export type Status = 'HEALTHY' | 'MONITOR' | 'CRITICAL';
export type ActionCode = 'REMOVE' | 'INSPECT' | 'CONTINUE';
export type FaultMode = 'HPC_DEGRADATION' | 'FAN_DEGRADATION' | 'NO_CLEAR_SIGNATURE';
export type LevelKey = '0.8' | '0.9' | '0.95';

export interface Interval {
  lower: number;
  upper: number;
}

export interface EngineSummary {
  engine_id: number;
  unit_code: string;
  current_cycle: number;
  health_pct: number;
  status: Status;
  rul_pred: number;
  rul_lower: number;
  rul_upper: number;
  fault_mode: FaultMode;
  fault_label: string;
  operating_regime: number;
  regime_name: string;
  action_code: ActionCode;
  drift_detected: boolean;
  anomaly_alarm: boolean;
}

export interface FleetOverview {
  total_engines: number;
  healthy_count: number;
  monitor_count: number;
  critical_count: number;
  average_health_pct: number;
  mean_rul: number;
  action_counts: Record<ActionCode, number>;
  drift_count: number;
  engines: EngineSummary[];
}

export interface HistoryPoint {
  cycle: number;
  regime: number;
  rul_pred: number;
  rul_lower: number;
  rul_upper: number;
  health_pct: number;
  anomaly_score: number;
  sensors: Record<string, number>;
}

export interface SensorReading {
  key: string;
  channel: number;
  name: string;
  description: string;
  unit: string;
  raw_value: number;
  norm_value: number | null;
  shift_sigma: number | null;
  informative: boolean;
}

export interface DriftChannel {
  sensor: string;
  ks_stat: number;
  p_value: number;
  p_value_adjusted: number;
  wasserstein_dist: number;
}

export interface DriftStatus {
  drift_detected: boolean;
  drift_score: number | null;
  threshold: number;
  p_value: number | null;
  status: 'DRIFT_DETECTED' | 'WITHIN_REFERENCE' | 'INSUFFICIENT_DATA';
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  channels: DriftChannel[];
  affected_channels: DriftChannel[];
  window_cycles: number;
}

export interface SignatureFinding {
  component: string;
  severity: 'HIGH' | 'MODERATE';
  description: string;
}

export interface CalibrationLogEntry {
  cycle: number;
  drift_score: number | null;
  escalated: boolean;
  message: string;
}

export interface OperatingSettings {
  altitude_kft: number;
  mach_number: number;
  throttle_pct: number;
}

export interface EngineDetail extends Omit<EngineSummary, 'drift_detected' | 'anomaly_alarm'> {
  total_cycles_observed: number;
  intervals: Record<LevelKey, Interval>;
  fault_confidence: number | null;
  hpc_score: number;
  fan_score: number;
  signature_progress: number;
  current_settings: OperatingSettings;
  drift_status: DriftStatus;
  anomaly: { score: number; threshold: number; alarm: boolean; first_alarm_cycle: number | null };
  active_anomalies: SignatureFinding[];
  telemetry_history: HistoryPoint[];
  latest_sensors: SensorReading[];
  calibration_log: CalibrationLogEntry[];
}

export interface CounterfactualResponse {
  baseline_rul: number;
  counterfactual_rul: number;
  counterfactual_interval: Interval | null;
  rul_delta: number;
  pct_change: number;
  stress_ratio: number;
  baseline_curve: Array<{ cycle: number; health: number }>;
  counterfactual_curve: Array<{ cycle: number; health: number }>;
  recommendation: string;
  parameters: OperatingSettings;
  current_settings: OperatingSettings;
  assumptions: string[];
}

export interface AdvisorAssessment {
  engine_id: number;
  timestamp_cycle: number;
  action_code: ActionCode;
  recommended_action: string;
  plan: string;
  decision_basis: {
    confidence_level: number;
    decision_rul: number;
    point_estimate: number;
    point_estimate_action: ActionCode;
    thresholds: { remove_at: number; inspect_at: number };
  };
  diagnostic_summary: string;
  calibration_note: string;
  scenario_note: string | null;
  trace: Array<{ agent: string; finding: string }>;
  disclaimer: string;
}

export interface CalibrationResult {
  engine_id: number;
  calibrated: boolean;
  status: string;
  message: string;
}

export interface PointMetrics {
  rmse: number;
  mae: number;
  nasa_score: number;
  mean_nasa_score: number;
}

export interface IntervalMetrics {
  target_coverage_pct: number;
  empirical_coverage_pct: number;
  mpiw_cycles: number;
  coverage_gap_pct: number;
}

export interface BenchmarkSummary {
  dataset: string;
  protocol: string;
  train_engines: number;
  test_engines: number;
  metrics: PointMetrics & {
    test_rmse: number;
    test_mae: number;
    interval_method: string;
    target_coverage_pct: number;
    empirical_coverage_pct: number;
    mpiw_cycles: number;
  };
  intervals: Record<'split' | 'cqr' | 'cqr_fleet_adapted', Record<LevelKey, IntervalMetrics>>;
  split_conformal_q90: number;
  anomaly_threshold: number;
  drift_threshold: number;
}

export interface AblationRow extends PointMetrics {
  id: string;
  name: string;
  detail: string;
  coverage_90?: number;
  width_90?: number;
  decision_agreement_pct?: number;
  missed_removals?: number;
  counterfactual_consistency_pct?: number;
}

export interface DecisionMetrics {
  agreement_pct: number;
  missed_removals: number;
  missed_removal_rate_pct: number;
  unsafe_continue: number;
  unnecessary_removals: number;
  oracle_removals: number;
  flips_per_engine_last10?: number;
}

export interface Experiments {
  generated_at: string;
  fd001: {
    description: string;
    train_engines: number;
    test_engines: number;
    conventional: PointMetrics;
    digital_twin: PointMetrics;
    split_conformal_90: IntervalMetrics;
  };
  fd004: {
    protocol: string;
    ablation: AblationRow[];
    intervals: Record<'split' | 'cqr' | 'cqr_fleet_adapted', Record<LevelKey, IntervalMetrics>>;
    calibration_curve: Array<{ nominal: number; split: number; cqr?: number; cqr_adapted?: number }>;
    decisions: {
      thresholds: { remove_at: number; inspect_at: number };
      oracle: string;
      drift_flag_rate_last_cycle_pct: number;
      policies: Record<'point_estimate' | 'split_lower_90' | 'cqr_adapted_lower_90' | 'agent', DecisionMetrics>;
    };
    counterfactual: { scenarios_checked: number; identity_at_current_point_pct: number; monotone_in_throttle_pct: number; note: string };
  };
  anomaly: {
    auroc: number;
    precision: number;
    recall: number;
    f1: number;
    healthy_false_alarm_rate_pct: number;
    engines_with_false_alarm_pct: number;
    detection_rate_pct: number;
    median_lead_time_cycles: number | null;
    labels: string;
    evaluation_engines: number;
    method: string;
  };
  fault_modes: {
    fd004_engines: number;
    cluster_sizes: Record<string, number>;
    silhouette: number;
    fd002_engines: number;
    fd002_assigned_to_hpc_pct: number;
    top_separating_sensors: Array<{ sensor: string; hpc_minus_fan_sigma: number }>;
    fd001_check: { expected: string; engines: number; hpc_pct: number; fan_pct: number };
    fd003_check: { expected: string; engines: number; hpc_pct: number; fan_pct: number };
  };
  transfer: {
    source: string;
    target: string;
    variants: Array<PointMetrics & { variant: string; detail: string; empirical_coverage_pct_90: number; mpiw_cycles_90: number; missed_removals: number }>;
    drift_detection: {
      threshold: number;
      in_domain_flag_rate_pct: number;
      shifted_flag_rate_pct: number;
      shifted_by_fault_hypothesis: Record<string, { engines: number; flag_rate_pct: number }> | null;
      note: string;
    };
  };
}

export interface TestPrediction {
  engine_id: number;
  true_rul: number;
  rul_pred: number;
  rul_lower: number;
  rul_upper: number;
  fault_mode: FaultMode;
}
