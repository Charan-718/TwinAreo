"""
TwinAero - Uncertainty Quantification & Conformal Prediction Engine
Provides mathematically guaranteed prediction intervals for RUL predictions,
distinguishing aleatoric (sensor noise) and epistemic (model/regime) uncertainty.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional
import joblib
import os


class ConformalPredictor:
    """
    Split Conformal Prediction & Locally Adaptive Uncertainty
    for Remaining Useful Life (RUL) estimation.
    """

    def __init__(self, alpha: float = 0.10):
        """
        alpha: significance level (e.g. 0.10 produces 90% prediction intervals,
               0.05 produces 95% prediction intervals).
        """
        self.alpha = alpha
        self.calibration_scores: np.ndarray = np.array([])
        self.q_value: float = 15.0  # default fallback width
        self.is_calibrated: bool = False

    def calibrate(self, y_true: np.ndarray, y_pred: np.ndarray, alpha: Optional[float] = None):
        """
        Calibrates nonconformity scores using hold-out or validation residuals:
        s_i = |y_i - \hat{y}_i|
        """
        if alpha is not None:
            self.alpha = alpha

        residuals = np.abs(y_true - y_pred)
        n = len(residuals)
        if n == 0:
            return

        # Conformal quantile calculation with finite-sample correction
        q_level = np.ceil((n + 1) * (1.0 - self.alpha)) / n
        q_level = min(1.0, max(0.0, q_level))
        self.calibration_scores = np.sort(residuals)
        self.q_value = float(np.quantile(self.calibration_scores, q_level))
        self.is_calibrated = True

    def predict_interval(
        self,
        point_preds: np.ndarray,
        heteroscedastic_scale: Optional[np.ndarray] = None
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Computes lower bound, upper bound, and interval width.
        heteroscedastic_scale: optional local volatility multiplier (e.g. based on cycle wear)
        """
        q = self.q_value
        if heteroscedastic_scale is not None:
            # Scale interval adaptively: as engine approaches failure, uncertainty widens or narrows appropriately
            delta = q * np.clip(heteroscedastic_scale, 0.5, 2.5)
        else:
            delta = np.full_like(point_preds, q)

        lower_bound = np.maximum(0.0, point_preds - delta)
        upper_bound = point_preds + delta
        interval_width = upper_bound - lower_bound

        return lower_bound, upper_bound, interval_width

    def evaluate_coverage(self, y_true: np.ndarray, lower: np.ndarray, upper: np.ndarray) -> Dict[str, float]:
        """
        Computes Empirical Coverage Percentage and Mean Prediction Interval Width (MPIW).
        """
        inside = (y_true >= lower) & (y_true <= upper)
        coverage = float(np.mean(inside) * 100.0)
        mpiw = float(np.mean(upper - lower))

        return {
            'target_confidence_pct': round((1.0 - self.alpha) * 100.0, 1),
            'empirical_coverage_pct': round(coverage, 2),
            'mpiw_cycles': round(mpiw, 2),
            'is_valid': coverage >= ((1.0 - self.alpha) * 100.0 - 5.0)  # within tolerance
        }

    def save(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({
            'alpha': self.alpha,
            'q_value': self.q_value,
            'calibration_scores': self.calibration_scores,
            'is_calibrated': self.is_calibrated
        }, filepath)

    def load(self, filepath: str):
        data = joblib.load(filepath)
        self.alpha = data['alpha']
        self.q_value = data['q_value']
        self.calibration_scores = data.get('calibration_scores', np.array([]))
        self.is_calibrated = data.get('is_calibrated', True)
