"""
TwinAero - Counterfactual Digital Twin Simulation API
"""

from fastapi import APIRouter, HTTPException, Path
from backend.services.twin_service import DigitalTwinService
from backend.models.schemas import CounterfactualRequest, CounterfactualResponse

router = APIRouter(prefix="/simulation", tags=["Simulation"])


@router.post("/{engine_id}/counterfactual", response_model=CounterfactualResponse)
def simulate_counterfactual(
    engine_id: int = Path(..., ge=1, le=300),
    request: CounterfactualRequest = CounterfactualRequest()
):
    """
    Evaluates what-if operational conditions (altitude, Mach, throttle)
    and forecasts impact on component degradation velocity and RUL.
    """
    service = DigitalTwinService.get_instance()
    try:
        return service.simulate_counterfactual(
            engine_id=engine_id,
            altitude_kft=request.altitude_kft,
            mach_number=request.mach_number,
            throttle_pct=request.throttle_pct
        )
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
