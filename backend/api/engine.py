"""
TwinAero - Engine Telemetry & Digital Twin API Endpoints
"""

from fastapi import APIRouter, HTTPException, Path
from backend.services.twin_service import DigitalTwinService
from backend.models.schemas import EngineDetailResponse

router = APIRouter(prefix="/engine", tags=["Engine"])


@router.get("/{engine_id}", response_model=EngineDetailResponse)
def get_engine_detail(engine_id: int = Path(..., ge=1, le=300)):
    """Retrieves full digital twin state and sensor history for a specific engine."""
    service = DigitalTwinService.get_instance()
    try:
        return service.get_engine_detail(engine_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
