"""
TwinAero - Fault-mode hypothesis from degradation signatures

C-MAPSS FD004 contains two fault modes (HPC and fan degradation) but publishes no
per-engine fault labels. The classifier therefore works in two steps:

1. Signature: for each run-to-failure training engine, the shift of every
   regime-normalized sensor between early life and end of life.
2. Unsupervised modes: k-means (k=2) over FD004 signatures. FD002 shares FD004's six
   operating conditions but has HPC degradation only, so the cluster that FD002
   signatures fall into is identified as HPC; the other is labeled fan.

A truncated engine is classified by the nearest mode centroid of its current shift.
When the shift is still small relative to end-of-life signatures, the classifier
reports "no clear signature yet" instead of guessing. Results are hypotheses, and
the API and UI present them that way.
"""

import os
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

from ml.preprocessing.loader import ACTIVE_SENSORS

SIGNATURE_SENSORS: List[str] = [f'{s}_norm' for s in ACTIVE_SENSORS]
WINDOW = 15


def signature(engine_df: pd.DataFrame, window: int = WINDOW) -> np.ndarray:
    early = engine_df.head(min(window, len(engine_df)))[SIGNATURE_SENSORS].mean()
    late = engine_df.tail(min(window, len(engine_df)))[SIGNATURE_SENSORS].mean()
    return (late - early).fillna(0).values


class FaultClassifier:
    FAULT_LABELS = {
        'NO_CLEAR_SIGNATURE': 'No clear degradation signature yet',
        'HPC_DEGRADATION': 'High-pressure compressor (HPC) degradation',
        'FAN_DEGRADATION': 'Fan degradation',
    }

    def __init__(self, model_path: Optional[str] = None):
        self.centroids: Optional[np.ndarray] = None
        self.mode_names: List[str] = []
        self.reference_norm: float = 1.0
        self.min_signature_fraction: float = 0.35
        self.fit_report: Dict[str, Any] = {}
        if model_path and os.path.exists(model_path):
            self.load(model_path)

    @property
    def fitted(self) -> bool:
        return self.centroids is not None

    def fit(self, fd004_train_feats: pd.DataFrame, hpc_only_feats: pd.DataFrame, seed: int = 7):
        sigs = np.vstack([signature(g) for _, g in fd004_train_feats.groupby('engine_id')])
        km = KMeans(n_clusters=2, n_init=20, random_state=seed).fit(sigs)
        hpc_sigs = np.vstack([signature(g) for _, g in hpc_only_feats.groupby('engine_id')])
        hpc_assign = km.predict(hpc_sigs)
        hpc_cluster = int(np.bincount(hpc_assign, minlength=2).argmax())

        self.centroids = km.cluster_centers_
        self.mode_names = ['HPC_DEGRADATION' if i == hpc_cluster else 'FAN_DEGRADATION' for i in range(2)]
        self.reference_norm = float(np.median(np.linalg.norm(sigs, axis=1)))

        sizes = np.bincount(km.labels_, minlength=2)
        self.fit_report = {
            'fd004_engines': int(len(sigs)),
            'cluster_sizes': {self.mode_names[i]: int(sizes[i]) for i in range(2)},
            'silhouette': round(float(silhouette_score(sigs, km.labels_)), 3),
            'fd002_engines': int(len(hpc_sigs)),
            'fd002_assigned_to_hpc_pct': round(float(np.mean(hpc_assign == hpc_cluster) * 100), 1),
            'top_separating_sensors': self._separating_sensors(),
        }
        return self

    def _separating_sensors(self, k: int = 5) -> List[Dict[str, float]]:
        diff = self.centroids[self.mode_names.index('HPC_DEGRADATION')] - \
               self.centroids[self.mode_names.index('FAN_DEGRADATION')]
        order = np.argsort(-np.abs(diff))[:k]
        return [{'sensor': SIGNATURE_SENSORS[i].replace('_norm', ''), 'hpc_minus_fan_sigma': round(float(diff[i]), 2)}
                for i in order]

    def mode_distances(self, sig: np.ndarray) -> Dict[str, float]:
        return {name: float(np.linalg.norm(sig - c)) for name, c in zip(self.mode_names, self.centroids)}

    def diagnose_trajectory(self, engine_df: pd.DataFrame, predicted_rul: Optional[float] = None) -> Dict[str, Any]:
        if len(engine_df) == 0 or not self.fitted:
            return self._empty_diagnosis()

        sig = signature(engine_df)
        progress = float(np.linalg.norm(sig) / max(self.reference_norm, 1e-6))
        d = self.mode_distances(sig)
        # Similarity to each mode, scaled by how far the engine has progressed.
        hpc_score = round(progress * d['FAN_DEGRADATION'] / (d['HPC_DEGRADATION'] + d['FAN_DEGRADATION']), 2)
        fan_score = round(progress * d['HPC_DEGRADATION'] / (d['HPC_DEGRADATION'] + d['FAN_DEGRADATION']), 2)

        if progress < self.min_signature_fraction:
            fault_mode, confidence = 'NO_CLEAR_SIGNATURE', None
        else:
            fault_mode = min(d, key=d.get)
            near, far = sorted(d.values())
            confidence = round(1.0 - near / max(far, 1e-6), 2)

        if predicted_rul is not None:
            health_pct = round(15.0 + (min(1.0, max(0.0, predicted_rul / 125.0)) ** 0.85) * 83.0, 1)
        else:
            health_pct = round(max(10.0, 100.0 - 60.0 * min(progress, 1.5)), 1)
        status = 'HEALTHY' if health_pct >= 75.0 else 'MONITOR' if health_pct >= 45.0 else 'CRITICAL'

        return {
            'health_pct': health_pct,
            'status': status,
            'fault_mode': fault_mode,
            'fault_label': self.FAULT_LABELS[fault_mode],
            'confidence': confidence,
            'hpc_score': hpc_score,
            'fan_score': fan_score,
            'signature_progress': round(progress, 2),
            'anomalies': self._signature_findings(sig),
            'current_cycle': int(engine_df['cycle'].iloc[-1]),
        }

    def _signature_findings(self, sig: np.ndarray, limit: float = 1.0) -> List[Dict[str, str]]:
        """Sensors whose early-to-late shift exceeds `limit` standard deviations."""
        findings = []
        for i in np.argsort(-np.abs(sig)):
            if abs(sig[i]) < limit or len(findings) >= 4:
                break
            sensor = SIGNATURE_SENSORS[i].replace('_norm', '')
            findings.append({
                'component': sensor,
                'severity': 'HIGH' if abs(sig[i]) >= 2.0 else 'MODERATE',
                'description': f'Shift of {sig[i]:+.2f} standard deviations since the first {WINDOW} observed cycles',
            })
        return findings

    def _empty_diagnosis(self) -> Dict[str, Any]:
        return {
            'health_pct': 100.0, 'status': 'HEALTHY', 'fault_mode': 'NO_CLEAR_SIGNATURE',
            'fault_label': self.FAULT_LABELS['NO_CLEAR_SIGNATURE'], 'confidence': None,
            'hpc_score': 0.0, 'fan_score': 0.0, 'signature_progress': 0.0, 'anomalies': [], 'current_cycle': 0,
        }

    def save(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self.__dict__, filepath)

    def load(self, filepath: str):
        self.__dict__.update(joblib.load(filepath))
        return self
