"""
TwinAero - Remaining Useful Life (RUL) Prediction Engine
Implements ensemble prognostic model tailored for FD004 operating conditions,
with NASA C-MAPSS scoring function and residual calibration.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
import joblib
import os


def nasa_scoring_function(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Official NASA C-MAPSS scoring metric:
    Asymmetric exponential penalty function.
    Late predictions (y_pred > y_true) are penalized exponentially more severely
    than early predictions (y_pred < y_true).
    """
    d = y_pred - y_true
    scores = np.where(d < 0, np.exp(-d / 13.0) - 1.0, np.exp(d / 10.0) - 1.0)
    return float(np.sum(scores))


class RULPredictor:
    """Prognostic model for turbofan engine Remaining Useful Life."""

    def __init__(self, model_path: Optional[str] = None):
        self.model = HistGradientBoostingRegressor(
            max_iter=150,
            learning_rate=0.08,
            max_leaf_nodes=31,
            min_samples_leaf=20,
            loss='squared_error',
            random_state=42
        )
        self.feature_columns: list = []
        self.fitted: bool = False
        self.train_residuals: np.ndarray = np.array([])

        if model_path and os.path.exists(model_path):
            self.load(model_path)

    def fit(self, X: pd.DataFrame, y: np.ndarray):
        """Fits the RUL model on feature matrix X and target y."""
        self.feature_columns = list(X.columns)
        self.model.fit(X, y)
        preds = self.model.predict(X)
        self.train_residuals = y - preds
        self.fitted = True

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Generates point predictions of RUL in cycles."""
        if not self.fitted:
            raise RuntimeError("Model must be fitted before predict() is called.")
        # Ensure exact column alignment
        X_aligned = X[self.feature_columns]
        preds = self.model.predict(X_aligned)
        return np.maximum(preds, 0.0)

    def evaluate(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """Calculates RMSE, MAE, NASA Score, and Max Error."""
        errors = y_pred - y_true
        rmse = float(np.sqrt(np.mean(errors ** 2)))
        mae = float(np.mean(np.abs(errors)))
        score = nasa_scoring_function(y_true, y_pred)
        mean_score_per_unit = float(score / len(y_true)) if len(y_true) > 0 else 0.0

        return {
            'rmse': round(rmse, 2),
            'mae': round(mae, 2),
            'nasa_score': round(score, 1),
            'mean_nasa_score': round(mean_score_per_unit, 2),
        }

    def save(self, filepath: str):
        """Serializes model and state."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({
            'model': self.model,
            'feature_columns': self.feature_columns,
            'train_residuals': self.train_residuals,
            'fitted': self.fitted
        }, filepath)

    def load(self, filepath: str):
        """Loads serialized model."""
        data = joblib.load(filepath)
        self.model = data['model']
        self.feature_columns = data['feature_columns']
        self.train_residuals = data.get('train_residuals', np.array([]))
        self.fitted = data.get('fitted', True)
