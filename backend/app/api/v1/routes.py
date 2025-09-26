from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime

from app.database import get_db
from app.services.route_management import RouteManagementService, RoutePoint, OptimizationParameters
from app.models.route import Route, RouteStatus, OptimizationType

router = APIRouter(prefix="/routes", tags=["routes"])

# Pydantic модели для запросов и ответов

class RoutePointRequest(BaseModel):
    lat: float = Field(..., description="Широта")
    lng: float = Field(..., description="Долгота")
    address: str = Field(..., description="Адрес")
    stop_type: str = Field(default="delivery", description="Тип остановки")
    time_window_start: Optional[datetime] = Field(None, description="Начало временного окна")
    time_window_end: Optional[datetime] = Field(None, description="Конец временного окна")
    service_time: int = Field(default=15, description="Время обслуживания в минутах")
    weight: float = Field(default=0.0, description="Вес груза")
    volume: float = Field(default=0.0, description="Объем груза")
    priority: int = Field(default=1, description="Приоритет")

class CreateRouteRequest(BaseModel):
    name: str = Field(..., description="Название маршрута")
    points: List[RoutePointRequest] = Field(..., description="Точки маршрута")
    driver_id: Optional[int] = Field(None, description="ID водителя")
    vehicle_id: Optional[int] = Field(None, description="ID транспортного средства")
    planned_date: Optional[datetime] = Field(None, description="Планируемая дата")
    optimization_algorithm: str = Field(default="nearest_neighbor", description="Алгоритм оптимизации")
    consider_traffic: bool = Field(default=True, description="Учитывать трафик")
    consider_time_windows: bool = Field(default=True, description="Учитывать временные окна")

class UpdateRouteRequest(BaseModel):
    name: Optional[str] = Field(None, description="Название маршрута")
    driver_id: Optional[int] = Field(None, description="ID водителя")
    vehicle_id: Optional[int] = Field(None, description="ID транспортного средства")
    planned_date: Optional[datetime] = Field(None, description="Планируемая дата")
    status: Optional[str] = Field(None, description="Статус маршрута")
    notes: Optional[str] = Field(None, description="Заметки")

class OptimizationRequest(BaseModel):
    algorithm: str = Field(default="nearest_neighbor", description="Алгоритм оптимизации")
    consider_traffic: bool = Field(default=True, description="Учитывать трафик")
    consider_time_windows: bool = Field(default=True, description="Учитывать временные окна")
    consider_vehicle_capacity: bool = Field(default=True, description="Учитывать грузоподъемность")
    max_route_duration: int = Field(default=480, description="Максимальная продолжительность маршрута")
    max_stops_per_route: int = Field(default=20, description="Максимальное количество остановок")
    cost_per_km: float = Field(default=2.0, description="Стоимость за км")
    cost_per_hour: float = Field(default=25.0, description="Стоимость за час")

class SimulationRequest(BaseModel):
    traffic_multiplier: float = Field(default=1.0, description="Множитель трафика")
    weather_impact: float = Field(default=1.0, description="Влияние погоды")
    unexpected_delays: Optional[List[Dict[str, Any]]] = Field(None, description="Неожиданные задержки")

class RouteResponse(BaseModel):
    id: int
    route_number: str
    name: Optional[str] = None
    driver_id: Optional[int]
    vehicle_id: Optional[int]
    status: str
    total_distance: float
    total_duration: int
    total_stops: int
    total_weight: float
    total_volume: float
    planned_start_time: datetime
    planned_end_time: Optional[datetime]
    actual_start_time: Optional[datetime]
    actual_end_time: Optional[datetime]
    is_optimized: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

@router.post("/", response_model=RouteResponse)
async def create_route(
    request: CreateRouteRequest,
    db: Session = Depends(get_db)
):
    """Создание нового маршрута"""
    try:
        service = RouteManagementService(db)
        
        # Преобразуем точки запроса в RoutePoint
        points = [
            RoutePoint(
                lat=point.lat,
                lng=point.lng,
                address=point.address,
                stop_type=point.stop_type,
                time_window_start=point.time_window_start,
                time_window_end=point.time_window_end,
                service_time=point.service_time,
                weight=point.weight,
                volume=point.volume,
                priority=point.priority
            )
            for point in request.points
        ]
        
        # Параметры оптимизации
        optimization_params = OptimizationParameters(
            algorithm=request.optimization_algorithm,
            consider_traffic=request.consider_traffic,
            consider_time_windows=request.consider_time_windows
        ) if request.optimization_algorithm != "none" else None
        
        route = service.create_route(
            name=request.name,
            points=points,
            driver_id=request.driver_id,
            vehicle_id=request.vehicle_id,
            planned_date=request.planned_date,
            optimization_params=optimization_params
        )
        
        return RouteResponse.from_orm(route)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка создания маршрута: {str(e)}")

@router.get("/", response_model=List[RouteResponse])
async def get_routes(
    status: Optional[str] = Query(None, description="Фильтр по статусу"),
    driver_id: Optional[int] = Query(None, description="Фильтр по водителю"),
    vehicle_id: Optional[int] = Query(None, description="Фильтр по транспорту"),
    date_from: Optional[datetime] = Query(None, description="Дата от"),
    date_to: Optional[datetime] = Query(None, description="Дата до"),
    limit: int = Query(100, description="Лимит записей"),
    offset: int = Query(0, description="Смещение"),
    db: Session = Depends(get_db)
):
    """Получение списка маршрутов с фильтрацией"""
    query = db.query(Route)
    
    if status:
        query = query.filter(Route.status == status)
    if driver_id:
        query = query.filter(Route.driver_id == driver_id)
    if vehicle_id:
        query = query.filter(Route.vehicle_id == vehicle_id)
    if date_from:
        query = query.filter(Route.planned_date >= date_from)
    if date_to:
        query = query.filter(Route.planned_date <= date_to)
    
    routes = query.offset(offset).limit(limit).all()
    return [RouteResponse.from_orm(route) for route in routes]

@router.get("/{route_id}", response_model=Dict[str, Any])
async def get_route_details(
    route_id: int,
    db: Session = Depends(get_db)
):
    """Получение детальной информации о маршруте с остановками"""
    service = RouteManagementService(db)
    route_data = service.get_route_with_stops(route_id)
    
    if not route_data:
        raise HTTPException(status_code=404, detail="Маршрут не найден")
    
    return route_data

@router.put("/{route_id}", response_model=RouteResponse)
async def update_route(
    route_id: int,
    request: UpdateRouteRequest,
    db: Session = Depends(get_db)
):
    """Обновление маршрута"""
    service = RouteManagementService(db)
    
    # Преобразуем запрос в словарь, исключая None значения
    updates = {k: v for k, v in request.dict().items() if v is not None}
    
    route = service.update_route(route_id, updates)
    if not route:
        raise HTTPException(status_code=404, detail="Маршрут не найден")
    
    return RouteResponse.from_orm(route)

@router.post("/{route_id}/waypoints")
async def add_waypoint(
    route_id: int,
    point: RoutePointRequest,
    position: Optional[int] = Query(None, description="Позиция для вставки"),
    db: Session = Depends(get_db)
):
    """Добавление промежуточной точки в маршрут"""
    service = RouteManagementService(db)
    
    route_point = RoutePoint(
        lat=point.lat,
        lng=point.lng,
        address=point.address,
        stop_type=point.stop_type,
        time_window_start=point.time_window_start,
        time_window_end=point.time_window_end,
        service_time=point.service_time,
        weight=point.weight,
        volume=point.volume,
        priority=point.priority
    )
    
    success = service.add_waypoint(route_id, route_point, position)
    if not success:
        raise HTTPException(
            status_code=400, 
            detail="Не удалось добавить точку. Проверьте статус маршрута."
        )
    
    return {"message": "Точка успешно добавлена"}

@router.delete("/{route_id}/waypoints/{stop_sequence}")
async def remove_waypoint(
    route_id: int,
    stop_sequence: int,
    db: Session = Depends(get_db)
):
    """Удаление точки из маршрута"""
    service = RouteManagementService(db)
    
    success = service.remove_waypoint(route_id, stop_sequence)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Не удалось удалить точку. Проверьте статус маршрута."
        )
    
    return {"message": "Точка успешно удалена"}

@router.post("/{route_id}/optimize", response_model=RouteResponse)
async def optimize_route(
    route_id: int,
    request: OptimizationRequest,
    db: Session = Depends(get_db)
):
    """Оптимизация маршрута"""
    service = RouteManagementService(db)
    
    params = OptimizationParameters(
        algorithm=request.algorithm,
        consider_traffic=request.consider_traffic,
        consider_time_windows=request.consider_time_windows,
        consider_vehicle_capacity=request.consider_vehicle_capacity,
        max_route_duration=request.max_route_duration,
        max_stops_per_route=request.max_stops_per_route,
        cost_per_km=request.cost_per_km,
        cost_per_hour=request.cost_per_hour
    )
    
    route = service.optimize_route(route_id, params)
    if not route:
        raise HTTPException(status_code=404, detail="Маршрут не найден")
    
    return RouteResponse.from_orm(route)

@router.post("/{route_id}/simulate")
async def simulate_conditions(
    route_id: int,
    request: SimulationRequest,
    db: Session = Depends(get_db)
):
    """Симуляция изменения условий в реальном времени"""
    service = RouteManagementService(db)
    
    result = service.simulate_real_time_conditions(
        route_id=route_id,
        traffic_multiplier=request.traffic_multiplier,
        weather_impact=request.weather_impact,
        unexpected_delays=request.unexpected_delays
    )
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return result

@router.get("/{route_id}/status")
async def get_route_status(
    route_id: int,
    db: Session = Depends(get_db)
):
    """Получение текущего статуса маршрута"""
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Маршрут не найден")
    
    return {
        "route_id": route_id,
        "status": route.status,
        "current_stop_index": route.current_stop_index,
        "completion_percentage": route.completion_percentage,
        "planned_start_time": route.planned_start_time,
        "actual_start_time": route.actual_start_time,
        "planned_end_time": route.planned_end_time,
        "actual_end_time": route.actual_end_time
    }

@router.post("/{route_id}/start")
async def start_route(
    route_id: int,
    db: Session = Depends(get_db)
):
    """Запуск маршрута"""
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Маршрут не найден")
    
    if route.status != RouteStatus.PLANNED.value:
        raise HTTPException(
            status_code=400,
            detail="Маршрут можно запустить только в статусе 'planned'"
        )
    
    route.status = RouteStatus.ACTIVE.value
    route.actual_start_time = datetime.now()
    db.commit()
    
    return {"message": "Маршрут запущен", "started_at": route.actual_start_time}

@router.post("/{route_id}/complete")
async def complete_route(
    route_id: int,
    db: Session = Depends(get_db)
):
    """Завершение маршрута"""
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Маршрут не найден")
    
    if route.status != RouteStatus.ACTIVE.value:
        raise HTTPException(
            status_code=400,
            detail="Завершить можно только активный маршрут"
        )
    
    route.status = RouteStatus.COMPLETED.value
    route.actual_end_time = datetime.now()
    route.completion_percentage = 100.0
    db.commit()
    
    return {"message": "Маршрут завершен", "completed_at": route.actual_end_time}

@router.get("/statistics/summary")
async def get_routes_statistics(
    date_from: Optional[datetime] = Query(None, description="Дата от"),
    date_to: Optional[datetime] = Query(None, description="Дата до"),
    db: Session = Depends(get_db)
):
    """Получение статистики по маршрутам"""
    from sqlalchemy import func
    
    query = db.query(Route)
    
    if date_from:
        query = query.filter(Route.planned_date >= date_from)
    if date_to:
        query = query.filter(Route.planned_date <= date_to)
    
    total_routes = query.count()
    
    # Статистика по статусам
    status_stats = db.query(
        Route.status,
        func.count(Route.id).label('count')
    ).group_by(Route.status).all()
    
    # Средние показатели
    avg_stats = query.with_entities(
        func.avg(Route.total_distance).label('avg_distance'),
        func.avg(Route.total_duration).label('avg_duration'),
        func.avg(Route.total_stops).label('avg_stops')
    ).first()
    
    return {
        "total_routes": total_routes,
        "status_breakdown": {status: count for status, count in status_stats},
        "averages": {
            "distance_km": round(avg_stats.avg_distance or 0, 2),
            "duration_minutes": round(avg_stats.avg_duration or 0, 2),
            "stops_count": round(avg_stats.avg_stops or 0, 2)
        }
    }