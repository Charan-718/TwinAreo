"""
TwinAero - Agentic Reasoning AI Advisor API
"""

from fastapi import APIRouter, HTTPException, Path
from backend.services.twin_service import DigitalTwinService

router = APIRouter(prefix="/advisor", tags=["AI Advisor"])


@router.get("/{engine_id}")
def get_ai_advisor_assessment(engine_id: int = Path(..., ge=1, le=300)):
    """
    Returns agentic reasoning chain and prescriptive airworthiness recommendations.
    """
    service = DigitalTwinService.get_instance()
    try:
        return service.get_ai_advisor(engine_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
