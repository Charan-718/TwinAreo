"""
TwinAero - Twin discrepancy (drift) detection and self-calibration policy

Degradation itself moves sensor values, so comparing an engine with its own early
life would flag every wearing engine. Instead the detector asks: does the engine's
recent sensor window look like training engines *at the same predicted life stage*?

Reference: training cycles whose (clipped) RUL lies within +/- `rul_band` of the
engine's current predicted RUL. Per-sensor two-sample Kolmogorov-Smirnov statistics
and Wasserstein distances are computed against that reference; the drift score is
their mean KS statistic. The alarm threshold is a quantile of scores on in-domain
held-out engines, so the in-domain false-alarm rate is chosen explicitly.

Self-calibration policy when drift is flagged: decisions switch to the wider 95%
interval, and the event is logged. Label-based recalibration (re-fitting conformal
corrections or the model once new run-to-failure engines are observed) is evaluated
offline in ml/experiments.
"""

from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from scipy.stats import ks_2samp, wasserstein_distance

DRIFT_SENSORS: List[str] = [f'sensor_{i}_norm_roll_mean' for i in (2, 3, 4, 7, 11, 12, 15, 17, 20, 21)]


class DriftDetector:
    def __init__(self, window: int = 15, rul_band: float = 10.0, false_alarm_rate: float = 0.05):
        self.window = window
        self.rul_band = rul_band
        self.false_alarm_rate = false_alarm_rate
        self.reference: Optional[pd.DataFrame] = None
        self.threshold: float = float('nan')

    def fit(self, train_feats: pd.DataFrame, rul_col: str = 'clipped_rul'):
        self.reference = train_feats[DRIFT_SENSORS + [rul_col]].rename(columns={rul_col: '_rul'}).dropna()
        return self

    def _reference_slice(self, predicted_rul: float) -> pd.DataFrame:
        ref = self.reference
        sl = ref[(ref['_rul'] - predicted_rul).abs() <= self.rul_band]
        return sl if len(sl) >= 50 else ref.iloc[(ref['_rul'] - predicted_rul).abs().argsort()[:500]]

    def score(self, engine_feats: pd.DataFrame, predicted_rul: float) -> Dict[str, Any]:
        recent = engine_feats.tail(self.window)
        if len(recent) < 5:
            return {'drift_score': None, 'channels': []}
        ref = self._reference_slice(predicted_rul)
        channels = []
        for col in DRIFT_SENSORS:
            stat, p = ks_2samp(ref[col].values, recent[col].values)
            channels.append({
                'sensor': col.replace('_norm_roll_mean', ''),
                'ks_stat': round(float(stat), 3),
                'p_value': float(p),
                'wasserstein_dist': round(float(wasserstein_distance(ref[col].values, recent[col].values)), 3),
            })
        return {'drift_score': float(np.mean([c['ks_stat'] for c in channels])), 'channels': channels}

    def calibrate_threshold(self, scores: np.ndarray):
        scores = np.asarray([s for s in scores if s is not None])
        self.threshold = float(np.quantile(scores, 1.0 - self.false_alarm_rate))
        return self

    def evaluate_drift(self, engine_feats: pd.DataFrame, predicted_rul: float) -> Dict[str, Any]:
        res = self.score(engine_feats, predicted_rul)
        score = res['drift_score']
        if score is None:
            return {
                'drift_detected': False, 'drift_score': None, 'threshold': round(self.threshold, 3),
                'p_value': None, 'status': 'INSUFFICIENT_DATA', 'severity': 'LOW',
                'calibrated': True, 'recalibration_triggered': False, 'affected_channels': [],
                'channels': [], 'drift_metric': 'KS_VS_LIFE_STAGE_REFERENCE', 'window_cycles': self.window,
            }
        n = len(res['channels'])
        for c in res['channels']:
            c['p_value_adjusted'] = round(min(1.0, c['p_value'] * n), 4)
            c['p_value'] = round(c['p_value'], 4)
        detected = score > self.threshold
        affected = [c for c in res['channels'] if c['ks_stat'] > self.threshold and c['p_value_adjusted'] < 0.05]
        severity = 'HIGH' if score > 1.5 * self.threshold else 'MODERATE' if detected else 'LOW'
        return {
            'drift_detected': bool(detected),
            'drift_score': round(score, 3),
            'threshold': round(self.threshold, 3),
            'p_value': min(c['p_value_adjusted'] for c in res['channels']),
            'status': 'DRIFT_DETECTED' if detected else 'WITHIN_REFERENCE',
            'severity': severity,
            'calibrated': not detected,
            'recalibration_triggered': bool(detected),
            'affected_channels': affected,
            'channels': res['channels'],
            'drift_metric': 'KS_VS_LIFE_STAGE_REFERENCE',
            'window_cycles': self.window,
        }
