"""
TwinAero - End-to-end training, calibration and benchmark on NASA C-MAPSS FD004

Engine-level protocol (no trajectory is used for both fitting and calibrating a component):
  * RUL model and quantile models: cross-conformal calibration. 5 folds over all 249
    training engines give out-of-fold nonconformity scores; final models use all engines.
  * Regime scaler, healthy-state reference and drift reference: fitted on an 80% engine
    split; the anomaly and drift thresholds are set on the remaining 20% (drift scores use
    out-of-fold RUL predictions).
  * The official FD004 test set (last observed cycle, RUL clipped at 125) is used for
    reporting only.

Artifacts are written to ml/models/. They are joblib files produced by this script and
loaded only by this repository's backend; do not load joblib files from other sources.
"""

import json
import os
import sys
import time

import joblib
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ml.anomaly.fault_classifier import FaultClassifier
from ml.anomaly.health_monitor import HealthStateMonitor
from ml.drift.detector import DriftDetector
from ml.pipeline import evaluate_last_cycle, fit_twin_cross_conformal, prepare_subset
from ml.preprocessing.loader import build_twin_features

MODELS_DIR = 'ml/models'


def drift_scores(detector: DriftDetector, feats, oof, stride: int = 10):
    """Scores on held-out engines, using out-of-fold RUL predictions."""
    scores = []
    lookup = oof.set_index(['engine_id', 'cycle'])['oof_pred']
    for eid, g in feats.groupby('engine_id'):
        preds = lookup.loc[eid].reindex(g['cycle']).values
        for i in range(detector.window, len(g) + 1, stride):
            scores.append(detector.score(g.iloc[:i], float(preds[i - 1]))['drift_score'])
    return np.array([s for s in scores if s is not None])


def run_pipeline():
    t0 = time.time()
    print('TwinAero training: NASA C-MAPSS FD004')

    data = prepare_subset('FD004')
    print(f'  proper-train engines: {len(data.train_ids)}, calibration engines: {len(data.cal_ids)}, '
          f'test engines: {data.test.engine_id.nunique()}')

    train_all = pd.concat([data.train, data.cal], ignore_index=True)
    twin, oof = fit_twin_cross_conformal(train_all)
    results = evaluate_last_cycle(twin, data.test, data.test_rul)
    print(f"  test RMSE {results['point']['rmse']}  MAE {results['point']['mae']}  NASA score {results['point']['nasa_score']}")
    for method in ('split', 'cqr', 'cqr_fleet_adapted'):
        for lv, m in results[method].items():
            print(f"  {method:18s} {float(lv):.0%}: coverage {m['empirical_coverage_pct']}%  width {m['mpiw_cycles']}")

    monitor = HealthStateMonitor().fit(data.train).calibrate_threshold(data.cal)
    print(f'  anomaly threshold: {monitor.threshold:.2f}')

    # Fault modes: all FD004 run-to-failure engines, identified against FD002 (HPC only),
    # both normalized with the FD004 regime scaler (same six operating conditions).
    fd004_all = build_twin_features(data.loader, data.loader.load_dataset('FD004')[0])
    fd002_all = build_twin_features(data.loader, data.loader.load_dataset('FD002')[0])
    fault = FaultClassifier().fit(fd004_all, fd002_all)
    print(f"  fault modes: {fault.fit_report['cluster_sizes']}, FD002 -> HPC {fault.fit_report['fd002_assigned_to_hpc_pct']}%")

    detector = DriftDetector().fit(data.train)
    detector.calibrate_threshold(drift_scores(detector, data.cal, oof))
    print(f'  drift threshold: {detector.threshold:.3f}')

    os.makedirs(MODELS_DIR, exist_ok=True)
    twin.rul.save(os.path.join(MODELS_DIR, 'rul_predictor.joblib'))
    twin.split.save(os.path.join(MODELS_DIR, 'conformal_predictor.joblib'))
    twin.cqr.save(os.path.join(MODELS_DIR, 'cqr_predictor.joblib'))
    monitor.save(os.path.join(MODELS_DIR, 'health_monitor.joblib'))
    fault.save(os.path.join(MODELS_DIR, 'fault_classifier.joblib'))

    joblib.dump({'regime_scaler': data.loader.regime_scaler}, os.path.join(MODELS_DIR, 'regime_scaler.joblib'))
    joblib.dump(detector.__dict__, os.path.join(MODELS_DIR, 'drift_detector.joblib'))

    summary = {
        'dataset': 'NASA C-MAPSS FD004',
        'protocol': '5-fold cross-conformal calibration over FD004 training engines; anomaly and drift thresholds '
                    'from a held-out 20% engine split; official test set evaluated at the last observed cycle, RUL clipped at 125.',
        'train_engines': int(len(data.train_ids) + len(data.cal_ids)),
        'proper_train_engines': int(len(data.train_ids)),
        'calibration_engines': int(len(data.cal_ids)),
        'test_engines': int(data.test.engine_id.nunique()),
        'operating_conditions': 6,
        'fault_modes': ['High-pressure compressor (HPC) degradation', 'Fan degradation'],
        'metrics': {
            'test_rmse': results['point']['rmse'],
            'test_mae': results['point']['mae'],
            'nasa_score': results['point']['nasa_score'],
            'mean_nasa_score': results['point']['mean_nasa_score'],
            'interval_method': 'CQR, fleet-adapted (label-shift weighted)',
            'target_coverage_pct': results['cqr_fleet_adapted']['0.9']['target_coverage_pct'],
            'empirical_coverage_pct': results['cqr_fleet_adapted']['0.9']['empirical_coverage_pct'],
            'mpiw_cycles': results['cqr_fleet_adapted']['0.9']['mpiw_cycles'],
        },
        'intervals': {k: results[k] for k in ('split', 'cqr', 'cqr_fleet_adapted')},
        'fleet_rul_distribution_estimate': twin.cqr.fleet_rul_distribution,
        'split_conformal_q90': round(twin.split.q_value, 2),
        'anomaly_threshold': round(monitor.threshold, 3),
        'drift_threshold': round(detector.threshold, 3),
        'fault_modes_fit': fault.fit_report,
    }
    with open(os.path.join(MODELS_DIR, 'benchmark_summary.json'), 'w') as f:
        json.dump(summary, f, indent=2)
    print(f'Artifacts written to {MODELS_DIR}/ in {time.time() - t0:.0f}s')


if __name__ == '__main__':
    run_pipeline()
