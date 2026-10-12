"""
TwinAero - Fleet and evaluation endpoints
"""

from fastapi import APIRouter

from backend.api.errors import service_errors
from backend.models.schemas import FleetOverviewResponse
from backend.services.twin_service import DigitalTwinService

router = APIRouter(prefix="/fleet", tags=["Fleet"])


@router.get("/overview", response_model=FleetOverviewResponse)
def get_fleet_overview():
    """Status, RUL interval, fault hypothesis and recommended action for every FD004 test engine."""
    with service_errors():
        return DigitalTwinService.get_instance().get_fleet_overview()


@router.get("/metrics")
def get_benchmark_metrics():
    """Benchmark summary written by ml/train_and_evaluate.py."""
    return DigitalTwinService.get_instance().get_benchmark_metrics()


@router.get("/experiments")
def get_experiments():
    """Ablation, transfer, anomaly, fault-mode and decision studies (ml/experiments)."""
    return DigitalTwinService.get_instance().get_experiments()


@router.get("/test-predictions")
def get_test_predictions():
    """Last-cycle predictions against ground-truth RUL, for the evaluation view."""
    with service_errors():
        return DigitalTwinService.get_instance().get_test_predictions()
