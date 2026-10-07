"""
TwinAero - Drift Detection & Self-Calibration API
"""

from fastapi import APIRouter, HTTPException, Path
from backend.services.twin_service import DigitalTwinService
from backend.models.schemas import CalibrationTriggerRequest

router = APIRouter(prefix="/drift", tags=["Drift & Calibration"])


@router.get("/{engine_id}")
def get_engine_drift_status(engine_id: int = Path(..., ge=1, le=300)):
    """Returns drift metrics and self-calibration status for engine."""
    service = DigitalTwinService.get_instance()
    try:
        detail = service.get_engine_detail(engine_id)
        return detail['drift_status']
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recalibrate")
def trigger_recalibration(req: CalibrationTriggerRequest):
    """Triggers self-calibration update for specified engine."""
    service = DigitalTwinService.get_instance()
    try:
        return service.trigger_self_calibration(req.engine_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
