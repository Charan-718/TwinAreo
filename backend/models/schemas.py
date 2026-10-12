"""
TwinAero - Pydantic request and response schemas
"""

from typing import List, Optional

from pydantic import BaseModel, Field


class EngineSummary(BaseModel):
    engine_id: int
    unit_code: str
    current_cycle: int
    health_pct: float
    status: str  # HEALTHY, MONITOR, CRITICAL (derived from predicted RUL)
    rul_pred: float
    rul_lower: float
    rul_upper: float
    fault_mode: str
    fault_label: str
    operating_regime: int
    regime_name: str
    action_code: str
    drift_detected: bool
    anomaly_alarm: bool


class FleetOverviewResponse(BaseModel):
    total_engines: int
    healthy_count: int
    monitor_count: int
    critical_count: int
    average_health_pct: float
    mean_rul: float
    action_counts: dict
    drift_count: int
    engines: List[EngineSummary]


class CounterfactualRequest(BaseModel):
    altitude_kft: float = Field(default=35.0, ge=0.0, le=42.0)
    mach_number: float = Field(default=0.84, ge=0.0, le=0.84)
    throttle_pct: float = Field(default=100.0, ge=60.0, le=100.0)


class CalibrationTriggerRequest(BaseModel):
    engine_id: int = Field(..., ge=1)
    forced: bool = False
