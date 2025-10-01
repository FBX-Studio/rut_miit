"""
Модуль для определения необходимости промежуточной выгрузки на складе
и оптимизации маршрутов с учетом возврата на склад
"""

from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class IntermediateUnloadingManager:
    """
    Менеджер промежуточной выгрузки для оптимизации маршрутов
    """
    
    def __init__(
        self,
        depot_coords: Tuple[float, float],
        max_vehicle_capacity_utilization: float = 0.9,
        unloading_time_minutes: int = 20
    ):
        """
        Инициализация менеджера промежуточной выгрузки
        
        Args:
            depot_coords: Координаты склада (lat, lon)
            max_vehicle_capacity_utilization: Максимальное использование вместимости (0-1)
            unloading_time_minutes: Время разгрузки на складе (минуты)
        """
        self.depot_coords = depot_coords
        self.max_capacity_utilization = max_vehicle_capacity_utilization
        self.unloading_time = unloading_time_minutes
        
    def needs_intermediate_unloading(
        self,
        orders: List[Dict],
        vehicle_capacity: Dict[str, float],
        current_load: Dict[str, float] = None
    ) -> bool:
        """
        Определяет необходимость промежуточной выгрузки
        
        Args:
            orders: Список оставшихся заказов в маршруте
            vehicle_capacity: Вместимость ТС {'weight': kg, 'volume': m³}
            current_load: Текущая загрузка ТС
            
        Returns:
            True если требуется промежуточная выгрузка
        """
        if not current_load:
            current_load = {'weight': 0, 'volume': 0}
        
        # Суммарный вес и объем оставшихся заказов
        total_remaining_weight = sum(o.get('weight', 0) for o in orders)
        total_remaining_volume = sum(o.get('volume', 0) for o in orders)
        
        # Проверяем превышение вместимости
        required_weight = current_load['weight'] + total_remaining_weight
        required_volume = current_load['volume'] + total_remaining_volume
        
        weight_exceeds = required_weight > (vehicle_capacity['weight'] * self.max_capacity_utilization)
        volume_exceeds = required_volume > (vehicle_capacity['volume'] * self.max_capacity_utilization)
        
        if weight_exceeds or volume_exceeds:
            logger.info(
                f"Промежуточная выгрузка требуется: "
                f"weight={required_weight:.2f}/{vehicle_capacity['weight']:.2f}kg, "
                f"volume={required_volume:.2f}/{vehicle_capacity['volume']:.2f}m³"
            )
            return True
        
        return False
    
    def calculate_unloading_points(
        self,
        route_orders: List[Dict],
        vehicle_capacity: Dict[str, float]
    ) -> List[int]:
        """
        Рассчитывает оптимальные точки для промежуточной выгрузки
        
        Args:
            route_orders: Список заказов в маршруте (упорядоченный)
            vehicle_capacity: Вместимость ТС
            
        Returns:
            Список индексов после которых нужна выгрузка
        """
        unloading_points = []
        current_weight = 0
        current_volume = 0
        
        for idx, order in enumerate(route_orders):
            # Добавляем вес и объем при загрузке
            current_weight += order.get('weight', 0)
            current_volume += order.get('volume', 0)
            
            # Вычитаем после доставки (если груз забирается)
            # В данном случае груз доставляется, поэтому вычитаем
            current_weight -= order.get('weight', 0)
            current_volume -= order.get('volume', 0)
            
            # Проверяем следующий заказ
            if idx + 1 < len(route_orders):
                next_order = route_orders[idx + 1]
                next_weight = current_weight + next_order.get('weight', 0)
                next_volume = current_volume + next_order.get('volume', 0)
                
                weight_will_exceed = next_weight > (vehicle_capacity['weight'] * self.max_capacity_utilization)
                volume_will_exceed = next_volume > (vehicle_capacity['volume'] * self.max_capacity_utilization)
                
                if weight_will_exceed or volume_will_exceed:
                    unloading_points.append(idx + 1)
                    current_weight = 0
                    current_volume = 0
                    logger.info(f"Точка промежуточной выгрузки после заказа {idx}")
        
        return unloading_points
    
    def insert_depot_returns(
        self,
        route_orders: List[Dict],
        unloading_points: List[int]
    ) -> List[Dict]:
        """
        Вставляет возвраты на склад в маршрут
        
        Args:
            route_orders: Список заказов в маршруте
            unloading_points: Индексы точек для возврата на склад
            
        Returns:
            Новый список с вставленными точками возврата на склад
        """
        new_route = []
        last_insert = 0
        
        for point_idx in sorted(unloading_points):
            # Добавляем заказы до точки выгрузки
            new_route.extend(route_orders[last_insert:point_idx])
            
            # Вставляем точку возврата на склад
            depot_stop = {
                'type': 'depot_return',
                'location': self.depot_coords,
                'service_time': self.unloading_time,
                'description': 'Промежуточная выгрузка на складе',
                'is_depot': True
            }
            new_route.append(depot_stop)
            
            last_insert = point_idx
        
        # Добавляем оставшиеся заказы
        new_route.extend(route_orders[last_insert:])
        
        return new_route
    
    def optimize_route_with_unloading(
        self,
        route_orders: List[Dict],
        vehicle_capacity: Dict[str, float]
    ) -> Tuple[List[Dict], Dict]:
        """
        Оптимизирует маршрут с учетом промежуточной выгрузки
        
        Args:
            route_orders: Список заказов
            vehicle_capacity: Вместимость ТС
            
        Returns:
            Кортеж: (оптимизированный маршрут, метаданные)
        """
        # Определяем точки промежуточной выгрузки
        unloading_points = self.calculate_unloading_points(
            route_orders, 
            vehicle_capacity
        )
        
        # Если не нужна промежуточная выгрузка
        if not unloading_points:
            return route_orders, {
                'requires_intermediate_unloading': False,
                'unloading_points': 0,
                'additional_time': 0
            }
        
        # Вставляем возвраты на склад
        optimized_route = self.insert_depot_returns(route_orders, unloading_points)
        
        # Метаданные
        metadata = {
            'requires_intermediate_unloading': True,
            'unloading_points': len(unloading_points),
            'additional_time': len(unloading_points) * self.unloading_time,
            'unloading_indices': unloading_points
        }
        
        logger.info(
            f"Маршрут оптимизирован с {len(unloading_points)} точками промежуточной выгрузки. "
            f"Дополнительное время: {metadata['additional_time']} минут"
        )
        
        return optimized_route, metadata
    
    def calculate_capacity_profile(
        self,
        route_orders: List[Dict]
    ) -> List[Tuple[int, float, float]]:
        """
        Рассчитывает профиль загрузки ТС на протяжении маршрута
        
        Args:
            route_orders: Список заказов в маршруте
            
        Returns:
            Список (индекс, вес, объем) для каждой точки маршрута
        """
        profile = []
        current_weight = 0
        current_volume = 0
        
        for idx, order in enumerate(route_orders):
            # Загрузка на складе
            if order.get('is_depot', False):
                # После выгрузки загрузка обнуляется
                current_weight = 0
                current_volume = 0
            else:
                # Добавляем груз при загрузке
                current_weight += order.get('weight', 0)
                current_volume += order.get('volume', 0)
            
            profile.append((idx, current_weight, current_volume))
            
            # После доставки груз убирается
            if not order.get('is_depot', False):
                current_weight -= order.get('weight', 0)
                current_volume -= order.get('volume', 0)
        
        return profile
    
    def suggest_optimal_batch_size(
        self,
        total_orders: int,
        vehicle_capacity: Dict[str, float],
        average_order_weight: float,
        average_order_volume: float
    ) -> int:
        """
        Предлагает оптимальный размер партии для загрузки
        
        Args:
            total_orders: Общее количество заказов
            vehicle_capacity: Вместимость ТС
            average_order_weight: Средний вес заказа
            average_order_volume: Средний объем заказа
            
        Returns:
            Оптимальный размер партии
        """
        # Рассчитываем сколько заказов влезет по весу
        max_by_weight = int(
            (vehicle_capacity['weight'] * self.max_capacity_utilization) / average_order_weight
        )
        
        # Рассчитываем сколько заказов влезет по объему
        max_by_volume = int(
            (vehicle_capacity['volume'] * self.max_capacity_utilization) / average_order_volume
        )
        
        # Выбираем минимум
        optimal_batch = min(max_by_weight, max_by_volume, total_orders)
        
        logger.info(
            f"Рекомендуемый размер партии: {optimal_batch} заказов "
            f"(по весу: {max_by_weight}, по объему: {max_by_volume})"
        )
        
        return optimal_batch


def check_requires_intermediate_stop(
    order_sequence: List,
    vehicle_max_weight: float,
    vehicle_max_volume: float,
    depot_coords: Tuple[float, float]
) -> Dict:
    """
    Вспомогательная функция для быстрой проверки необходимости промежуточной выгрузки
    
    Args:
        order_sequence: Последовательность заказов
        vehicle_max_weight: Максимальный вес ТС
        vehicle_max_volume: Максимальный объем ТС
        depot_coords: Координаты склада
        
    Returns:
        Словарь с информацией о промежуточных остановках
    """
    manager = IntermediateUnloadingManager(depot_coords)
    
    vehicle_capacity = {
        'weight': vehicle_max_weight,
        'volume': vehicle_max_volume
    }
    
    optimized_route, metadata = manager.optimize_route_with_unloading(
        order_sequence,
        vehicle_capacity
    )
    
    return {
        'requires_unloading': metadata['requires_intermediate_unloading'],
        'optimized_route': optimized_route,
        'unloading_points': metadata['unloading_points'],
        'additional_time_minutes': metadata['additional_time']
    }
