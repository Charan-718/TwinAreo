export interface EngineSummary {
  engine_id: number;
  unit_code: string;
  current_cycle: number;
  health_pct: number;
  status: 'HEALTHY' | 'MONITOR' | 'CRITICAL';
  rul_pred: number;
  rul_lower: number;
  rul_upper: number;
  fault_mode: string;
  fault_label: string;
  operating_regime: number;
  regime_name: string;
}

export interface SensorValue {
  key: string;
  name: string;
  description: string;
  raw_value: number;
  norm_value: number;
  unit: string;
}

export interface EngineTelemetryPoint {
  cycle: number;
  setting_1: number;
  setting_2: number;
  setting_3: number;
  regime: number;
  health_pct: number;
  hpc_index: number;
  fan_index: number;
  key_sensors: {
    T30: number;
    P30: number;
    Nf: number;
    Ps30: number;
    BPR: number;
  };
}

export interface Anomaly {
  component: string;
  severity: 'HIGH' | 'MODERATE' | 'LOW';
  description: string;
}

export interface DriftStatus {
  drift_detected: boolean;
  drift_score: number;
  p_value: number;
  status: string;
  severity: string;
  calibrated: boolean;
  recalibration_triggered: boolean;
  last_calibrated_cycle?: number;
  affected_channels?: Array<{
    sensor: string;
    ks_stat: number;
    p_value: number;
    wasserstein_dist: number;
  }>;
}

export interface EngineDetail {
  engine_id: number;
  unit_code: string;
  total_cycles_observed: number;
  health_pct: number;
  status: 'HEALTHY' | 'MONITOR' | 'CRITICAL';
  rul_pred: number;
  rul_lower: number;
  rul_upper: number;
  confidence_pct: number;
  fault_mode: string;
  fault_label: string;
  operating_regime: number;
  regime_name: string;
  drift_status: DriftStatus;
  active_anomalies: Anomaly[];
  telemetry_history: EngineTelemetryPoint[];
  latest_sensors: SensorValue[];
}

export interface CounterfactualResponse {
  baseline_rul: number;
  counterfactual_rul: number;
  rul_delta: number;
  pct_change: number;
  stress_ratio: number;
  effective_stress: number;
  baseline_curve: Array<{ cycle: number; health: number }>;
  counterfactual_curve: Array<{ cycle: number; health: number }>;
  recommendation: string;
  parameters: {
    altitude_kft: number;
    mach_number: number;
    throttle_pct: number;
  };
}

export interface AdvisorAssessment {
  agent_id: string;
  timestamp_cycle: number;
  diagnostic_summary: string;
  root_cause: string;
  urgency: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  airworthiness_risk: 'NOMINAL' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  dispatch_status: string;
  action_code: string;
  recommended_action: string;
  rul_assessment: {
    point_estimate: number;
    confidence_interval_90: string;
    safe_dispatch_limit: number;
  };
  calibration_note: string;
  observations: string[];
  decision_tree_path: string[];
}

export interface BenchmarkMetrics {
  dataset: string;
  train_engines: number;
  test_engines: number;
  operating_conditions: number;
  fault_modes: string[];
  metrics: {
    train_rmse: number;
    train_mae: number;
    test_rmse: number;
    test_mae: number;
    nasa_score: number;
    mean_nasa_score: number;
    target_coverage_pct: number;
    empirical_coverage_pct: number;
    mpiw_cycles: number;
    coverage_valid: boolean;
  };
}
