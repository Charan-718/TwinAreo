"""
TwinAero - Twin discrepancy and self-calibration endpoints
"""

from fastapi import APIRouter, Path

from backend.api.errors import service_errors
from backend.models.schemas import CalibrationTriggerRequest
from backend.services.twin_service import DigitalTwinService

router = APIRouter(prefix="/drift", tags=["Drift & Calibration"])


@router.get("/{engine_id}")
def get_engine_drift_status(engine_id: int = Path(..., ge=1, le=300)):
    with service_errors():
        return DigitalTwinService.get_instance().get_drift(engine_id)


@router.post("/recalibrate")
def trigger_recalibration(req: CalibrationTriggerRequest):
    """Re-runs the discrepancy check and applies the self-calibration policy."""
    with service_errors():
        return DigitalTwinService.get_instance().trigger_self_calibration(req.engine_id)
