"""
TwinAero - Uncertainty Quantification & Conformal Prediction Engine

Two interval methods, both calibrated on engines that were never seen in training:

* Split conformal (absolute residual score): constant-width intervals.
* Conformalized Quantile Regression (CQR, Romano et al. 2019): quantile models give
  input-dependent widths; a conformal correction restores the coverage guarantee.

The guarantee is marginal and assumes calibration and deployment data are
exchangeable. Under domain shift (e.g. FD002 -> FD004) it no longer holds, which is
exactly what the self-calibration experiments measure.
"""

import os
from typing import Dict, Iterable, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
from scipy.optimize import nnls
from sklearn.ensemble import HistGradientBoostingRegressor

CONFIDENCE_LEVELS = (0.80, 0.90, 0.95)


def conformal_quantile(scores: np.ndarray, alpha: float) -> float:
    """Finite-sample corrected (1 - alpha) quantile of nonconformity scores."""
    n = len(scores)
    if n == 0:
        raise ValueError('Cannot calibrate on an empty set')
    level = min(1.0, np.ceil((n + 1) * (1.0 - alpha)) / n)
    return float(np.quantile(scores, level, method='higher'))


def interval_metrics(y_true: np.ndarray, lower: np.ndarray, upper: np.ndarray, target: float) -> Dict[str, float]:
    """Empirical coverage, mean prediction interval width and the coverage gap."""
    inside = (y_true >= lower) & (y_true <= upper)
    coverage = float(np.mean(inside) * 100.0)
    return {
        'target_coverage_pct': round(target * 100.0, 1),
        'empirical_coverage_pct': round(coverage, 2),
        'mpiw_cycles': round(float(np.mean(upper - lower)), 2),
        'coverage_gap_pct': round(coverage - target * 100.0, 2),
    }


class ConformalPredictor:
    """Split conformal intervals with absolute-residual scores, at several confidence levels."""

    def __init__(self, alpha: float = 0.10):
        self.alpha = alpha
        self.calibration_scores: np.ndarray = np.array([])
        self.q_value: float = float('nan')
        self.q_by_level: Dict[float, float] = {}
        self.is_calibrated: bool = False

    def calibrate(self, y_true: np.ndarray, y_pred: np.ndarray, alpha: Optional[float] = None,
                  levels: Iterable[float] = CONFIDENCE_LEVELS):
        if alpha is not None:
            self.alpha = alpha
        self.calibration_scores = np.sort(np.abs(np.asarray(y_true) - np.asarray(y_pred)))
        self.q_value = conformal_quantile(self.calibration_scores, self.alpha)
        self.q_by_level = {round(lv, 2): conformal_quantile(self.calibration_scores, 1.0 - lv) for lv in levels}
        self.is_calibrated = True

    def quantile_for(self, confidence: float) -> float:
        key = round(confidence, 2)
        if key in self.q_by_level:
            return self.q_by_level[key]
        return conformal_quantile(self.calibration_scores, 1.0 - confidence)

    def predict_interval(self, point_preds: np.ndarray, confidence: Optional[float] = None
                         ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        q = self.q_value if confidence is None else self.quantile_for(confidence)
        point_preds = np.asarray(point_preds, dtype=float)
        lower = np.maximum(0.0, point_preds - q)
        upper = point_preds + q
        return lower, upper, upper - lower

    def evaluate_coverage(self, y_true: np.ndarray, lower: np.ndarray, upper: np.ndarray) -> Dict[str, float]:
        return interval_metrics(y_true, lower, upper, 1.0 - self.alpha)

    def save(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({
            'alpha': self.alpha,
            'q_value': self.q_value,
            'q_by_level': self.q_by_level,
            'calibration_scores': self.calibration_scores,
            'is_calibrated': self.is_calibrated,
        }, filepath)

    def load(self, filepath: str):
        data = joblib.load(filepath)
        self.alpha = data['alpha']
        self.q_value = data['q_value']
        self.q_by_level = data.get('q_by_level', {})
        self.calibration_scores = data.get('calibration_scores', np.array([]))
        self.is_calibrated = data.get('is_calibrated', True)


class CQRPredictor:
    """Conformalized quantile regression at several confidence levels."""

    def __init__(self, levels: Iterable[float] = CONFIDENCE_LEVELS, random_state: int = 42):
        self.levels = tuple(round(lv, 2) for lv in levels)
        self.random_state = random_state
        self.models: Dict[Tuple[float, str], HistGradientBoostingRegressor] = {}
        self.corrections: Dict[float, float] = {}
        self.feature_columns: list = []
        self.is_calibrated = False

    def _quantile_model(self, q: float) -> HistGradientBoostingRegressor:
        return HistGradientBoostingRegressor(
            loss='quantile', quantile=q, max_iter=200, learning_rate=0.06,
            max_leaf_nodes=31, min_samples_leaf=40, random_state=self.random_state,
        )

    def fit(self, X: pd.DataFrame, y: np.ndarray):
        self.feature_columns = list(X.columns)
        for lv in self.levels:
            a = 1.0 - lv
            for side, q in (('lo', a / 2.0), ('hi', 1.0 - a / 2.0)):
                model = self._quantile_model(q)
                model.fit(X, y)
                self.models[(lv, side)] = model
        return self

    def _raw_bounds(self, X: pd.DataFrame, level: float) -> Tuple[np.ndarray, np.ndarray]:
        Xa = X[self.feature_columns]
        lo = self.models[(level, 'lo')].predict(Xa)
        hi = self.models[(level, 'hi')].predict(Xa)
        return np.minimum(lo, hi), np.maximum(lo, hi)

    def calibrate(self, X_cal: pd.DataFrame, y_cal: np.ndarray, cal_reference: Optional[np.ndarray] = None):
        """`cal_reference` is a 1-D unlabeled covariate (predicted RUL) kept for shift weighting."""
        y_cal = np.asarray(y_cal, dtype=float)
        self.cal_scores = {}
        for lv in self.levels:
            lo, hi = self._raw_bounds(X_cal, lv)
            scores = np.maximum(lo - y_cal, y_cal - hi)
            self.cal_scores[lv] = scores
            self.corrections[lv] = conformal_quantile(scores, 1.0 - lv)
        self.cal_reference = None if cal_reference is None else np.asarray(cal_reference, dtype=float)
        self.cal_labels = y_cal
        self.fleet_adapted = False
        self.is_calibrated = True
        return self

    def set_calibration(self, scores_by_level: Dict[float, np.ndarray], cal_reference: np.ndarray,
                        cal_labels: np.ndarray):
        """Install out-of-fold scores (cross-conformal calibration)."""
        self.cal_scores = {lv: np.asarray(scores_by_level[lv]) for lv in self.levels}
        self.corrections = {lv: conformal_quantile(self.cal_scores[lv], 1.0 - lv) for lv in self.levels}
        self.cal_reference = np.asarray(cal_reference, dtype=float)
        self.cal_labels = np.asarray(cal_labels, dtype=float)
        self.fleet_adapted = False
        self.is_calibrated = True
        return self

    def scores(self, X: pd.DataFrame, y: np.ndarray) -> Dict[float, np.ndarray]:
        out = {}
        for lv in self.levels:
            lo, hi = self._raw_bounds(X, lv)
            out[lv] = np.maximum(lo - y, y - hi)
        return out

    # -- Self-calibration to the deployed fleet -----------------------------------------
    # The deployed fleet's remaining-life distribution differs from the calibration set
    # (label shift): test trajectories stop mid/late life, while calibration engines
    # include every cycle. Black-box shift estimation (Lipton et al., 2018) recovers the
    # fleet's RUL-bin proportions from *unlabeled* predictions through the calibration
    # confusion matrix; calibration scores are then reweighted by true-RUL bin
    # (weighted conformal prediction, Tibshirani et al., 2019). The unknown weight of a new
    # point is bounded by the largest bin weight, which keeps the correction conservative.

    RUL_BINS = np.array([-np.inf, 25, 50, 75, 100, 120, np.inf])

    def adapt_to_fleet(self, fleet_reference: np.ndarray):
        if self.cal_reference is None or self.cal_labels is None:
            raise ValueError('calibrate() was called without cal_reference')
        k = len(self.RUL_BINS) - 1
        y_bin = np.clip(np.digitize(self.cal_labels, self.RUL_BINS[1:-1]), 0, k - 1)
        p_bin = np.clip(np.digitize(self.cal_reference, self.RUL_BINS[1:-1]), 0, k - 1)
        f_bin = np.clip(np.digitize(np.asarray(fleet_reference), self.RUL_BINS[1:-1]), 0, k - 1)

        confusion = np.zeros((k, k))
        np.add.at(confusion, (p_bin, y_bin), 1.0)
        confusion /= len(y_bin)
        mu = np.bincount(f_bin, minlength=k) / len(f_bin)
        w, _ = nnls(confusion, mu)
        prior_cal = np.bincount(y_bin, minlength=k) / len(y_bin)
        w = np.where(prior_cal > 0, w, 0.0)
        w = w / max(np.sum(w * prior_cal), 1e-9)          # normalize so E_cal[w] = 1
        self.label_weights = w
        self.fleet_rul_distribution = (w * prior_cal).round(3).tolist()

        w_cal = w[y_bin]
        w_new = float(w.max())
        self.weighted_corrections = {}
        for lv in self.levels:
            order = np.argsort(self.cal_scores[lv])
            s_sorted, w_sorted = self.cal_scores[lv][order], w_cal[order]
            cum = np.cumsum(w_sorted) / (w_sorted.sum() + w_new)
            idx = np.searchsorted(cum, lv, side='left')
            self.weighted_corrections[lv] = float(s_sorted[idx]) if idx < len(s_sorted) else float(s_sorted[-1])
        self.fleet_adapted = True
        return self

    def predict_interval(self, X: pd.DataFrame, confidence: float = 0.90,
                         adapted: bool = False) -> Tuple[np.ndarray, np.ndarray]:
        lv = round(confidence, 2)
        lo, hi = self._raw_bounds(X, lv)
        if adapted and getattr(self, 'fleet_adapted', False):
            e = self.weighted_corrections[lv]
        else:
            e = self.corrections.get(lv, 0.0)
        return np.maximum(0.0, lo - e), np.maximum(0.0, hi + e)

    def save(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self.__dict__, filepath)

    def load(self, filepath: str):
        self.__dict__.update(joblib.load(filepath))
        return self
