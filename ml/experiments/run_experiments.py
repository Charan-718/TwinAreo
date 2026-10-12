"""
TwinAero - Experiment suite

Runs every study described in the project abstract and writes ml/models/experiments.json,
which the dashboard's Evaluation page renders verbatim.

  1. FD001 sanity baseline        single condition / single fault, pipeline debugging
  2. FD004 ablation (A0-A5)       conventional -> digital twin -> uncertainty ->
                                  self-calibration -> counterfactual -> agentic
  3. Calibration curve            nominal vs empirical interval coverage
  4. Decision-support consistency agreement with an oracle that knows the true RUL,
                                  missed / unnecessary removals, decision stability
  5. FD002 -> FD004 transfer      drift detection and self-calibration under domain shift
  6. Anomaly detection            healthy-state detector on held-out run-to-failure engines
  7. Fault-mode checks            FD002 / FD001 (HPC only) and FD003 (HPC + fan) signatures
  8. Counterfactual consistency   identity and monotonicity of the what-if surrogate

All protocols are engine-level: an engine never contributes to both fitting and
evaluation of the same component. Usage:  python3 ml/experiments/run_experiments.py
"""

import json
import os
import sys
import time
import warnings

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
warnings.filterwarnings('ignore')

from ml.agent.advisor import INSPECT_AT, REMOVE_AT, decide
from ml.anomaly.fault_classifier import FaultClassifier, signature
from ml.anomaly.health_monitor import HealthStateMonitor
from ml.digital_twin.counterfactual import CounterfactualSimulator
from ml.drift.detector import DriftDetector
from ml.pipeline import (
    RUL_CLIP, X, evaluate_last_cycle, fit_twin, fit_twin_cross_conformal, prepare_subset, recalibrate,
)
from ml.preprocessing.loader import build_twin_features, conventional_feature_columns, last_cycle_rows, split_engines
from ml.uncertainty.conformal import interval_metrics

OUT = 'ml/models/experiments.json'
LAST_K = 10  # cycles used for decision-stability analysis


def log(msg):
    print(f'[{time.strftime("%H:%M:%S")}] {msg}', flush=True)


# ---------------------------------------------------------------------------
# Decision helpers
# ---------------------------------------------------------------------------

def decision_metrics(true_rul: np.ndarray, decision_rul: np.ndarray) -> dict:
    oracle = np.array([decide(r) for r in true_rul])
    policy = np.array([decide(r) for r in decision_rul])
    n_remove = max(1, int(np.sum(oracle == 'REMOVE')))
    return {
        'agreement_pct': round(float(np.mean(oracle == policy) * 100), 1),
        'missed_removals': int(np.sum((oracle == 'REMOVE') & (policy != 'REMOVE'))),
        'missed_removal_rate_pct': round(float(np.sum((oracle == 'REMOVE') & (policy != 'REMOVE')) / n_remove * 100), 1),
        'unsafe_continue': int(np.sum((oracle != 'CONTINUE') & (policy == 'CONTINUE'))),
        'unnecessary_removals': int(np.sum((policy == 'REMOVE') & (true_rul > INSPECT_AT))),
        'oracle_removals': int(np.sum(oracle == 'REMOVE')),
    }


def flip_rate(actions_by_engine) -> float:
    """Mean number of action changes over the last LAST_K cycles per engine."""
    flips = [int(np.sum(a[1:] != a[:-1])) for a in actions_by_engine if len(a) > 1]
    return round(float(np.mean(flips)), 3)


def drift_flags_last_k(detector, feats, preds_by_row):
    flags = []
    for eid, g in feats.groupby('engine_id'):
        g = g.reset_index(drop=True)
        p = preds_by_row[eid]
        row = []
        for i in range(max(1, len(g) - LAST_K + 1), len(g) + 1):
            row.append(detector.evaluate_drift(g.iloc[:i], float(p[i - 1]))['drift_detected'])
        flags.append(np.array(row))
    return flags


def drift_threshold_from(detector, feats, twin, stride=10):
    scores = []
    for _, g in feats.groupby('engine_id'):
        p = twin.rul.predict(X(g, twin.feature_cols))
        for i in range(detector.window, len(g) + 1, stride):
            scores.append(detector.score(g.iloc[:i], float(p[i - 1]))['drift_score'])
    detector.calibrate_threshold(np.array([s for s in scores if s is not None]))
    return detector


def oof_drift_scores(detector, feats, oof, stride=10):
    lookup = oof.set_index(['engine_id', 'cycle'])['oof_pred']
    scores = []
    for eid, g in feats.groupby('engine_id'):
        p = lookup.loc[eid].reindex(g['cycle']).values
        for i in range(detector.window, len(g) + 1, stride):
            scores.append(detector.score(g.iloc[:i], float(p[i - 1]))['drift_score'])
    return np.array([x for x in scores if x is not None])


def last_cycle_drift_rate(detector, twin, test_feats):
    last_flags = []
    for _, g in test_feats.groupby('engine_id'):
        p = float(twin.rul.predict(X(g.tail(1), twin.feature_cols))[0])
        last_flags.append(detector.evaluate_drift(g, p)['drift_detected'])
    return np.array(last_flags)


# ---------------------------------------------------------------------------
# Studies
# ---------------------------------------------------------------------------

def study_fd001():
    log('FD001 sanity baseline')
    d = prepare_subset('FD001')
    conv = fit_twin(d.train, d.cal, conventional_feature_columns(), with_cqr=False)
    twin = fit_twin(d.train, d.cal, with_cqr=False)
    twin_eval = evaluate_last_cycle(twin, d.test, d.test_rul)
    return {
        'description': 'Single operating condition, HPC degradation only. Used to debug the pipeline before FD004.',
        'train_engines': int(len(d.train_ids) + len(d.cal_ids)),
        'test_engines': int(d.test.engine_id.nunique()),
        'conventional': evaluate_last_cycle(conv, d.test, d.test_rul)['point'],
        'digital_twin': twin_eval['point'],
        'split_conformal_90': twin_eval['split']['0.9'],
    }


def study_fd004(results):
    log('FD004: fitting conventional and digital-twin models (cross-conformal, as served)')
    d = prepare_subset('FD004')
    train_all = pd.concat([d.train, d.cal], ignore_index=True)
    conv = fit_twin(train_all, d.cal, conventional_feature_columns(), with_cqr=False)
    twin, oof = fit_twin_cross_conformal(train_all)

    conv_eval = evaluate_last_cycle(conv, d.test, d.test_rul)
    twin_eval = evaluate_last_cycle(twin, d.test, d.test_rul)   # also fleet-adapts twin.cqr

    last = last_cycle_rows(d.test)
    y = np.minimum(d.test_rul, RUL_CLIP).astype(float)
    pred = twin.rul.predict(X(last, twin.feature_cols))
    lo_split, _, _ = twin.split.predict_interval(pred, confidence=0.9)
    lo_cqr90, _ = twin.cqr.predict_interval(X(last, twin.feature_cols), 0.9, adapted=True)
    lo_cqr95, _ = twin.cqr.predict_interval(X(last, twin.feature_cols), 0.95, adapted=True)

    log('FD004: drift detector and decision stability')
    detector = DriftDetector().fit(d.train)
    detector.calibrate_threshold(oof_drift_scores(detector, d.cal, oof))
    preds_by_row, lo90_rows, lo95_rows = {}, {}, {}
    for eid, g in d.test.groupby('engine_id'):
        Xg = X(g, twin.feature_cols)
        preds_by_row[eid] = twin.rul.predict(Xg)
        lo90_rows[eid] = twin.cqr.predict_interval(Xg, 0.9, adapted=True)[0]
        lo95_rows[eid] = twin.cqr.predict_interval(Xg, 0.95, adapted=True)[0]
    flags = drift_flags_last_k(detector, d.test, preds_by_row)
    last_drift = np.array([f[-1] for f in flags])
    agent_rul = np.where(last_drift, lo_cqr95, lo_cqr90)

    def actions(series_by_engine):
        return [np.array([decide(v) for v in s[-LAST_K:]]) for s in series_by_engine]

    eids = sorted(preds_by_row)
    point_actions = actions([preds_by_row[e] for e in eids])
    lb_actions = actions([lo90_rows[e] for e in eids])
    agent_actions = [np.array([decide(lo95_rows[e][-LAST_K:][i] if f[i] else lo90_rows[e][-LAST_K:][i])
                               for i in range(len(f))]) for e, f in zip(eids, flags)]

    decisions = {
        'point_estimate': {**decision_metrics(y, pred), 'flips_per_engine_last10': flip_rate(point_actions)},
        'split_lower_90': decision_metrics(y, lo_split),
        'cqr_adapted_lower_90': {**decision_metrics(y, lo_cqr90), 'flips_per_engine_last10': flip_rate(lb_actions)},
        'agent': {**decision_metrics(y, agent_rul), 'flips_per_engine_last10': flip_rate(agent_actions)},
    }

    log('FD004: counterfactual consistency')
    sim = CounterfactualSimulator()
    identity_ok, monotone_ok, n = 0, 0, 0
    for _, row in last.head(60).iterrows():
        cur = {'altitude_kft': float(row['setting_1']), 'mach_number': float(row['setting_2']),
               'throttle_pct': float(row['setting_3'])}
        base = float(twin.rul.predict(X(row.to_frame().T, twin.feature_cols))[0])
        for mode in ('HPC_DEGRADATION', 'FAN_DEGRADATION'):
            n += 1
            same = sim.simulate_scenario(0, 80, base, fault_mode=mode, current_settings=cur, **cur)
            identity_ok += abs(same['rul_delta']) < 0.05
            ruls = [sim.simulate_scenario(0, 80, base, cur['altitude_kft'], cur['mach_number'], t, mode, cur)['counterfactual_rul']
                    for t in range(60, 101, 5)]
            monotone_ok += all(a >= b for a, b in zip(ruls, ruls[1:]))
    counterfactual = {
        'scenarios_checked': n,
        'identity_at_current_point_pct': round(identity_ok / n * 100, 1),
        'monotone_in_throttle_pct': round(monotone_ok / n * 100, 1),
        'note': 'Internal consistency only. C-MAPSS has no ground truth for alternative operating profiles.',
    }

    calib_curve = []
    for lv in [0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95]:
        lo, hi, _ = twin.split.predict_interval(pred, confidence=lv)
        calib_curve.append({'nominal': lv, 'split': interval_metrics(y, lo, hi, lv)['empirical_coverage_pct']})
    for point in calib_curve:
        key = str(point['nominal'])
        if key in twin_eval['cqr_fleet_adapted']:
            point['cqr_adapted'] = twin_eval['cqr_fleet_adapted'][key]['empirical_coverage_pct']
            point['cqr'] = twin_eval['cqr'][key]['empirical_coverage_pct']

    ablation = [
        {'id': 'A0', 'name': 'Conventional RUL', 'detail': 'Raw sensors and settings, no operating-regime handling',
         **conv_eval['point']},
        {'id': 'A1', 'name': 'Digital twin features', 'detail': 'Regime-normalized sensors, rolling statistics, degradation indices',
         **twin_eval['point']},
        {'id': 'A2', 'name': '+ Uncertainty', 'detail': 'CQR 90% intervals, cross-conformal calibration',
         **twin_eval['point'], 'coverage_90': twin_eval['cqr']['0.9']['empirical_coverage_pct'],
         'width_90': twin_eval['cqr']['0.9']['mpiw_cycles'],
         'missed_removals': decisions['cqr_adapted_lower_90']['missed_removals']},
        {'id': 'A3', 'name': '+ Self-calibration', 'detail': 'Label-shift-weighted CQR adapted to the deployed fleet (no labels)',
         **twin_eval['point'], 'coverage_90': twin_eval['cqr_fleet_adapted']['0.9']['empirical_coverage_pct'],
         'width_90': twin_eval['cqr_fleet_adapted']['0.9']['mpiw_cycles']},
        {'id': 'A4', 'name': '+ Counterfactual', 'detail': 'What-if surrogate; consistency checks only',
         **twin_eval['point'], 'coverage_90': twin_eval['cqr_fleet_adapted']['0.9']['empirical_coverage_pct'],
         'width_90': twin_eval['cqr_fleet_adapted']['0.9']['mpiw_cycles'],
         'counterfactual_consistency_pct': counterfactual['monotone_in_throttle_pct']},
        {'id': 'A5', 'name': 'Full agentic framework', 'detail': 'Agent decides on the conservative bound, 95% when drift is flagged',
         **twin_eval['point'], 'coverage_90': twin_eval['cqr_fleet_adapted']['0.9']['empirical_coverage_pct'],
         'width_90': twin_eval['cqr_fleet_adapted']['0.9']['mpiw_cycles'],
         'decision_agreement_pct': decisions['agent']['agreement_pct'],
         'missed_removals': decisions['agent']['missed_removals']},
    ]
    ablation[1]['decision_agreement_pct'] = decisions['point_estimate']['agreement_pct']
    ablation[1]['missed_removals'] = decisions['point_estimate']['missed_removals']
    ablation[2]['decision_agreement_pct'] = decisions['cqr_adapted_lower_90']['agreement_pct']

    results['fd004'] = {
        'protocol': 'Models fitted on all 249 training engines with 5-fold cross-conformal calibration (the served model); '
                    'drift threshold from held-out engines with out-of-fold predictions; official test set at the last '
                    'observed cycle, RUL clipped at 125. A0 is a point model only.',
        'ablation': ablation,
        'intervals': {k: twin_eval[k] for k in ('split', 'cqr', 'cqr_fleet_adapted')},
        'calibration_curve': calib_curve,
        'decisions': {
            'thresholds': {'remove_at': REMOVE_AT, 'inspect_at': INSPECT_AT},
            'oracle': 'Same policy applied to the true RUL',
            'drift_flag_rate_last_cycle_pct': round(float(np.mean(last_drift) * 100), 1),
            'policies': decisions,
        },
        'counterfactual': counterfactual,
    }
    return d, twin


def study_anomaly(d):
    log('Anomaly detection')
    ids = d.train_ids.copy()
    fit_ids, thr_ids = split_engines(ids, holdout_frac=0.2, seed=11)
    monitor = HealthStateMonitor().fit(d.train[d.train.engine_id.isin(fit_ids)])
    monitor.calibrate_threshold(d.train[d.train.engine_id.isin(thr_ids)])
    m = monitor.evaluate(d.cal)
    m['evaluation_engines'] = int(d.cal.engine_id.nunique())
    m['method'] = 'Mahalanobis distance to early-life (first 30 cycles) sensor distribution; threshold = 99th percentile on held-out healthy cycles; alarm after 3 consecutive exceedances.'
    return m


def study_fault_modes(d):
    log('Fault-mode external checks')
    fd004_all = build_twin_features(d.loader, d.loader.load_dataset('FD004')[0])
    fd002_all = build_twin_features(d.loader, d.loader.load_dataset('FD002')[0])
    fc = FaultClassifier().fit(fd004_all, fd002_all)
    report = dict(fc.fit_report)
    for subset, expect in (('FD001', 'HPC only'), ('FD003', 'HPC and fan')):
        tr = d.loader.load_dataset(subset)[0]
        feats = build_twin_features(d.loader, tr)
        names = [min(fc.mode_distances(signature(g)), key=fc.mode_distances(signature(g)).get)
                 for _, g in feats.groupby('engine_id')]
        report[f'{subset.lower()}_check'] = {
            'expected': expect,
            'engines': len(names),
            'hpc_pct': round(names.count('HPC_DEGRADATION') / len(names) * 100, 1),
            'fan_pct': round(names.count('FAN_DEGRADATION') / len(names) * 100, 1),
            'note': 'Single sea-level condition, normalized with the FD004 regime-0 scaler.',
        }
    return report


def study_transfer(fd004):
    log('Transfer FD002 -> FD004')
    src = prepare_subset('FD002')
    twin = fit_twin(src.train, src.cal)
    tgt_train_df, tgt_test_df, tgt_rul = src.loader.load_dataset('FD004')
    tgt_test = build_twin_features(src.loader, tgt_test_df)
    tgt_train = build_twin_features(src.loader, tgt_train_df)
    y = np.minimum(tgt_rul, RUL_CLIP).astype(float)

    def score(t, adapted=False):
        last = last_cycle_rows(tgt_test)
        p = t.rul.predict(X(last, t.feature_cols))
        if adapted:
            t.cqr.adapt_to_fleet(p)
        lo, hi = t.cqr.predict_interval(X(last, t.feature_cols), 0.9, adapted=adapted)
        lo, hi = np.minimum(lo, p), np.maximum(hi, p)
        return {**t.rul.evaluate(y, p), **{f'{k}_90': v for k, v in interval_metrics(y, lo, hi, 0.9).items()
                                           if k in ('empirical_coverage_pct', 'mpiw_cycles')},
                'missed_removals': decision_metrics(y, lo)['missed_removals']}

    rows = [{'variant': 'No self-calibration', 'detail': 'FD002 model applied to FD004 as is', **score(twin)}]
    rows.append({'variant': 'Label-free fleet adaptation', 'detail': 'Label-shift-weighted CQR on unlabeled FD004 predictions',
                 **score(recalibrate(twin, src.cal), adapted=True)})

    new_ids = np.sort(np.random.default_rng(3).choice(tgt_train_df.engine_id.unique(), 25, replace=False))
    new_engines = tgt_train[tgt_train.engine_id.isin(new_ids)]
    rows.append({'variant': 'Recalibrate with 25 new failures', 'detail': 'Conformal corrections refit on 25 FD004 run-to-failure engines',
                 **score(recalibrate(twin, new_engines))})
    half = split_engines(new_ids, 0.4, seed=5)
    retrained = fit_twin(pd.concat([src.train, tgt_train[tgt_train.engine_id.isin(half[0])]]),
                         tgt_train[tgt_train.engine_id.isin(half[1])])
    rows.append({'variant': 'Retrain + recalibrate', 'detail': f'Model refit with {len(half[0])} FD004 engines, calibrated on {len(half[1])}',
                 **score(retrained)})

    log('Transfer: drift detection rates')
    detector = drift_threshold_from(DriftDetector().fit(src.train), src.cal, twin)
    in_domain = last_cycle_drift_rate(detector, twin, src.test)
    shifted = last_cycle_drift_rate(detector, twin, tgt_test)

    fc = FaultClassifier().load('ml/models/fault_classifier.joblib') if os.path.exists('ml/models/fault_classifier.joblib') else None
    by_mode = None
    if fc is not None:
        modes = []
        fd004_scaled = build_twin_features(fd004.loader, tgt_test_df)
        for _, g in fd004_scaled.groupby('engine_id'):
            modes.append(fc.diagnose_trajectory(g)['fault_mode'])
        modes = np.array(modes)
        by_mode = {m: {'engines': int(np.sum(modes == m)), 'flag_rate_pct': round(float(np.mean(shifted[modes == m]) * 100), 1)}
                   for m in np.unique(modes)}

    return {
        'source': 'FD002 (six conditions, HPC only)',
        'target': 'FD004 (six conditions, HPC and fan)',
        'variants': rows,
        'drift_detection': {
            'threshold': round(detector.threshold, 3),
            'in_domain_flag_rate_pct': round(float(np.mean(in_domain) * 100), 1),
            'shifted_flag_rate_pct': round(float(np.mean(shifted) * 100), 1),
            'shifted_by_fault_hypothesis': by_mode,
            'note': 'Rate of test engines flagged at their last observed cycle. In-domain = FD002 test set.',
        },
    }


def main():
    t0 = time.time()
    results = {'generated_at': time.strftime('%Y-%m-%d %H:%M'), 'dataset_primary': 'NASA C-MAPSS FD004'}
    results['fd001'] = study_fd001()
    d, _ = study_fd004(results)
    results['anomaly'] = study_anomaly(d)
    results['fault_modes'] = study_fault_modes(d)
    results['transfer'] = study_transfer(d)
    results['runtime_seconds'] = round(time.time() - t0)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w') as f:
        json.dump(results, f, indent=2, default=lambda o: o.item() if hasattr(o, 'item') else str(o))
    log(f'Wrote {OUT} in {results["runtime_seconds"]}s')


if __name__ == '__main__':
    main()
