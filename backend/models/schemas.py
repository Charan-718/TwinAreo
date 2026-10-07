"""
TwinAero - Pydantic Data Models and API Schemas
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class EngineSummary(BaseModel):
    engine_id: int
    unit_code: str
    current_cycle: int
    health_pct: float
    status: str  # HEALTHY, MONITOR, CRITICAL
    rul_pred: float
    rul_lower: float
    rul_upper: float
    fault_mode: str
    fault_label: str
    operating_regime: int
    regime_name: str


class SensorValue(BaseModel):
    key: str
    name: str
    description: str
    raw_value: float
    norm_value: float
    unit: str


class EngineTelemetryPoint(BaseModel):
    cycle: int
    setting_1: float
    setting_2: float
    setting_3: float
    regime: int
    health_pct: float
    hpc_index: float
    fan_index: float
    key_sensors: Dict[str, float]


class EngineDetailResponse(BaseModel):
    engine_id: int
    unit_code: str
    total_cycles_observed: int
    health_pct: float
    status: str
    rul_pred: float
    rul_lower: float
    rul_upper: float
    confidence_pct: float
    fault_mode: str
    fault_label: str
    operating_regime: int
    regime_name: str
    drift_status: Dict[str, Any]
    active_anomalies: List[Dict[str, Any]]
    telemetry_history: List[EngineTelemetryPoint]
    latest_sensors: List[SensorValue]


class CounterfactualRequest(BaseModel):
    altitude_kft: float = Field(default=35.0, ge=0.0, le=45.0)
    mach_number: float = Field(default=0.80, ge=0.0, le=0.90)
    throttle_pct: float = Field(default=100.0, ge=50.0, le=110.0)


class CurvePoint(BaseModel):
    cycle: int
    health: float


class CounterfactualResponse(BaseModel):
    baseline_rul: float
    counterfactual_rul: float
    rul_delta: float
    pct_change: float
    stress_ratio: float
    effective_stress: float
    baseline_curve: List[CurvePoint]
    counterfactual_curve: List[CurvePoint]
    recommendation: str
    parameters: Dict[str, float]


class CalibrationTriggerRequest(BaseModel):
    engine_id: int
    forced: bool = False


class FleetOverviewResponse(BaseModel):
    total_engines: int
    healthy_count: int
    monitor_count: int
    critical_count: int
    average_health_pct: float
    mean_rul: float
    engines: List[EngineSummary]
