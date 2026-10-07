"""
TwinAero - FastAPI Application Entrypoint
Uncertainty-Aware Self-Calibrating Aerospace Engine Digital Twin
"""

import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Add project root to sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.api.fleet import router as fleet_router
from backend.api.engine import router as engine_router
from backend.api.simulation import router as simulation_router
from backend.api.drift import router as drift_router
from backend.api.advisor import router as advisor_router
from backend.services.twin_service import DigitalTwinService

app = FastAPI(
    title="TwinAero Digital Twin API",
    description="Uncertainty-Aware & Self-Calibrating Digital Twin for Aerospace Engine Health Management (NASA C-MAPSS FD004)",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(fleet_router, prefix="/api")
app.include_router(engine_router, prefix="/api")
app.include_router(simulation_router, prefix="/api")
app.include_router(drift_router, prefix="/api")
app.include_router(advisor_router, prefix="/api")


@app.on_event("startup")
def startup_event():
    print("[TwinAero API] Booting Digital Twin engine service...")
    DigitalTwinService.get_instance()
    print("[TwinAero API] Ready to receive telemetry and reasoning queries.")


@app.get("/api/health")
def healthcheck():
    return {
        "status": "healthy",
        "service": "TwinAero Digital Twin API",
        "benchmark": "NASA C-MAPSS FD004",
        "engine_count": 248,
        "operating_conditions": 6,
        "fault_modes": ["HPC Degradation", "Fan Degradation"]
    }


# Mount frontend static build if present
frontend_build_dir = os.path.join(PROJECT_ROOT, "frontend/build")
if os.path.exists(frontend_build_dir):
    app.mount("/", StaticFiles(directory=frontend_build_dir, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
