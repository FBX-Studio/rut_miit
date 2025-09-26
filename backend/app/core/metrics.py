"""
Модуль для сбора метрик Prometheus
"""
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from prometheus_client.core import CollectorRegistry
import time
from functools import wraps
from typing import Callable, Any

# Создаем собственный реестр метрик
REGISTRY = CollectorRegistry()

# Метрики для API
api_requests_total = Counter(
    'api_requests_total',
    'Total number of API requests',
    ['method', 'endpoint', 'status_code'],
    registry=REGISTRY
)

api_request_duration_seconds = Histogram(
    'api_request_duration_seconds',
    'API request duration in seconds',
    ['method', 'endpoint'],
    registry=REGISTRY
)

# Метрики для оптимизации маршрутов
optimization_requests_total = Counter(
    'optimization_requests_total',
    'Total number of optimization requests',
    ['algorithm', 'status'],
    registry=REGISTRY
)

optimization_duration_seconds = Histogram(
    'optimization_duration_seconds',
    'Optimization duration in seconds',
    ['algorithm'],
    registry=REGISTRY
)

optimization_routes_generated = Gauge(
    'optimization_routes_generated',
    'Number of routes generated in last optimization',
    registry=REGISTRY
)

optimization_total_distance = Gauge(
    'optimization_total_distance_km',
    'Total distance of optimized routes in kilometers',
    registry=REGISTRY
)

optimization_total_cost = Gauge(
    'optimization_total_cost',
    'Total cost of optimized routes',
    registry=REGISTRY
)

# Метрики для базы данных
db_connections_active = Gauge(
    'db_connections_active',
    'Number of active database connections',
    registry=REGISTRY
)

db_query_duration_seconds = Histogram(
    'db_query_duration_seconds',
    'Database query duration in seconds',
    ['operation'],
    registry=REGISTRY
)

# Метрики для заказов
orders_total = Gauge(
    'orders_total',
    'Total number of orders',
    ['status'],
    registry=REGISTRY
)

vehicles_total = Gauge(
    'vehicles_total',
    'Total number of vehicles',
    ['status'],
    registry=REGISTRY
)

drivers_total = Gauge(
    'drivers_total',
    'Total number of drivers',
    ['status'],
    registry=REGISTRY
)

# Декораторы для автоматического сбора метрик
def track_api_metrics(endpoint: str):
    """Декоратор для отслеживания метрик API"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            method = "GET"  # По умолчанию, можно улучшить
            status_code = "200"
            
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status_code = "500"
                raise
            finally:
                duration = time.time() - start_time
                api_requests_total.labels(
                    method=method,
                    endpoint=endpoint,
                    status_code=status_code
                ).inc()
                api_request_duration_seconds.labels(
                    method=method,
                    endpoint=endpoint
                ).observe(duration)
        
        return wrapper
    return decorator

def track_optimization_metrics(algorithm: str):
    """Декоратор для отслеживания метрик оптимизации"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            status = "success"
            
            try:
                result = func(*args, **kwargs)
                
                # Обновляем метрики на основе результата
                if hasattr(result, 'routes'):
                    optimization_routes_generated.set(len(result.routes))
                if hasattr(result, 'total_distance'):
                    optimization_total_distance.set(result.total_distance)
                if hasattr(result, 'total_cost'):
                    optimization_total_cost.set(result.total_cost)
                
                return result
            except Exception as e:
                status = "error"
                raise
            finally:
                duration = time.time() - start_time
                optimization_requests_total.labels(
                    algorithm=algorithm,
                    status=status
                ).inc()
                optimization_duration_seconds.labels(
                    algorithm=algorithm
                ).observe(duration)
        
        return wrapper
    return decorator

def track_db_metrics(operation: str):
    """Декоратор для отслеживания метрик базы данных"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                db_query_duration_seconds.labels(
                    operation=operation
                ).observe(duration)
        
        return wrapper
    return decorator

def get_metrics():
    """Возвращает метрики в формате Prometheus"""
    return generate_latest(REGISTRY)

def update_business_metrics(session):
    """Обновляет бизнес-метрики из базы данных"""
    from app.models import Order, Vehicle, Driver
    from app.models.order import OrderStatus
    from app.models.vehicle import VehicleStatus
    from app.models.driver import DriverStatus
    
    try:
        # Метрики заказов
        for status in OrderStatus:
            count = session.query(Order).filter(Order.status == status).count()
            orders_total.labels(status=status.value).set(count)
        
        # Метрики транспортных средств
        for status in VehicleStatus:
            count = session.query(Vehicle).filter(Vehicle.status == status).count()
            vehicles_total.labels(status=status.value).set(count)
        
        # Метрики водителей
        for status in DriverStatus:
            count = session.query(Driver).filter(Driver.status == status).count()
            drivers_total.labels(status=status.value).set(count)
            
    except Exception as e:
        print(f"Error updating business metrics: {e}")