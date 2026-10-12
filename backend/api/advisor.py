"""
TwinAero - Agentic maintenance advisor endpoint
"""

from fastapi import APIRouter, Path

from backend.api.errors import service_errors
from backend.services.twin_service import DigitalTwinService

router = APIRouter(prefix="/advisor", tags=["Advisor"])


@router.get("/{engine_id}")
def get_advisor_assessment(engine_id: int = Path(..., ge=1, le=300)):
    """Agent trace and recommended maintenance action for an engine."""
    with service_errors():
        return DigitalTwinService.get_instance().get_advisor(engine_id)
