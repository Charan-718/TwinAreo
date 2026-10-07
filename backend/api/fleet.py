"""
TwinAero - Fleet API Endpoints
"""

from fastapi import APIRouter, HTTPException, Query
from backend.services.twin_service import DigitalTwinService
from backend.models.schemas import FleetOverviewResponse
from typing import Optional

router = APIRouter(prefix="/fleet", tags=["Fleet"])


@router.get("/overview", response_model=FleetOverviewResponse)
def get_fleet_overview():
    """Returns overview of all engines in the FD004 fleet."""
    service = DigitalTwinService.get_instance()
    return service.get_fleet_overview()


@router.get("/metrics")
def get_benchmark_metrics():
    """Returns benchmark test accuracy, NASA score, and conformal coverage metrics."""
    service = DigitalTwinService.get_instance()
    return service.get_benchmark_metrics()
