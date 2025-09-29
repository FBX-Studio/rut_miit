from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import asyncio
import json
import logging

from app.database import get_db
from app.models.route import Route
from app.models.route_stop import RouteStop
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.order import Order
from app.services.route_management import RouteManagementService, OptimizationParameters
from app.optimization.adaptive_optimizer import AdaptiveOptimizer

logger = logging.getLogger(__name__)
router = APIRouter()

# Новые модели для отслеживания времени доставки
class DeliveryTimeEvent(BaseModel):
    event_type: str = Field(..., description="Тип события: delay, speedup, breakdown, traffic, weather")
    time_impact: int = Field(..., description="Влияние на время в минутах (+ задержка, - ускорение)")
    description: str = Field(..., description="Описание события")
    timestamp: datetime = Field(default_factory=datetime.now)
    route_id: Optional[int] = Field(None, description="ID затронутого маршрута")

class DeliveryTimeTracker(BaseModel):
    scenario_id: str
    initial_delivery_time: int = Field(..., description="Изначальное время доставки в минутах")
    current_delivery_time: int = Field(..., description="Текущее время доставки в минутах")
    time_saved: int = Field(default=0, description="Сэкономленное время в минутах")
    time_lost: int = Field(default=0, description="Потерянное время в минутах")
    events: List[DeliveryTimeEvent] = Field(default_factory=list)
    start_time: datetime = Field(default_factory=datetime.now)
    last_update: datetime = Field(default_factory=datetime.now)
    is_active: bool = Field(default=True)

class ManualParameterChange(BaseModel):
    parameter_type: str = Field(..., description="Тип параметра для изменения")
    target_id: int = Field(..., description="ID целевого объекта")
    new_value: Any = Field(..., description="Новое значение")
    immediate_apply: bool = Field(default=True, description="Применить немедленно")
    time_impact_minutes: Optional[int] = Field(None, description="Ожидаемое влияние на время доставки")
    description: Optional[str] = Field(None, description="Описание изменения")

# Расширенные существующие модели
class DynamicParameter(BaseModel):
    parameter_type: str = Field(..., description="Тип параметра: traffic_delay, order_volume, driver_change, customer_schedule, weather_impact, vehicle_breakdown")
    target_id: int = Field(..., description="ID целевого объекта (заказ, маршрут, водитель)")
    value: Any = Field(..., description="Новое значение параметра")
    duration_minutes: Optional[int] = Field(None, description="Длительность изменения в минутах")
    description: Optional[str] = Field(None, description="Описание изменения")
    time_impact: Optional[int] = Field(None, description="Влияние на время доставки в минутах")

class TestScenario(BaseModel):
    name: str = Field(..., description="Название сценария")
    description: Optional[str] = Field(None, description="Описание сценария")
    parameters: List[DynamicParameter] = Field(..., description="Список изменяемых параметров")
    duration_minutes: int = Field(default=60, description="Общая длительность теста")
    auto_reoptimize: bool = Field(default=True, description="Автоматическая реоптимизация при изменениях")
    initial_delivery_time: int = Field(default=120, description="Изначальное время доставки в минутах")
    allow_manual_changes: bool = Field(default=True, description="Разрешить ручные изменения во время выполнения")

class TestResult(BaseModel):
    scenario_id: str
    start_time: datetime
    end_time: Optional[datetime]
    status: str  # running, completed, failed, paused
    metrics_before: Dict[str, Any]
    metrics_after: Optional[Dict[str, Any]]
    parameter_changes: List[Dict[str, Any]]
    manual_changes: List[Dict[str, Any]] = Field(default_factory=list)
    reoptimization_count: int
    performance_impact: Optional[Dict[str, Any]]
    time_tracker: Optional[DeliveryTimeTracker] = None

class DriverLoadAnalysis(BaseModel):
    driver_id: int
    current_load: float  # 0.0 - 1.0
    experience_factor: float  # 0.0 - 1.0
    efficiency_score: float  # 0.0 - 1.0
    recommended_max_load: float
    current_routes: int
    avg_delivery_time: float
    stress_indicators: List[str]

class VehicleDistributionAnalysis(BaseModel):
    total_vehicles: int
    available_vehicles: int
    utilization_rate: float
    optimal_distribution: Dict[str, int]  # zone -> vehicle_count
    current_distribution: Dict[str, int]
    efficiency_score: float
    recommendations: List[str]

# Global storage for active test scenarios
active_scenarios: Dict[str, TestResult] = {}

# Глобальное хранилище для отслеживания времени доставки
delivery_time_trackers: Dict[str, DeliveryTimeTracker] = {}

# Новые вспомогательные функции
async def _run_delivery_countdown(scenario_id: str):
    """Запуск обратного отсчета времени доставки"""
    try:
        while scenario_id in delivery_time_trackers and delivery_time_trackers[scenario_id].is_active:
            tracker = delivery_time_trackers[scenario_id]
            
            # Уменьшаем время на 1 минуту каждые 60 секунд реального времени
            # Для демонстрации используем ускоренный режим: 1 секунда = 1 минута симуляции
            await asyncio.sleep(1)
            
            if tracker.current_delivery_time > 0:
                tracker.current_delivery_time -= 1
                tracker.last_update = datetime.now()
            
            # Проверяем, завершена ли доставка
            if tracker.current_delivery_time <= 0:
                tracker.is_active = False
                # Добавляем событие завершения
                completion_event = DeliveryTimeEvent(
                    event_type="completion",
                    time_impact=0,
                    description="Доставка завершена"
                )
                tracker.events.append(completion_event)
                break
                
    except Exception as e:
        logger.error(f"Error in delivery countdown for {scenario_id}: {e}")

async def _update_delivery_time(scenario_id: str, time_impact: int, description: str, event_type: str = "manual"):
    """Обновление времени доставки с учетом события"""
    if scenario_id not in delivery_time_trackers:
        return
    
    tracker = delivery_time_trackers[scenario_id]
    
    # Создаем событие
    event = DeliveryTimeEvent(
        event_type=event_type,
        time_impact=time_impact,
        description=description
    )
    
    # Обновляем время
    tracker.current_delivery_time += time_impact
    
    # Обновляем статистику
    if time_impact > 0:
        tracker.time_lost += time_impact
    else:
        tracker.time_saved += abs(time_impact)
    
    # Добавляем событие в историю
    tracker.events.append(event)
    tracker.last_update = datetime.now()
    
    logger.info(f"Updated delivery time for {scenario_id}: {time_impact} minutes, new total: {tracker.current_delivery_time}")

async def _handle_simulation_time_event(scenario_id: str, event, time_impact: int):
    """Обработчик событий времени от симуляции"""
    if scenario_id in delivery_time_trackers:
        await _update_delivery_time(
            scenario_id,
            time_impact,
            event.description,
            event.event_type.value
        )

@router.post("/scenarios/create", response_model=Dict[str, str])
async def create_test_scenario(
    scenario: TestScenario,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Создать и запустить тестовый сценарий с отслеживанием времени"""
    try:
        scenario_id = f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Создаем трекер времени доставки
        time_tracker = DeliveryTimeTracker(
            scenario_id=scenario_id,
            initial_delivery_time=scenario.initial_delivery_time,
            current_delivery_time=scenario.initial_delivery_time
        )
        delivery_time_trackers[scenario_id] = time_tracker
        
        # Получаем метрики до изменений
        metrics_before = await _collect_system_metrics(db)
        
        # Создаем результат теста
        test_result = TestResult(
            scenario_id=scenario_id,
            start_time=datetime.now(),
            end_time=None,
            status="running",
            metrics_before=metrics_before,
            metrics_after=None,
            parameter_changes=[],
            manual_changes=[],
            reoptimization_count=0,
            performance_impact=None,
            time_tracker=time_tracker
        )
        
        active_scenarios[scenario_id] = test_result
        
        # Запускаем сценарий в фоне
        background_tasks.add_task(
            _execute_test_scenario,
            scenario_id,
            scenario,
            db
        )
        
        # Запускаем обратный отсчет времени
        background_tasks.add_task(
            _run_delivery_countdown,
            scenario_id
        )
        
        logger.info(f"Created test scenario {scenario_id}: {scenario.name}")
        
        return {
            "scenario_id": scenario_id,
            "status": "created",
            "message": f"Тестовый сценарий '{scenario.name}' создан и запущен с отслеживанием времени"
        }
        
    except Exception as e:
        logger.error(f"Failed to create test scenario: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка создания сценария: {str(e)}")

@router.post("/scenarios/{scenario_id}/modify-parameter")
async def modify_parameter_manually(
    scenario_id: str,
    change: ManualParameterChange,
    db: Session = Depends(get_db)
):
    """Ручное изменение параметра во время выполнения теста"""
    if scenario_id not in active_scenarios:
        raise HTTPException(status_code=404, detail="Сценарий не найден")
    
    test_result = active_scenarios[scenario_id]
    if test_result.status != "running":
        raise HTTPException(status_code=400, detail="Сценарий не активен")
    
    try:
        route_service = RouteManagementService(db)
        
        # Применяем изменение
        param = DynamicParameter(
            parameter_type=change.parameter_type,
            target_id=change.target_id,
            value=change.new_value,
            description=change.description,
            time_impact=change.time_impact_minutes
        )
        
        result = await _apply_parameter_change(param, route_service, db)
        
        # Записываем ручное изменение
        manual_change = {
            "timestamp": datetime.now(),
            "change": change.dict(),
            "result": result
        }
        test_result.manual_changes.append(manual_change)
        
        # Обновляем время доставки если указано влияние
        if change.time_impact_minutes and scenario_id in delivery_time_trackers:
            await _update_delivery_time(
                scenario_id,
                change.time_impact_minutes,
                f"Ручное изменение: {change.description or change.parameter_type}"
            )
        
        return {
            "status": "success",
            "message": "Параметр изменен",
            "result": result,
            "time_impact": change.time_impact_minutes
        }
        
    except Exception as e:
        logger.error(f"Failed to modify parameter manually: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка изменения параметра: {str(e)}")

@router.get("/scenarios/{scenario_id}/time-tracker", response_model=DeliveryTimeTracker)
async def get_delivery_time_tracker(scenario_id: str):
    """Получить информацию о времени доставки"""
    if scenario_id not in delivery_time_trackers:
        raise HTTPException(status_code=404, detail="Трекер времени не найден")
    
    return delivery_time_trackers[scenario_id]

@router.post("/scenarios/{scenario_id}/add-event")
async def add_delivery_event(
    scenario_id: str,
    event: DeliveryTimeEvent
):
    """Добавить событие, влияющее на время доставки"""
    if scenario_id not in delivery_time_trackers:
        raise HTTPException(status_code=404, detail="Трекер времени не найден")
    
    await _update_delivery_time(
        scenario_id,
        event.time_impact,
        event.description,
        event.event_type
    )
    
    return {
        "status": "success",
        "message": "Событие добавлено",
        "current_time": delivery_time_trackers[scenario_id].current_delivery_time
    }

@router.get("/scenarios/{scenario_id}/status", response_model=TestResult)
async def get_scenario_status(scenario_id: str):
    """Получить статус тестового сценария с информацией о времени"""
    if scenario_id not in active_scenarios:
        raise HTTPException(status_code=404, detail="Сценарий не найден")
    
    test_result = active_scenarios[scenario_id]
    
    # Обновляем информацию о времени
    if scenario_id in delivery_time_trackers:
        test_result.time_tracker = delivery_time_trackers[scenario_id]
    
    return test_result

@router.get("/scenarios/active", response_model=List[TestResult])
async def get_active_scenarios():
    """Получить список активных сценариев"""
    return list(active_scenarios.values())

@router.post("/scenarios/{scenario_id}/stop")
async def stop_scenario(scenario_id: str):
    """Остановить выполнение сценария"""
    if scenario_id not in active_scenarios:
        raise HTTPException(status_code=404, detail="Сценарий не найден")
    
    test_result = active_scenarios[scenario_id]
    if test_result.status == "running":
        test_result.status = "stopped"
        test_result.end_time = datetime.now()
        
        logger.info(f"Stopped test scenario {scenario_id}")
        
        return {"status": "stopped", "message": "Сценарий остановлен"}
    
    return {"status": test_result.status, "message": "Сценарий уже завершен"}

@router.post("/parameters/modify")
async def modify_delivery_parameters(
    parameters: List[DynamicParameter],
    db: Session = Depends(get_db)
):
    """Динамическое изменение параметров доставки"""
    try:
        results = []
        route_service = RouteManagementService(db)
        
        for param in parameters:
            result = await _apply_parameter_change(param, route_service, db)
            results.append(result)
        
        return {
            "status": "success",
            "changes_applied": len(results),
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Failed to modify parameters: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка изменения параметров: {str(e)}")

@router.get("/analytics/driver-load", response_model=List[DriverLoadAnalysis])
async def analyze_driver_load(db: Session = Depends(get_db)):
    """Анализ нагрузки на водителей"""
    try:
        drivers = db.query(Driver).all()
        analyses = []
        
        for driver in drivers:
            analysis = await _analyze_driver_load(driver, db)
            analyses.append(analysis)
        
        return analyses
        
    except Exception as e:
        logger.error(f"Failed to analyze driver load: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка анализа нагрузки: {str(e)}")

@router.get("/analytics/vehicle-distribution", response_model=VehicleDistributionAnalysis)
async def analyze_vehicle_distribution(db: Session = Depends(get_db)):
    """Анализ распределения транспортных средств"""
    try:
        analysis = await _analyze_vehicle_distribution(db)
        return analysis
        
    except Exception as e:
        logger.error(f"Failed to analyze vehicle distribution: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка анализа распределения: {str(e)}")

@router.post("/simulation/virtual-delivery")
async def simulate_virtual_delivery(
    route_id: int,
    traffic_multiplier: float = 1.0,
    weather_impact: float = 1.0,
    unexpected_delays: Optional[List[Dict[str, Any]]] = None,
    db: Session = Depends(get_db)
):
    """Симуляция виртуальной доставки"""
    try:
        route_service = RouteManagementService(db)
        
        # Используем существующий метод симуляции
        simulation_result = route_service.simulate_real_time_conditions(
            route_id=route_id,
            traffic_multiplier=traffic_multiplier,
            weather_impact=weather_impact,
            unexpected_delays=unexpected_delays or []
        )
        
        return {
            "status": "success",
            "route_id": route_id,
            "simulation_result": simulation_result,
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Failed to simulate delivery: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка симуляции: {str(e)}")

# Helper functions
async def _execute_test_scenario(scenario_id: str, scenario: TestScenario, db: Session):
    """Выполнение тестового сценария в фоне"""
    try:
        test_result = active_scenarios[scenario_id]
        route_service = RouteManagementService(db)
        
        # Инициализируем трекер времени доставки
        initial_time = scenario.initial_delivery_time
        delivery_time_trackers[scenario_id] = DeliveryTimeTracker(
            scenario_id=scenario_id,
            initial_delivery_time=initial_time,
            current_delivery_time=initial_time,
            events=[],
            start_time=datetime.now()
        )
        
        # Запускаем обратный отсчет времени
        asyncio.create_task(_run_delivery_countdown(scenario_id))
        
        # Применяем изменения параметров
        for param in scenario.parameters:
            change_result = await _apply_parameter_change(param, route_service, db)
            test_result.parameter_changes.append(change_result)
            
            # Обновляем время доставки если есть влияние
            if param.time_impact:
                await _update_delivery_time(
                    scenario_id,
                    param.time_impact,
                    f"Параметр {param.parameter_type}: {param.description or 'изменение'}",
                    "parameter_change"
                )
            
            # Автоматическая реоптимизация если включена
            if scenario.auto_reoptimize and change_result.get("requires_reoptimization"):
                await _trigger_reoptimization(change_result.get("affected_routes", []), route_service)
                test_result.reoptimization_count += 1
        
        # Ждем завершения сценария
        await asyncio.sleep(scenario.duration_minutes * 60)
        
        # Собираем финальные метрики
        test_result.metrics_after = await _collect_system_metrics(db)
        test_result.performance_impact = _calculate_performance_impact(
            test_result.metrics_before,
            test_result.metrics_after
        )
        
        test_result.status = "completed"
        test_result.end_time = datetime.now()
        
        logger.info(f"Completed test scenario {scenario_id}")
        
    except Exception as e:
        logger.error(f"Error executing scenario {scenario_id}: {e}")
        test_result.status = "failed"
        test_result.end_time = datetime.now()

async def _apply_parameter_change(param: DynamicParameter, route_service: RouteManagementService, db: Session):
    """Применение изменения параметра"""
    result = {
        "parameter_type": param.parameter_type,
        "target_id": param.target_id,
        "value": param.value,
        "timestamp": datetime.now(),
        "success": False,
        "requires_reoptimization": False,
        "affected_routes": []
    }
    
    try:
        if param.parameter_type == "traffic_delay":
            # Изменение задержек на дорогах
            route = db.query(Route).filter(Route.id == param.target_id).first()
            if route:
                # Применяем симуляцию трафика
                route_service.simulate_real_time_conditions(
                    route_id=param.target_id,
                    traffic_multiplier=param.value
                )
                result["success"] = True
                result["requires_reoptimization"] = True
                result["affected_routes"] = [param.target_id]
        
        elif param.parameter_type == "order_volume":
            # Изменение объема заказа
            order = db.query(Order).filter(Order.id == param.target_id).first()
            if order:
                old_volume = order.volume
                order.volume = param.value
                db.commit()
                result["success"] = True
                result["old_value"] = old_volume
                # Найти затронутые маршруты
                affected_routes = db.query(Route).join(RouteStop).filter(
                    RouteStop.order_id == param.target_id
                ).all()
                result["affected_routes"] = [r.id for r in affected_routes]
                result["requires_reoptimization"] = True
        
        elif param.parameter_type == "driver_change":
            # Смена водителя
            route = db.query(Route).filter(Route.id == param.target_id).first()
            if route:
                old_driver_id = route.driver_id
                route.driver_id = param.value
                db.commit()
                result["success"] = True
                result["old_value"] = old_driver_id
                result["affected_routes"] = [param.target_id]
                result["requires_reoptimization"] = True
        
        elif param.parameter_type == "customer_schedule":
            # Изменение графика работы клиента
            # Это потребует обновления временных окон в заказах
            order = db.query(Order).filter(Order.id == param.target_id).first()
            if order:
                old_schedule = {
                    "time_window_start": order.time_window_start,
                    "time_window_end": order.time_window_end
                }
                order.time_window_start = param.value.get("start")
                order.time_window_end = param.value.get("end")
                db.commit()
                result["success"] = True
                result["old_value"] = old_schedule
                result["requires_reoptimization"] = True
        
    except Exception as e:
        logger.error(f"Failed to apply parameter change: {e}")
        result["error"] = str(e)
    
    return result

async def _trigger_reoptimization(route_ids: List[int], route_service: RouteManagementService):
    """Запуск реоптимизации маршрутов"""
    try:
        params = OptimizationParameters(
            algorithm="nearest_neighbor",
            consider_traffic=True,
            consider_time_windows=True,
            consider_vehicle_capacity=True
        )
        
        for route_id in route_ids:
            route_service.optimize_route(route_id, params)
            
    except Exception as e:
        logger.error(f"Failed to trigger reoptimization: {e}")

async def _collect_system_metrics(db: Session) -> Dict[str, Any]:
    """Сбор системных метрик"""
    try:
        total_routes = db.query(Route).count()
        active_routes = db.query(Route).filter(Route.status.in_(["planned", "in_progress"])).count()
        total_orders = db.query(Order).count()
        total_vehicles = db.query(Vehicle).count()
        total_drivers = db.query(Driver).count()
        
        return {
            "total_routes": total_routes,
            "active_routes": active_routes,
            "total_orders": total_orders,
            "total_vehicles": total_vehicles,
            "total_drivers": total_drivers,
            "timestamp": datetime.now()
        }
    except Exception as e:
        logger.error(f"Failed to collect metrics: {e}")
        return {}

def _calculate_performance_impact(before: Dict[str, Any], after: Dict[str, Any]) -> Dict[str, Any]:
    """Расчет влияния на производительность"""
    try:
        impact = {}
        
        for key in before.keys():
            if key != "timestamp" and key in after:
                before_val = before[key]
                after_val = after[key]
                
                if isinstance(before_val, (int, float)) and isinstance(after_val, (int, float)):
                    if before_val != 0:
                        change_percent = ((after_val - before_val) / before_val) * 100
                        impact[f"{key}_change_percent"] = round(change_percent, 2)
                    impact[f"{key}_absolute_change"] = after_val - before_val
        
        return impact
    except Exception as e:
        logger.error(f"Failed to calculate performance impact: {e}")
        return {}

async def _analyze_driver_load(driver: Driver, db: Session) -> DriverLoadAnalysis:
    """Анализ нагрузки конкретного водителя"""
    try:
        # Получаем активные маршруты водителя
        active_routes = db.query(Route).filter(
            Route.driver_id == driver.id,
            Route.status.in_(["planned", "in_progress"])
        ).all()
        
        # Рассчитываем текущую нагрузку
        total_duration = sum(route.total_duration for route in active_routes)
        max_work_hours = 8 * 60  # 8 часов в минутах
        current_load = min(total_duration / max_work_hours, 1.0)
        
        # Фактор опыта (упрощенная версия)
        experience_factor = min(driver.experience_years / 10.0, 1.0) if hasattr(driver, 'experience_years') else 0.5
        
        # Оценка эффективности
        completed_routes = db.query(Route).filter(
            Route.driver_id == driver.id,
            Route.status == "completed"
        ).count()
        
        efficiency_score = min(completed_routes / 100.0, 1.0)  # Упрощенная оценка
        
        # Рекомендуемая максимальная нагрузка
        recommended_max_load = 0.8 + (experience_factor * 0.2)
        
        # Индикаторы стресса
        stress_indicators = []
        if current_load > 0.9:
            stress_indicators.append("Критическая перегрузка")
        elif current_load > 0.8:
            stress_indicators.append("Высокая нагрузка")
        
        if len(active_routes) > 5:
            stress_indicators.append("Слишком много активных маршрутов")
        
        return DriverLoadAnalysis(
            driver_id=driver.id,
            current_load=current_load,
            experience_factor=experience_factor,
            efficiency_score=efficiency_score,
            recommended_max_load=recommended_max_load,
            current_routes=len(active_routes),
            avg_delivery_time=total_duration / max(len(active_routes), 1),
            stress_indicators=stress_indicators
        )
        
    except Exception as e:
        logger.error(f"Failed to analyze driver load for driver {driver.id}: {e}")
        return DriverLoadAnalysis(
            driver_id=driver.id,
            current_load=0.0,
            experience_factor=0.0,
            efficiency_score=0.0,
            recommended_max_load=0.8,
            current_routes=0,
            avg_delivery_time=0.0,
            stress_indicators=["Ошибка анализа"]
        )

async def _analyze_vehicle_distribution(db: Session) -> VehicleDistributionAnalysis:
    """Анализ распределения транспортных средств"""
    try:
        total_vehicles = db.query(Vehicle).count()
        available_vehicles = db.query(Vehicle).filter(Vehicle.status == "available").count()
        
        utilization_rate = (total_vehicles - available_vehicles) / max(total_vehicles, 1)
        
        # Упрощенный анализ распределения по зонам
        # В реальной системе здесь была бы более сложная логика
        current_distribution = {
            "center": 5,
            "north": 3,
            "south": 4,
            "east": 2,
            "west": 3
        }
        
        optimal_distribution = {
            "center": 6,
            "north": 4,
            "south": 3,
            "east": 2,
            "west": 2
        }
        
        # Оценка эффективности
        efficiency_score = 0.85  # Упрощенная оценка
        
        recommendations = []
        if utilization_rate > 0.9:
            recommendations.append("Рассмотрите увеличение автопарка")
        if utilization_rate < 0.5:
            recommendations.append("Возможна оптимизация использования транспорта")
        
        return VehicleDistributionAnalysis(
            total_vehicles=total_vehicles,
            available_vehicles=available_vehicles,
            utilization_rate=utilization_rate,
            optimal_distribution=optimal_distribution,
            current_distribution=current_distribution,
            efficiency_score=efficiency_score,
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Failed to analyze vehicle distribution: {e}")
        return VehicleDistributionAnalysis(
            total_vehicles=0,
            available_vehicles=0,
            utilization_rate=0.0,
            optimal_distribution={},
            current_distribution={},
            efficiency_score=0.0,
            recommendations=["Ошибка анализа"]
        )

# Добавляем тестовые данные для демонстрации
def _initialize_demo_data():
    """Инициализация демонстрационных данных"""
    demo_scenario_id = "demo-scenario-001"
    
    # Создаем демо-трекер времени с некоторыми событиями
    demo_tracker = DeliveryTimeTracker(
        scenario_id=demo_scenario_id,
        initial_delivery_time=45,  # 45 минут изначально
        current_delivery_time=52,  # 52 минуты сейчас (потеряно 7 минут)
        events=[
            DeliveryTimeEvent(
                event_type="delay",
                time_impact=5,
                timestamp=datetime.now() - timedelta(minutes=10),
                description="Увеличение объема заказов"
            ),
            DeliveryTimeEvent(
                event_type="traffic",
                time_impact=8,
                timestamp=datetime.now() - timedelta(minutes=5),
                description="Задержка из-за пробок"
            ),
            DeliveryTimeEvent(
                event_type="speedup",
                time_impact=-6,
                timestamp=datetime.now() - timedelta(minutes=2),
                description="Оптимизация маршрута"
            )
        ]
    )
    
    # Создаем демо-сценарий
    demo_scenario = TestResult(
        scenario_id=demo_scenario_id,
        name="Демонстрационный сценарий",
        description="Показывает работу отслеживания времени",
        start_time=datetime.now() - timedelta(minutes=15),
        end_time=None,
        status="running",
        metrics_before={},
        metrics_after=None,
        parameter_changes=[],
        manual_changes=[],
        reoptimization_count=0,
        performance_impact=None,
        time_tracker=demo_tracker
    )
    
    active_scenarios[demo_scenario_id] = demo_scenario
    delivery_time_trackers[demo_scenario_id] = demo_tracker

# Инициализируем демо-данные при запуске
_initialize_demo_data()