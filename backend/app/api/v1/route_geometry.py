"""
API endpoints для построения геометрии маршрутов
"""
from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.route_geometry_service import route_geometry_service

router = APIRouter(prefix="/route-geometry", tags=["route-geometry"])


class WaypointRequest(BaseModel):
    """Точка маршрута"""
    lat: float = Field(..., description="Широта")
    lng: float = Field(..., description="Долгота")


class RouteGeometryRequest(BaseModel):
    """Запрос на построение геометрии маршрута"""
    waypoints: List[WaypointRequest] = Field(..., description="Точки маршрута")
    avoid_tolls: bool = Field(default=False, description="Избегать платных дорог")
    avoid_unpaved: bool = Field(default=False, description="Избегать грунтовых дорог")
    with_traffic: bool = Field(default=False, description="Учитывать пробки")


class RouteGeometryResponse(BaseModel):
    """Ответ с геометрией маршрута"""
    geometry: List[List[float]] = Field(..., description="Координаты маршрута [[lat, lng], ...]")
    distance: float = Field(default=0, description="Расстояние в км")
    duration: float = Field(default=0, description="Время в пути (минуты)")
    duration_in_traffic: float = Field(default=0, description="Время в пути с учетом пробок (минуты)")


@router.post("/build", response_model=RouteGeometryResponse)
async def build_route_geometry(request: RouteGeometryRequest):
    """
    Построить геометрию маршрута по дорогам через Yandex Maps API
    
    Возвращает список координат маршрута, построенного по дорогам.
    Если построение не удалось, возвращает прямые линии между точками.
    """
    try:
        # Конвертируем точки в кортежи
        waypoints = [(wp.lat, wp.lng) for wp in request.waypoints]
        
        if len(waypoints) < 2:
            raise HTTPException(
                status_code=400,
                detail="Необходимо минимум 2 точки для построения маршрута"
            )
        
        if request.with_traffic:
            # Построение с учетом пробок и полной информацией
            result = await route_geometry_service.build_route_with_traffic(waypoints)
            return RouteGeometryResponse(
                geometry=result["geometry"],
                distance=result.get("distance", 0),
                duration=result.get("duration", 0),
                duration_in_traffic=result.get("duration_in_traffic", 0)
            )
        else:
            # Простое построение геометрии
            geometry = await route_geometry_service.build_route_geometry(
                waypoints,
                avoid_tolls=request.avoid_tolls,
                avoid_unpaved=request.avoid_unpaved
            )
            
            return RouteGeometryResponse(
                geometry=geometry,
                distance=0,
                duration=0,
                duration_in_traffic=0
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка построения маршрута: {str(e)}"
        )


@router.post("/build-simple", response_model=RouteGeometryResponse)
async def build_simple_route(waypoints: List[WaypointRequest]):
    """
    Быстрое построение маршрута с минимальными параметрами
    """
    try:
        wp_list = [(wp.lat, wp.lng) for wp in waypoints]
        
        result = await route_geometry_service.build_route_with_traffic(wp_list)
        
        return RouteGeometryResponse(
            geometry=result["geometry"],
            distance=result.get("distance", 0),
            duration=result.get("duration", 0),
            duration_in_traffic=result.get("duration_in_traffic", 0)
        )
    except Exception as e:
        # Fallback на прямые линии
        return RouteGeometryResponse(
            geometry=[[wp.lat, wp.lng] for wp in waypoints],
            distance=0,
            duration=0,
            duration_in_traffic=0
        )
