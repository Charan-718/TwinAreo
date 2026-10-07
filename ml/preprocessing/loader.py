"""
TwinAero - NASA C-MAPSS FD004 Preprocessing and Ingestion Engine
Handles multivariate sensor streams, 6 operating condition regimes,
and dual fault modes (HPC degradation & Fan degradation).
"""

import os
import numpy as np
import pandas as pd
from typing import Tuple, Dict, List, Optional
from sklearn.cluster import KMeans

# Standard C-MAPSS 26 column definitions
SETTING_COLS = ['setting_1', 'setting_2', 'setting_3']
SENSOR_COLS = [f'sensor_{i}' for i in range(1, 22)]
COLUMN_NAMES = ['engine_id', 'cycle'] + SETTING_COLS + SENSOR_COLS

# Descriptive mapping for aerospace digital twin visualization
SENSOR_METADATA = {
    'sensor_1': {'name': 'T2', 'desc': 'Total temperature at fan inlet', 'unit': '°R'},
    'sensor_2': {'name': 'T24', 'desc': 'Total temperature at LPC outlet', 'unit': '°R'},
    'sensor_3': {'name': 'T30', 'desc': 'Total temperature at HPC outlet', 'unit': '°R'},
    'sensor_4': {'name': 'T50', 'desc': 'Total temperature at LPT outlet', 'unit': '°R'},
    'sensor_5': {'name': 'P2', 'desc': 'Pressure at fan inlet', 'unit': 'psia'},
    'sensor_6': {'name': 'P15', 'desc': 'Total pressure in bypass-duct', 'unit': 'psia'},
    'sensor_7': {'name': 'P30', 'desc': 'Total pressure at HPC outlet', 'unit': 'psia'},
    'sensor_8': {'name': 'Nf', 'desc': 'Physical fan speed', 'unit': 'rpm'},
    'sensor_9': {'name': 'Nc', 'desc': 'Physical core speed', 'unit': 'rpm'},
    'sensor_10': {'name': 'epr', 'desc': 'Engine pressure ratio (P50/P2)', 'unit': '-'},
    'sensor_11': {'name': 'Ps30', 'desc': 'Static pressure at HPC outlet', 'unit': 'psia'},
    'sensor_12': {'name': 'phi', 'desc': 'Ratio of fuel flow to Ps30', 'unit': 'pps/psi'},
    'sensor_13': {'name': 'NRf', 'desc': 'Corrected fan speed', 'unit': 'rpm'},
    'sensor_14': {'name': 'NRc', 'desc': 'Corrected core speed', 'unit': 'rpm'},
    'sensor_15': {'name': 'BPR', 'desc': 'Bypass Ratio', 'unit': '-'},
    'sensor_16': {'name': 'farB', 'desc': 'Burner fuel-air ratio', 'unit': '-'},
    'sensor_17': {'name': 'htBleed', 'desc': 'Bleed Enthalpy', 'unit': 'BTU/lbm'},
    'sensor_18': {'name': 'Nf_dmd', 'desc': 'Demanded fan speed', 'unit': 'rpm'},
    'sensor_19': {'name': 'PCNfR_dmd', 'desc': 'Demanded corrected fan speed', 'unit': 'rpm'},
    'sensor_20': {'name': 'W31', 'desc': 'HPT coolant bleed', 'unit': 'lbm/s'},
    'sensor_21': {'name': 'W32', 'desc': 'LPT coolant bleed', 'unit': 'lbm/s'},
}

SETTING_METADATA = {
    'setting_1': {'name': 'Altitude', 'desc': 'Flight altitude (0 - 42,000 ft)', 'unit': 'kft'},
    'setting_2': {'name': 'Mach', 'desc': 'Mach number (0 - 0.84)', 'unit': 'Mach'},
    'setting_3': {'name': 'TRA', 'desc': 'Throttle Resolver Angle (20 - 100)', 'unit': '°'},
}

# The 6 canonical operating condition centers for FD004 (Altitude, Mach, TRA)
# Derived from C-MAPSS flight envelope clusters
NOMINAL_REGIME_CENTERS = np.array([
    [0.0, 0.0, 100.0],       # Regime 0: Sea level static / Takeoff
    [10.0, 0.25, 100.0],     # Regime 1: Low altitude climb
    [20.0, 0.70, 100.0],     # Regime 2: Mid altitude cruise
    [25.0, 0.62, 60.0],      # Regime 3: Descent / Partial throttle
    [35.0, 0.84, 100.0],     # Regime 4: High altitude cruise
    [42.0, 0.84, 100.0],     # Regime 5: Maximum altitude ceiling
])

# Constant or invariant sensors in FD004 that provide negligible variance
INVARIANT_SENSORS = ['sensor_1', 'sensor_5', 'sensor_16', 'sensor_18', 'sensor_19']
ACTIVE_SENSORS = [s for s in SENSOR_COLS if s not in INVARIANT_SENSORS]


class CMAPSSDataLoader:
    """Loads and standardizes NASA C-MAPSS dataset trajectories."""

    def __init__(self, data_dir: str = 'data/raw', max_rul_clip: int = 125):
        self.data_dir = data_dir
        self.max_rul_clip = max_rul_clip
        self.regime_scaler: Dict[int, Dict[str, Tuple[float, float]]] = {}

    def load_dataset(self, subset: str = 'FD004') -> Tuple[pd.DataFrame, pd.DataFrame, np.ndarray]:
        """Loads train, test, and true RUL for a specific subset."""
        train_path = os.path.join(self.data_dir, f'train_{subset}.txt')
        test_path = os.path.join(self.data_dir, f'test_{subset}.txt')
        rul_path = os.path.join(self.data_dir, f'RUL_{subset}.txt')

        if not os.path.exists(train_path):
            raise FileNotFoundError(f"Training file not found: {train_path}")

        train_df = pd.read_csv(train_path, sep=r'\s+', header=None, names=COLUMN_NAMES)
        test_df = pd.read_csv(test_path, sep=r'\s+', header=None, names=COLUMN_NAMES)
        rul_true = pd.read_csv(rul_path, sep=r'\s+', header=None).values.flatten()

        # Compute piecewise linear RUL for training data
        train_df = self._compute_training_rul(train_df)

        # Assign operating condition regimes (0 through 5)
        train_df['regime'] = self._assign_operating_regimes(train_df[SETTING_COLS].values)
        test_df['regime'] = self._assign_operating_regimes(test_df[SETTING_COLS].values)

        return train_df, test_df, rul_true

    def _compute_training_rul(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculates true remaining cycles per engine and clips at max_rul_clip."""
        max_cycles = df.groupby('engine_id')['cycle'].max().reset_index()
        max_cycles.rename(columns={'cycle': 'max_cycle'}, inplace=True)
        merged = df.merge(max_cycles, on='engine_id', how='left')
        merged['true_rul'] = merged['max_cycle'] - merged['cycle']
        merged['clipped_rul'] = merged['true_rul'].clip(upper=self.max_rul_clip)
        merged.drop(columns=['max_cycle'], inplace=True)
        return merged

    def _assign_operating_regimes(self, settings: np.ndarray) -> np.ndarray:
        """Assigns each record to the closest of the 6 canonical flight operating regimes."""
        # Normalize settings for Euclidean distance: altitude ~ 0-42, Mach ~ 0-0.84, TRA ~ 60-100
        weights = np.array([1.0 / 42.0, 1.0 / 0.84, 1.0 / 40.0])
        norm_settings = settings * weights
        norm_centers = NOMINAL_REGIME_CENTERS * weights
        
        # Compute pairwise distance to 6 centers
        distances = np.linalg.norm(norm_settings[:, np.newaxis, :] - norm_centers[np.newaxis, :, :], axis=2)
        return np.argmin(distances, axis=1)

    def fit_regime_standardization(self, train_df: pd.DataFrame):
        """Computes mean and std for each sensor within each operating regime."""
        self.regime_scaler = {}
        for r in range(6):
            r_data = train_df[train_df['regime'] == r]
            self.regime_scaler[r] = {}
            for s in SENSOR_COLS:
                mean = r_data[s].mean() if len(r_data) > 0 else 0.0
                std = r_data[s].std() if len(r_data) > 0 else 1.0
                if std < 1e-6 or np.isnan(std):
                    std = 1.0
                self.regime_scaler[r][s] = (mean, std)

    def standardize_by_regime(self, df: pd.DataFrame) -> pd.DataFrame:
        """Standardizes sensor values with regime-specific mean and std to cancel operating variance."""
        df_norm = df.copy()
        for r in range(6):
            mask = df_norm['regime'] == r
            if not mask.any():
                continue
            for s in SENSOR_COLS:
                mean, std = self.regime_scaler[r][s]
                df_norm.loc[mask, f'{s}_norm'] = (df_norm.loc[mask, s] - mean) / std
        return df_norm

    def extract_features(self, df_norm: pd.DataFrame, window: int = 10) -> pd.DataFrame:
        """
        Extracts temporal rolling statistics, trends, and degradation signatures.
        """
        feats = df_norm.copy()
        norm_cols = [f'{s}_norm' for s in ACTIVE_SENSORS if f'{s}_norm' in df_norm.columns]

        # Group by engine_id for rolling window features
        rolled = feats.groupby('engine_id')[norm_cols]
        rolling_mean = rolled.rolling(window, min_periods=1).mean().reset_index(level=0, drop=True)
        rolling_std = rolled.rolling(window, min_periods=1).std().fillna(0).reset_index(level=0, drop=True)

        for col in norm_cols:
            feats[f'{col}_roll_mean'] = rolling_mean[col]
            feats[f'{col}_roll_std'] = rolling_std[col]

        # Specific component degradation index indicators:
        # HPC degradation increases T30 (sensor 3) and fuel ratio phi (sensor 12), lowers P30 (sensor 7) and Ps30 (sensor 11)
        if 'sensor_3_norm' in feats and 'sensor_7_norm' in feats:
            feats['hpc_degrade_index'] = feats['sensor_3_norm'] - feats['sensor_7_norm']
        else:
            feats['hpc_degrade_index'] = 0.0

        # Fan degradation affects fan speed Nf (sensor 8), bypass pressure P15 (sensor 6), and BPR (sensor 15)
        if 'sensor_8_norm' in feats and 'sensor_15_norm' in feats:
            feats['fan_degrade_index'] = feats['sensor_15_norm'] - feats['sensor_8_norm']
        else:
            feats['fan_degrade_index'] = 0.0

        return feats
