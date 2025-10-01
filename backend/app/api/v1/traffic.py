"""
Traffic API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Tuple
from datetime import datetime
from pydantic import BaseModel, Field
import logging

from app.services.traffic_service import TrafficService
from app.services.yandex_maps_service import YandexMapsService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Traffic"])

# Initialize services
yandex_service = YandexMapsService()
traffic_service = TrafficService(yandex_service)


class LocationModel(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class RouteTrafficRequest(BaseModel):
    origin: LocationModel
    destination: LocationModel
    waypoints: Optional[List[LocationModel]] = None


class TrafficLevelRequest(BaseModel):
    location: LocationModel
    radius_meters: int = Field(1000, ge=100, le=5000)


class TrafficForecastRequest(BaseModel):
    origin: LocationModel
    destination: LocationModel
    departure_time: datetime


class ETARequest(BaseModel):
    current_location: LocationModel
    destination: LocationModel
    remaining_stops: List[LocationModel] = []


@router.post("/route-traffic")
async def get_route_traffic(request: RouteTrafficRequest):
    """
    Get traffic information for a specific route
    
    Returns:
    - Total distance and time
    - Traffic delay
    - Average traffic level
    - Detailed segments with traffic data
    """
    try:
        origin = (request.origin.latitude, request.origin.longitude)
        destination = (request.destination.latitude, request.destination.longitude)
        
        waypoints = None
        if request.waypoints:
            waypoints = [(wp.latitude, wp.longitude) for wp in request.waypoints]
        
        traffic_data = await traffic_service.get_route_traffic(
            origin=origin,
            destination=destination,
            waypoints=waypoints
        )
        
        return {
            "success": True,
            "data": traffic_data
        }
        
    except Exception as e:
        logger.error(f"Error getting route traffic: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/traffic-level")
async def get_traffic_level(request: TrafficLevelRequest):
    """
    Get current traffic level for a specific location
    
    Returns traffic level from 1-10:
    - 1-2: Free flow
    - 3-4: Light traffic
    - 5-6: Moderate traffic
    - 7-8: Heavy traffic
    - 9-10: Jam
    """
    try:
        location = (request.location.latitude, request.location.longitude)
        
        traffic_level = await traffic_service.get_current_traffic_level(
            location=location,
            radius_meters=request.radius_meters
        )
        
        return {
            "success": True,
            "location": {
                "latitude": request.location.latitude,
                "longitude": request.location.longitude
            },
            "traffic_level": traffic_level,
            "description": traffic_service._get_traffic_description(traffic_level),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting traffic level: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/traffic-forecast")
async def get_traffic_forecast(request: TrafficForecastRequest):
    """
    Get traffic forecast for future departure time
    
    Helps optimize departure time to avoid traffic
    """
    try:
        origin = (request.origin.latitude, request.origin.longitude)
        destination = (request.destination.latitude, request.destination.longitude)
        
        forecast = await traffic_service.get_traffic_forecast(
            origin=origin,
            destination=destination,
            departure_time=request.departure_time
        )
        
        return {
            "success": True,
            "forecast": forecast
        }
        
    except Exception as e:
        logger.error(f"Error getting traffic forecast: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calculate-eta")
async def calculate_eta_with_traffic(request: ETARequest):
    """
    Calculate ETA considering current traffic conditions
    
    Takes into account:
    - Current location
    - Remaining stops
    - Real-time traffic data
    - Historical patterns
    """
    try:
        current_location = (
            request.current_location.latitude,
            request.current_location.longitude
        )
        destination = (
            request.destination.latitude,
            request.destination.longitude
        )
        remaining_stops = [
            (stop.latitude, stop.longitude)
            for stop in request.remaining_stops
        ]
        
        eta_data = await traffic_service.calculate_eta_with_traffic(
            current_location=current_location,
            destination=destination,
            remaining_stops=remaining_stops
        )
        
        return {
            "success": True,
            "eta": eta_data
        }
        
    except Exception as e:
        logger.error(f"Error calculating ETA: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/traffic-heatmap")
async def get_traffic_heatmap(
    min_lat: float = Query(..., ge=-90, le=90),
    max_lat: float = Query(..., ge=-90, le=90),
    min_lon: float = Query(..., ge=-180, le=180),
    max_lon: float = Query(..., ge=-180, le=180),
    grid_size: int = Query(10, ge=5, le=50)
):
    """
    Get traffic heatmap data for a geographical area
    
    Returns grid of traffic levels that can be visualized as a heatmap
    """
    try:
        # Create grid of points
        lat_step = (max_lat - min_lat) / grid_size
        lon_step = (max_lon - min_lon) / grid_size
        
        heatmap_data = []
        
        for i in range(grid_size):
            for j in range(grid_size):
                lat = min_lat + (i + 0.5) * lat_step
                lon = min_lon + (j + 0.5) * lon_step
                
                # Get traffic level for this point
                traffic_level = await traffic_service.get_current_traffic_level(
                    location=(lat, lon),
                    radius_meters=1000
                )
                
                heatmap_data.append({
                    "latitude": lat,
                    "longitude": lon,
                    "traffic_level": traffic_level,
                    "color": _get_traffic_color(traffic_level)
                })
        
        return {
            "success": True,
            "bounds": {
                "min_lat": min_lat,
                "max_lat": max_lat,
                "min_lon": min_lon,
                "max_lon": max_lon
            },
            "grid_size": grid_size,
            "data": heatmap_data,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating traffic heatmap: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/cache")
async def clear_traffic_cache():
    """
    Clear traffic data cache
    
    Use this endpoint to force refresh of traffic data
    """
    try:
        traffic_service.clear_cache()
        
        return {
            "success": True,
            "message": "Traffic cache cleared successfully"
        }
        
    except Exception as e:
        logger.error(f"Error clearing cache: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cache/cleanup")
async def cleanup_expired_cache():
    """
    Cleanup expired cache entries
    
    This endpoint is useful for scheduled cleanup jobs
    """
    try:
        traffic_service.cleanup_expired_cache()
        
        return {
            "success": True,
            "message": "Expired cache entries cleaned up"
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up cache: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


def _get_traffic_color(level: int) -> str:
    """Get color hex code for traffic level"""
    if level <= 2:
        return "#10B981"  # Green
    elif level <= 4:
        return "#84CC16"  # Light green
    elif level <= 6:
        return "#F59E0B"  # Amber
    elif level <= 8:
        return "#F97316"  # Orange
    else:
        return "#EF4444"  # Red
