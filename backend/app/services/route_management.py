from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta
import json
import math
from dataclasses import dataclass

from app.models.route import Route, RouteStatus, OptimizationType
from app.models.order import Order, OrderStatus
from app.models.driver import Driver, DriverStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.route_stop import RouteStop

@dataclass
class RoutePoint:
    """Точка маршрута с координатами и параметрами"""
    lat: float
    lng: float
    address: str
    stop_type: str = "delivery"  # pickup, delivery, waypoint
    time_window_start: Optional[datetime] = None
    time_window_end: Optional[datetime] = None
    service_time: int = 15  # минуты
    weight: float = 0.0
    volume: float = 0.0
    priority: int = 1

@dataclass
class OptimizationParameters:
    """Параметры оптимизации маршрута"""
    algorithm: str = "nearest_neighbor"  # nearest_neighbor, genetic, simulated_annealing
    consider_traffic: bool = True
    consider_time_windows: bool = True
    consider_vehicle_capacity: bool = True
    max_route_duration: int = 480  # минуты (8 часов)
    max_stops_per_route: int = 20
    cost_per_km: float = 2.0
    cost_per_hour: float = 25.0

class RouteManagementService:
    """Сервис управления маршрутами"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_route(
        self,
        name: str,
        points: List[RoutePoint],
        driver_id: Optional[int] = None,
        vehicle_id: Optional[int] = None,
        planned_date: Optional[datetime] = None,
        optimization_params: Optional[OptimizationParameters] = None
    ) -> Route:
        """Создание нового маршрута"""
        
        if not points or len(points) < 2:
            raise ValueError("Маршрут должен содержать минимум 2 точки")
        
        # Создаем маршрут
        route = Route(
            route_number=self._generate_route_number(),
            driver_id=driver_id,
            vehicle_id=vehicle_id,
            planned_date=planned_date or datetime.now(),
            planned_start_time=planned_date or datetime.now(),
            total_stops=len(points)
        )
        
        # Рассчитываем базовые параметры
        total_distance, total_duration = self._calculate_route_metrics(points)
        route.total_distance = total_distance
        route.total_duration = total_duration
        route.planned_end_time = route.planned_start_time + timedelta(minutes=total_duration)
        
        # Рассчитываем общий вес и объем
        route.total_weight = sum(point.weight for point in points)
        route.total_volume = sum(point.volume for point in points)
        
        self.db.add(route)
        self.db.flush()
        
        # Создаем остановки маршрута
        for i, point in enumerate(points):
            route_stop = RouteStop(
                route_id=route.id,
                stop_sequence=i + 1,
                address=point.address,
                latitude=point.lat,
                longitude=point.lng,
                stop_type=point.stop_type,
                planned_arrival_time=self._calculate_arrival_time(
                    route.planned_start_time, points[:i+1]
                ),
                time_window_start=point.time_window_start,
                time_window_end=point.time_window_end,
                service_time_minutes=point.service_time,
                weight=point.weight,
                volume=point.volume,
                priority=point.priority
            )
            self.db.add(route_stop)
        
        # Оптимизируем маршрут если указаны параметры
        if optimization_params:
            route = self.optimize_route(route.id, optimization_params)
        
        self.db.commit()
        return route
    
    def update_route(
        self,
        route_id: int,
        updates: Dict[str, Any]
    ) -> Optional[Route]:
        """Обновление маршрута"""
        
        route = self.db.query(Route).filter(Route.id == route_id).first()
        if not route:
            return None
        
        # Обновляем основные поля
        for field, value in updates.items():
            if hasattr(route, field):
                setattr(route, field, value)
        
        route.updated_at = datetime.now()
        self.db.commit()
        return route
    
    def add_waypoint(
        self,
        route_id: int,
        point: RoutePoint,
        position: Optional[int] = None
    ) -> bool:
        """Добавление промежуточной точки в маршрут"""
        
        route = self.db.query(Route).filter(Route.id == route_id).first()
        if not route or route.status != RouteStatus.PLANNED:
            return False
        
        # Получаем существующие остановки
        stops = self.db.query(RouteStop).filter(
            RouteStop.route_id == route_id
        ).order_by(RouteStop.stop_sequence).all()
        
        # Определяем позицию для вставки
        if position is None:
            position = len(stops)
        
        # Сдвигаем последующие остановки
        for stop in stops[position:]:
            stop.stop_sequence += 1
        
        # Создаем новую остановку
        new_stop = RouteStop(
            route_id=route_id,
            stop_sequence=position + 1,
            address=point.address,
            latitude=point.lat,
            longitude=point.lng,
            stop_type=point.stop_type,
            service_time_minutes=point.service_time,
            weight=point.weight,
            volume=point.volume,
            priority=point.priority
        )
        
        self.db.add(new_stop)
        
        # Пересчитываем метрики маршрута
        self._recalculate_route_metrics(route)
        
        self.db.commit()
        return True
    
    def remove_waypoint(self, route_id: int, stop_sequence: int) -> bool:
        """Удаление точки из маршрута"""
        
        route = self.db.query(Route).filter(Route.id == route_id).first()
        if not route or route.status != RouteStatus.PLANNED:
            return False
        
        # Находим и удаляем остановку
        stop = self.db.query(RouteStop).filter(
            and_(
                RouteStop.route_id == route_id,
                RouteStop.stop_sequence == stop_sequence
            )
        ).first()
        
        if not stop:
            return False
        
        self.db.delete(stop)
        
        # Сдвигаем последующие остановки
        subsequent_stops = self.db.query(RouteStop).filter(
            and_(
                RouteStop.route_id == route_id,
                RouteStop.stop_sequence > stop_sequence
            )
        ).all()
        
        for subsequent_stop in subsequent_stops:
            subsequent_stop.stop_sequence -= 1
        
        # Пересчитываем метрики маршрута
        self._recalculate_route_metrics(route)
        
        self.db.commit()
        return True
    
    def optimize_route(
        self,
        route_id: int,
        params: OptimizationParameters
    ) -> Optional[Route]:
        """Оптимизация маршрута"""
        
        route = self.db.query(Route).filter(Route.id == route_id).first()
        if not route:
            return None
        
        # Получаем остановки маршрута
        stops = self.db.query(RouteStop).filter(
            RouteStop.route_id == route_id
        ).order_by(RouteStop.stop_sequence).all()
        
        if len(stops) < 3:  # Начало, конец и минимум одна остановка
            return route
        
        # Применяем алгоритм оптимизации
        if params.algorithm == "nearest_neighbor":
            optimized_sequence = self._nearest_neighbor_optimization(stops, params)
        elif params.algorithm == "genetic":
            optimized_sequence = self._genetic_algorithm_optimization(stops, params)
        elif params.algorithm == "simulated_annealing":
            optimized_sequence = self._simulated_annealing_optimization(stops, params)
        else:
            optimized_sequence = list(range(len(stops)))
        
        # Обновляем последовательность остановок
        for i, stop_index in enumerate(optimized_sequence):
            stops[stop_index].stop_sequence = i + 1
            stops[stop_index].planned_arrival_time = self._calculate_stop_arrival_time(
                route.planned_start_time, stops, i
            )
        
        # Обновляем метрики маршрута
        route.optimization_type = OptimizationType.STATIC
        route.is_optimized = True
        route.last_optimized_at = datetime.now()
        route.reoptimization_count += 1
        
        # Пересчитываем общие метрики
        self._recalculate_route_metrics(route)
        
        self.db.commit()
        return route
    
    def get_route_with_stops(self, route_id: int) -> Optional[Dict[str, Any]]:
        """Получение маршрута с остановками"""
        
        route = self.db.query(Route).filter(Route.id == route_id).first()
        if not route:
            return None
        
        stops = self.db.query(RouteStop).filter(
            RouteStop.route_id == route_id
        ).order_by(RouteStop.stop_sequence).all()
        
        return {
            "route": route,
            "stops": stops,
            "total_stops": len(stops),
            "estimated_duration": route.total_duration,
            "total_distance": route.total_distance
        }
    
    def find_optimal_routes(
        self,
        orders: List[Order],
        available_drivers: List[Driver],
        available_vehicles: List[Vehicle],
        params: OptimizationParameters
    ) -> List[Route]:
        """Поиск оптимальных маршрутов для списка заказов"""
        
        routes = []
        unassigned_orders = orders.copy()
        
        for driver, vehicle in zip(available_drivers, available_vehicles):
            if not unassigned_orders:
                break
            
            # Создаем маршрут для водителя и транспорта
            route_orders = self._select_orders_for_route(
                unassigned_orders, vehicle, params
            )
            
            if route_orders:
                # Создаем точки маршрута из заказов
                points = self._orders_to_route_points(route_orders)
                
                # Создаем маршрут
                route = self.create_route(
                    name=f"Маршрут {driver.name}",
                    points=points,
                    driver_id=driver.id,
                    vehicle_id=vehicle.id,
                    optimization_params=params
                )
                
                routes.append(route)
                
                # Удаляем назначенные заказы
                for order in route_orders:
                    unassigned_orders.remove(order)
        
        return routes
    
    def simulate_real_time_conditions(
        self,
        route_id: int,
        traffic_multiplier: float = 1.0,
        weather_impact: float = 1.0,
        unexpected_delays: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Симуляция изменения условий в реальном времени"""
        
        route = self.db.query(Route).filter(Route.id == route_id).first()
        if not route:
            return {"error": "Маршрут не найден"}
        
        stops = self.db.query(RouteStop).filter(
            RouteStop.route_id == route_id
        ).order_by(RouteStop.stop_sequence).all()
        
        # Применяем изменения условий
        total_delay = 0
        updated_stops = []
        
        for stop in stops:
            # Рассчитываем задержку от трафика
            traffic_delay = (stop.service_time_minutes * traffic_multiplier) - stop.service_time_minutes
            
            # Рассчитываем задержку от погоды
            weather_delay = stop.service_time_minutes * (weather_impact - 1.0)
            
            # Добавляем неожиданные задержки
            unexpected_delay = 0
            if unexpected_delays:
                for delay in unexpected_delays:
                    if delay.get("stop_sequence") == stop.stop_sequence:
                        unexpected_delay = delay.get("delay_minutes", 0)
            
            total_stop_delay = traffic_delay + weather_delay + unexpected_delay
            total_delay += total_stop_delay
            
            # Обновляем время прибытия
            if stop.planned_arrival_time:
                stop.actual_arrival_time = stop.planned_arrival_time + timedelta(
                    minutes=total_delay
                )
            
            updated_stops.append({
                "stop_sequence": stop.stop_sequence,
                "address": stop.address,
                "planned_arrival": stop.planned_arrival_time,
                "actual_arrival": stop.actual_arrival_time,
                "delay_minutes": total_stop_delay
            })
        
        # Обновляем общее время маршрута
        route.actual_end_time = route.planned_end_time + timedelta(minutes=total_delay)
        
        self.db.commit()
        
        return {
            "route_id": route_id,
            "total_delay_minutes": total_delay,
            "updated_stops": updated_stops,
            "new_estimated_completion": route.actual_end_time
        }
    
    # Вспомогательные методы
    
    def _generate_route_number(self) -> str:
        """Генерация номера маршрута"""
        today = datetime.now().strftime("%Y%m%d")
        count = self.db.query(Route).filter(
            func.date(Route.created_at) == datetime.now().date()
        ).count()
        return f"RT-{today}-{count + 1:03d}"
    
    def _calculate_route_metrics(self, points: List[RoutePoint]) -> Tuple[float, int]:
        """Расчет общего расстояния и времени маршрута"""
        total_distance = 0.0
        total_duration = 0
        
        for i in range(len(points) - 1):
            distance = self._calculate_distance(
                points[i].lat, points[i].lng,
                points[i + 1].lat, points[i + 1].lng
            )
            total_distance += distance
            
            # Примерное время в пути (60 км/ч средняя скорость)
            travel_time = (distance / 60) * 60  # минуты
            total_duration += travel_time + points[i + 1].service_time
        
        return total_distance, int(total_duration)
    
    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Расчет расстояния между двумя точками (формула гаверсинуса)"""
        R = 6371  # Радиус Земли в км
        
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        
        a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlng / 2) * math.sin(dlng / 2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
    
    def _calculate_arrival_time(self, start_time: datetime, points: List[RoutePoint]) -> datetime:
        """Расчет времени прибытия в точку"""
        if len(points) <= 1:
            return start_time
        
        total_time = 0
        for i in range(len(points) - 1):
            distance = self._calculate_distance(
                points[i].lat, points[i].lng,
                points[i + 1].lat, points[i + 1].lng
            )
            travel_time = (distance / 60) * 60  # минуты
            total_time += travel_time + points[i].service_time
        
        return start_time + timedelta(minutes=total_time)
    
    def _recalculate_route_metrics(self, route: Route):
        """Пересчет метрик маршрута"""
        stops = self.db.query(RouteStop).filter(
            RouteStop.route_id == route.id
        ).order_by(RouteStop.stop_sequence).all()
        
        if not stops:
            return
        
        # Пересчитываем расстояние и время
        total_distance = 0.0
        total_duration = 0
        total_weight = 0.0
        total_volume = 0.0
        
        for i, stop in enumerate(stops):
            total_weight += stop.weight or 0.0
            total_volume += stop.volume or 0.0
            total_duration += stop.service_time_minutes or 15
            
            if i < len(stops) - 1:
                distance = self._calculate_distance(
                    stop.latitude, stop.longitude,
                    stops[i + 1].latitude, stops[i + 1].longitude
                )
                total_distance += distance
                total_duration += (distance / 60) * 60  # время в пути
        
        route.total_distance = total_distance
        route.total_duration = total_duration
        route.total_weight = total_weight
        route.total_volume = total_volume
        route.total_stops = len(stops)
        route.planned_end_time = route.planned_start_time + timedelta(minutes=total_duration)
    
    def _nearest_neighbor_optimization(
        self, 
        stops: List[RouteStop], 
        params: OptimizationParameters
    ) -> List[int]:
        """Алгоритм ближайшего соседа для оптимизации маршрута"""
        if len(stops) <= 2:
            return list(range(len(stops)))
        
        # Начинаем с первой точки (депо)
        unvisited = list(range(1, len(stops) - 1))  # Исключаем начало и конец
        route = [0]  # Начинаем с депо
        current = 0
        
        while unvisited:
            nearest_idx = min(unvisited, key=lambda x: self._calculate_distance(
                stops[current].latitude, stops[current].longitude,
                stops[x].latitude, stops[x].longitude
            ))
            
            route.append(nearest_idx)
            unvisited.remove(nearest_idx)
            current = nearest_idx
        
        # Добавляем конечную точку
        if len(stops) > 1:
            route.append(len(stops) - 1)
        
        return route
    
    def _genetic_algorithm_optimization(
        self, 
        stops: List[RouteStop], 
        params: OptimizationParameters
    ) -> List[int]:
        """Генетический алгоритм (упрощенная версия)"""
        # Для демонстрации возвращаем результат ближайшего соседа
        return self._nearest_neighbor_optimization(stops, params)
    
    def _simulated_annealing_optimization(
        self, 
        stops: List[RouteStop], 
        params: OptimizationParameters
    ) -> List[int]:
        """Алгоритм имитации отжига (упрощенная версия)"""
        # Для демонстрации возвращаем результат ближайшего соседа
        return self._nearest_neighbor_optimization(stops, params)
    
    def _select_orders_for_route(
        self,
        orders: List[Order],
        vehicle: Vehicle,
        params: OptimizationParameters
    ) -> List[Order]:
        """Выбор заказов для маршрута с учетом ограничений"""
        selected_orders = []
        total_weight = 0.0
        total_volume = 0.0
        
        # Сортируем заказы по приоритету и близости
        sorted_orders = sorted(orders, key=lambda x: (-x.priority, x.created_at))
        
        for order in sorted_orders:
            # Проверяем ограничения по весу и объему
            if (total_weight + order.weight <= vehicle.max_weight and
                total_volume + order.volume <= vehicle.max_volume and
                len(selected_orders) < params.max_stops_per_route):
                
                selected_orders.append(order)
                total_weight += order.weight
                total_volume += order.volume
        
        return selected_orders
    
    def _orders_to_route_points(self, orders: List[Order]) -> List[RoutePoint]:
        """Преобразование заказов в точки маршрута"""
        points = []
        
        # Добавляем депо как начальную точку
        points.append(RoutePoint(
            lat=55.7558,  # Москва, центр
            lng=37.6176,
            address="Депо",
            stop_type="depot"
        ))
        
        # Добавляем точки доставки
        for order in orders:
            points.append(RoutePoint(
                lat=order.delivery_lat,
                lng=order.delivery_lng,
                address=order.delivery_address,
                stop_type="delivery",
                time_window_start=order.delivery_time_from,
                time_window_end=order.delivery_time_to,
                weight=order.weight,
                volume=order.volume,
                priority=order.priority
            ))
        
        # Добавляем депо как конечную точку
        points.append(RoutePoint(
            lat=55.7558,
            lng=37.6176,
            address="Депо",
            stop_type="depot"
        ))
        
        return points
    
    def _calculate_stop_arrival_time(
        self,
        start_time: datetime,
        stops: List[RouteStop],
        stop_index: int
    ) -> datetime:
        """Расчет времени прибытия в конкретную остановку"""
        total_time = 0
        
        for i in range(stop_index):
            if i < len(stops) - 1:
                distance = self._calculate_distance(
                    stops[i].latitude, stops[i].longitude,
                    stops[i + 1].latitude, stops[i + 1].longitude
                )
                travel_time = (distance / 60) * 60  # минуты
                total_time += travel_time + (stops[i].service_time_minutes or 15)
        
        return start_time + timedelta(minutes=total_time)