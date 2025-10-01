import random
from datetime import datetime, timedelta
from typing import List, Tuple
from faker import Faker

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Customer, Vehicle, Driver, Order
from app.models.order import OrderStatus, OrderPriority
from app.models.vehicle import VehicleStatus, VehicleType
from app.models.driver import DriverStatus, ExperienceLevel

fake = Faker('ru_RU')

MOSCOW_BOUNDS = {
    'lat_min': 55.5,
    'lat_max': 56.0,
    'lon_min': 37.3,
    'lon_max': 37.9
}

VEHICLE_TYPES = [
    {'type': VehicleType.VAN, 'capacity': 1500, 'volume': 9.0},
    {'type': VehicleType.TRUCK, 'capacity': 5000, 'volume': 20.0},
    {'type': VehicleType.TRUCK, 'capacity': 20000, 'volume': 82.0},
    {'type': VehicleType.VAN, 'capacity': 2000, 'volume': 12.0},
]

PRODUCT_CATEGORIES = [
    'Продукты питания',
    'Бытовая техника',
    'Мебель',
    'Строительные материалы',
    'Одежда и обувь',
    'Электроника',
    'Книги и канцтовары',
    'Спортивные товары'
]

def generate_moscow_coordinates() -> Tuple[float, float]:
    lat = random.uniform(MOSCOW_BOUNDS['lat_min'], MOSCOW_BOUNDS['lat_max'])
    lon = random.uniform(MOSCOW_BOUNDS['lon_min'], MOSCOW_BOUNDS['lon_max'])
    return lat, lon

def generate_phone_number() -> str:
    return f"+7{random.randint(900, 999)}{random.randint(1000000, 9999999)}"

def create_customers(session: Session, count: int = 50) -> List[Customer]:
    customers = []
    
    for i in range(count):
        lat, lon = generate_moscow_coordinates()
        
        customer = Customer(
            name=fake.company(),
            email=fake.email(),
            phone=generate_phone_number(),
            address=fake.address(),
            latitude=lat,
            longitude=lon,
            city="Москва",
            postal_code=fake.postcode(),
            business_type=random.choice(['retail', 'wholesale', 'manufacturing', 'services']),
            preferred_delivery_start="09:00",
            preferred_delivery_end="18:00",
            is_active=True
        )
        
        session.add(customer)
        customers.append(customer)
    
    session.commit()
    print(f"Создано {count} клиентов")
    return customers

def create_drivers(session: Session, count: int = 15) -> List[Driver]:
    drivers = []
    
    for i in range(count):
        driver = Driver(
            employee_id=f"DRV{i+1:03d}",
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            phone=generate_phone_number(),
            email=fake.email(),
            license_number=f"77{random.randint(10, 99)}{random.randint(100000, 999999)}",
            license_categories="B,C,D,E",
            years_of_experience=random.uniform(0.5, 25.0),
            experience_level=random.choice(list(ExperienceLevel)),
            status=random.choice([DriverStatus.AVAILABLE, DriverStatus.OFF_DUTY]),
            max_working_hours=random.choice([8, 10, 12]),
            shift_start_time="08:00",
            shift_end_time="18:00"
        )
        
        session.add(driver)
        drivers.append(driver)
    
    session.commit()
    print(f"Создано {count} водителей")
    return drivers

def create_vehicles(session: Session, drivers: List[Driver], count: int = 10) -> List[Vehicle]:
    vehicles = []
    
    for i in range(count):
        vehicle_type_info = random.choice(VEHICLE_TYPES)
        lat, lon = generate_moscow_coordinates()
        
        vehicle = Vehicle(
            license_plate=f"{random.choice(['А', 'В', 'Е', 'К', 'М', 'Н', 'О', 'Р', 'С', 'Т', 'У', 'Х'])}"
                          f"{random.randint(100, 999)}"
                          f"{random.choice(['А', 'В', 'Е', 'К', 'М', 'Н', 'О', 'Р', 'С', 'Т', 'У', 'Х'])}"
                          f"{random.choice(['А', 'В', 'Е', 'К', 'М', 'Н', 'О', 'Р', 'С', 'Т', 'У', 'Х'])}"
                          f"{random.choice([77, 97, 99, 177, 197, 199, 777])}",
            model=fake.word().capitalize(),
            brand=random.choice(['ГАЗ', 'КАМАЗ', 'Mercedes', 'Iveco', 'Volvo']),
            year=random.randint(2015, 2024),
            vehicle_type=vehicle_type_info['type'],
            max_weight_capacity=vehicle_type_info['capacity'],
            max_volume_capacity=vehicle_type_info['volume'],
            fuel_consumption=random.uniform(8.0, 25.0),
            status=random.choice([VehicleStatus.AVAILABLE, VehicleStatus.IN_USE]),
            current_latitude=lat,
            current_longitude=lon,
            depot_latitude=55.7558,
            depot_longitude=37.6176,
            has_gps=True,
            has_temperature_control=random.choice([True, False]),
            has_lift_gate=random.choice([True, False])
        )
        
        session.add(vehicle)
        vehicles.append(vehicle)
    
    session.commit()
    print(f"Создано {count} транспортных средств")
    return vehicles

def create_orders(session: Session, customers: List[Customer], count: int = 200) -> List[Order]:
    orders = []
    
    for i in range(count):
        customer = random.choice(customers)
        delivery_lat, delivery_lon = generate_moscow_coordinates()
        
        order_date = fake.date_between(start_date='-7d', end_date='+14d')
        start_hour = random.randint(8, 18)
        start_minute = random.choice([0, 15, 30, 45])
        
        time_start = datetime.combine(
            order_date, 
            datetime.min.time().replace(hour=start_hour, minute=start_minute)
        )
        time_end = time_start + timedelta(hours=random.randint(1, 4))
        
        order = Order(
            order_number=f"ORD{i+1:06d}",
            customer_id=customer.id,
            delivery_address=fake.address(),
            delivery_latitude=delivery_lat,
            delivery_longitude=delivery_lon,
            time_window_start=time_start,
            time_window_end=time_end,
            estimated_service_time=random.randint(15, 60),
            weight=random.uniform(10, 1000),
            volume=random.uniform(0.1, 5.0),
            value=random.uniform(500, 50000),
            priority=random.choice(list(OrderPriority)),
            status=random.choice([
                OrderStatus.PENDING,
                OrderStatus.ASSIGNED,
                OrderStatus.IN_TRANSIT,
                OrderStatus.DELIVERED
            ]),
            requires_signature=random.choice([True, False]),
            fragile=random.choice([True, False]),
            temperature_controlled=random.choice([True, False]),
            special_instructions=random.choice([
                None, 
                "Хрупкий груз", 
                "Требует охлаждения", 
                "Негабаритный груз",
                "Ценный груз"
            ]) if random.random() < 0.3 else None
        )
        
        session.add(order)
        orders.append(order)
    
    session.commit()
    print(f"Создано {count} заказов")
    return orders

def clear_existing_data(session: Session):
    print("🧹 Очистка существующих данных...")
    
    session.query(Order).delete()
    session.query(Vehicle).delete()
    session.query(Driver).delete()
    session.query(Customer).delete()
    
    session.commit()
    print("✅ Существующие данные очищены")

def main():
    print("🚀 Начинаем генерацию тестовых данных...")
    
    session = SessionLocal()
    try:
        # Проверяем и очищаем существующие данные
        existing_customers = session.query(Customer).count()
        existing_drivers = session.query(Driver).count()
        existing_vehicles = session.query(Vehicle).count()
        existing_orders = session.query(Order).count()
        
        if any([existing_customers, existing_drivers, existing_vehicles, existing_orders]):
            print(f"⚠️  Найдены существующие данные: {existing_customers} клиентов, {existing_drivers} водителей, {existing_vehicles} ТС, {existing_orders} заказов")
            clear_existing_data(session)
        
        print("\n1. Создание клиентов...")
        customers = create_customers(session, 50)
        
        print("\n2. Создание водителей...")
        drivers = create_drivers(session, 15)
        
        print("\n3. Создание транспортных средств...")
        vehicles = create_vehicles(session, drivers, 10)
        
        print("\n4. Создание заказов...")
        orders = create_orders(session, customers, 200)
        
        print(f"\n✅ Генерация завершена успешно!")
        print(f"📊 Статистика:")
        print(f"   - Клиентов: {len(customers)}")
        print(f"   - Водителей: {len(drivers)}")
        print(f"   - Транспортных средств: {len(vehicles)}")
        print(f"   - Заказов: {len(orders)}")
        
    except Exception as e:
        print(f"❌ Ошибка при генерации данных: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    main()