"""
Расширенный генератор тестовых данных для системы доставки RUT MIIT
Создает комплексные тестовые сценарии с различными условиями доставки
"""

import random
import json
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from faker import Faker
from dataclasses import dataclass, asdict
from enum import Enum

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Customer, Vehicle, Driver, Order
from app.models.order import OrderStatus, OrderPriority
from app.models.vehicle import VehicleStatus, VehicleType
from app.models.driver import DriverStatus, ExperienceLevel

fake = Faker('ru_RU')

class DeliveryComplexity(Enum):
    SIMPLE = "simple"
    MEDIUM = "medium"
    COMPLEX = "complex"
    EXTREME = "extreme"

class WeatherCondition(Enum):
    CLEAR = "clear"
    RAIN = "rain"
    SNOW = "snow"
    FOG = "fog"
    STORM = "storm"

class TrafficCondition(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXTREME = "extreme"

@dataclass
class DeliveryScenario:
    """Класс для описания сценария доставки"""
    name: str
    description: str
    complexity: DeliveryComplexity
    weather: WeatherCondition
    traffic: TrafficCondition
    distance_km: float
    estimated_time_minutes: int
    cargo_type: str
    special_requirements: List[str]
    risk_factors: List[str]
    cost_multiplier: float

@dataclass
class TestConfiguration:
    """Конфигурация для генерации тестовых данных"""
    customers_count: int = 100
    drivers_count: int = 25
    vehicles_count: int = 20
    orders_count: int = 500
    scenario_distribution: Dict[DeliveryComplexity, float] = None
    time_range_days: int = 30
    include_rush_hours: bool = True
    include_weekend_delivery: bool = True
    include_night_delivery: bool = True

# Предопределенные сценарии доставки
DELIVERY_SCENARIOS = [
    # Простые сценарии
    DeliveryScenario(
        name="Городская доставка в хорошую погоду",
        description="Стандартная доставка по городу в благоприятных условиях",
        complexity=DeliveryComplexity.SIMPLE,
        weather=WeatherCondition.CLEAR,
        traffic=TrafficCondition.LOW,
        distance_km=random.uniform(5, 15),
        estimated_time_minutes=random.randint(30, 60),
        cargo_type="Стандартный груз",
        special_requirements=[],
        risk_factors=[],
        cost_multiplier=1.0
    ),
    
    # Средние сценарии
    DeliveryScenario(
        name="Доставка в час пик",
        description="Доставка в условиях интенсивного движения",
        complexity=DeliveryComplexity.MEDIUM,
        weather=WeatherCondition.CLEAR,
        traffic=TrafficCondition.HIGH,
        distance_km=random.uniform(10, 25),
        estimated_time_minutes=random.randint(60, 120),
        cargo_type="Стандартный груз",
        special_requirements=["Учет пробок"],
        risk_factors=["Задержки в пути"],
        cost_multiplier=1.3
    ),
    
    DeliveryScenario(
        name="Доставка хрупкого груза",
        description="Транспортировка хрупких товаров с особой осторожностью",
        complexity=DeliveryComplexity.MEDIUM,
        weather=WeatherCondition.CLEAR,
        traffic=TrafficCondition.MEDIUM,
        distance_km=random.uniform(8, 20),
        estimated_time_minutes=random.randint(45, 90),
        cargo_type="Хрупкий груз",
        special_requirements=["Осторожная погрузка", "Медленная езда", "Специальная упаковка"],
        risk_factors=["Повреждение груза"],
        cost_multiplier=1.5
    ),
    
    # Сложные сценарии
    DeliveryScenario(
        name="Доставка в плохую погоду",
        description="Доставка в условиях дождя или снега",
        complexity=DeliveryComplexity.COMPLEX,
        weather=random.choice([WeatherCondition.RAIN, WeatherCondition.SNOW]),
        traffic=TrafficCondition.HIGH,
        distance_km=random.uniform(15, 35),
        estimated_time_minutes=random.randint(90, 180),
        cargo_type="Стандартный груз",
        special_requirements=["Защита от влаги", "Осторожное вождение"],
        risk_factors=["Плохая видимость", "Скользкая дорога", "Задержки"],
        cost_multiplier=1.8
    ),
    
    DeliveryScenario(
        name="Доставка негабаритного груза",
        description="Транспортировка крупногабаритных товаров",
        complexity=DeliveryComplexity.COMPLEX,
        weather=WeatherCondition.CLEAR,
        traffic=TrafficCondition.MEDIUM,
        distance_km=random.uniform(20, 50),
        estimated_time_minutes=random.randint(120, 240),
        cargo_type="Негабаритный груз",
        special_requirements=["Специальный транспорт", "Разрешения на проезд", "Сопровождение"],
        risk_factors=["Ограничения по маршруту", "Сложная погрузка"],
        cost_multiplier=2.5
    ),
    
    # Экстремальные сценарии
    DeliveryScenario(
        name="Экстренная доставка в шторм",
        description="Срочная доставка в экстремальных погодных условиях",
        complexity=DeliveryComplexity.EXTREME,
        weather=WeatherCondition.STORM,
        traffic=TrafficCondition.EXTREME,
        distance_km=random.uniform(25, 60),
        estimated_time_minutes=random.randint(180, 360),
        cargo_type="Срочный груз",
        special_requirements=["Экстренная доставка", "Специальный водитель", "Постоянная связь"],
        risk_factors=["Опасные условия", "Закрытые дороги", "Высокий риск аварий"],
        cost_multiplier=4.0
    ),
    
    DeliveryScenario(
        name="Ночная доставка ценного груза",
        description="Доставка ценных товаров в ночное время",
        complexity=DeliveryComplexity.EXTREME,
        weather=WeatherCondition.CLEAR,
        traffic=TrafficCondition.LOW,
        distance_km=random.uniform(30, 80),
        estimated_time_minutes=random.randint(150, 300),
        cargo_type="Ценный груз",
        special_requirements=["Охрана", "Специальная сигнализация", "Ночная доставка"],
        risk_factors=["Кража", "Ограниченная видимость", "Меньше помощи на дороге"],
        cost_multiplier=3.5
    )
]

class AdvancedTestDataGenerator:
    """Расширенный генератор тестовых данных"""
    
    def __init__(self, config: TestConfiguration = None):
        self.config = config or TestConfiguration()
        self.session = SessionLocal()
        
        # Распределение сценариев по умолчанию
        if not self.config.scenario_distribution:
            self.config.scenario_distribution = {
                DeliveryComplexity.SIMPLE: 0.4,
                DeliveryComplexity.MEDIUM: 0.35,
                DeliveryComplexity.COMPLEX: 0.2,
                DeliveryComplexity.EXTREME: 0.05
            }
    
    def generate_moscow_coordinates(self) -> Tuple[float, float]:
        """Генерирует случайные координаты в пределах Москвы и области"""
        # Расширенные границы для более реалистичных сценариев
        bounds = {
            'lat_min': 55.3,
            'lat_max': 56.2,
            'lon_min': 37.0,
            'lon_max': 38.2
        }
        
        lat = random.uniform(bounds['lat_min'], bounds['lat_max'])
        lon = random.uniform(bounds['lon_min'], bounds['lon_max'])
        return lat, lon
    
    def create_advanced_customers(self) -> List[Customer]:
        """Создает клиентов с различными профилями"""
        customers = []
        
        # Типы клиентов
        customer_types = [
            {"type": "Частное лицо", "weight": 0.6},
            {"type": "Малый бизнес", "weight": 0.25},
            {"type": "Корпоративный клиент", "weight": 0.15}
        ]
        
        for i in range(self.config.customers_count):
            customer_type = random.choices(
                [ct["type"] for ct in customer_types],
                weights=[ct["weight"] for ct in customer_types]
            )[0]
            
            # Генерируем данные в зависимости от типа клиента
            if customer_type == "Частное лицо":
                name = fake.name()
                phone = fake.phone_number()
                email = fake.email()
                business_type = None
            elif customer_type == "Малый бизнес":
                name = fake.name()
                phone = fake.phone_number()
                email = fake.company_email()
                business_type = "small_business"
            else:  # Корпоративный клиент
                name = fake.name()
                phone = fake.phone_number()
                email = fake.company_email()
                business_type = "corporate"
            
            lat, lon = self.generate_moscow_coordinates()
            
            customer = Customer(
                name=name,
                phone=phone,
                email=email,
                address=fake.address(),
                latitude=lat,
                longitude=lon,
                city="Moscow",
                postal_code=fake.postcode(),
                business_type=business_type
            )
            customers.append(customer)
        
        return customers
    
    def generate_customers(self, count: int = None, center_coords: List[float] = None, radius_km: float = None) -> List[Customer]:
        """Публичный метод для генерации клиентов (для совместимости с тестами)"""
        if count:
            original_count = self.config.customers_count
            self.config.customers_count = count
        
        customers = self.create_advanced_customers()
        
        if count:
            self.config.customers_count = original_count
            
        return customers
    
    def generate_drivers(self, count: int = None) -> List[Driver]:
        """Публичный метод для генерации водителей (для совместимости с тестами)"""
        if count:
            original_count = self.config.drivers_count
            self.config.drivers_count = count
        
        drivers = self.create_specialized_drivers()
        
        if count:
            self.config.drivers_count = original_count
            
        return drivers
    
    def generate_vehicles(self, count: int = None) -> List[Vehicle]:
        """Публичный метод для генерации транспортных средств (для совместимости с тестами)"""
        if count:
            original_count = self.config.vehicles_count
            self.config.vehicles_count = count
        
        # Создаем водителей для привязки к транспорту
        drivers = self.create_specialized_drivers()
        vehicles = self.create_diverse_vehicles(drivers)
        
        if count:
            self.config.vehicles_count = original_count
            
        return vehicles
    
    def create_specialized_drivers(self) -> List[Driver]:
        """Создает водителей со специализацией"""
        drivers = []
        
        # Проверяем существующих водителей для избежания дублирования employee_id
        existing_drivers = self.session.query(Driver).all()
        existing_ids = {driver.employee_id for driver in existing_drivers}
        
        # Специализации водителей
        specializations = [
            {"name": "Стандартная доставка", "weight": 0.5},
            {"name": "Хрупкие грузы", "weight": 0.2},
            {"name": "Негабаритные грузы", "weight": 0.15},
            {"name": "Ценные грузы", "weight": 0.1},
            {"name": "Экстренная доставка", "weight": 0.05}
        ]
        
        for i in range(self.config.drivers_count):
            # Генерируем уникальный employee_id
            employee_id = f"DRV{len(existing_ids) + i + 1:04d}"
            while employee_id in existing_ids:
                employee_id = f"DRV{len(existing_ids) + i + random.randint(1000, 9999):04d}"
            existing_ids.add(employee_id)
            
            specialization = random.choices(
                [s["name"] for s in specializations],
                weights=[s["weight"] for s in specializations]
            )[0]
            
            # Опыт влияет на рейтинг и специализацию
            experience = random.choice(list(ExperienceLevel))
            
            if experience == ExperienceLevel.JUNIOR:
                rating = random.uniform(3.5, 4.2)
                can_handle_complex = False
                years_exp = random.uniform(0.5, 2.0)
            elif experience == ExperienceLevel.MIDDLE:
                rating = random.uniform(4.0, 4.6)
                can_handle_complex = random.choice([True, False])
                years_exp = random.uniform(2.0, 5.0)
            else:  # SENIOR
                rating = random.uniform(4.4, 5.0)
                can_handle_complex = True
                years_exp = random.uniform(5.0, 15.0)
            
            full_name = fake.name().split()
            first_name = full_name[0]
            last_name = full_name[1] if len(full_name) > 1 else "Иванов"
            
            driver = Driver(
                employee_id=employee_id,
                first_name=first_name,
                last_name=last_name,
                email=fake.email(),
                phone=fake.phone_number(),
                license_number=f"77{random.randint(10, 99)}{random.randint(100000, 999999)}",
                experience_level=experience,
                years_of_experience=years_exp,
                customer_rating=round(rating, 1),
                status=random.choice([DriverStatus.AVAILABLE, DriverStatus.BUSY, DriverStatus.OFF_DUTY]),
                specialization=specialization,
                can_work_nights=random.choice([True, False]),
                can_work_weekends=random.choice([True, False]),
                can_handle_fragile=specialization in ["Хрупкие грузы", "Стандартная доставка"],
                can_handle_high_value=specialization in ["Ценные грузы", "Экстренная доставка"],
                notes=f"Специализация: {specialization}, Сложные грузы: {'Да' if can_handle_complex else 'Нет'}"
            )
            
            self.session.add(driver)
            drivers.append(driver)
        
        self.session.commit()
        print(f"Создано {len(drivers)} водителей со специализацией")
        return drivers
    
    def create_diverse_vehicles(self, drivers: List[Driver]) -> List[Vehicle]:
        """Создает разнообразный парк транспортных средств"""
        vehicles = []
        
        # Расширенные типы транспорта
        vehicle_configs = [
            {"type": VehicleType.VAN, "capacity": 1500, "volume": 9.0, "specialization": "Стандартная доставка"},
            {"type": VehicleType.VAN, "capacity": 2000, "volume": 12.0, "specialization": "Хрупкие грузы"},
            {"type": VehicleType.TRUCK, "capacity": 5000, "volume": 20.0, "specialization": "Средние грузы"},
            {"type": VehicleType.TRUCK, "capacity": 20000, "volume": 82.0, "specialization": "Крупные грузы"},
            {"type": VehicleType.TRUCK, "capacity": 25000, "volume": 100.0, "specialization": "Негабаритные грузы"},
        ]
        
        for i in range(self.config.vehicles_count):
            config = random.choice(vehicle_configs)
            
            # Возраст влияет на надежность
            age_years = random.randint(1, 15)
            if age_years <= 3:
                reliability = random.uniform(0.95, 1.0)
            elif age_years <= 7:
                reliability = random.uniform(0.85, 0.95)
            else:
                reliability = random.uniform(0.7, 0.85)
            
            # Генерируем координаты депо
            depot_lat, depot_lon = self.generate_moscow_coordinates()
            
            vehicle = Vehicle(
                license_plate=f"{''.join(random.choices('АВЕКМНОРСТУХ', k=1))}{random.randint(100, 999)}{''.join(random.choices('АВЕКМНОРСТУХ', k=2))}{random.randint(10, 99)}",
                model=fake.word().capitalize() + " " + str(random.randint(1000, 9999)),
                brand=random.choice(["ГАЗ", "КАМАЗ", "МАЗ", "Iveco", "Mercedes", "Volvo"]),
                year=random.randint(2008, 2024),
                vehicle_type=config["type"],
                max_weight_capacity=config["capacity"],
                max_volume_capacity=config["volume"],
                fuel_consumption=random.uniform(8.0, 25.0),
                max_working_hours=random.randint(8, 12),
                requires_break_every=random.randint(3, 5),
                break_duration=random.randint(20, 45),
                current_latitude=depot_lat + random.uniform(-0.1, 0.1),
                current_longitude=depot_lon + random.uniform(-0.1, 0.1),
                depot_latitude=depot_lat,
                depot_longitude=depot_lon,
                status=random.choice(list(VehicleStatus)),
                has_gps=random.choice([True, False]),
                has_temperature_control=random.choice([True, False]) if config["specialization"] in ["Хрупкие грузы"] else False,
                has_lift_gate=random.choice([True, False]),
                cost_per_km=random.uniform(0.3, 0.8),
                cost_per_hour=random.uniform(20.0, 35.0),
                age_years=age_years,
                reliability_score=round(reliability, 2),
                specialization=config["specialization"],
                has_refrigeration=random.choice([True, False]) if config["specialization"] in ["Хрупкие грузы"] else False,
                notes=f"Специализация: {config['specialization']}, Возраст: {age_years} лет"
            )
            
            self.session.add(vehicle)
            vehicles.append(vehicle)
        
        self.session.commit()
        print(f"Создано {len(vehicles)} транспортных средств")
        return vehicles
    
    def create_scenario_based_orders(self, customers: List[Customer]) -> List[Order]:
        """Создает заказы на основе сценариев доставки"""
        orders = []
        
        for i in range(self.config.orders_count):
            # Выбираем сценарий на основе распределения
            complexity = random.choices(
                list(self.config.scenario_distribution.keys()),
                weights=list(self.config.scenario_distribution.values())
            )[0]
            
            # Выбираем подходящий сценарий
            suitable_scenarios = [s for s in DELIVERY_SCENARIOS if s.complexity == complexity]
            scenario = random.choice(suitable_scenarios)
            
            customer = random.choice(customers)
            delivery_lat, delivery_lon = self.generate_moscow_coordinates()
            
            # Генерируем время с учетом сценария
            order_date = fake.date_between(
                start_date=f'-{self.config.time_range_days//2}d',
                end_date=f'+{self.config.time_range_days//2}d'
            )
            
            # Учитываем особенности времени доставки
            if "ночная" in scenario.name.lower():
                start_hour = random.randint(22, 5) % 24
            elif "час пик" in scenario.name.lower():
                start_hour = random.choice([8, 9, 17, 18, 19])
            else:
                start_hour = random.randint(8, 20)
            
            start_minute = random.choice([0, 15, 30, 45])
            time_start = datetime.combine(
                order_date,
                datetime.min.time().replace(hour=start_hour, minute=start_minute)
            )
            time_end = time_start + timedelta(minutes=scenario.estimated_time_minutes)
            
            # Параметры груза в зависимости от сценария
            if "хрупкий" in scenario.cargo_type.lower():
                weight = random.uniform(1, 50)
                volume = random.uniform(0.1, 2.0)
                value = random.uniform(5000, 100000)
                fragile = True
            elif "негабаритный" in scenario.cargo_type.lower():
                weight = random.uniform(500, 5000)
                volume = random.uniform(5.0, 50.0)
                value = random.uniform(10000, 500000)
                fragile = False
            elif "ценный" in scenario.cargo_type.lower():
                weight = random.uniform(1, 100)
                volume = random.uniform(0.1, 5.0)
                value = random.uniform(50000, 1000000)
                fragile = random.choice([True, False])
            else:
                weight = random.uniform(10, 1000)
                volume = random.uniform(0.1, 10.0)
                value = random.uniform(500, 50000)
                fragile = False
            
            # Статус заказа
            if order_date < datetime.now().date():
                status = random.choice([OrderStatus.DELIVERED, OrderStatus.CANCELLED])
            else:
                status = random.choice([OrderStatus.PENDING, OrderStatus.ASSIGNED])
            
            order = Order(
                order_number=f"ADV{i+1:06d}",
                customer_id=customer.id,
                delivery_address=fake.address(),
                delivery_latitude=delivery_lat,
                delivery_longitude=delivery_lon,
                time_window_start=time_start,
                time_window_end=time_end,
                estimated_service_time=random.randint(15, 120),
                weight=weight,
                volume=volume,
                value=value,
                priority=OrderPriority.HIGH if complexity in [DeliveryComplexity.COMPLEX, DeliveryComplexity.EXTREME] else random.choice(list(OrderPriority)),
                status=status,
                requires_signature=True if "ценный" in scenario.cargo_type.lower() else random.choice([True, False]),
                fragile=fragile,
                temperature_controlled="охлаждение" in " ".join(scenario.special_requirements).lower(),
                special_instructions="; ".join(scenario.special_requirements) if scenario.special_requirements else None,
                scenario_name=scenario.name,
                complexity_level=scenario.complexity.value,
                weather_condition=scenario.weather.value,
                traffic_condition=scenario.traffic.value,
                risk_factors="; ".join(scenario.risk_factors) if scenario.risk_factors else None,
                cost_multiplier=scenario.cost_multiplier
            )
            
            self.session.add(order)
            orders.append(order)
        
        self.session.commit()
        print(f"Создано {len(orders)} заказов на основе сценариев")
        return orders
    
    def generate_test_scenarios_config(self) -> Dict:
        """Генерирует конфигурацию тестовых сценариев"""
        scenarios_config = {
            "scenarios": [asdict(scenario) for scenario in DELIVERY_SCENARIOS],
            "configuration": asdict(self.config),
            "generated_at": datetime.now().isoformat(),
            "statistics": {
                "total_scenarios": len(DELIVERY_SCENARIOS),
                "complexity_distribution": self.config.scenario_distribution
            }
        }
        return scenarios_config
    
    def save_scenarios_config(self, filename: str = "test_scenarios_config.json"):
        """Сохраняет конфигурацию сценариев в файл"""
        config = self.generate_test_scenarios_config()
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        print(f"Конфигурация сценариев сохранена в {filename}")
    
    def clear_existing_data(self):
        """Очищает существующие данные"""
        print("🧹 Очистка существующих данных...")
        
        self.session.query(Order).delete()
        self.session.query(Vehicle).delete()
        self.session.query(Driver).delete()
        self.session.query(Customer).delete()
        
        self.session.commit()
        print("✅ Существующие данные очищены")
    
    def generate_all_data(self, clear_existing: bool = True):
        """Генерирует все тестовые данные"""
        try:
            print("🚀 Начинаем генерацию расширенных тестовых данных...")
            
            if clear_existing:
                self.clear_existing_data()
            
            print("\n1. Создание клиентов различных типов...")
            customers = self.create_advanced_customers()
            
            print("\n2. Создание специализированных водителей...")
            drivers = self.create_specialized_drivers()
            
            print("\n3. Создание разнообразного парка транспорта...")
            vehicles = self.create_diverse_vehicles(drivers)
            
            print("\n4. Создание заказов на основе сценариев...")
            orders = self.create_scenario_based_orders(customers)
            
            print("\n5. Сохранение конфигурации сценариев...")
            self.save_scenarios_config()
            
            print(f"\n✅ Генерация завершена успешно!")
            print(f"📊 Статистика:")
            print(f"   - Клиентов: {len(customers)}")
            print(f"   - Водителей: {len(drivers)}")
            print(f"   - Транспортных средств: {len(vehicles)}")
            print(f"   - Заказов: {len(orders)}")
            print(f"   - Сценариев доставки: {len(DELIVERY_SCENARIOS)}")
            
            # Статистика по сложности
            complexity_stats = {}
            for order in orders:
                complexity = order.complexity_level
                complexity_stats[complexity] = complexity_stats.get(complexity, 0) + 1
            
            print(f"\n📈 Распределение по сложности:")
            for complexity, count in complexity_stats.items():
                percentage = (count / len(orders)) * 100
                print(f"   - {complexity}: {count} ({percentage:.1f}%)")
                
        except Exception as e:
            print(f"❌ Ошибка при генерации данных: {e}")
            self.session.rollback()
            raise
        finally:
            self.session.close()

def main():
    """Основная функция"""
    # Конфигурация для генерации
    config = TestConfiguration(
        customers_count=100,
        drivers_count=25,
        vehicles_count=20,
        orders_count=500,
        time_range_days=60,
        include_rush_hours=True,
        include_weekend_delivery=True,
        include_night_delivery=True
    )
    
    generator = AdvancedTestDataGenerator(config)
    generator.generate_all_data()

if __name__ == "__main__":
    main()