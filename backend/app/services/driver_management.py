"""
Модуль управления водителями для системы доставки RUT MIIT
Включает функции управления профилями, доступностью, рейтингом и специализацией
"""

from datetime import datetime, timedelta, time
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from dataclasses import dataclass
from enum import Enum

from app.models.driver import Driver, DriverStatus, ExperienceLevel
from app.models.order import Order, OrderStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.database import get_db

class AvailabilityStatus(Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    ON_BREAK = "on_break"
    OFF_DUTY = "off_duty"
    UNAVAILABLE = "unavailable"

class ShiftType(Enum):
    DAY = "day"
    NIGHT = "night"
    FLEXIBLE = "flexible"

@dataclass
class DriverProfile:
    """Расширенный профиль водителя"""
    id: int
    name: str
    phone: str
    license_number: str
    experience_level: ExperienceLevel
    rating: float
    status: DriverStatus
    specialization: str
    can_work_nights: bool
    can_work_weekends: bool
    current_vehicle_id: Optional[int]
    total_deliveries: int
    successful_deliveries: int
    average_delivery_time: float
    customer_feedback_score: float
    punctuality_score: float
    safety_score: float
    last_active: datetime
    notes: str

@dataclass
class DriverAvailability:
    """Информация о доступности водителя"""
    driver_id: int
    date: datetime
    shift_start: time
    shift_end: time
    is_available: bool
    break_times: List[Tuple[time, time]]
    max_orders_per_day: int
    current_orders_count: int
    estimated_free_time: Optional[datetime]

@dataclass
class DriverPerformanceMetrics:
    """Метрики производительности водителя"""
    driver_id: int
    period_start: datetime
    period_end: datetime
    total_orders: int
    completed_orders: int
    cancelled_orders: int
    completion_rate: float
    average_rating: float
    on_time_delivery_rate: float
    fuel_efficiency: float
    distance_covered: float
    revenue_generated: float
    customer_complaints: int
    safety_incidents: int

class DriverManagementService:
    """Сервис управления водителями"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_driver_profile(self, driver_id: int) -> Optional[DriverProfile]:
        """Получает расширенный профиль водителя"""
        driver = self.db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            return None
        
        # Получаем статистику заказов
        total_orders = self.db.query(Order).filter(Order.driver_id == driver_id).count()
        successful_orders = self.db.query(Order).filter(
            and_(Order.driver_id == driver_id, Order.status == OrderStatus.DELIVERED)
        ).count()
        
        # Вычисляем среднее время доставки
        avg_delivery_time = self._calculate_average_delivery_time(driver_id)
        
        # Получаем оценки клиентов
        customer_feedback = self._calculate_customer_feedback_score(driver_id)
        
        # Вычисляем показатель пунктуальности
        punctuality = self._calculate_punctuality_score(driver_id)
        
        # Показатель безопасности
        safety = self._calculate_safety_score(driver_id)
        
        # Текущее транспортное средство
        current_vehicle = self.db.query(Vehicle).filter(Vehicle.driver_id == driver_id).first()
        
        return DriverProfile(
            id=driver.id,
            name=driver.full_name,
            phone=driver.phone,
            license_number=driver.license_number,
            experience_level=driver.experience_level,
            rating=driver.customer_rating,
            status=driver.status,
            specialization=driver.specialization or "Стандартная доставка",
            can_work_nights=driver.can_work_nights,
            can_work_weekends=driver.can_work_weekends,
            current_vehicle_id=current_vehicle.id if current_vehicle else None,
            total_deliveries=total_orders,
            successful_deliveries=successful_orders,
            average_delivery_time=avg_delivery_time,
            customer_feedback_score=customer_feedback,
            punctuality_score=punctuality,
            safety_score=safety,
            last_active=driver.last_active or driver.updated_at or datetime.now(),
            notes=driver.notes or ""
        )
    
    def update_driver_profile(self, driver_id: int, updates: Dict) -> bool:
        """Обновляет профиль водителя"""
        driver = self.db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            return False
        
        # Разрешенные поля для обновления
        allowed_fields = [
            'name', 'phone', 'license_number', 'experience_level', 
            'specialization', 'can_work_nights', 'can_work_weekends', 'notes'
        ]
        
        for field, value in updates.items():
            if field in allowed_fields and hasattr(driver, field):
                setattr(driver, field, value)
        
        driver.updated_at = datetime.now()
        self.db.commit()
        return True
    
    def get_driver_availability(self, driver_id: int, date: datetime = None) -> Optional[DriverAvailability]:
        """Получает информацию о доступности водителя на определенную дату"""
        if date is None:
            date = datetime.now()
        
        driver = self.db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            return None
        
        # Определяем рабочую смену
        if driver.can_work_nights:
            shift_start = time(0, 0)
            shift_end = time(23, 59)
        else:
            shift_start = time(8, 0)
            shift_end = time(20, 0)
        
        # Проверяем работу в выходные
        is_weekend = date.weekday() >= 5
        if is_weekend and not driver.can_work_weekends:
            is_available = False
        else:
            is_available = driver.status == DriverStatus.AVAILABLE
        
        # Получаем текущие заказы на дату
        current_orders = self.db.query(Order).filter(
            and_(
                Order.driver_id == driver_id,
                func.date(Order.time_window_start) == date.date(),
                Order.status.in_([OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS])
            )
        ).count()
        
        # Максимальное количество заказов в зависимости от опыта
        max_orders = {
            ExperienceLevel.JUNIOR: 8,
            ExperienceLevel.MIDDLE: 12,
            ExperienceLevel.SENIOR: 16
        }.get(driver.experience_level, 10)
        
        # Время перерывов (примерное)
        break_times = [(time(12, 0), time(13, 0)), (time(16, 0), time(16, 30))]
        
        # Оценка времени освобождения
        estimated_free_time = self._estimate_driver_free_time(driver_id, date)
        
        return DriverAvailability(
            driver_id=driver_id,
            date=date,
            shift_start=shift_start,
            shift_end=shift_end,
            is_available=is_available,
            break_times=break_times,
            max_orders_per_day=max_orders,
            current_orders_count=current_orders,
            estimated_free_time=estimated_free_time
        )
    
    def find_available_drivers(self, 
                             specialization: str = None,
                             min_rating: float = 0.0,
                             experience_level: ExperienceLevel = None,
                             can_work_nights: bool = None,
                             can_work_weekends: bool = None,
                             date: datetime = None) -> List[DriverProfile]:
        """Находит доступных водителей по критериям"""
        if date is None:
            date = datetime.now()
        
        query = self.db.query(Driver).filter(Driver.status == DriverStatus.AVAILABLE)
        
        # Фильтры
        if specialization:
            query = query.filter(Driver.specialization == specialization)
        
        if min_rating > 0:
            query = query.filter(Driver.rating >= min_rating)
        
        if experience_level:
            query = query.filter(Driver.experience_level == experience_level)
        
        if can_work_nights is not None:
            query = query.filter(Driver.can_work_nights == can_work_nights)
        
        if can_work_weekends is not None:
            query = query.filter(Driver.can_work_weekends == can_work_weekends)
        
        drivers = query.all()
        
        # Проверяем доступность каждого водителя на указанную дату
        available_drivers = []
        for driver in drivers:
            availability = self.get_driver_availability(driver.id, date)
            if availability and availability.is_available and availability.current_orders_count < availability.max_orders_per_day:
                profile = self.get_driver_profile(driver.id)
                if profile:
                    available_drivers.append(profile)
        
        # Сортируем по рейтингу
        available_drivers.sort(key=lambda x: x.rating, reverse=True)
        
        return available_drivers
    
    def assign_driver_to_order(self, driver_id: int, order_id: int) -> bool:
        """Назначает водителя на заказ"""
        driver = self.db.query(Driver).filter(Driver.id == driver_id).first()
        order = self.db.query(Order).filter(Order.id == order_id).first()
        
        if not driver or not order:
            return False
        
        if driver.status != DriverStatus.AVAILABLE:
            return False
        
        # Проверяем доступность на время заказа
        availability = self.get_driver_availability(driver_id, order.time_window_start)
        if not availability or not availability.is_available:
            return False
        
        if availability.current_orders_count >= availability.max_orders_per_day:
            return False
        
        # Назначаем заказ
        order.driver_id = driver_id
        order.status = OrderStatus.ASSIGNED
        
        # Обновляем статус водителя если это его первый заказ на день
        if availability.current_orders_count == 0:
            driver.status = DriverStatus.BUSY
        
        self.db.commit()
        return True
    
    def update_driver_status(self, driver_id: int, status: DriverStatus) -> bool:
        """Обновляет статус водителя"""
        driver = self.db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            return False
        
        driver.status = status
        driver.updated_at = datetime.now()
        self.db.commit()
        return True
    
    def calculate_driver_performance(self, driver_id: int, 
                                   period_start: datetime = None,
                                   period_end: datetime = None) -> Optional[DriverPerformanceMetrics]:
        """Вычисляет метрики производительности водителя за период"""
        if period_end is None:
            period_end = datetime.now()
        if period_start is None:
            period_start = period_end - timedelta(days=30)
        
        driver = self.db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            return None
        
        # Заказы за период
        orders_query = self.db.query(Order).filter(
            and_(
                Order.driver_id == driver_id,
                Order.time_window_start >= period_start,
                Order.time_window_start <= period_end
            )
        )
        
        total_orders = orders_query.count()
        completed_orders = orders_query.filter(Order.status == OrderStatus.DELIVERED).count()
        cancelled_orders = orders_query.filter(Order.status == OrderStatus.CANCELLED).count()
        
        completion_rate = (completed_orders / total_orders * 100) if total_orders > 0 else 0
        
        # Средний рейтинг (используем рейтинг водителя как базу)
        average_rating = driver.rating
        
        # Показатель своевременности доставки
        on_time_rate = self._calculate_on_time_delivery_rate(driver_id, period_start, period_end)
        
        # Эффективность использования топлива (примерная)
        fuel_efficiency = self._calculate_fuel_efficiency(driver_id, period_start, period_end)
        
        # Пройденное расстояние (примерное)
        distance_covered = self._calculate_distance_covered(driver_id, period_start, period_end)
        
        # Сгенерированная выручка (примерная)
        revenue = self._calculate_revenue_generated(driver_id, period_start, period_end)
        
        # Жалобы клиентов (примерное)
        complaints = max(0, int((5.0 - average_rating) * total_orders * 0.1))
        
        # Инциденты безопасности (примерное)
        safety_incidents = max(0, int((5.0 - self._calculate_safety_score(driver_id)) * 0.5))
        
        return DriverPerformanceMetrics(
            driver_id=driver_id,
            period_start=period_start,
            period_end=period_end,
            total_orders=total_orders,
            completed_orders=completed_orders,
            cancelled_orders=cancelled_orders,
            completion_rate=completion_rate,
            average_rating=average_rating,
            on_time_delivery_rate=on_time_rate,
            fuel_efficiency=fuel_efficiency,
            distance_covered=distance_covered,
            revenue_generated=revenue,
            customer_complaints=complaints,
            safety_incidents=safety_incidents
        )
    
    def update_driver_rating(self, driver_id: int, new_rating: float, feedback: str = None) -> bool:
        """Обновляет рейтинг водителя"""
        driver = self.db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            return False
        
        # Взвешенное обновление рейтинга
        current_rating = driver.rating
        total_orders = self.db.query(Order).filter(Order.driver_id == driver_id).count()
        
        if total_orders > 0:
            # Учитываем количество заказов для более точного рейтинга
            weight = min(total_orders, 100) / 100  # Максимальный вес 100 заказов
            updated_rating = (current_rating * weight + new_rating * (1 - weight))
        else:
            updated_rating = new_rating
        
        driver.rating = round(updated_rating, 1)
        driver.updated_at = datetime.now()
        
        if feedback:
            driver.notes = f"{driver.notes or ''}\n[{datetime.now().strftime('%Y-%m-%d')}] Отзыв: {feedback}"
        
        self.db.commit()
        return True
    
    def get_driver_statistics(self) -> Dict:
        """Получает общую статистику по водителям"""
        total_drivers = self.db.query(Driver).count()
        available_drivers = self.db.query(Driver).filter(Driver.status == DriverStatus.AVAILABLE).count()
        busy_drivers = self.db.query(Driver).filter(Driver.status == DriverStatus.BUSY).count()
        off_duty_drivers = self.db.query(Driver).filter(Driver.status == DriverStatus.OFF_DUTY).count()
        
        # Средний рейтинг
        avg_rating = self.db.query(func.avg(Driver.rating)).scalar() or 0
        
        # Распределение по опыту
        experience_distribution = {}
        for level in ExperienceLevel:
            count = self.db.query(Driver).filter(Driver.experience_level == level).count()
            experience_distribution[level.value] = count
        
        # Распределение по специализации
        specializations = self.db.query(Driver.specialization, func.count(Driver.id)).group_by(Driver.specialization).all()
        specialization_distribution = {spec: count for spec, count in specializations if spec}
        
        return {
            "total_drivers": total_drivers,
            "available_drivers": available_drivers,
            "busy_drivers": busy_drivers,
            "off_duty_drivers": off_duty_drivers,
            "average_rating": round(avg_rating, 2),
            "experience_distribution": experience_distribution,
            "specialization_distribution": specialization_distribution,
            "utilization_rate": round((busy_drivers / total_drivers * 100) if total_drivers > 0 else 0, 1)
        }
    
    # Вспомогательные методы
    def _calculate_average_delivery_time(self, driver_id: int) -> float:
        """Вычисляет среднее время доставки"""
        # Примерный расчет на основе заказов
        completed_orders = self.db.query(Order).filter(
            and_(Order.driver_id == driver_id, Order.status == OrderStatus.DELIVERED)
        ).count()
        
        if completed_orders == 0:
            return 0.0
        
        # Примерное время на основе опыта водителя
        driver = self.db.query(Driver).filter(Driver.id == driver_id).first()
        if driver:
            base_time = {
                ExperienceLevel.JUNIOR: 45.0,
                ExperienceLevel.MIDDLE: 35.0,
                ExperienceLevel.SENIOR: 30.0
            }.get(driver.experience_level, 40.0)
            
            # Корректировка на основе рейтинга
            rating_factor = driver.rating / 5.0
            return base_time * (2.0 - rating_factor)
        
        return 40.0
    
    def _calculate_customer_feedback_score(self, driver_id: int) -> float:
        """Вычисляет оценку обратной связи клиентов"""
        driver = self.db.query(Driver).filter(Driver.id == driver_id).first()
        return driver.customer_rating if driver else 0.0
    
    def _calculate_punctuality_score(self, driver_id: int) -> float:
        """Вычисляет показатель пунктуальности"""
        driver = self.db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            return 0.0
        
        # Базируется на рейтинге и опыте
        base_score = driver.customer_rating
        experience_bonus = {
            ExperienceLevel.JUNIOR: 0.0,
            ExperienceLevel.MIDDLE: 0.2,
            ExperienceLevel.SENIOR: 0.5
        }.get(driver.experience_level, 0.0)
        
        return min(5.0, base_score + experience_bonus)
    
    def _calculate_safety_score(self, driver_id: int) -> float:
        """Вычисляет показатель безопасности"""
        driver = self.db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            return 0.0
        
        # Базируется на рейтинге и опыте
        base_score = driver.customer_rating * 0.9  # Немного строже чем общий рейтинг
        experience_bonus = {
            ExperienceLevel.JUNIOR: -0.2,
            ExperienceLevel.MIDDLE: 0.0,
            ExperienceLevel.SENIOR: 0.3
        }.get(driver.experience_level, 0.0)
        
        return max(1.0, min(5.0, base_score + experience_bonus))
    
    def _estimate_driver_free_time(self, driver_id: int, date: datetime) -> Optional[datetime]:
        """Оценивает время освобождения водителя"""
        # Получаем последний заказ на дату
        last_order = self.db.query(Order).filter(
            and_(
                Order.driver_id == driver_id,
                func.date(Order.time_window_start) == date.date(),
                Order.status.in_([OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS])
            )
        ).order_by(Order.time_window_end.desc()).first()
        
        if last_order:
            # Добавляем время на завершение заказа
            return last_order.time_window_end + timedelta(minutes=30)
        
        return datetime.now()
    
    def _calculate_on_time_delivery_rate(self, driver_id: int, start_date: datetime, end_date: datetime) -> float:
        """Вычисляет процент своевременных доставок"""
        driver = self.db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            return 0.0
        
        # Примерный расчет на основе рейтинга
        return min(100.0, driver.rating * 18.0)  # 5.0 рейтинг = 90% своевременности
    
    def _calculate_fuel_efficiency(self, driver_id: int, start_date: datetime, end_date: datetime) -> float:
        """Вычисляет эффективность использования топлива"""
        # Примерный расчет
        driver = self.db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            return 0.0
        
        base_efficiency = 12.0  # л/100км
        experience_factor = {
            ExperienceLevel.JUNIOR: 1.2,
            ExperienceLevel.MIDDLE: 1.0,
            ExperienceLevel.SENIOR: 0.9
        }.get(driver.experience_level, 1.0)
        
        return base_efficiency * experience_factor
    
    def _calculate_distance_covered(self, driver_id: int, start_date: datetime, end_date: datetime) -> float:
        """Вычисляет пройденное расстояние"""
        orders_count = self.db.query(Order).filter(
            and_(
                Order.driver_id == driver_id,
                Order.time_window_start >= start_date,
                Order.time_window_start <= end_date,
                Order.status == OrderStatus.DELIVERED
            )
        ).count()
        
        # Примерно 25 км на заказ
        return orders_count * 25.0
    
    def _calculate_revenue_generated(self, driver_id: int, start_date: datetime, end_date: datetime) -> float:
        """Вычисляет сгенерированную выручку"""
        orders_count = self.db.query(Order).filter(
            and_(
                Order.driver_id == driver_id,
                Order.time_window_start >= start_date,
                Order.time_window_start <= end_date,
                Order.status == OrderStatus.DELIVERED
            )
        ).count()
        
        # Примерно 1500 рублей за заказ
        return orders_count * 1500.0