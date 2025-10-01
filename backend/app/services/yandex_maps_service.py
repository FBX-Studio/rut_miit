import asyncio
import aiohttp
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import json
from dataclasses import dataclass
import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

@dataclass
class TrafficInfo:
    """Traffic information for a route segment"""
    segment_id: str
    traffic_factor: float  # 1.0 = free flow, >1.0 = congested
    speed_kmh: float
    travel_time_seconds: int
    distance_meters: int
    jam_level: int  # 0-10 scale
    description: str
    color: str  # Color for visualization
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'segment_id': self.segment_id,
            'traffic_factor': self.traffic_factor,
            'speed_kmh': self.speed_kmh,
            'travel_time_seconds': self.travel_time_seconds,
            'distance_meters': self.distance_meters,
            'jam_level': self.jam_level,
            'description': self.description,
            'color': self.color
        }

@dataclass
class RouteInfo:
    """Complete route information from Yandex Maps"""
    total_distance_meters: int
    total_time_seconds: int
    traffic_time_seconds: int
    geometry: List[Tuple[float, float]]  # List of (lat, lon) coordinates
    traffic_segments: List[TrafficInfo]
    alternative_routes: List[Dict] = None
    average_jam_level: int = 0
    traffic_delay_seconds: int = 0
    traffic_color: str = '#10B981'  # Default green
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON response"""
        return {
            'total_distance_meters': self.total_distance_meters,
            'total_time_seconds': self.total_time_seconds,
            'traffic_time_seconds': self.traffic_time_seconds,
            'traffic_delay_seconds': self.traffic_delay_seconds,
            'average_jam_level': self.average_jam_level,
            'traffic_color': self.traffic_color,
            'geometry': self.geometry,
            'traffic_segments': [seg.to_dict() for seg in self.traffic_segments],
            'alternative_routes': self.alternative_routes or []
        }

class YandexMapsService:
    """
    Service for integrating with Yandex Maps API
    Provides routing, traffic information, and ETA predictions
    """
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.yandex_maps_api_key
        self.base_url = "https://api.routing.yandex.net"
        self.geocoder_url = "https://geocode-maps.yandex.ru"
        self.traffic_url = "https://api.traffic.yandex.net"
        
        # Rate limiting
        self.requests_per_second = 10
        self.last_request_time = 0
        
        # Cache for geocoding results
        self.geocoding_cache: Dict[str, Tuple[float, float]] = {}
        
        # Session for connection pooling
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            connector=aiohttp.TCPConnector(limit=100)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def _rate_limit(self):
        """Implement rate limiting for API requests"""
        current_time = asyncio.get_event_loop().time()
        time_since_last = current_time - self.last_request_time
        min_interval = 1.0 / self.requests_per_second
        
        if time_since_last < min_interval:
            await asyncio.sleep(min_interval - time_since_last)
        
        self.last_request_time = asyncio.get_event_loop().time()
    
    async def _ensure_session(self):
        """Ensure aiohttp session is created"""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30),
                connector=aiohttp.TCPConnector(limit=100)
            )
    
    async def geocode_address(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Geocode an address to coordinates
        
        Args:
            address: Address string to geocode
            
        Returns:
            Tuple of (latitude, longitude) or None if not found
        """
        
        # Check cache first
        if address in self.geocoding_cache:
            return self.geocoding_cache[address]
        
        await self._rate_limit()
        
        try:
            params = {
                "apikey": self.api_key,
                "geocode": address,
                "format": "json",
                "results": 1
            }
            
            async with self.session.get(f"{self.geocoder_url}/1.x/", params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Parse Yandex geocoding response
                    geo_objects = data.get("response", {}).get("GeoObjectCollection", {}).get("featureMember", [])
                    
                    if geo_objects:
                        point = geo_objects[0]["GeoObject"]["Point"]["pos"]
                        lon, lat = map(float, point.split())
                        
                        # Cache the result
                        self.geocoding_cache[address] = (lat, lon)
                        
                        logger.info(f"Geocoded '{address}' to ({lat}, {lon})")
                        return (lat, lon)
                
                logger.warning(f"Geocoding failed for address: {address}")
                return None
                
        except Exception as e:
            logger.error(f"Geocoding error for '{address}': {e}")
            return None
    
    async def get_route_info(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        waypoints: List[Tuple[float, float]] = None,
        departure_time: datetime = None,
        vehicle_type: str = "car"
    ) -> Optional[RouteInfo]:
        """
        Get detailed route information including traffic
        
        Args:
            origin: Starting point (lat, lon)
            destination: End point (lat, lon)
            waypoints: Optional intermediate points
            departure_time: When to start the journey
            vehicle_type: Type of vehicle (car, truck, etc.)
            
        Returns:
            RouteInfo object with route details
        """
        
        await self._rate_limit()
        
        try:
            # Build route points
            route_points = [origin]
            if waypoints:
                route_points.extend(waypoints)
            route_points.append(destination)
            
            # Convert to Yandex format (lon,lat)
            points_str = "|".join([f"{lon},{lat}" for lat, lon in route_points])
            
            params = {
                "apikey": self.api_key,
                "waypoints": points_str,
                "mode": self._get_vehicle_mode(vehicle_type),
                "traffic": "true",
                "alternatives": "false"
            }
            
            # Add departure time if specified
            if departure_time:
                params["departure_time"] = int(departure_time.timestamp())
            
            async with self.session.get(f"{self.base_url}/v2/route", params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._parse_route_response(data)
                else:
                    logger.error(f"Route API error: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Route info error: {e}")
            return None
    
    def _get_vehicle_mode(self, vehicle_type: str) -> str:
        """Convert vehicle type to Yandex routing mode"""
        mode_mapping = {
            "car": "driving",
            "van": "driving",
            "truck": "truck",
            "motorcycle": "driving"
        }
        return mode_mapping.get(vehicle_type.lower(), "driving")
    
    def _parse_route_response(self, data: Dict) -> Optional[RouteInfo]:
        """Parse Yandex Maps route response"""
        try:
            route = data.get("route", {})
            
            if not route:
                return None
            
            # Extract basic route info
            total_distance = route.get("distance", {}).get("value", 0)
            total_time = route.get("duration", {}).get("value", 0)
            traffic_time = route.get("duration_in_traffic", {}).get("value", total_time)
            
            # Extract geometry
            geometry = []
            legs = route.get("legs", [])
            for leg in legs:
                steps = leg.get("steps", [])
                for step in steps:
                    polyline = step.get("polyline", {}).get("points", "")
                    # Decode polyline (simplified - in production use proper polyline decoder)
                    step_coords = self._decode_polyline(polyline)
                    geometry.extend(step_coords)
            
            # Extract traffic information
            traffic_segments = []
            for leg in legs:
                steps = leg.get("steps", [])
                for i, step in enumerate(steps):
                    distance = step.get("distance", {}).get("value", 0)
                    duration = step.get("duration", {}).get("value", 0)
                    traffic_duration = step.get("duration_in_traffic", {}).get("value", duration)
                    
                    if distance > 0 and duration > 0:
                        traffic_factor = traffic_duration / duration if duration > 0 else 1.0
                        speed_kmh = (distance / 1000) / (duration / 3600) if duration > 0 else 30
                        
                        # Estimate jam level based on traffic factor
                        jam_level = min(10, max(0, int((traffic_factor - 1.0) * 10)))
                        
                        traffic_segments.append(TrafficInfo(
                            segment_id=f"segment_{i}",
                            traffic_factor=traffic_factor,
                            speed_kmh=speed_kmh,
                            travel_time_seconds=traffic_duration,
                            distance_meters=distance,
                            jam_level=jam_level,
                            description=step.get("html_instructions", "")
                        ))
            
            return RouteInfo(
                total_distance_meters=total_distance,
                total_time_seconds=total_time,
                traffic_time_seconds=traffic_time,
                geometry=geometry,
                traffic_segments=traffic_segments
            )
            
        except Exception as e:
            logger.error(f"Error parsing route response: {e}")
            return None
    
    def _decode_polyline(self, polyline: str) -> List[Tuple[float, float]]:
        """
        Simplified polyline decoder
        In production, use a proper polyline decoding library
        """
        # This is a placeholder - implement proper polyline decoding
        # For now, return empty list
        return []
    
    async def get_distance_matrix(
        self,
        origins: List[Tuple[float, float]],
        destinations: List[Tuple[float, float]],
        vehicle_type: str = "car",
        departure_time: datetime = None
    ) -> Optional[Dict]:
        """
        Get distance and time matrix between multiple points
        
        Args:
            origins: List of origin points (lat, lon)
            destinations: List of destination points (lat, lon)
            vehicle_type: Type of vehicle
            departure_time: When to start the journey
            
        Returns:
            Matrix with distances and times
        """
        
        await self._rate_limit()
        
        try:
            # Convert coordinates to Yandex format
            origins_str = "|".join([f"{lon},{lat}" for lat, lon in origins])
            destinations_str = "|".join([f"{lon},{lat}" for lat, lon in destinations])
            
            params = {
                "apikey": self.api_key,
                "origins": origins_str,
                "destinations": destinations_str,
                "mode": self._get_vehicle_mode(vehicle_type),
                "traffic": "true"
            }
            
            if departure_time:
                params["departure_time"] = int(departure_time.timestamp())
            
            async with self.session.get(f"{self.base_url}/v2/matrix", params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._parse_matrix_response(data, len(origins), len(destinations))
                else:
                    logger.error(f"Matrix API error: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Distance matrix error: {e}")
            return None
    
    def _parse_matrix_response(self, data: Dict, num_origins: int, num_destinations: int) -> Dict:
        """Parse distance matrix response"""
        try:
            rows = data.get("rows", [])
            
            distance_matrix = []
            time_matrix = []
            traffic_matrix = []
            
            for i in range(num_origins):
                distance_row = []
                time_row = []
                traffic_row = []
                
                if i < len(rows):
                    elements = rows[i].get("elements", [])
                    
                    for j in range(num_destinations):
                        if j < len(elements):
                            element = elements[j]
                            
                            if element.get("status") == "OK":
                                distance = element.get("distance", {}).get("value", 0)
                                duration = element.get("duration", {}).get("value", 0)
                                traffic_duration = element.get("duration_in_traffic", {}).get("value", duration)
                                
                                distance_row.append(distance)
                                time_row.append(duration)
                                traffic_row.append(traffic_duration)
                            else:
                                # Use large values for unreachable destinations
                                distance_row.append(999999)
                                time_row.append(999999)
                                traffic_row.append(999999)
                        else:
                            distance_row.append(999999)
                            time_row.append(999999)
                            traffic_row.append(999999)
                else:
                    # Fill with large values if no data
                    distance_row = [999999] * num_destinations
                    time_row = [999999] * num_destinations
                    traffic_row = [999999] * num_destinations
                
                distance_matrix.append(distance_row)
                time_matrix.append(time_row)
                traffic_matrix.append(traffic_row)
            
            return {
                "distance_matrix": distance_matrix,
                "time_matrix": time_matrix,
                "traffic_time_matrix": traffic_matrix,
                "status": "OK"
            }
            
        except Exception as e:
            logger.error(f"Error parsing matrix response: {e}")
            return {
                "distance_matrix": [[999999] * num_destinations] * num_origins,
                "time_matrix": [[999999] * num_destinations] * num_origins,
                "traffic_time_matrix": [[999999] * num_destinations] * num_origins,
                "status": "ERROR"
            }
    
    async def get_current_traffic(
        self,
        bounds: Tuple[Tuple[float, float], Tuple[float, float]]
    ) -> Dict:
        """
        Get current traffic information for a geographic area
        
        Args:
            bounds: ((min_lat, min_lon), (max_lat, max_lon))
            
        Returns:
            Traffic information for the area
        """
        
        await self._rate_limit()
        
        try:
            (min_lat, min_lon), (max_lat, max_lon) = bounds
            
            params = {
                "apikey": self.api_key,
                "bbox": f"{min_lon},{min_lat},{max_lon},{max_lat}",
                "format": "json"
            }
            
            async with self.session.get(f"{self.traffic_url}/v1/traffic", params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._parse_traffic_response(data)
                else:
                    logger.error(f"Traffic API error: {response.status}")
                    return {"status": "ERROR", "traffic_level": 5}
                    
        except Exception as e:
            logger.error(f"Traffic info error: {e}")
            return {"status": "ERROR", "traffic_level": 5}
    
    def _parse_traffic_response(self, data: Dict) -> Dict:
        """Parse traffic information response"""
        try:
            # Simplified traffic parsing
            # In production, this would parse detailed traffic data
            
            traffic_level = data.get("traffic_level", 5)  # 0-10 scale
            incidents = data.get("incidents", [])
            
            return {
                "status": "OK",
                "traffic_level": traffic_level,
                "incidents_count": len(incidents),
                "incidents": incidents[:10],  # Limit to 10 incidents
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error parsing traffic response: {e}")
            return {"status": "ERROR", "traffic_level": 5}
    
    async def get_eta_with_traffic(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        departure_time: datetime = None,
        vehicle_type: str = "car"
    ) -> Dict:
        """
        Get ETA considering current traffic conditions
        
        Args:
            origin: Starting point (lat, lon)
            destination: End point (lat, lon)
            departure_time: When to start (default: now)
            vehicle_type: Type of vehicle
            
        Returns:
            ETA information with traffic consideration
        """
        
        if not departure_time:
            departure_time = datetime.utcnow()
        
        route_info = await self.get_route_info(
            origin=origin,
            destination=destination,
            departure_time=departure_time,
            vehicle_type=vehicle_type
        )
        
        if not route_info:
            # Fallback calculation
            return self._fallback_eta_calculation(origin, destination, departure_time)
        
        # Calculate traffic factor
        traffic_factor = (
            route_info.traffic_time_seconds / route_info.total_time_seconds
            if route_info.total_time_seconds > 0 else 1.0
        )
        
        eta = departure_time + timedelta(seconds=route_info.traffic_time_seconds)
        
        return {
            "eta": eta,
            "travel_time_seconds": route_info.traffic_time_seconds,
            "travel_time_minutes": route_info.traffic_time_seconds / 60,
            "distance_km": route_info.total_distance_meters / 1000,
            "traffic_factor": traffic_factor,
            "route_geometry": route_info.geometry,
            "traffic_segments": [
                {
                    "traffic_factor": seg.traffic_factor,
                    "jam_level": seg.jam_level,
                    "speed_kmh": seg.speed_kmh
                } for seg in route_info.traffic_segments
            ],
            "confidence": self._calculate_eta_confidence(route_info),
            "method": "yandex_maps_with_traffic"
        }
    
    def _fallback_eta_calculation(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        departure_time: datetime
    ) -> Dict:
        """Fallback ETA calculation when API is unavailable"""
        
        # Simple distance calculation (Haversine formula)
        lat1, lon1 = origin
        lat2, lon2 = destination
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
        c = 2 * np.arcsin(np.sqrt(a))
        distance_km = 6371 * c  # Earth's radius in km
        
        # Estimate travel time (assuming 30 km/h average speed in city)
        travel_time_hours = distance_km / 30
        travel_time_seconds = travel_time_hours * 3600
        
        eta = departure_time + timedelta(seconds=travel_time_seconds)
        
        return {
            "eta": eta,
            "travel_time_seconds": travel_time_seconds,
            "travel_time_minutes": travel_time_seconds / 60,
            "distance_km": distance_km,
            "traffic_factor": 1.2,  # Assume some traffic
            "confidence": 0.6,  # Lower confidence for fallback
            "method": "fallback_calculation"
        }
    
    def _calculate_eta_confidence(self, route_info: RouteInfo) -> float:
        """Calculate confidence level for ETA prediction"""
        
        base_confidence = 0.85
        
        # Reduce confidence based on traffic variability
        if route_info.traffic_segments:
            traffic_factors = [seg.traffic_factor for seg in route_info.traffic_segments]
            traffic_variance = np.var(traffic_factors)
            
            # High variance means less predictable traffic
            confidence_reduction = min(0.3, traffic_variance * 0.5)
            base_confidence -= confidence_reduction
        
        # Reduce confidence for very long routes
        if route_info.total_distance_meters > 50000:  # > 50km
            base_confidence -= 0.1
        
        return max(0.3, base_confidence)
    
    async def batch_geocode(self, addresses: List[str]) -> Dict[str, Optional[Tuple[float, float]]]:
        """
        Geocode multiple addresses in batch
        
        Args:
            addresses: List of address strings
            
        Returns:
            Dictionary mapping addresses to coordinates
        """
        
        results = {}
        
        # Process in batches to respect rate limits
        batch_size = 5
        for i in range(0, len(addresses), batch_size):
            batch = addresses[i:i + batch_size]
            
            # Process batch concurrently
            tasks = [self.geocode_address(address) for address in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Store results
            for address, result in zip(batch, batch_results):
                if isinstance(result, Exception):
                    logger.error(f"Geocoding failed for {address}: {result}")
                    results[address] = None
                else:
                    results[address] = result
            
            # Small delay between batches
            if i + batch_size < len(addresses):
                await asyncio.sleep(0.5)
        
        return results
    
    def get_service_status(self) -> Dict:
        """Get service status and statistics"""
        return {
            "api_key_configured": bool(self.api_key),
            "session_active": self.session is not None and not self.session.closed,
            "geocoding_cache_size": len(self.geocoding_cache),
            "requests_per_second_limit": self.requests_per_second,
            "base_urls": {
                "routing": self.base_url,
                "geocoding": self.geocoder_url,
                "traffic": self.traffic_url
            }
        }