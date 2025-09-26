from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./vrptw.db"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # JWT
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    
    # Yandex Maps API
    yandex_maps_api_key: Optional[str] = None
    
    # Application
    debug: bool = True
    environment: str = "development"
    
    # API Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Optimization parameters
    max_vehicles: int = 50
    max_orders: int = 1000
    delay_threshold_minutes: int = 15
    traffic_threshold_multiplier: float = 1.5
    
    # WebSocket Settings
    ws_heartbeat_interval: int = 30
    ws_max_connections: int = 100
    
    # Celery
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()