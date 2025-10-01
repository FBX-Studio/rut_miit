"""
API endpoints для генерации случайных маршрутов доставки
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.yandex_geocoder_service import yandex_geocoder_service
from app.services.route_geometry_service import route_geometry_service

router = APIRouter(prefix="/delivery-generator", tags=["delivery-generator"])


class AddressResponse(BaseModel):
    """Ответ с адресом и координатами"""
    address: str
    street: str
    house_number: int
    coordinates: dict


class DeliveryStop(BaseModel):
    """Остановка доставки"""
    id: str
    name: str
    address: str
    type: str
    coordinates: dict


class DeliveryRouteResponse(BaseModel):
    """Полный маршрут доставки с геометрией"""
    stops: list[DeliveryStop]
    route_geometry: list[list[float]]
    distance: float
    duration: float
    duration_in_traffic: float


@router.get("/random-address", response_model=AddressResponse)
async def get_random_address():
    """
    Сгенерировать случайный адрес в Москве
    
    Использует Yandex Geocoder API для получения реальных адресов
    """
    try:
        address = await yandex_geocoder_service.generate_random_moscow_address()
        
        if not address:
            raise HTTPException(
                status_code=500,
                detail="Не удалось сгенерировать адрес"
            )
        
        return AddressResponse(**address)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка генерации адреса: {str(e)}"
        )


@router.post("/generate-route", response_model=DeliveryRouteResponse)
async def generate_delivery_route(
    num_stops: int = Query(default=5, ge=1, le=20, description="Количество точек доставки")
):
    """
    Сгенерировать полный маршрут доставки со случайными адресами
    
    Генерирует:
    1. Случайные адреса в Москве через Geocoder API
    2. Маршрут по дорогам через Router API
    3. Расстояние и время с учетом пробок
    """
    try:
        # Генерируем остановки
        stops = await yandex_geocoder_service.generate_delivery_route(num_stops)
        
        if len(stops) < 2:
            raise HTTPException(
                status_code=500,
                detail="Не удалось сгенерировать достаточно остановок"
            )
        
        # Извлекаем координаты для построения маршрута
        waypoints = [
            (stop["coordinates"]["lat"], stop["coordinates"]["lng"])
            for stop in stops
        ]
        
        # Строим маршрут по дорогам
        route_result = await route_geometry_service.build_route_with_traffic(waypoints)
        
        return DeliveryRouteResponse(
            stops=[DeliveryStop(**stop) for stop in stops],
            route_geometry=route_result["geometry"],
            distance=route_result.get("distance", 0),
            duration=route_result.get("duration", 0),
            duration_in_traffic=route_result.get("duration_in_traffic", 0)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка генерации маршрута: {str(e)}"
        )


@router.get("/geocode")
async def geocode_address(address: str = Query(..., description="Адрес для геокодирования")):
    """
    Получить координаты по адресу
    """
    try:
        coordinates = await yandex_geocoder_service.geocode_address(address)
        
        if not coordinates:
            raise HTTPException(
                status_code=404,
                detail="Адрес не найден"
            )
        
        return {
            "address": address,
            "coordinates": {
                "lat": coordinates[0],
                "lng": coordinates[1]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка геокодирования: {str(e)}"
        )


@router.get("/reverse-geocode")
async def reverse_geocode(
    lat: float = Query(..., description="Широта"),
    lng: float = Query(..., description="Долгота")
):
    """
    Получить адрес по координатам
    """
    try:
        address = await yandex_geocoder_service.reverse_geocode(lat, lng)
        
        if not address:
            raise HTTPException(
                status_code=404,
                detail="Адрес не найден"
            )
        
        return {
            "coordinates": {"lat": lat, "lng": lng},
            "address": address
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка обратного геокодирования: {str(e)}"
        )
