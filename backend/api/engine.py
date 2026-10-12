"""
TwinAero - Engine state endpoint
"""

from fastapi import APIRouter, Path

from backend.api.errors import service_errors
from backend.services.twin_service import DigitalTwinService

router = APIRouter(prefix="/engine", tags=["Engine"])


@router.get("/{engine_id}")
def get_engine_detail(engine_id: int = Path(..., ge=1, le=300)):
    """Full twin state: per-cycle RUL and interval, anomaly score, sensors, diagnosis, drift."""
    with service_errors():
        return DigitalTwinService.get_instance().get_engine_detail(engine_id)
