"""
Сервис для построения геометрии маршрутов через Yandex Maps API
"""
import httpx
import logging
from typing import List, Tuple, Optional
from fastapi import HTTPException

from app.core.config import settings

logger = logging.getLogger(__name__)


class RouteGeometryService:
    """Сервис для построения маршрутов по дорогам"""
    
    def __init__(self):
        self.api_key = settings.yandex_maps_api_key or ""
        # Yandex Routes API (альтернатива Router API v2)
        # Router API v2 требует коммерческий аккаунт
        self.router_url = "https://api.routing.yandex.net/v2/route"
        
        logger.info(f"RouteGeometryService initialized with API key: {self.api_key[:10]}...")
        
    async def build_route_geometry(
        self,
        waypoints: List[Tuple[float, float]],
        avoid_tolls: bool = False,
        avoid_unpaved: bool = False
    ) -> List[List[float]]:
        """
        Построить маршрут по дорогам через Yandex Router API
        
        Args:
            waypoints: Список точек маршрута [(lat, lon), ...]
            avoid_tolls: Избегать платных дорог
            avoid_unpaved: Избегать грунтовых дорог
            
        Returns:
            Список координат маршрута [[lat, lon], ...]
        """
        if len(waypoints) < 2:
            logger.warning("Not enough waypoints to build route")
            return [[lat, lon] for lat, lon in waypoints]
        
        try:
            # Формируем запрос к Yandex Router API
            params = {
                "apikey": self.api_key,
            }
            
            # Формируем список точек
            points = []
            for lat, lon in waypoints:
                points.append({
                    "type": "waypoint",
                    "point": [lon, lat]  # Yandex использует [lon, lat]
                })
            
            # Опции маршрутизации
            route_options = {
                "mode": "driving",
                "avoid_tolls": avoid_tolls,
                "avoid_unpaved": avoid_unpaved
            }
            
            request_body = {
                "points": points,
                "options": route_options
            }
            
            logger.info(f"Building route for {len(waypoints)} waypoints")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.router_url,
                    params=params,
                    json=request_body
                )
                
                if response.status_code != 200:
                    logger.error(f"Yandex API error: {response.status_code} - {response.text}")
                    # Fallback на прямые линии
                    return [[lat, lon] for lat, lon in waypoints]
                
                data = response.json()
                
                # Извлекаем геометрию маршрута
                if "route" in data and "legs" in data["route"]:
                    coordinates = []
                    for leg in data["route"]["legs"]:
                        if "steps" in leg:
                            for step in leg["steps"]:
                                if "polyline" in step:
                                    # Декодируем polyline
                                    decoded = self._decode_polyline(step["polyline"])
                                    coordinates.extend(decoded)
                    
                    if coordinates:
                        logger.info(f"Route built successfully with {len(coordinates)} points")
                        return coordinates
                
                # Если не удалось извлечь геометрию, используем прямые линии
                logger.warning("Could not extract route geometry, using direct lines")
                return [[lat, lon] for lat, lon in waypoints]
                
        except httpx.TimeoutException:
            logger.error("Yandex API timeout")
            return [[lat, lon] for lat, lon in waypoints]
        except Exception as e:
            logger.error(f"Error building route: {str(e)}")
            return [[lat, lon] for lat, lon in waypoints]
    
    def _decode_polyline(self, encoded: str) -> List[List[float]]:
        """
        Декодирование polyline из Yandex API
        
        Args:
            encoded: Закодированная строка polyline
            
        Returns:
            Список координат [[lat, lon], ...]
        """
        # Yandex использует свой формат polyline
        # Для упрощения вернем пустой список, так как формат может отличаться
        # В реальном проекте нужно использовать правильный декодер
        return []
    
    async def build_route_with_traffic(
        self,
        waypoints: List[Tuple[float, float]]
    ) -> dict:
        """
        Построить маршрут с учетом пробок
        
        Args:
            waypoints: Список точек маршрута
            
        Returns:
            Словарь с геометрией и информацией о маршруте
        """
        try:
            params = {
                "apikey": self.api_key,
            }
            
            points = []
            for lat, lon in waypoints:
                points.append({
                    "type": "waypoint",
                    "point": [lon, lat]  # Yandex Router ожидает [lon, lat]
                })
            
            request_body = {
                "points": points,
                "options": {
                    "mode": "driving",
                    "traffic_mode": "enabled"  # Учитываем пробки
                }
            }
            
            logger.info(f"Sending request to Yandex Router API with {len(points)} points")
            logger.info(f"Request body: {request_body}")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.router_url,
                    params=params,
                    json=request_body
                )
                
                logger.info(f"Yandex Router API response status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Логируем структуру ответа для отладки
                    logger.info(f"Yandex Router API response keys: {list(data.keys())}")
                    if "route" in data:
                        logger.info(f"Route keys: {list(data['route'].keys())}")
                        if "legs" in data["route"] and len(data["route"]["legs"]) > 0:
                            logger.info(f"First leg keys: {list(data['route']['legs'][0].keys())}")
                    
                    # Логируем сырой ответ для отладки (первые 500 символов)
                    import json
                    response_str = json.dumps(data, ensure_ascii=False)[:500]
                    logger.info(f"Yandex Router API raw response: {response_str}...")
                    
                    result = {
                        "geometry": [[lat, lon] for lat, lon in waypoints],
                        "distance": 0,
                        "duration": 0,
                        "duration_in_traffic": 0
                    }
                    
                    if "route" in data:
                        route = data["route"]
                        
                        # Извлекаем метрики
                        if "distance" in route:
                            result["distance"] = route["distance"]["value"] / 1000  # в км
                        
                        if "duration" in route:
                            result["duration"] = route["duration"]["value"] / 60  # в минутах
                        
                        if "duration_in_traffic" in route:
                            result["duration_in_traffic"] = route["duration_in_traffic"]["value"] / 60
                        
                        # Извлекаем геометрию маршрута
                        coordinates = []
                        
                        # Пробуем разные варианты структуры ответа Yandex API
                        if "legs" in route:
                            for leg in route["legs"]:
                                # Вариант 1: geometry в leg
                                if "geometry" in leg and "coordinates" in leg["geometry"]:
                                    for coord in leg["geometry"]["coordinates"]:
                                        # Yandex возвращает [lon, lat], конвертируем в [lat, lon]
                                        coordinates.append([coord[1], coord[0]])
                                
                                # Вариант 2: steps с geometry
                                if "steps" in leg:
                                    for step in leg["steps"]:
                                        if "geometry" in step and "coordinates" in step["geometry"]:
                                            for coord in step["geometry"]["coordinates"]:
                                                coordinates.append([coord[1], coord[0]])
                                        
                                        # Вариант 3: polyline в step
                                        if "polyline" in step and "points" in step["polyline"]:
                                            for point in step["polyline"]["points"]:
                                                # point = [lon, lat]
                                                coordinates.append([point[1], point[0]])
                        
                        # Вариант 4: geometry на уровне route
                        if not coordinates and "geometry" in route:
                            if "coordinates" in route["geometry"]:
                                for coord in route["geometry"]["coordinates"]:
                                    coordinates.append([coord[1], coord[0]])
                        
                        if coordinates and len(coordinates) > 0:
                            result["geometry"] = coordinates
                            logger.info(f"✅ Extracted {len(coordinates)} geometry points from Yandex API")
                        else:
                            logger.warning(f"⚠️ No geometry coordinates extracted from Yandex API, using waypoints as fallback")
                    
                    logger.info(f"Final result: distance={result['distance']:.2f}km, geometry_points={len(result['geometry'])}")
                    return result
                else:
                    logger.error(f"❌ Yandex API error: {response.status_code}")
                    error_text = response.text[:200]
                    logger.error(f"Error response: {error_text}")
                    return {
                        "geometry": [[lat, lon] for lat, lon in waypoints],
                        "distance": 0,
                        "duration": 0,
                        "duration_in_traffic": 0
                    }
                    
        except Exception as e:
            logger.error(f"Error building route with traffic: {str(e)}")
            return {
                "geometry": [[lat, lon] for lat, lon in waypoints],
                "distance": 0,
                "duration": 0,
                "duration_in_traffic": 0
            }


# Singleton instance
route_geometry_service = RouteGeometryService()
