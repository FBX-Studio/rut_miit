"""
Caching utilities for VRPTW optimization system
"""

import hashlib
import json
import logging
from typing import Any, Optional, Callable
from functools import wraps
from datetime import datetime, timedelta
import numpy as np

logger = logging.getLogger(__name__)


class SimpleCache:
    """Simple in-memory cache with TTL support"""
    
    def __init__(self, default_ttl_seconds: int = 3600):
        self.cache: dict = {}
        self.default_ttl = default_ttl_seconds
        
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if key not in self.cache:
            return None
            
        entry = self.cache[key]
        
        # Check if expired
        if datetime.now() > entry['expires_at']:
            del self.cache[key]
            return None
            
        logger.debug(f"Cache hit for key: {key}")
        return entry['value']
        
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in cache"""
        ttl = ttl or self.default_ttl
        expires_at = datetime.now() + timedelta(seconds=ttl)
        
        self.cache[key] = {
            'value': value,
            'expires_at': expires_at
        }
        
        logger.debug(f"Cache set for key: {key}, TTL: {ttl}s")
        
    def delete(self, key: str):
        """Delete value from cache"""
        if key in self.cache:
            del self.cache[key]
            logger.debug(f"Cache deleted for key: {key}")
            
    def clear(self):
        """Clear all cache"""
        self.cache.clear()
        logger.info("Cache cleared")
        
    def cleanup_expired(self):
        """Remove expired entries"""
        now = datetime.now()
        expired_keys = [
            key for key, entry in self.cache.items()
            if now > entry['expires_at']
        ]
        
        for key in expired_keys:
            del self.cache[key]
            
        if expired_keys:
            logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")


class DistanceMatrixCache(SimpleCache):
    """Specialized cache for distance matrices"""
    
    def __init__(self, ttl_seconds: int = 86400):  # 24 hours default
        super().__init__(default_ttl_seconds=ttl_seconds)
        
    def get_matrix_key(self, locations: list) -> str:
        """Generate cache key for location set"""
        # Sort locations to ensure consistent hashing
        sorted_locations = sorted([tuple(loc) for loc in locations])
        location_str = json.dumps(sorted_locations)
        return hashlib.md5(location_str.encode()).hexdigest()
        
    def get_matrix(self, locations: list) -> Optional[np.ndarray]:
        """Get distance matrix from cache"""
        key = self.get_matrix_key(locations)
        cached = self.get(key)
        
        if cached is not None:
            return np.array(cached)
        return None
        
    def set_matrix(self, locations: list, matrix: np.ndarray):
        """Set distance matrix in cache"""
        key = self.get_matrix_key(locations)
        self.set(key, matrix.tolist())


def cache_result(cache_instance: SimpleCache, ttl: Optional[int] = None, key_prefix: str = ""):
    """
    Decorator for caching function results
    
    Args:
        cache_instance: Cache instance to use
        ttl: Time to live in seconds
        key_prefix: Prefix for cache key
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            key_parts = [key_prefix, func.__name__]
            
            # Add args to key
            for arg in args:
                if isinstance(arg, (str, int, float, bool)):
                    key_parts.append(str(arg))
                elif isinstance(arg, (list, tuple)):
                    key_parts.append(str(len(arg)))
                    
            # Add kwargs to key
            for k, v in sorted(kwargs.items()):
                if isinstance(v, (str, int, float, bool)):
                    key_parts.append(f"{k}={v}")
                    
            cache_key = ":".join(key_parts)
            
            # Try to get from cache
            cached_result = cache_instance.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Returning cached result for {func.__name__}")
                return cached_result
                
            # Compute result
            result = func(*args, **kwargs)
            
            # Store in cache
            cache_instance.set(cache_key, result, ttl=ttl)
            
            return result
            
        return wrapper
    return decorator


# Global cache instances
distance_cache = DistanceMatrixCache()
route_cache = SimpleCache(default_ttl_seconds=1800)  # 30 minutes
geocoding_cache = SimpleCache(default_ttl_seconds=86400)  # 24 hours
