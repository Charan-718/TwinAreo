"""
TwinAero - Healthy-state anomaly detector

Learns the distribution of regime-normalized, smoothed sensor signals during early
engine life (assumed healthy, as stated in the C-MAPSS documentation) and scores new
cycles by their Mahalanobis distance from that reference. The alarm threshold is a
high quantile of scores on held-out healthy cycles, so the false-alarm rate on healthy
data is set explicitly rather than tuned on failures.
"""

import os
from typing import Dict, List, Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score, precision_recall_fscore_support

from ml.preprocessing.loader import ACTIVE_SENSORS

ANOMALY_FEATURES: List[str] = [f'{s}_norm_roll_mean' for s in ACTIVE_SENSORS]


def healthy_mask(df: pd.DataFrame, healthy_cycles: int = 30) -> pd.Series:
    return df['cycle'] <= healthy_cycles


class HealthStateMonitor:
    def __init__(self, healthy_cycles: int = 30, false_alarm_rate: float = 0.01, persistence: int = 3):
        self.healthy_cycles = healthy_cycles
        self.false_alarm_rate = false_alarm_rate
        self.persistence = persistence
        self.mean_: Optional[np.ndarray] = None
        self.precision_: Optional[np.ndarray] = None
        self.threshold: float = float('nan')

    def fit(self, train_feats: pd.DataFrame):
        ref = train_feats.loc[healthy_mask(train_feats, self.healthy_cycles), ANOMALY_FEATURES].fillna(0).values
        self.mean_ = ref.mean(axis=0)
        cov = np.cov(ref, rowvar=False) + np.eye(ref.shape[1]) * 1e-6
        self.precision_ = np.linalg.pinv(cov)
        return self

    def score(self, feats: pd.DataFrame) -> np.ndarray:
        X = feats[ANOMALY_FEATURES].fillna(0).values - self.mean_
        return np.sqrt(np.einsum('ij,jk,ik->i', X, self.precision_, X))

    def calibrate_threshold(self, cal_feats: pd.DataFrame):
        scores = self.score(cal_feats.loc[healthy_mask(cal_feats, self.healthy_cycles)])
        self.threshold = float(np.quantile(scores, 1.0 - self.false_alarm_rate))
        return self

    def persistent_alarm(self, scores: np.ndarray) -> np.ndarray:
        """True where the score has exceeded the threshold for `persistence` consecutive cycles."""
        above = (scores > self.threshold).astype(int)
        run = np.zeros_like(above)
        for i, a in enumerate(above):
            run[i] = (run[i - 1] + 1) if (a and i > 0) else a
        return run >= self.persistence

    def evaluate(self, feats: pd.DataFrame, rul_col: str = 'true_rul',
                 healthy_rul: int = 125, degraded_rul: int = 30) -> Dict[str, float]:
        """
        Proxy labels on run-to-failure engines: cycles with true RUL > healthy_rul are
        healthy, cycles with true RUL <= degraded_rul are degraded, the transition band
        in between is excluded. Also reports detection lead time per engine.
        """
        scores = self.score(feats)
        y = np.where(feats[rul_col] <= degraded_rul, 1, np.where(feats[rul_col] > healthy_rul, 0, -1))
        keep = y >= 0
        y_k, s_k = y[keep], scores[keep]
        pred = (s_k > self.threshold).astype(int)
        p, r, f1, _ = precision_recall_fscore_support(y_k, pred, average='binary', zero_division=0)

        leads, false_alarm_engines, engines = [], 0, 0
        for _, g in feats.assign(_s=scores).groupby('engine_id'):
            engines += 1
            alarm = self.persistent_alarm(g['_s'].values)
            healthy_part = (g[rul_col] > healthy_rul).values
            if (alarm & healthy_part).any():
                false_alarm_engines += 1
            idx = np.argmax(alarm) if alarm.any() else None
            if idx is not None and not healthy_part[idx]:
                leads.append(int(g[rul_col].values[idx]))

        return {
            'auroc': round(float(roc_auc_score(y_k, s_k)), 3),
            'precision': round(float(p), 3),
            'recall': round(float(r), 3),
            'f1': round(float(f1), 3),
            'threshold': round(self.threshold, 3),
            'healthy_false_alarm_rate_pct': round(float(np.mean(s_k[y_k == 0] > self.threshold) * 100), 2),
            'engines_with_false_alarm_pct': round(false_alarm_engines / max(1, engines) * 100, 1),
            'detection_rate_pct': round(len(leads) / max(1, engines) * 100, 1),
            'median_lead_time_cycles': float(np.median(leads)) if leads else None,
            'labels': f'healthy: true RUL > {healthy_rul}; degraded: true RUL <= {degraded_rul}',
        }

    def save(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self.__dict__, filepath)

    def load(self, filepath: str):
        self.__dict__.update(joblib.load(filepath))
        return self
