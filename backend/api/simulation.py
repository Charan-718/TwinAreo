"""
TwinAero - Counterfactual what-if endpoint
"""

from fastapi import APIRouter, Path

from backend.api.errors import service_errors
from backend.models.schemas import CounterfactualRequest
from backend.services.twin_service import DigitalTwinService

router = APIRouter(prefix="/simulation", tags=["Simulation"])


@router.post("/{engine_id}/counterfactual")
def simulate_counterfactual(engine_id: int = Path(..., ge=1, le=300), request: CounterfactualRequest = CounterfactualRequest()):
    """Assumption-based what-if: how a different operating profile would change modeled RUL."""
    with service_errors():
        return DigitalTwinService.get_instance().simulate_counterfactual(
            engine_id, request.altitude_kft, request.mach_number, request.throttle_pct)
