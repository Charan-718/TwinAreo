"""
TwinAero - Digital Twin orchestration service

Loads the artifacts written by ml/train_and_evaluate.py, replays the FD004 test fleet
through every component once at startup (RUL, conformal intervals, anomaly score,
fault-mode hypothesis, twin-discrepancy check), and serves per-engine views from that
cache. Everything the API returns is computed from data and fitted models; no value is
hard-coded for display.
"""

import json
import os
import sys
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
import pandas as pd

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from ml.agent.advisor import MaintenanceAdvisor, decide
from ml.anomaly.fault_classifier import FaultClassifier
from ml.anomaly.health_monitor import HealthStateMonitor
from ml.digital_twin.counterfactual import CounterfactualSimulator
from ml.drift.detector import DriftDetector
from ml.preprocessing.loader import (
    ACTIVE_SENSORS, SENSOR_COLS, SENSOR_METADATA, CMAPSSDataLoader, build_twin_features,
)
from ml.rul.predictor import RULPredictor
from ml.uncertainty.conformal import CONFIDENCE_LEVELS, CQRPredictor

MODELS_DIR = os.path.join(PROJECT_ROOT, 'ml/models')
DATA_DIR = os.path.join(PROJECT_ROOT, 'data/raw')

# Operating-condition centers of FD004 (setting_1 altitude kft, setting_2 Mach, setting_3 TRA).
REGIME_NAMES = {
    0: 'Sea level, TRA 100',
    1: '10 kft, Mach 0.25, TRA 100',
    2: '20 kft, Mach 0.70, TRA 100',
    3: '25 kft, Mach 0.62, TRA 60',
    4: '35 kft, Mach 0.84, TRA 100',
    5: '42 kft, Mach 0.84, TRA 100',
}

LEVEL_KEYS = [str(lv) for lv in CONFIDENCE_LEVELS]   # '0.8', '0.9', '0.95'


def health_from_rul(rul: np.ndarray) -> np.ndarray:
    """Health index derived from predicted RUL: 98% at the 125-cycle cap, 15% at zero."""
    return np.round(15.0 + (np.clip(rul / 125.0, 0.0, 1.0) ** 0.85) * 83.0, 1)


def status_from_health(h: float) -> str:
    return 'HEALTHY' if h >= 75.0 else 'MONITOR' if h >= 45.0 else 'CRITICAL'


class ArtifactsMissing(RuntimeError):
    pass


class DigitalTwinService:
    _instance: Optional['DigitalTwinService'] = None

    @classmethod
    def get_instance(cls) -> 'DigitalTwinService':
        if cls._instance is None:
            cls._instance = DigitalTwinService()
            cls._instance.initialize()
        return cls._instance

    def __init__(self):
        self.loader = CMAPSSDataLoader(data_dir=DATA_DIR)
        self.rul = RULPredictor()
        self.cqr = CQRPredictor()
        self.monitor = HealthStateMonitor()
        self.fault = FaultClassifier()
        self.drift = DriftDetector()
        self.simulator = CounterfactualSimulator()
        self.advisor = MaintenanceAdvisor()
        self.benchmark: Dict[str, Any] = {}
        self.experiments: Dict[str, Any] = {}
        self.feats: Optional[pd.DataFrame] = None
        self.rows: Dict[int, pd.DataFrame] = {}
        self.engine_cache: Dict[int, Dict[str, Any]] = {}
        self.calibration_log: Dict[int, List[Dict[str, Any]]] = {}
        self.ready = False
        self.error: Optional[str] = None

    # -- Startup ----------------------------------------------------------------------

    def _path(self, name: str) -> str:
        return os.path.join(MODELS_DIR, name)

    def initialize(self):
        required = ['rul_predictor.joblib', 'cqr_predictor.joblib', 'health_monitor.joblib',
                    'fault_classifier.joblib', 'drift_detector.joblib', 'regime_scaler.joblib']
        missing = [f for f in required if not os.path.exists(self._path(f))]
        if missing:
            self.error = f"Model artifacts missing ({', '.join(missing)}). Run: python3 ml/train_and_evaluate.py"
            print(f'[DigitalTwinService] {self.error}')
            return

        # Artifacts are produced locally by ml/train_and_evaluate.py; never load joblib files from elsewhere.
        self.loader.regime_scaler = joblib.load(self._path('regime_scaler.joblib'))['regime_scaler']
        self.rul.load(self._path('rul_predictor.joblib'))
        self.cqr.load(self._path('cqr_predictor.joblib'))
        self.monitor.load(self._path('health_monitor.joblib'))
        self.fault.load(self._path('fault_classifier.joblib'))
        self.drift.__dict__.update(joblib.load(self._path('drift_detector.joblib')))
        for name, attr in (('benchmark_summary.json', 'benchmark'), ('experiments.json', 'experiments')):
            if os.path.exists(self._path(name)):
                with open(self._path(name)) as f:
                    setattr(self, attr, json.load(f))

        _, test_df, rul_true = self.loader.load_dataset('FD004')
        feats = build_twin_features(self.loader, test_df)
        X = feats[self.rul.feature_columns].fillna(0)
        feats['rul_pred'] = np.round(self.rul.predict(X), 1)

        # Self-calibrate intervals to the deployed fleet (label-free, see conformal.py).
        last_pred = feats.groupby('engine_id')['rul_pred'].last().values
        self.cqr.adapt_to_fleet(last_pred)
        for lv, key in zip(CONFIDENCE_LEVELS, LEVEL_KEYS):
            lo, hi = self.cqr.predict_interval(X, lv, adapted=True)
            feats[f'lo_{key}'] = np.round(np.minimum(lo, feats['rul_pred']), 1)
            feats[f'hi_{key}'] = np.round(np.maximum(hi, feats['rul_pred']), 1)

        feats['anomaly_score'] = np.round(self.monitor.score(feats), 2)
        feats['health_pct'] = health_from_rul(feats['rul_pred'].values)
        self.feats = feats
        self.rows = {int(eid): g.reset_index(drop=True) for eid, g in feats.groupby('engine_id')}
        self.true_rul = {int(eid): float(r) for eid, r in zip(sorted(self.rows), rul_true)}

        for eid in self.rows:
            self.engine_cache[eid] = self._summarize(eid)
        self.ready = True
        print(f'[DigitalTwinService] Ready: {len(self.rows)} FD004 test engines.')

    def require_ready(self):
        if not self.ready:
            raise ArtifactsMissing(self.error or 'Service is not initialized')

    # -- Per-engine state ---------------------------------------------------------------

    def _summarize(self, eid: int) -> Dict[str, Any]:
        g = self.rows[eid]
        last = g.iloc[-1]
        rul_pred = float(last['rul_pred'])
        diag = self.fault.diagnose_trajectory(g, predicted_rul=rul_pred)
        drift = self.drift.evaluate_drift(g, rul_pred)
        alarm = self.monitor.persistent_alarm(g['anomaly_score'].values)
        first_alarm = int(g['cycle'].values[np.argmax(alarm)]) if alarm.any() else None
        intervals = {k: {'lower': float(last[f'lo_{k}']), 'upper': float(last[f'hi_{k}'])} for k in LEVEL_KEYS}
        decision_key = '0.95' if drift['drift_detected'] else '0.9'
        return {
            'engine_id': eid,
            'unit_code': f'FD004-{eid:03d}',
            'current_cycle': int(last['cycle']),
            'health_pct': float(last['health_pct']),
            'status': status_from_health(float(last['health_pct'])),
            'rul_pred': rul_pred,
            'rul_lower': intervals['0.9']['lower'],
            'rul_upper': intervals['0.9']['upper'],
            'intervals': intervals,
            'fault_mode': diag['fault_mode'],
            'fault_label': diag['fault_label'],
            'fault_confidence': diag['confidence'],
            'diagnosis': diag,
            'operating_regime': int(last['regime']),
            'regime_name': REGIME_NAMES.get(int(last['regime']), f"Regime {int(last['regime'])}"),
            'current_settings': {
                'altitude_kft': round(float(last['setting_1']), 1),
                'mach_number': round(float(last['setting_2']), 2),
                'throttle_pct': round(float(last['setting_3']), 0),
            },
            'drift_status': drift,
            'anomaly': {
                'score': float(last['anomaly_score']),
                'threshold': round(self.monitor.threshold, 2),
                'alarm': bool(alarm[-1]),
                'first_alarm_cycle': first_alarm,
            },
            'action_code': decide(intervals[decision_key]['lower']),
        }

    def _engine(self, eid: int) -> Dict[str, Any]:
        self.require_ready()
        if eid not in self.engine_cache:
            raise KeyError(f'Engine {eid} not found in the FD004 test set')
        return self.engine_cache[eid]

    # -- Public API -----------------------------------------------------------------------

    def get_fleet_overview(self) -> Dict[str, Any]:
        self.require_ready()
        engines = []
        for eid in sorted(self.engine_cache):
            s = self.engine_cache[eid]
            engines.append({k: s[k] for k in (
                'engine_id', 'unit_code', 'current_cycle', 'health_pct', 'status', 'rul_pred', 'rul_lower',
                'rul_upper', 'fault_mode', 'fault_label', 'operating_regime', 'regime_name', 'action_code')}
                | {'drift_detected': s['drift_status']['drift_detected'], 'anomaly_alarm': s['anomaly']['alarm']})
        status = [e['status'] for e in engines]
        return {
            'total_engines': len(engines),
            'healthy_count': status.count('HEALTHY'),
            'monitor_count': status.count('MONITOR'),
            'critical_count': status.count('CRITICAL'),
            'average_health_pct': round(float(np.mean([e['health_pct'] for e in engines])), 1),
            'mean_rul': round(float(np.mean([e['rul_pred'] for e in engines])), 1),
            'action_counts': {a: sum(e['action_code'] == a for e in engines) for a in ('REMOVE', 'INSPECT', 'CONTINUE')},
            'drift_count': sum(e['drift_detected'] for e in engines),
            'engines': engines,
        }

    def get_engine_detail(self, eid: int) -> Dict[str, Any]:
        s = self._engine(eid)
        g = self.rows[eid]
        last = g.iloc[-1]
        early = g.head(min(15, len(g)))

        history = []
        for _, r in g.iterrows():
            history.append({
                'cycle': int(r['cycle']),
                'regime': int(r['regime']),
                'rul_pred': float(r['rul_pred']),
                'rul_lower': float(r['lo_0.9']),
                'rul_upper': float(r['hi_0.9']),
                'health_pct': float(r['health_pct']),
                'anomaly_score': float(r['anomaly_score']),
                'sensors': {sn: round(float(r[f'{sn}_norm_roll_mean']), 3) for sn in ACTIVE_SENSORS},
            })

        latest_sensors = []
        for sn in SENSOR_COLS:
            meta = SENSOR_METADATA[sn]
            active = sn in ACTIVE_SENSORS
            latest_sensors.append({
                'key': sn,
                'channel': int(sn.split('_')[1]),
                'name': meta['name'],
                'description': meta['desc'],
                'unit': meta['unit'],
                'raw_value': round(float(last[sn]), 4),
                'norm_value': round(float(last[f'{sn}_norm']), 2) if active else None,
                'shift_sigma': round(float(g.tail(15)[f'{sn}_norm'].mean() - early[f'{sn}_norm'].mean()), 2) if active else None,
                'informative': active,
            })

        detail = {k: v for k, v in s.items() if k != 'diagnosis'}
        detail.update({
            'total_cycles_observed': s['current_cycle'],
            'confidence_pct': 90.0,
            'hpc_score': s['diagnosis']['hpc_score'],
            'fan_score': s['diagnosis']['fan_score'],
            'signature_progress': s['diagnosis']['signature_progress'],
            'active_anomalies': s['diagnosis']['anomalies'],
            'telemetry_history': history,
            'latest_sensors': latest_sensors,
            'calibration_log': self.calibration_log.get(eid, []),
        })
        return detail

    def get_drift(self, eid: int) -> Dict[str, Any]:
        return self._engine(eid)['drift_status']

    def simulate_counterfactual(self, eid: int, altitude_kft: float, mach_number: float, throttle_pct: float) -> Dict[str, Any]:
        s = self._engine(eid)
        return self.simulator.simulate_scenario(
            current_cycle=s['current_cycle'], current_health_pct=s['health_pct'], baseline_rul=s['rul_pred'],
            altitude_kft=altitude_kft, mach_number=mach_number, throttle_pct=throttle_pct,
            fault_mode=s['fault_mode'], current_settings=s['current_settings'],
            baseline_interval=s['intervals']['0.9'],
        )

    def trigger_self_calibration(self, eid: int) -> Dict[str, Any]:
        """Re-runs the twin-discrepancy check and applies the self-calibration policy."""
        s = self._engine(eid)
        drift = self.drift.evaluate_drift(self.rows[eid], s['rul_pred'])
        s['drift_status'] = drift
        if drift['drift_detected']:
            message = ('Twin discrepancy is above threshold. Decisions for this engine now use the 95% interval '
                       'until new run-to-failure data allows the conformal corrections to be refit.')
        elif drift['drift_score'] is None:
            message = 'Too few cycles to test for twin discrepancy. No change applied.'
        else:
            message = 'Twin discrepancy is within threshold. Calibration is current; no change applied.'
        entry = {'cycle': s['current_cycle'], 'drift_score': drift['drift_score'],
                 'escalated': bool(drift['drift_detected']), 'message': message}
        self.calibration_log.setdefault(eid, []).append(entry)
        return {'engine_id': eid, 'calibrated': not drift['drift_detected'], 'status': drift['status'],
                'message': message, 'log_entry': entry}

    def get_advisor(self, eid: int) -> Dict[str, Any]:
        s = self._engine(eid)
        engine = {**s, 'total_cycles_observed': s['current_cycle'],
                  'active_anomalies': s['diagnosis']['anomalies']}

        def runner(alt, mach, thr):
            return self.simulate_counterfactual(eid, alt, mach, thr)

        return self.advisor.generate_assessment(engine, scenario_runner=runner)

    def get_benchmark_metrics(self) -> Dict[str, Any]:
        return self.benchmark

    def get_experiments(self) -> Dict[str, Any]:
        return self.experiments

    def get_test_predictions(self) -> List[Dict[str, Any]]:
        """Last-cycle prediction vs. ground truth for every test engine (evaluation view only)."""
        self.require_ready()
        out = []
        for eid in sorted(self.engine_cache):
            s = self.engine_cache[eid]
            out.append({'engine_id': eid, 'true_rul': min(self.true_rul[eid], 125.0), 'rul_pred': s['rul_pred'],
                        'rul_lower': s['rul_lower'], 'rul_upper': s['rul_upper'], 'fault_mode': s['fault_mode']})
        return out
