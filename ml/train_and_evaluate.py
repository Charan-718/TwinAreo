"""
TwinAero - End-to-End Model Training, Calibration, and Evaluation Script
Executes on NASA C-MAPSS FD004 (248 training engines, 249 test engines,
6 operating conditions, 2 degradation modes).
Saves models and benchmarks to ml/models/.
"""

import os
import sys
import json
import numpy as np
import pandas as pd

# Add repo root to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ml.preprocessing.loader import CMAPSSDataLoader, ACTIVE_SENSORS, SENSOR_COLS
from ml.rul.predictor import RULPredictor, nasa_scoring_function
from ml.uncertainty.conformal import ConformalPredictor
from ml.anomaly.fault_classifier import FaultClassifier
import joblib


def run_pipeline():
    print("=" * 65)
    print(" TwinAero ML Pipeline: NASA C-MAPSS FD004 Benchmark Training ")
    print("=" * 65)

    data_loader = CMAPSSDataLoader(data_dir='data/raw', max_rul_clip=125)
    print("\n[1/6] Loading C-MAPSS FD004 dataset...")
    train_df, test_df, rul_true = data_loader.load_dataset('FD004')
    print(f"  Training records: {len(train_df):,} rows from {train_df['engine_id'].nunique()} run-to-failure engines")
    print(f"  Test records:     {len(test_df):,} rows from {test_df['engine_id'].nunique()} hold-out engines")
    print(f"  Ground truth RUL: {len(rul_true)} test units")

    print("\n[2/6] Fitting operating condition regime standardizers (6 flight regimes)...")
    data_loader.fit_regime_standardization(train_df)
    train_norm = data_loader.standardize_by_regime(train_df)
    test_norm = data_loader.standardize_by_regime(test_df)

    print("\n[3/6] Extracting temporal degradation features...")
    train_feats = data_loader.extract_features(train_norm, window=10)
    test_feats = data_loader.extract_features(test_norm, window=10)

    # Feature selection: normalized sensors, rolling stats, operating settings, degradation indices
    feature_cols = [f'{s}_norm' for s in ACTIVE_SENSORS] + \
                   [f'{s}_norm_roll_mean' for s in ACTIVE_SENSORS] + \
                   [f'{s}_norm_roll_std' for s in ACTIVE_SENSORS] + \
                   ['setting_1', 'setting_2', 'setting_3', 'hpc_degrade_index', 'fan_degrade_index']

    X_train = train_feats[feature_cols].fillna(0)
    y_train = train_feats['clipped_rul'].values

    print(f"  Feature matrix shape: {X_train.shape}")

    print("\n[4/6] Training RUL Prognostic Ensemble...")
    rul_predictor = RULPredictor()
    rul_predictor.fit(X_train, y_train)

    train_preds = rul_predictor.predict(X_train)
    train_metrics = rul_predictor.evaluate(y_train, train_preds)
    print(f"  Train RMSE: {train_metrics['rmse']} cycles | MAE: {train_metrics['mae']} cycles")

    print("\n[5/6] Conformal Uncertainty Calibration (90% Confidence)...")
    # Split-conformal calibration on validation engines (units 200..248)
    val_units = train_feats['engine_id'] >= 200
    X_val = train_feats[val_units][feature_cols].fillna(0)
    y_val = train_feats[val_units]['clipped_rul'].values
    val_preds = rul_predictor.predict(X_val)

    conformal = ConformalPredictor(alpha=0.10)
    conformal.calibrate(y_val, val_preds)
    print(f"  Conformal nonconformity quantile q (90%): {conformal.q_value:.2f} cycles")

    print("\n[6/6] Evaluating on Hold-out Test Fleet (FD004)...")
    # Extract final cycle for each test engine
    last_test_rows = test_feats.groupby('engine_id').last().reset_index()
    X_test_last = last_test_rows[feature_cols].fillna(0)
    test_preds = rul_predictor.predict(X_test_last)

    # Compare against ground truth test RUL (clipped at 125 for standard benchmark consistency)
    y_test_eval = np.minimum(rul_true, 125.0)
    test_metrics = rul_predictor.evaluate(y_test_eval, test_preds)
    
    # Uncertainty intervals on test engines
    lower_bounds, upper_bounds, widths = conformal.predict_interval(test_preds)
    coverage_metrics = conformal.evaluate_coverage(y_test_eval, lower_bounds, upper_bounds)

    print("\n" + "=" * 65)
    print(" BENCHMARK RESULTS (NASA C-MAPSS FD004 Test Fleet):")
    print(f"  Test RMSE:               {test_metrics['rmse']} cycles")
    print(f"  Test MAE:                {test_metrics['mae']} cycles")
    print(f"  NASA Scoring Metric:     {test_metrics['nasa_score']}")
    print(f"  Mean NASA Score/Engine:  {test_metrics['mean_nasa_score']}")
    print(f"  Empirical Coverage (90%): {coverage_metrics['empirical_coverage_pct']}% (Target: 90.0%)")
    print(f"  Mean Interval Width:     {coverage_metrics['mpiw_cycles']} cycles")
    print("=" * 65)

    # Save artifacts
    models_dir = 'ml/models'
    os.makedirs(models_dir, exist_ok=True)
    rul_predictor.save(os.path.join(models_dir, 'rul_predictor.joblib'))
    conformal.save(os.path.join(models_dir, 'conformal_predictor.joblib'))
    joblib.dump(data_loader, os.path.join(models_dir, 'data_loader.joblib'))

    benchmark_summary = {
        'dataset': 'NASA C-MAPSS FD004',
        'train_engines': int(train_df['engine_id'].nunique()),
        'test_engines': int(test_df['engine_id'].nunique()),
        'operating_conditions': 6,
        'fault_modes': ['High-Pressure Compressor (HPC) Degradation', 'Fan Degradation'],
        'metrics': {
            'train_rmse': train_metrics['rmse'],
            'train_mae': train_metrics['mae'],
            'test_rmse': test_metrics['rmse'],
            'test_mae': test_metrics['mae'],
            'nasa_score': test_metrics['nasa_score'],
            'mean_nasa_score': test_metrics['mean_nasa_score'],
            'target_coverage_pct': coverage_metrics['target_confidence_pct'],
            'empirical_coverage_pct': coverage_metrics['empirical_coverage_pct'],
            'mpiw_cycles': coverage_metrics['mpiw_cycles'],
            'coverage_valid': coverage_metrics['is_valid']
        }
    }

    with open(os.path.join(models_dir, 'benchmark_summary.json'), 'w') as f:
        json.dump(benchmark_summary, f, indent=2)

    print(f"\nArtifacts successfully serialized to {models_dir}/")


if __name__ == '__main__':
    run_pipeline()
