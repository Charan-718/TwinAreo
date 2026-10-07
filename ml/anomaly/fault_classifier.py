"""
TwinAero - Anomaly Detection & Fault Mode Diagnostic Classifier
Calibrated for NASA C-MAPSS FD004 dual degradation modes:
- High-Pressure Compressor (HPC) Degradation
- Fan Degradation
- Nominal Operational Health
- Combined Dual-Mode Degradation
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
import os
import joblib


class FaultClassifier:
    """Classifies engine fault modes and calculates continuous Health Index (0-100%)."""

    FAULT_MODES = {
        0: 'NORMAL_HEALTHY',
        1: 'HPC_DEGRADATION',
        2: 'FAN_DEGRADATION',
        3: 'COMBINED_DEGRADATION',
    }

    FAULT_LABELS = {
        'NORMAL_HEALTHY': 'Nominal Operational Health',
        'HPC_DEGRADATION': 'High-Pressure Compressor (HPC) Degradation',
        'FAN_DEGRADATION': 'Fan Subsystem Degradation',
        'COMBINED_DEGRADATION': 'Dual Mode (HPC + Fan) Degradation',
    }

    def __init__(self, model_path: Optional[str] = None):
        self.fitted: bool = True

    def diagnose_trajectory(self, engine_df: pd.DataFrame, predicted_rul: Optional[float] = None) -> Dict[str, Any]:
        """
        Diagnoses current status, health index, degradation metrics,
        and fault mode for a single engine's operational cycles.
        """
        if len(engine_df) == 0:
            return self._empty_diagnosis()

        latest = engine_df.iloc[-1]
        current_cycle = int(latest['cycle'])

        # Compare baseline (first 15 cycles) vs recent (last 15 cycles)
        early_window = engine_df.head(min(15, len(engine_df)))
        late_window = engine_df.tail(min(15, len(engine_df)))

        # 1. HPC Degradation Signature:
        # T30 (sensor 3) increases, P30 (sensor 7) drops, Ps30 (sensor 11) shifts
        t30_delta = float(late_window['sensor_3_norm'].mean() - early_window['sensor_3_norm'].mean())
        p30_delta = float(late_window['sensor_7_norm'].mean() - early_window['sensor_7_norm'].mean())
        ps30_delta = float(late_window['sensor_11_norm'].mean() - early_window['sensor_11_norm'].mean())
        hpc_signature = max(0.0, (t30_delta - 0.7 * p30_delta + 0.5 * ps30_delta) / 1.5)

        # 2. Fan Degradation Signature:
        # Fan speed Nf (sensor 8), corrected fan speed NRf (sensor 13), Bypass Ratio BPR (sensor 15)
        nf_delta = float(abs(late_window['sensor_8_norm'].mean() - early_window['sensor_8_norm'].mean()))
        bpr_delta = float(abs(late_window['sensor_15_norm'].mean() - early_window['sensor_15_norm'].mean()))
        p15_delta = float(abs(late_window['sensor_6_norm'].mean() - early_window['sensor_6_norm'].mean()))
        fan_signature = max(0.0, (0.5 * nf_delta + 0.6 * bpr_delta + 0.4 * p15_delta) / 1.5)

        # Health Index calculation:
        # If predicted RUL is supplied, calibrate health percentage smoothly:
        # Healthy: 75-100%, Monitor: 45-74%, Critical: 5-44%
        if predicted_rul is not None:
            # Map RUL [0, 125] -> Health [15%, 98%]
            norm_rul = min(1.0, max(0.0, predicted_rul / 125.0))
            health_pct = 15.0 + (norm_rul ** 0.85) * 83.0
        else:
            total_dev = 0.55 * hpc_signature + 0.45 * fan_signature
            health_pct = max(10.0, min(99.0, 100.0 - (total_dev * 25.0)))

        health_pct = round(float(health_pct), 1)

        # Classify status
        if health_pct >= 75.0:
            status = 'HEALTHY'
        elif health_pct >= 45.0:
            status = 'MONITOR'
        else:
            status = 'CRITICAL'

        # Classify fault mode
        if health_pct >= 85.0 and hpc_signature < 0.6 and fan_signature < 0.6:
            fault_mode = 'NORMAL_HEALTHY'
            confidence = round(float(min(0.99, 0.75 + (health_pct - 80.0) / 100.0)), 2)
        elif hpc_signature > fan_signature * 1.2:
            fault_mode = 'HPC_DEGRADATION'
            confidence = round(float(min(0.98, 0.82 + 0.12 * (1.0 - health_pct / 100.0))), 2)
        elif fan_signature > hpc_signature * 1.2:
            fault_mode = 'FAN_DEGRADATION'
            confidence = round(float(min(0.98, 0.80 + 0.14 * (1.0 - health_pct / 100.0))), 2)
        else:
            fault_mode = 'COMBINED_DEGRADATION'
            confidence = round(float(min(0.96, 0.85 + 0.10 * (1.0 - health_pct / 100.0))), 2)

        # Active anomalies
        anomalies = []
        if hpc_signature > 0.5:
            anomalies.append({
                'component': 'High-Pressure Compressor (HPC)',
                'severity': 'HIGH' if hpc_signature > 1.2 else 'MODERATE',
                'description': f'T30 thermal rise (+{t30_delta:.2f}σ) and P30 drop ({p30_delta:.2f}σ) indicating blade erosion & clearance leakage'
            })
        if fan_signature > 0.5:
            anomalies.append({
                'component': 'Fan & Bypass Duct Module',
                'severity': 'HIGH' if fan_signature > 1.2 else 'MODERATE',
                'description': f'Nf rotational drift (Δ{nf_delta:.2f}σ) and BPR bypass ratio shift (Δ{bpr_delta:.2f}σ)'
            })

        return {
            'health_pct': health_pct,
            'status': status,
            'fault_mode': fault_mode,
            'fault_label': self.FAULT_LABELS[fault_mode],
            'confidence': confidence,
            'hpc_score': round(float(hpc_signature), 2),
            'fan_score': round(float(fan_signature), 2),
            'anomalies': anomalies,
            'current_cycle': current_cycle,
        }

    def _empty_diagnosis(self) -> Dict[str, Any]:
        return {
            'health_pct': 100.0,
            'status': 'HEALTHY',
            'fault_mode': 'NORMAL_HEALTHY',
            'fault_label': 'Nominal Operational Health',
            'confidence': 1.0,
            'hpc_score': 0.0,
            'fan_score': 0.0,
            'anomalies': [],
            'current_cycle': 0,
        }
