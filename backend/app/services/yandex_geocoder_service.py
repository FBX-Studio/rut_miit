"""
Сервис для работы с Yandex Geocoder API
Генерация случайных адресов доставки в Москве
"""
import httpx
import logging
import random
from typing import List, Tuple, Optional, Dict
from app.core.config import settings

logger = logging.getLogger(__name__)


class YandexGeocoderService:
    """Сервис для геокодирования и генерации случайных адресов"""
    
    def __init__(self):
        self.api_key = settings.yandex_maps_api_key or ""
        self.geocoder_url = "https://geocode-maps.yandex.ru/1.x/"
        
        # Популярные районы Москвы для генерации адресов
        self.moscow_districts = [
            "Арбат",
            "Тверской район",
            "Хамовники",
            "Пресненский район",
            "Замоскворечье",
            "Таганский район",
            "Басманный район",
            "Красносельский район",
            "Мещанский район",
            "Якиманка",
            "Дорогомилово",
            "Фили-Давыдково",
            "Раменки",
            "Академический район",
            "Черёмушки",
        ]
        
        # Типичные названия улиц
        self.street_names = [
            "улица Тверская",
            "Ленинский проспект",
            "улица Арбат",
            "проспект Мира",
            "Кутузовский проспект",
            "улица Профсоюзная",
            "Ленинградский проспект",
            "улица Новый Арбат",
            "Садовое кольцо",
            "улица Остоженка",
            "Пречистенка улица",
            "улица Покровка",
            "Мясницкая улица",
            "улица Маросейка",
            "Петровка улица",
            "улица Кузнецкий Мост",
            "Столешников переулок",
            "улица Большая Дмитровка",
            "улица Малая Бронная",
            "улица Пятницкая",
        ]
    
    async def geocode_address(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Получить координаты по адресу
        
        Args:
            address: Адрес для геокодирования
            
        Returns:
            Кортеж (lat, lon) или None если адрес не найден
        """
        try:
            params = {
                "apikey": self.api_key,
                "geocode": address,
                "format": "json",
                "results": 1
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.geocoder_url, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Извлекаем координаты
                    try:
                        geo_object = data["response"]["GeoObjectCollection"]["featureMember"][0]["GeoObject"]
                        pos = geo_object["Point"]["pos"]
                        lon, lat = map(float, pos.split())
                        
                        logger.info(f"Geocoded '{address}' to ({lat}, {lon})")
                        return (lat, lon)
                    except (KeyError, IndexError):
                        logger.warning(f"Address not found: {address}")
                        return None
                else:
                    logger.error(f"Geocoder API error: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error geocoding address '{address}': {str(e)}")
            return None
    
    async def reverse_geocode(self, lat: float, lon: float) -> Optional[str]:
        """
        Получить адрес по координатам
        
        Args:
            lat: Широта
            lon: Долгота
            
        Returns:
            Адрес или None
        """
        try:
            params = {
                "apikey": self.api_key,
                "geocode": f"{lon},{lat}",
                "format": "json",
                "results": 1
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.geocoder_url, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    try:
                        geo_object = data["response"]["GeoObjectCollection"]["featureMember"][0]["GeoObject"]
                        address = geo_object["metaDataProperty"]["GeocoderMetaData"]["text"]
                        
                        logger.info(f"Reverse geocoded ({lat}, {lon}) to '{address}'")
                        return address
                    except (KeyError, IndexError):
                        logger.warning(f"No address found for coordinates ({lat}, {lon})")
                        return None
                else:
                    logger.error(f"Reverse geocoder API error: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error reverse geocoding ({lat}, {lon}): {str(e)}")
            return None
    
    async def generate_random_moscow_address(self) -> Optional[Dict[str, any]]:
        """
        Сгенерировать случайный адрес в Москве
        
        Returns:
            Словарь с адресом и координатами
        """
        # Выбираем случайную улицу и дом
        street = random.choice(self.street_names)
        house_number = random.randint(1, 100)
        
        # Формируем полный адрес
        address = f"Москва, {street}, дом {house_number}"
        
        # Получаем координаты
        coordinates = await self.geocode_address(address)
        
        if coordinates:
            return {
                "address": address,
                "street": street,
                "house_number": house_number,
                "coordinates": {
                    "lat": coordinates[0],
                    "lng": coordinates[1]
                }
            }
        else:
            # Если адрес не найден, генерируем координаты в пределах Москвы
            # Центр Москвы: 55.7558, 37.6176
            lat = 55.7558 + random.uniform(-0.15, 0.15)
            lon = 37.6176 + random.uniform(-0.20, 0.20)
            
            # Получаем реальный адрес по координатам
            real_address = await self.reverse_geocode(lat, lon)
            
            return {
                "address": real_address or address,
                "street": street,
                "house_number": house_number,
                "coordinates": {
                    "lat": lat,
                    "lng": lon
                }
            }
    
    async def generate_delivery_route(self, num_stops: int = 5) -> List[Dict[str, any]]:
        """
        Сгенерировать маршрут доставки со случайными адресами
        
        Args:
            num_stops: Количество остановок (по умолчанию 5)
            
        Returns:
            Список остановок с адресами и координатами
        """
        stops = []
        
        # Первая точка - склад (фиксированный адрес)
        depot = await self.geocode_address("Москва, Ленинградский проспект, 39")
        if depot:
            stops.append({
                "id": "depot",
                "name": "Склад",
                "address": "Москва, Ленинградский проспект, 39",
                "type": "depot",
                "coordinates": {
                    "lat": depot[0],
                    "lng": depot[1]
                }
            })
        
        # Генерируем случайные точки доставки
        for i in range(num_stops):
            delivery_address = await self.generate_random_moscow_address()
            
            if delivery_address:
                stops.append({
                    "id": f"delivery_{i+1}",
                    "name": f"Доставка {i+1}",
                    "address": delivery_address["address"],
                    "type": "delivery",
                    "coordinates": delivery_address["coordinates"]
                })
        
        # Возврат на склад
        if depot:
            stops.append({
                "id": "depot_return",
                "name": "Возврат на склад",
                "address": "Москва, Ленинградский проспект, 39",
                "type": "depot",
                "coordinates": {
                    "lat": depot[0],
                    "lng": depot[1]
                }
            })
        
        logger.info(f"Generated delivery route with {len(stops)} stops")
        return stops


# Singleton instance
yandex_geocoder_service = YandexGeocoderService()
