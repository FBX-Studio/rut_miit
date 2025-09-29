import asyncio
import random
import math
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import json
import logging

logger = logging.getLogger(__name__)

class EventType(Enum):
    """Типы событий в реальном времени"""
    TRAFFIC_CHANGE = "traffic_change"
    WEATHER_CHANGE = "weather_change"
    VEHICLE_BREAKDOWN = "vehicle_breakdown"
    NEW_ORDER = "new_order"
    ORDER_CANCELLATION = "order_cancellation"
    DRIVER_UNAVAILABLE = "driver_unavailable"
    ROAD_CLOSURE = "road_closure"
    DELIVERY_DELAY = "delivery_delay"
    PRIORITY_CHANGE = "priority_change"

class Severity(Enum):
    """Уровни серьезности событий"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class RealtimeEvent:
    """Событие в реальном времени"""
    event_id: str
    event_type: EventType
    severity: Severity
    timestamp: datetime
    location: Optional[Dict[str, float]] = None  # {"lat": float, "lng": float}
    affected_entities: List[str] = field(default_factory=list)  # IDs затронутых объектов
    parameters: Dict[str, Any] = field(default_factory=dict)
    duration: Optional[int] = None  # продолжительность в минутах
    description: str = ""
    resolved: bool = False

@dataclass
class TrafficCondition:
    """Состояние трафика"""
    location: Dict[str, float]
    condition: str  # light, normal, heavy, jam
    speed_multiplier: float  # множитель скорости (0.1 - 1.5)
    updated_at: datetime
    radius_km: float = 5.0

@dataclass
class WeatherCondition:
    """Погодные условия"""
    condition: str  # clear, rain, snow, fog, storm
    intensity: float  # 0.0 - 1.0
    visibility_km: float
    speed_impact: float  # множитель скорости
    updated_at: datetime
    area_radius_km: float = 50.0

@dataclass
class VehicleStatus:
    """Статус транспортного средства"""
    vehicle_id: str
    status: str  # available, busy, breakdown, maintenance
    location: Dict[str, float]
    speed: float
    fuel_level: float
    updated_at: datetime

class RealtimeSimulationService:
    """Сервис имитации изменений условий в реальном времени"""
    
    def __init__(self):
        self.active_events: Dict[str, RealtimeEvent] = {}
        self.traffic_conditions: Dict[str, TrafficCondition] = {}
        self.weather_conditions: Dict[str, WeatherCondition] = {}
        self.vehicle_statuses: Dict[str, VehicleStatus] = {}
        self.event_subscribers: List[Callable] = []
        self.simulation_running = False
        self.simulation_speed = 1.0  # множитель скорости симуляции
        self.base_event_probability = 0.1  # базовая вероятность события
        
        # Параметры симуляции
        self.simulation_params = {
            "traffic_variability": 0.3,
            "weather_change_probability": 0.1,
            "vehicle_breakdown_probability": 0.05,
            "new_order_probability": 0.2,
            "update_interval": 30,  # секунды
            "geographic_center": [55.7558, 37.6176],  # Москва
            "geographic_radius": 50.0  # км
        }
        
        # Хранилище для связи с тестовыми сценариями
        self.scenario_id: Optional[str] = None
        self.time_event_callback: Optional[Callable] = None
    
    def subscribe_to_events(self, callback: Callable[[RealtimeEvent], None]):
        """Подписаться на события в реальном времени"""
        self.event_subscribers.append(callback)
    
    def unsubscribe_from_events(self, callback: Callable[[RealtimeEvent], None]):
        """Отписаться от событий"""
        if callback in self.event_subscribers:
            self.event_subscribers.remove(callback)
    
    def _notify_subscribers(self, event: RealtimeEvent):
        """Уведомить подписчиков о событии"""
        for callback in self.event_subscribers:
            try:
                callback(event)
            except Exception as e:
                logger.error(f"Ошибка при уведомлении подписчика: {e}")
        
        # Если есть связанный сценарий, отправляем событие времени
        if self.scenario_id and self.time_event_callback:
            try:
                # Рассчитываем влияние события на время доставки
                time_impact = self._calculate_time_impact(event)
                if time_impact != 0:
                    self.time_event_callback(self.scenario_id, event, time_impact)
            except Exception as e:
                logger.error(f"Ошибка при отправке события времени: {e}")
    
    def _calculate_time_impact(self, event: RealtimeEvent) -> int:
        """Рассчитать влияние события на время доставки (в секундах)"""
        impact_map = {
            EventType.TRAFFIC_CHANGE: {
                "light": -300,    # экономия 5 минут
                "normal": 0,      # без изменений
                "heavy": 600,     # потеря 10 минут
                "jam": 1800       # потеря 30 минут
            },
            EventType.WEATHER_CHANGE: {
                "clear": -180,    # экономия 3 минуты
                "rain": 300,      # потеря 5 минут
                "snow": 900,      # потеря 15 минут
                "fog": 600,       # потеря 10 минут
                "storm": 1200     # потеря 20 минут
            },
            EventType.VEHICLE_BREAKDOWN: 1800,  # потеря 30 минут
            EventType.NEW_ORDER: 600,           # потеря 10 минут (перепланирование)
            EventType.ORDER_CANCELLATION: -300, # экономия 5 минут
            EventType.ROAD_CLOSURE: 1200,       # потеря 20 минут
            EventType.DELIVERY_DELAY: 900       # потеря 15 минут
        }
        
        if event.event_type in [EventType.TRAFFIC_CHANGE, EventType.WEATHER_CHANGE]:
            condition = event.parameters.get("new_condition", "normal")
            return impact_map[event.event_type].get(condition, 0)
        else:
            return impact_map.get(event.event_type, 0)
    
    def set_time_event_callback(self, callback: Callable):
        """Установить callback для событий времени"""
        self.time_event_callback = callback
    
    def update_simulation_parameters(self, params: Dict[str, Any]):
        """Обновить параметры симуляции во время выполнения"""
        self.simulation_params.update(params)
        logger.info(f"Параметры симуляции обновлены: {params}")
    
    async def start_simulation(self, params: Dict[str, Any] = None, scenario_id: str = None):
        """Запустить симуляцию в реальном времени"""
        if self.simulation_running:
            return
        
        if params:
            self.simulation_params.update(params)
        
        # Сохраняем ID сценария для связи с системой отслеживания времени
        self.scenario_id = scenario_id
        
        self.simulation_running = True
        logger.info(f"Запуск симуляции в реальном времени для сценария {scenario_id}")
        
        # Инициализируем базовые условия
        await self._initialize_conditions()
        
        # Запускаем основной цикл симуляции
        asyncio.create_task(self._simulation_loop())
    
    async def stop_simulation(self):
        """Остановить симуляцию"""
        self.simulation_running = False
        logger.info("Симуляция остановлена")
    
    async def _simulation_loop(self):
        """Основной цикл симуляции"""
        while self.simulation_running:
            try:
                # Генерируем события
                await self._generate_random_events()
                
                # Обновляем условия
                await self._update_traffic_conditions()
                await self._update_weather_conditions()
                await self._update_vehicle_statuses()
                
                # Разрешаем завершенные события
                await self._resolve_expired_events()
                
                # Ждем до следующего обновления
                interval = self.simulation_params["update_interval"] / self.simulation_speed
                await asyncio.sleep(interval)
                
            except Exception as e:
                logger.error(f"Ошибка в цикле симуляции: {e}")
                await asyncio.sleep(5)
    
    async def _initialize_conditions(self):
        """Инициализация базовых условий"""
        center = self.simulation_params["geographic_center"]
        radius = self.simulation_params["geographic_radius"]
        
        # Инициализируем трафик в нескольких точках
        for i in range(5):
            location = self._generate_random_location(center, radius)
            location_key = f"{location['lat']:.4f},{location['lng']:.4f}"
            
            self.traffic_conditions[location_key] = TrafficCondition(
                location=location,
                condition=random.choice(["light", "normal", "heavy"]),
                speed_multiplier=random.uniform(0.7, 1.2),
                updated_at=datetime.now(),
                radius_km=random.uniform(3.0, 10.0)
            )
        
        # Инициализируем погоду
        self.weather_conditions["global"] = WeatherCondition(
            condition=random.choice(["clear", "rain", "fog"]),
            intensity=random.uniform(0.1, 0.7),
            visibility_km=random.uniform(5.0, 50.0),
            speed_impact=random.uniform(0.8, 1.0),
            updated_at=datetime.now()
        )
    
    async def _generate_random_events(self):
        """Генерация случайных событий"""
        
        # Изменение трафика
        if random.random() < self.simulation_params["traffic_variability"]:
            await self._generate_traffic_event()
        
        # Изменение погоды
        if random.random() < self.simulation_params["weather_change_probability"]:
            await self._generate_weather_event()
        
        # Поломка транспорта
        if random.random() < self.simulation_params["vehicle_breakdown_probability"]:
            await self._generate_vehicle_breakdown_event()
        
        # Новый заказ
        if random.random() < self.simulation_params["new_order_probability"]:
            await self._generate_new_order_event()
        
        # Отмена заказа
        if random.random() < 0.05:
            await self._generate_order_cancellation_event()
        
        # Закрытие дороги
        if random.random() < 0.02:
            await self._generate_road_closure_event()
    
    async def _generate_traffic_event(self):
        """Генерация события изменения трафика"""
        center = self.simulation_params["geographic_center"]
        radius = self.simulation_params["geographic_radius"]
        location = self._generate_random_location(center, radius)
        
        conditions = ["light", "normal", "heavy", "jam"]
        new_condition = random.choice(conditions)
        
        speed_multipliers = {
            "light": random.uniform(1.1, 1.3),
            "normal": random.uniform(0.9, 1.1),
            "heavy": random.uniform(0.6, 0.8),
            "jam": random.uniform(0.2, 0.4)
        }
        
        event = RealtimeEvent(
            event_id=f"traffic_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{random.randint(1000, 9999)}",
            event_type=EventType.TRAFFIC_CHANGE,
            severity=Severity.MEDIUM if new_condition in ["heavy", "jam"] else Severity.LOW,
            timestamp=datetime.now(),
            location=location,
            parameters={
                "new_condition": new_condition,
                "speed_multiplier": speed_multipliers[new_condition],
                "radius_km": random.uniform(2.0, 15.0)
            },
            duration=random.randint(15, 120),
            description=f"Изменение трафика на {new_condition}"
        )
        
        self.active_events[event.event_id] = event
        self._notify_subscribers(event)
        
        # Обновляем условия трафика
        location_key = f"{location['lat']:.4f},{location['lng']:.4f}"
        self.traffic_conditions[location_key] = TrafficCondition(
            location=location,
            condition=new_condition,
            speed_multiplier=speed_multipliers[new_condition],
            updated_at=datetime.now(),
            radius_km=event.parameters["radius_km"]
        )
    
    async def _generate_weather_event(self):
        """Генерация события изменения погоды"""
        conditions = ["clear", "rain", "snow", "fog", "storm"]
        current_weather = self.weather_conditions.get("global")
        
        # Избегаем повторения текущего состояния
        available_conditions = [c for c in conditions if c != (current_weather.condition if current_weather else None)]
        new_condition = random.choice(available_conditions)
        
        intensity = random.uniform(0.1, 0.9)
        
        weather_impacts = {
            "clear": {"visibility": 50.0, "speed": 1.0},
            "rain": {"visibility": 20.0, "speed": 0.8},
            "snow": {"visibility": 10.0, "speed": 0.6},
            "fog": {"visibility": 5.0, "speed": 0.7},
            "storm": {"visibility": 3.0, "speed": 0.5}
        }
        
        impact = weather_impacts[new_condition]
        
        event = RealtimeEvent(
            event_id=f"weather_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{random.randint(1000, 9999)}",
            event_type=EventType.WEATHER_CHANGE,
            severity=Severity.HIGH if new_condition in ["snow", "storm"] else Severity.MEDIUM,
            timestamp=datetime.now(),
            parameters={
                "new_condition": new_condition,
                "intensity": intensity,
                "visibility_km": impact["visibility"] * (1 - intensity * 0.5),
                "speed_impact": impact["speed"] * (1 - intensity * 0.3)
            },
            duration=random.randint(30, 240),
            description=f"Изменение погоды на {new_condition} (интенсивность: {intensity:.1f})"
        )
        
        self.active_events[event.event_id] = event
        self._notify_subscribers(event)
        
        # Обновляем погодные условия
        self.weather_conditions["global"] = WeatherCondition(
            condition=new_condition,
            intensity=intensity,
            visibility_km=event.parameters["visibility_km"],
            speed_impact=event.parameters["speed_impact"],
            updated_at=datetime.now()
        )
    
    async def _generate_vehicle_breakdown_event(self):
        """Генерация события поломки транспорта"""
        # Симулируем случайное транспортное средство
        vehicle_id = f"vehicle_{random.randint(1, 20)}"
        
        center = self.simulation_params["geographic_center"]
        radius = self.simulation_params["geographic_radius"]
        location = self._generate_random_location(center, radius)
        
        breakdown_types = [
            "engine_failure", "tire_puncture", "fuel_shortage", 
            "electrical_problem", "transmission_issue"
        ]
        
        breakdown_type = random.choice(breakdown_types)
        repair_time = {
            "engine_failure": random.randint(120, 300),
            "tire_puncture": random.randint(30, 60),
            "fuel_shortage": random.randint(20, 40),
            "electrical_problem": random.randint(60, 180),
            "transmission_issue": random.randint(180, 360)
        }
        
        event = RealtimeEvent(
            event_id=f"breakdown_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{random.randint(1000, 9999)}",
            event_type=EventType.VEHICLE_BREAKDOWN,
            severity=Severity.HIGH,
            timestamp=datetime.now(),
            location=location,
            affected_entities=[vehicle_id],
            parameters={
                "breakdown_type": breakdown_type,
                "estimated_repair_time": repair_time[breakdown_type]
            },
            duration=repair_time[breakdown_type],
            description=f"Поломка транспорта {vehicle_id}: {breakdown_type}"
        )
        
        self.active_events[event.event_id] = event
        self._notify_subscribers(event)
        
        # Обновляем статус транспорта
        self.vehicle_statuses[vehicle_id] = VehicleStatus(
            vehicle_id=vehicle_id,
            status="breakdown",
            location=location,
            speed=0.0,
            fuel_level=random.uniform(0.1, 0.8),
            updated_at=datetime.now()
        )
    
    async def _generate_new_order_event(self):
        """Генерация события нового заказа"""
        center = self.simulation_params["geographic_center"]
        radius = self.simulation_params["geographic_radius"]
        pickup_location = self._generate_random_location(center, radius)
        delivery_location = self._generate_random_location(center, radius)
        
        priorities = ["low", "medium", "high", "urgent"]
        priority = random.choice(priorities)
        
        event = RealtimeEvent(
            event_id=f"new_order_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{random.randint(1000, 9999)}",
            event_type=EventType.NEW_ORDER,
            severity=Severity.HIGH if priority == "urgent" else Severity.MEDIUM,
            timestamp=datetime.now(),
            parameters={
                "pickup_location": pickup_location,
                "delivery_location": delivery_location,
                "priority": priority,
                "weight": random.uniform(1.0, 50.0),
                "volume": random.uniform(0.1, 2.0),
                "time_window": random.randint(60, 240)  # минуты
            },
            description=f"Новый заказ с приоритетом {priority}"
        )
        
        self.active_events[event.event_id] = event
        self._notify_subscribers(event)
    
    async def _generate_order_cancellation_event(self):
        """Генерация события отмены заказа"""
        # Симулируем случайный заказ
        order_id = f"order_{random.randint(1, 100)}"
        
        cancellation_reasons = [
            "customer_request", "address_incorrect", "item_unavailable",
            "payment_issue", "delivery_impossible"
        ]
        
        reason = random.choice(cancellation_reasons)
        
        event = RealtimeEvent(
            event_id=f"cancel_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{random.randint(1000, 9999)}",
            event_type=EventType.ORDER_CANCELLATION,
            severity=Severity.MEDIUM,
            timestamp=datetime.now(),
            affected_entities=[order_id],
            parameters={
                "reason": reason,
                "compensation_required": random.choice([True, False])
            },
            description=f"Отмена заказа {order_id}: {reason}"
        )
        
        self.active_events[event.event_id] = event
        self._notify_subscribers(event)
    
    async def _generate_road_closure_event(self):
        """Генерация события закрытия дороги"""
        center = self.simulation_params["geographic_center"]
        radius = self.simulation_params["geographic_radius"]
        location = self._generate_random_location(center, radius)
        
        closure_reasons = [
            "construction", "accident", "weather_damage", 
            "maintenance", "special_event"
        ]
        
        reason = random.choice(closure_reasons)
        
        duration_ranges = {
            "construction": (240, 1440),  # 4-24 часа
            "accident": (30, 180),        # 30 минут - 3 часа
            "weather_damage": (120, 720), # 2-12 часов
            "maintenance": (60, 300),     # 1-5 часов
            "special_event": (120, 480)   # 2-8 часов
        }
        
        min_duration, max_duration = duration_ranges[reason]
        duration = random.randint(min_duration, max_duration)
        
        event = RealtimeEvent(
            event_id=f"closure_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{random.randint(1000, 9999)}",
            event_type=EventType.ROAD_CLOSURE,
            severity=Severity.HIGH,
            timestamp=datetime.now(),
            location=location,
            parameters={
                "reason": reason,
                "affected_radius_km": random.uniform(1.0, 5.0),
                "detour_available": random.choice([True, False]),
                "detour_distance_km": random.uniform(2.0, 15.0) if random.choice([True, False]) else None
            },
            duration=duration,
            description=f"Закрытие дороги: {reason}"
        )
        
        self.active_events[event.event_id] = event
        self._notify_subscribers(event)
    
    async def _update_traffic_conditions(self):
        """Обновление условий трафика"""
        for location_key, condition in self.traffic_conditions.items():
            # Случайное изменение условий трафика
            if random.random() < 0.1:  # 10% шанс изменения
                conditions = ["light", "normal", "heavy", "jam"]
                # Предпочитаем плавные переходы
                current_idx = conditions.index(condition.condition)
                
                possible_changes = []
                if current_idx > 0:
                    possible_changes.append(conditions[current_idx - 1])
                if current_idx < len(conditions) - 1:
                    possible_changes.append(conditions[current_idx + 1])
                possible_changes.append(condition.condition)  # остаться тем же
                
                new_condition = random.choice(possible_changes)
                
                speed_multipliers = {
                    "light": random.uniform(1.1, 1.3),
                    "normal": random.uniform(0.9, 1.1),
                    "heavy": random.uniform(0.6, 0.8),
                    "jam": random.uniform(0.2, 0.4)
                }
                
                condition.condition = new_condition
                condition.speed_multiplier = speed_multipliers[new_condition]
                condition.updated_at = datetime.now()
    
    async def _update_weather_conditions(self):
        """Обновление погодных условий"""
        if "global" in self.weather_conditions:
            weather = self.weather_conditions["global"]
            
            # Случайное изменение интенсивности
            if random.random() < 0.2:  # 20% шанс изменения интенсивности
                intensity_change = random.uniform(-0.2, 0.2)
                weather.intensity = max(0.0, min(1.0, weather.intensity + intensity_change))
                
                # Пересчитываем влияние на видимость и скорость
                weather_impacts = {
                    "clear": {"visibility": 50.0, "speed": 1.0},
                    "rain": {"visibility": 20.0, "speed": 0.8},
                    "snow": {"visibility": 10.0, "speed": 0.6},
                    "fog": {"visibility": 5.0, "speed": 0.7},
                    "storm": {"visibility": 3.0, "speed": 0.5}
                }
                
                if weather.condition in weather_impacts:
                    impact = weather_impacts[weather.condition]
                    weather.visibility_km = impact["visibility"] * (1 - weather.intensity * 0.5)
                    weather.speed_impact = impact["speed"] * (1 - weather.intensity * 0.3)
                
                weather.updated_at = datetime.now()
    
    async def _update_vehicle_statuses(self):
        """Обновление статусов транспортных средств"""
        for vehicle_id, status in self.vehicle_statuses.items():
            # Симулируем движение
            if status.status == "busy":
                # Случайное изменение местоположения
                lat_change = random.uniform(-0.01, 0.01)
                lng_change = random.uniform(-0.01, 0.01)
                
                status.location["lat"] += lat_change
                status.location["lng"] += lng_change
                status.speed = random.uniform(20.0, 80.0)
                status.fuel_level = max(0.0, status.fuel_level - random.uniform(0.01, 0.05))
                status.updated_at = datetime.now()
    
    async def _resolve_expired_events(self):
        """Разрешение завершенных событий"""
        current_time = datetime.now()
        expired_events = []
        
        for event_id, event in self.active_events.items():
            if event.duration and not event.resolved:
                elapsed_minutes = (current_time - event.timestamp).total_seconds() / 60
                if elapsed_minutes >= event.duration:
                    event.resolved = True
                    expired_events.append(event_id)
                    
                    # Восстанавливаем нормальные условия
                    await self._resolve_event(event)
        
        # Удаляем разрешенные события
        for event_id in expired_events:
            del self.active_events[event_id]
    
    async def _resolve_event(self, event: RealtimeEvent):
        """Разрешение конкретного события"""
        if event.event_type == EventType.VEHICLE_BREAKDOWN:
            # Восстанавливаем транспорт
            for vehicle_id in event.affected_entities:
                if vehicle_id in self.vehicle_statuses:
                    self.vehicle_statuses[vehicle_id].status = "available"
                    self.vehicle_statuses[vehicle_id].updated_at = datetime.now()
        
        elif event.event_type == EventType.TRAFFIC_CHANGE:
            # Возвращаем нормальный трафик
            if event.location:
                location_key = f"{event.location['lat']:.4f},{event.location['lng']:.4f}"
                if location_key in self.traffic_conditions:
                    self.traffic_conditions[location_key].condition = "normal"
                    self.traffic_conditions[location_key].speed_multiplier = 1.0
                    self.traffic_conditions[location_key].updated_at = datetime.now()
        
        # Уведомляем подписчиков о разрешении события
        resolution_event = RealtimeEvent(
            event_id=f"resolved_{event.event_id}",
            event_type=event.event_type,
            severity=Severity.LOW,
            timestamp=datetime.now(),
            description=f"Разрешено: {event.description}",
            resolved=True
        )
        
        self._notify_subscribers(resolution_event)
    
    def _generate_random_location(self, center: List[float], radius_km: float) -> Dict[str, float]:
        """Генерация случайной локации в радиусе от центра"""
        # Конвертируем радиус в градусы (приблизительно)
        radius_deg = radius_km / 111.0  # 1 градус ≈ 111 км
        
        # Генерируем случайную точку в круге
        angle = random.uniform(0, 2 * math.pi)
        distance = random.uniform(0, radius_deg) * math.sqrt(random.random())
        
        lat = center[0] + distance * math.cos(angle)
        lng = center[1] + distance * math.sin(angle)
        
        return {"lat": lat, "lng": lng}
    
    def get_current_conditions(self) -> Dict[str, Any]:
        """Получить текущие условия"""
        return {
            "traffic_conditions": {k: {
                "location": v.location,
                "condition": v.condition,
                "speed_multiplier": v.speed_multiplier,
                "updated_at": v.updated_at.isoformat(),
                "radius_km": v.radius_km
            } for k, v in self.traffic_conditions.items()},
            
            "weather_conditions": {k: {
                "condition": v.condition,
                "intensity": v.intensity,
                "visibility_km": v.visibility_km,
                "speed_impact": v.speed_impact,
                "updated_at": v.updated_at.isoformat(),
                "area_radius_km": v.area_radius_km
            } for k, v in self.weather_conditions.items()},
            
            "vehicle_statuses": {k: {
                "vehicle_id": v.vehicle_id,
                "status": v.status,
                "location": v.location,
                "speed": v.speed,
                "fuel_level": v.fuel_level,
                "updated_at": v.updated_at.isoformat()
            } for k, v in self.vehicle_statuses.items()},
            
            "active_events": {k: {
                "event_id": v.event_id,
                "event_type": v.event_type.value,
                "severity": v.severity.value,
                "timestamp": v.timestamp.isoformat(),
                "location": v.location,
                "affected_entities": v.affected_entities,
                "parameters": v.parameters,
                "duration": v.duration,
                "description": v.description,
                "resolved": v.resolved
            } for k, v in self.active_events.items()}
        }
    
    def get_active_events(self, event_type: Optional[EventType] = None) -> List[RealtimeEvent]:
        """Получить активные события"""
        events = list(self.active_events.values())
        
        if event_type:
            events = [e for e in events if e.event_type == event_type]
        
        return sorted(events, key=lambda x: x.timestamp, reverse=True)
    
    def force_event(self, event_type: EventType, parameters: Dict[str, Any] = None) -> RealtimeEvent:
        """Принудительно создать событие для тестирования"""
        # Создаем событие напрямую
        center = self.simulation_params["geographic_center"]
        radius = self.simulation_params["geographic_radius"]
        location = self._generate_random_location(center, radius)
        
        event_id = f"{event_type.value}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{random.randint(1000, 9999)}"
        
        # Создаем событие в зависимости от типа
        if event_type == EventType.TRAFFIC_CHANGE:
            conditions = ["light", "normal", "heavy", "jam"]
            condition = random.choice(conditions)
            event = RealtimeEvent(
                event_id=event_id,
                event_type=event_type,
                severity=Severity.MEDIUM if condition in ["heavy", "jam"] else Severity.LOW,
                timestamp=datetime.now(),
                location=location,
                parameters={
                    "new_condition": condition,
                    "speed_multiplier": random.uniform(0.2, 1.3),
                    "radius_km": random.uniform(2.0, 15.0)
                },
                duration=random.randint(15, 120),
                description=f"Принудительное изменение трафика на {condition}"
            )
        elif event_type == EventType.WEATHER_CHANGE:
            conditions = ["clear", "rain", "snow", "fog", "storm"]
            condition = random.choice(conditions)
            event = RealtimeEvent(
                event_id=event_id,
                event_type=event_type,
                severity=Severity.HIGH if condition == "storm" else Severity.MEDIUM,
                timestamp=datetime.now(),
                location=location,
                parameters={
                    "condition": condition,
                    "intensity": random.uniform(0.3, 1.0),
                    "visibility_km": random.uniform(1.0, 10.0),
                    "speed_impact": random.uniform(0.5, 0.9)
                },
                duration=random.randint(30, 180),
                description=f"Принудительное изменение погоды: {condition}"
            )
        else:
            # Для других типов событий создаем базовое событие
            event = RealtimeEvent(
                event_id=event_id,
                event_type=event_type,
                severity=Severity.MEDIUM,
                timestamp=datetime.now(),
                location=location,
                parameters=parameters or {},
                duration=random.randint(15, 60),
                description=f"Принудительное событие: {event_type.value}"
            )
        
        # Добавляем событие в активные
        self.active_events[event.event_id] = event
        self._notify_subscribers(event)
        
        return event
    
    def update_simulation_parameters(self, params: Dict[str, Any]):
        """Обновить параметры симуляции"""
        self.simulation_params.update(params)
        logger.info(f"Параметры симуляции обновлены: {params}")
    
    def get_simulation_statistics(self) -> Dict[str, Any]:
        """Получить статистику симуляции"""
        event_counts = {}
        for event in self.active_events.values():
            event_type = event.event_type.value
            event_counts[event_type] = event_counts.get(event_type, 0) + 1
        
        return {
            "simulation_running": self.simulation_running,
            "simulation_speed": self.simulation_speed,
            "active_events_count": len(self.active_events),
            "event_counts_by_type": event_counts,
            "traffic_conditions_count": len(self.traffic_conditions),
            "vehicle_statuses_count": len(self.vehicle_statuses),
            "simulation_parameters": self.simulation_params.copy()
        }