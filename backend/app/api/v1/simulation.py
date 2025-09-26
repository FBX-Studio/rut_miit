from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Query
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import asyncio

from app.services.realtime_simulation import (
    RealtimeSimulationService, 
    EventType, 
    Severity,
    RealtimeEvent
)

router = APIRouter(prefix="/simulation", tags=["simulation"])

# Глобальный экземпляр сервиса симуляции
simulation_service = RealtimeSimulationService()

# Pydantic модели для API

class SimulationParametersRequest(BaseModel):
    """Запрос на обновление параметров симуляции"""
    traffic_variability: Optional[float] = Field(None, ge=0.0, le=1.0, description="Изменчивость трафика")
    weather_change_probability: Optional[float] = Field(None, ge=0.0, le=1.0, description="Вероятность изменения погоды")
    vehicle_breakdown_probability: Optional[float] = Field(None, ge=0.0, le=1.0, description="Вероятность поломки транспорта")
    new_order_probability: Optional[float] = Field(None, ge=0.0, le=1.0, description="Вероятность нового заказа")
    update_interval: Optional[int] = Field(None, ge=1, le=300, description="Интервал обновления в секундах")
    geographic_center: Optional[List[float]] = Field(None, description="Географический центр [lat, lng]")
    geographic_radius: Optional[float] = Field(None, ge=1.0, le=200.0, description="Радиус симуляции в км")

class ForceEventRequest(BaseModel):
    """Запрос на принудительное создание события"""
    event_type: str = Field(..., description="Тип события")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Дополнительные параметры")

class SimulationStatusResponse(BaseModel):
    """Ответ со статусом симуляции"""
    running: bool
    speed: float
    active_events_count: int
    parameters: Dict[str, Any]

class EventResponse(BaseModel):
    """Ответ с информацией о событии"""
    event_id: str
    event_type: str
    severity: str
    timestamp: datetime
    location: Optional[Dict[str, float]]
    affected_entities: List[str]
    parameters: Dict[str, Any]
    duration: Optional[int]
    description: str
    resolved: bool

class ConditionsResponse(BaseModel):
    """Ответ с текущими условиями"""
    traffic_conditions: Dict[str, Any]
    weather_conditions: Dict[str, Any]
    vehicle_statuses: Dict[str, Any]
    active_events: Dict[str, Any]

class StatisticsResponse(BaseModel):
    """Ответ со статистикой симуляции"""
    simulation_running: bool
    simulation_speed: float
    active_events_count: int
    event_counts_by_type: Dict[str, int]
    traffic_conditions_count: int
    vehicle_statuses_count: int
    simulation_parameters: Dict[str, Any]

@router.post("/start", response_model=Dict[str, str])
async def start_simulation(
    background_tasks: BackgroundTasks,
    params: Optional[SimulationParametersRequest] = None
):
    """Запустить симуляцию в реальном времени"""
    try:
        if simulation_service.simulation_running:
            raise HTTPException(status_code=400, detail="Симуляция уже запущена")
        
        # Подготавливаем параметры
        simulation_params = {}
        if params:
            param_dict = params.dict(exclude_unset=True)
            simulation_params.update(param_dict)
        
        # Запускаем симуляцию в фоне
        background_tasks.add_task(simulation_service.start_simulation, simulation_params)
        
        return {"message": "Симуляция запущена", "status": "started"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка запуска симуляции: {str(e)}")

@router.post("/stop", response_model=Dict[str, str])
async def stop_simulation():
    """Остановить симуляцию"""
    try:
        if not simulation_service.simulation_running:
            raise HTTPException(status_code=400, detail="Симуляция не запущена")
        
        await simulation_service.stop_simulation()
        return {"message": "Симуляция остановлена", "status": "stopped"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка остановки симуляции: {str(e)}")

@router.get("/status", response_model=SimulationStatusResponse)
async def get_simulation_status():
    """Получить статус симуляции"""
    try:
        return SimulationStatusResponse(
            running=simulation_service.simulation_running,
            speed=simulation_service.simulation_speed,
            active_events_count=len(simulation_service.active_events),
            parameters=simulation_service.simulation_params
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения статуса: {str(e)}")

@router.put("/parameters", response_model=Dict[str, str])
async def update_simulation_parameters(params: SimulationParametersRequest):
    """Обновить параметры симуляции"""
    try:
        param_dict = params.dict(exclude_unset=True)
        simulation_service.update_simulation_parameters(param_dict)
        
        return {"message": "Параметры симуляции обновлены", "updated_params": str(list(param_dict.keys()))}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обновления параметров: {str(e)}")

@router.get("/conditions", response_model=ConditionsResponse)
async def get_current_conditions():
    """Получить текущие условия симуляции"""
    try:
        conditions = simulation_service.get_current_conditions()
        return ConditionsResponse(**conditions)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения условий: {str(e)}")

@router.get("/events", response_model=List[EventResponse])
async def get_active_events(event_type: Optional[str] = None):
    """Получить активные события"""
    try:
        # Преобразуем строку в EventType, если указан
        filter_type = None
        if event_type:
            try:
                filter_type = EventType(event_type)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Неверный тип события: {event_type}")
        
        events = simulation_service.get_active_events(filter_type)
        
        return [
            EventResponse(
                event_id=event.event_id,
                event_type=event.event_type.value,
                severity=event.severity.value,
                timestamp=event.timestamp,
                location=event.location,
                affected_entities=event.affected_entities,
                parameters=event.parameters,
                duration=event.duration,
                description=event.description,
                resolved=event.resolved
            )
            for event in events
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения событий: {str(e)}")

@router.post("/events/force", response_model=EventResponse)
async def force_event(request: ForceEventRequest):
    """Принудительно создать событие для тестирования"""
    try:
        # Проверяем валидность типа события
        try:
            event_type = EventType(request.event_type)
        except ValueError:
            available_types = [e.value for e in EventType]
            raise HTTPException(
                status_code=400, 
                detail=f"Неверный тип события: {request.event_type}. Доступные типы: {available_types}"
            )
        
        event = simulation_service.force_event(event_type, request.parameters)
        
        if not event:
            raise HTTPException(status_code=500, detail="Не удалось создать событие")
        
        return EventResponse(
            event_id=event.event_id,
            event_type=event.event_type.value,
            severity=event.severity.value,
            timestamp=event.timestamp,
            location=event.location,
            affected_entities=event.affected_entities,
            parameters=event.parameters,
            duration=event.duration,
            description=event.description,
            resolved=event.resolved
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка создания события: {str(e)}")

@router.get("/statistics", response_model=StatisticsResponse)
async def get_simulation_statistics():
    """Получить статистику симуляции"""
    try:
        stats = simulation_service.get_simulation_statistics()
        return StatisticsResponse(**stats)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения статистики: {str(e)}")

@router.get("/event-types", response_model=List[str])
async def get_available_event_types():
    """Получить список доступных типов событий"""
    return [event_type.value for event_type in EventType]

@router.get("/severity-levels", response_model=List[str])
async def get_available_severity_levels():
    """Получить список доступных уровней серьезности"""
    return [severity.value for severity in Severity]

@router.post("/speed", response_model=Dict[str, str])
async def set_simulation_speed(speed: float = Query(..., ge=0.1, le=10.0)):
    """Установить скорость симуляции"""
    try:
        simulation_service.simulation_speed = speed
        return {"message": f"Скорость симуляции установлена: {speed}x", "speed": str(speed)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка установки скорости: {str(e)}")

@router.delete("/events/{event_id}", response_model=Dict[str, str])
async def resolve_event(event_id: str):
    """Принудительно разрешить событие"""
    try:
        if event_id not in simulation_service.active_events:
            raise HTTPException(status_code=404, detail="Событие не найдено")
        
        event = simulation_service.active_events[event_id]
        event.resolved = True
        
        # Разрешаем событие
        await simulation_service._resolve_event(event)
        
        # Удаляем из активных событий
        del simulation_service.active_events[event_id]
        
        return {"message": f"Событие {event_id} разрешено", "event_id": event_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка разрешения события: {str(e)}")

@router.post("/reset", response_model=Dict[str, str])
async def reset_simulation():
    """Сбросить симуляцию к начальному состоянию"""
    try:
        # Останавливаем симуляцию, если она запущена
        if simulation_service.simulation_running:
            await simulation_service.stop_simulation()
        
        # Очищаем все состояния
        simulation_service.active_events.clear()
        simulation_service.traffic_conditions.clear()
        simulation_service.weather_conditions.clear()
        simulation_service.vehicle_statuses.clear()
        
        # Сбрасываем параметры к значениям по умолчанию
        simulation_service.simulation_speed = 1.0
        simulation_service.base_event_probability = 0.1
        
        return {"message": "Симуляция сброшена к начальному состоянию", "status": "reset"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сброса симуляции: {str(e)}")

# WebSocket endpoint для real-time уведомлений (опционально)
from fastapi import WebSocket, WebSocketDisconnect
import json

class ConnectionManager:
    """Менеджер WebSocket соединений"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message, default=str))
            except:
                disconnected.append(connection)
        
        # Удаляем отключенные соединения
        for connection in disconnected:
            self.disconnect(connection)

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint для получения событий в реальном времени"""
    await manager.connect(websocket)
    
    # Подписываемся на события симуляции
    async def event_handler(event: RealtimeEvent):
        await manager.broadcast({
            "type": "simulation_event",
            "data": {
                "event_id": event.event_id,
                "event_type": event.event_type.value,
                "severity": event.severity.value,
                "timestamp": event.timestamp.isoformat(),
                "location": event.location,
                "description": event.description,
                "parameters": event.parameters
            }
        })
    
    simulation_service.subscribe_to_events(event_handler)
    
    try:
        while True:
            # Ждем сообщения от клиента (для поддержания соединения)
            data = await websocket.receive_text()
            
            # Можно обрабатывать команды от клиента
            try:
                message = json.loads(data)
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except:
                pass
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        simulation_service.unsubscribe_from_events(event_handler)