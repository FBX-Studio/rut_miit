"""
Main FastAPI application entry point for the VRPTW optimization system.
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, Response
import uvicorn

from app.api.routes import router as api_router
from app.api.websocket import websocket_router
from app.api.v1.monitoring import router as monitoring_router
from app.api.v1.drivers import router as drivers_router
from app.api.v1.routes import router as routes_router
from app.api.v1.simulation import router as simulation_router
from app.api.v1.testing import router as testing_router
from app.optimization.vrptw_solver import VRPTWSolver
from app.optimization.adaptive_optimizer import AdaptiveOptimizer
from app.services.yandex_maps_service import YandexMapsService
from app.optimization.eta_predictor import ETAPredictor
from app.database import get_db
from app.core.metrics import get_metrics, update_business_metrics, CONTENT_TYPE_LATEST
from sqlalchemy.orm import Session

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global instances
vrptw_solver = None
adaptive_optimizer = None
yandex_maps_service = None
eta_predictor = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global vrptw_solver, adaptive_optimizer, yandex_maps_service, eta_predictor
    
    logger.info("Starting VRPTW optimization system...")
    
    try:
        # Initialize services
        yandex_maps_service = YandexMapsService(api_key=os.getenv("YANDEX_MAPS_API_KEY", ""))
        eta_predictor = ETAPredictor()
        vrptw_solver = VRPTWSolver()
        adaptive_optimizer = AdaptiveOptimizer(
            vrptw_solver=vrptw_solver,
            eta_predictor=eta_predictor,
            delay_threshold_minutes=15
        )
        
        # Store instances in app state
        app.state.vrptw_solver = vrptw_solver
        app.state.adaptive_optimizer = adaptive_optimizer
        app.state.yandex_maps_service = yandex_maps_service
        app.state.eta_predictor = eta_predictor
        
        # Note: Adaptive monitoring will be started via API endpoint
        # to avoid blocking the startup process
        
        logger.info("VRPTW optimization system started successfully")
        
        yield
        
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        raise
    finally:
        # Cleanup
        if adaptive_optimizer:
            adaptive_optimizer.stop_monitoring()
        logger.info("VRPTW optimization system stopped")


# Create FastAPI app
app = FastAPI(
    title="Slot-Aware Adaptive VRPTW System",
    description="Advanced Vehicle Routing Problem with Time Windows solver with real-time optimization",
    version="1.0.0",
    lifespan=lifespan
)

# Configure JSON response encoding
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import json

@app.middleware("http")
async def add_utf8_encoding(request, call_next):
    response = await call_next(request)
    if response.headers.get("content-type", "").startswith("application/json"):
        response.headers["content-type"] = "application/json; charset=utf-8"
    return response

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include routers
app.include_router(drivers_router, prefix="/api/v1/drivers")
app.include_router(routes_router, prefix="/api/v1/routes")
app.include_router(simulation_router, prefix="/api/v1/simulation")
app.include_router(monitoring_router, prefix="/api/v1/monitoring")
app.include_router(testing_router, prefix="/api/v1/testing")
app.include_router(api_router, prefix="/api/v1")
app.include_router(websocket_router)

@app.get("/")
async def root():
    return {"message": "Slot-Aware Adaptive VRPTW System API"}

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "services": {
            "vrptw_solver": vrptw_solver is not None,
            "adaptive_optimizer": adaptive_optimizer is not None and adaptive_optimizer.monitoring_active,
            "yandex_maps": yandex_maps_service is not None,
            "eta_predictor": eta_predictor is not None,
        }
    }

@app.get("/metrics")
async def metrics(db: Session = Depends(get_db)):
    """Endpoint для метрик Prometheus"""
    # Обновляем бизнес-метрики перед возвратом
    update_business_metrics(db)
    
    metrics_data = get_metrics()
    return Response(content=metrics_data, media_type=CONTENT_TYPE_LATEST)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True,
    )