"""
Traffic information service for Yandex Maps integration
"""

import logging
import asyncio
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
import httpx
from app.services.yandex_maps_service import YandexMapsService

logger = logging.getLogger(__name__)


class TrafficLevel:
    """Traffic level constants"""
    FREE = 1  # Свободно
    LIGHT = 3  # Легкий трафик
    MODERATE = 5  # Умеренный трафик
    HEAVY = 7  # Плотный трафик
    JAM = 9  # Пробка


class TrafficSegment:
    """Traffic segment information"""
    
    def __init__(
        self,
        start: Tuple[float, float],
        end: Tuple[float, float],
        traffic_level: int,
        speed_kmh: float,
        delay_seconds: int = 0
    ):
        self.start = start
        self.end = end
        self.traffic_level = traffic_level
        self.speed_kmh = speed_kmh
        self.delay_seconds = delay_seconds


class TrafficService:
    """
    Service for retrieving and processing traffic information
    """
    
    def __init__(self, yandex_maps_service: YandexMapsService):
        self.yandex_service = yandex_maps_service
        self.traffic_cache: Dict[str, Dict] = {}
        self.cache_ttl = 300  # 5 minutes
        
    async def get_route_traffic(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        waypoints: Optional[List[Tuple[float, float]]] = None
    ) -> Dict:
        """
        Get traffic information for a route
        
        Args:
            origin: Starting point (lat, lon)
            destination: Ending point (lat, lon)
            waypoints: Optional intermediate waypoints
            
        Returns:
            Dictionary with traffic information
        """
        cache_key = self._generate_cache_key(origin, destination, waypoints)
        
        # Check cache
        if cache_key in self.traffic_cache:
            cached_data = self.traffic_cache[cache_key]
            if datetime.now() < cached_data['expires_at']:
                logger.debug(f"Using cached traffic data for {cache_key}")
                return cached_data['data']
        
        try:
            # Get route with traffic from Yandex Maps
            route_info = await self.yandex_service.get_route_info(
                origin=origin,
                destination=destination,
                waypoints=waypoints
            )
            
            if not route_info:
                logger.warning("No route information received")
                return self._get_default_traffic_data()
            
            # Process traffic information
            traffic_data = self._process_traffic_data(route_info)
            
            # Cache the result
            self.traffic_cache[cache_key] = {
                'data': traffic_data,
                'expires_at': datetime.now() + timedelta(seconds=self.cache_ttl)
            }
            
            return traffic_data
            
        except Exception as e:
            logger.error(f"Error getting traffic data: {e}", exc_info=True)
            return self._get_default_traffic_data()
    
    async def get_current_traffic_level(
        self,
        location: Tuple[float, float],
        radius_meters: int = 1000
    ) -> int:
        """
        Get current traffic level for a specific location
        
        Args:
            location: Location coordinates (lat, lon)
            radius_meters: Radius to check around location
            
        Returns:
            Traffic level (1-10)
        """
        try:
            # Create a small route around the location to get traffic
            lat, lon = location
            offset = 0.01  # Approximately 1 km
            
            nearby_point = (lat + offset, lon + offset)
            
            traffic_data = await self.get_route_traffic(location, nearby_point)
            
            return traffic_data.get('average_traffic_level', TrafficLevel.MODERATE)
            
        except Exception as e:
            logger.error(f"Error getting traffic level: {e}")
            return TrafficLevel.MODERATE
    
    async def get_traffic_forecast(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        departure_time: datetime
    ) -> Dict:
        """
        Get traffic forecast for future departure time
        
        Args:
            origin: Starting point
            destination: Ending point
            departure_time: Planned departure time
            
        Returns:
            Forecasted traffic information
        """
        # Note: Yandex Maps API может не поддерживать прогноз трафика напрямую
        # В таком случае используем исторические данные и эвристики
        
        current_traffic = await self.get_route_traffic(origin, destination)
        
        # Adjust based on time of day
        hour = departure_time.hour
        day_of_week = departure_time.weekday()
        
        # Peak hours adjustment
        rush_hour_multiplier = 1.0
        if day_of_week < 5:  # Weekday
            if 8 <= hour <= 10 or 17 <= hour <= 19:
                rush_hour_multiplier = 1.5
        
        forecast = {
            'departure_time': departure_time.isoformat(),
            'estimated_duration': current_traffic['total_time_seconds'] * rush_hour_multiplier,
            'traffic_forecast': 'heavy' if rush_hour_multiplier > 1.0 else 'moderate',
            'confidence': 0.75,
            'alternative_times': self._suggest_alternative_times(
                departure_time,
                current_traffic['total_time_seconds']
            )
        }
        
        return forecast
    
    async def calculate_eta_with_traffic(
        self,
        current_location: Tuple[float, float],
        destination: Tuple[float, float],
        remaining_stops: List[Tuple[float, float]]
    ) -> Dict:
        """
        Calculate ETA considering current traffic conditions
        
        Args:
            current_location: Driver's current position
            destination: Final destination
            remaining_stops: List of remaining delivery stops
            
        Returns:
            ETA information with traffic considerations
        """
        try:
            # Build route through all stops
            all_points = [current_location] + remaining_stops + [destination]
            
            total_time = 0
            total_distance = 0
            traffic_delay = 0
            
            # Calculate time for each segment
            for i in range(len(all_points) - 1):
                segment_traffic = await self.get_route_traffic(
                    all_points[i],
                    all_points[i + 1]
                )
                
                total_time += segment_traffic['total_time_seconds']
                total_distance += segment_traffic['total_distance_meters']
                traffic_delay += segment_traffic.get('traffic_delay_seconds', 0)
            
            eta = datetime.now() + timedelta(seconds=total_time)
            
            return {
                'eta': eta.isoformat(),
                'total_time_seconds': total_time,
                'total_distance_meters': total_distance,
                'traffic_delay_seconds': traffic_delay,
                'traffic_impact_percentage': (traffic_delay / total_time * 100) if total_time > 0 else 0,
                'confidence': 0.85,
                'alternative_eta': {
                    'optimistic': (eta - timedelta(seconds=traffic_delay * 0.5)).isoformat(),
                    'pessimistic': (eta + timedelta(seconds=traffic_delay * 0.5)).isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error calculating ETA with traffic: {e}")
            return {
                'eta': (datetime.now() + timedelta(hours=1)).isoformat(),
                'error': str(e)
            }
    
    def _process_traffic_data(self, route_info) -> Dict:
        """Process raw route information into traffic data"""
        
        traffic_time = route_info.traffic_time_seconds
        free_flow_time = route_info.total_time_seconds
        
        # Calculate traffic delay
        traffic_delay = max(0, traffic_time - free_flow_time)
        
        # Calculate average traffic level
        if traffic_delay == 0:
            avg_level = TrafficLevel.FREE
        elif traffic_delay < 300:  # < 5 minutes
            avg_level = TrafficLevel.LIGHT
        elif traffic_delay < 600:  # < 10 minutes
            avg_level = TrafficLevel.MODERATE
        elif traffic_delay < 1200:  # < 20 minutes
            avg_level = TrafficLevel.HEAVY
        else:
            avg_level = TrafficLevel.JAM
        
        # Process traffic segments
        segments = []
        if route_info.traffic_segments:
            for segment in route_info.traffic_segments:
                segments.append({
                    'traffic_level': segment.get('jam_level', 0),
                    'speed_kmh': segment.get('speed', 0),
                    'length_meters': segment.get('length', 0)
                })
        
        return {
            'total_distance_meters': route_info.total_distance_meters,
            'total_time_seconds': traffic_time,
            'free_flow_time_seconds': free_flow_time,
            'traffic_delay_seconds': traffic_delay,
            'average_traffic_level': avg_level,
            'traffic_description': self._get_traffic_description(avg_level),
            'segments': segments,
            'timestamp': datetime.now().isoformat()
        }
    
    def _get_traffic_description(self, level: int) -> str:
        """Get human-readable traffic description"""
        if level <= 2:
            return "Свободно"
        elif level <= 4:
            return "Легкий трафик"
        elif level <= 6:
            return "Умеренный трафик"
        elif level <= 8:
            return "Плотный трафик"
        else:
            return "Пробка"
    
    def _get_default_traffic_data(self) -> Dict:
        """Return default traffic data when API fails"""
        return {
            'total_distance_meters': 0,
            'total_time_seconds': 0,
            'free_flow_time_seconds': 0,
            'traffic_delay_seconds': 0,
            'average_traffic_level': TrafficLevel.MODERATE,
            'traffic_description': "Данные недоступны",
            'segments': [],
            'timestamp': datetime.now().isoformat(),
            'error': 'Traffic data unavailable'
        }
    
    def _suggest_alternative_times(
        self,
        departure_time: datetime,
        base_duration: float
    ) -> List[Dict]:
        """Suggest alternative departure times with better traffic"""
        suggestions = []
        
        # Check earlier and later times
        for offset_hours in [-2, -1, 1, 2]:
            alt_time = departure_time + timedelta(hours=offset_hours)
            hour = alt_time.hour
            
            # Estimate traffic based on time
            if 8 <= hour <= 10 or 17 <= hour <= 19:
                traffic_factor = 1.5
                description = "Час пик"
            elif 11 <= hour <= 16:
                traffic_factor = 1.0
                description = "Нормальный трафик"
            else:
                traffic_factor = 0.8
                description = "Свободно"
            
            suggestions.append({
                'time': alt_time.isoformat(),
                'estimated_duration': base_duration * traffic_factor,
                'time_savings': base_duration * (1 - traffic_factor),
                'description': description
            })
        
        return sorted(suggestions, key=lambda x: x['estimated_duration'])
    
    def _generate_cache_key(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        waypoints: Optional[List[Tuple[float, float]]] = None
    ) -> str:
        """Generate cache key for route"""
        key_parts = [
            f"{origin[0]:.4f},{origin[1]:.4f}",
            f"{destination[0]:.4f},{destination[1]:.4f}"
        ]
        
        if waypoints:
            for wp in waypoints:
                key_parts.append(f"{wp[0]:.4f},{wp[1]:.4f}")
        
        return "|".join(key_parts)
    
    def clear_cache(self):
        """Clear traffic cache"""
        self.traffic_cache.clear()
        logger.info("Traffic cache cleared")
    
    def cleanup_expired_cache(self):
        """Remove expired cache entries"""
        now = datetime.now()
        expired_keys = [
            key for key, value in self.traffic_cache.items()
            if now >= value['expires_at']
        ]
        
        for key in expired_keys:
            del self.traffic_cache[key]
        
        if expired_keys:
            logger.info(f"Cleaned up {len(expired_keys)} expired traffic cache entries")
