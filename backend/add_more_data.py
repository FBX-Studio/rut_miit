#!/usr/bin/env python3
"""
Скрипт для добавления дополнительных заказов и транспортных средств в систему VRPTW
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import random
from app.core.config import settings
from app.models.order import Order, OrderStatus, OrderPriority
from app.models.vehicle import Vehicle, VehicleType, VehicleStatus
from app.models.customer import Customer
from app.models.driver import Driver

def create_session():
    engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

def add_customers(db, count=5):
    """Добавляем новых клиентов"""
    customers = []
    customer_data = [
        {"name": "ООО Логистик Плюс", "phone": "+7-495-123-4567", "email": "info@logistic-plus.ru", 
         "address": "ул. Тверская, 15", "city": "Москва", "postal_code": "125009",
         "latitude": 55.7558, "longitude": 37.6176},
        {"name": "ИП Петров А.В.", "phone": "+7-812-987-6543", "email": "petrov@mail.ru",
         "address": "Невский пр., 28", "city": "Санкт-Петербург", "postal_code": "191025",
         "latitude": 59.9311, "longitude": 30.3609},
        {"name": "Торговый дом Сибирь", "phone": "+7-383-555-0123", "email": "td.sibir@yandex.ru",
         "address": "ул. Ленина, 45", "city": "Новосибирск", "postal_code": "630007",
         "latitude": 55.0084, "longitude": 82.9357},
        {"name": "Компания Восток", "phone": "+7-423-777-8899", "email": "vostok@company.ru",
         "address": "ул. Светланская, 67", "city": "Владивосток", "postal_code": "690091",
         "latitude": 43.1056, "longitude": 131.8735},
        {"name": "Южный Экспресс", "phone": "+7-861-444-5566", "email": "south@express.ru",
         "address": "ул. Красная, 122", "city": "Краснодар", "postal_code": "350000",
         "latitude": 45.0355, "longitude": 38.9753}
    ]
    
    for data in customer_data[:count]:
        customer = Customer(**data)
        db.add(customer)
        customers.append(customer)
    
    db.commit()
    print(f"Добавлено {len(customers)} новых клиентов")
    return customers

def add_vehicles(db, count=5):
    """Добавляем новые транспортные средства"""
    vehicles = []
    vehicle_data = [
        {"license_plate": "А123БВ77", "model": "Газель Next", "brand": "ГАЗ", "year": 2023,
         "vehicle_type": VehicleType.VAN, "max_weight_capacity": 1500.0, "max_volume_capacity": 9.0,
         "fuel_consumption": 12.5, "depot_latitude": 55.7558, "depot_longitude": 37.6176},
        {"license_plate": "В456ГД78", "model": "Sprinter", "brand": "Mercedes", "year": 2022,
         "vehicle_type": VehicleType.VAN, "max_weight_capacity": 2000.0, "max_volume_capacity": 12.0,
         "fuel_consumption": 10.8, "depot_latitude": 55.7558, "depot_longitude": 37.6176},
        {"license_plate": "Е789ЖЗ99", "model": "Atego", "brand": "Mercedes", "year": 2021,
         "vehicle_type": VehicleType.TRUCK, "max_weight_capacity": 7500.0, "max_volume_capacity": 35.0,
         "fuel_consumption": 18.2, "depot_latitude": 55.7558, "depot_longitude": 37.6176},
        {"license_plate": "К012ЛМ50", "model": "Валдай", "brand": "ГАЗ", "year": 2020,
         "vehicle_type": VehicleType.TRUCK, "max_weight_capacity": 4000.0, "max_volume_capacity": 20.0,
         "fuel_consumption": 15.5, "depot_latitude": 55.7558, "depot_longitude": 37.6176},
        {"license_plate": "Н345ОП61", "model": "Transit", "brand": "Ford", "year": 2023,
         "vehicle_type": VehicleType.VAN, "max_weight_capacity": 1800.0, "max_volume_capacity": 10.5,
         "fuel_consumption": 11.2, "depot_latitude": 55.7558, "depot_longitude": 37.6176}
    ]
    
    for data in vehicle_data[:count]:
        data["status"] = VehicleStatus.AVAILABLE
        data["has_gps"] = True
        data["has_temperature_control"] = random.choice([True, False])
        data["has_lift_gate"] = random.choice([True, False])
        data["max_working_hours"] = 8
        data["requires_break_every"] = 4
        data["break_duration"] = 30
        
        vehicle = Vehicle(**data)
        db.add(vehicle)
        vehicles.append(vehicle)
    
    db.commit()
    print(f"Добавлено {len(vehicles)} новых транспортных средств")
    return vehicles

def add_orders(db, customers, count=10):
    """Добавляем новые заказы"""
    orders = []
    
    # Координаты различных районов Москвы для разнообразия
    moscow_locations = [
        (55.7558, 37.6176, "Центр"),
        (55.8431, 37.6156, "Северный округ"),
        (55.6761, 37.5775, "Юго-Западный округ"),
        (55.7887, 37.7473, "Восточный округ"),
        (55.7033, 37.5297, "Западный округ"),
        (55.6220, 37.6068, "Южный округ"),
        (55.8782, 37.6562, "Северо-Восточный округ"),
        (55.6415, 37.7423, "Юго-Восточный округ")
    ]
    
    for i in range(count):
        customer = random.choice(customers)
        location = random.choice(moscow_locations)
        
        # Случайное время доставки в течение следующих 3 дней
        base_date = datetime.now() + timedelta(days=random.randint(0, 3))
        start_hour = random.randint(8, 16)
        
        order_data = {
            "order_number": f"ORD-{datetime.now().strftime('%Y%m%d')}-{i+2:03d}",
            "customer_id": customer.id,
            "delivery_address": f"{location[2]}, дом {random.randint(1, 100)}",
            "delivery_latitude": location[0] + random.uniform(-0.05, 0.05),
            "delivery_longitude": location[1] + random.uniform(-0.05, 0.05),
            "time_window_start": base_date.replace(hour=start_hour, minute=0, second=0),
            "time_window_end": base_date.replace(hour=start_hour + 4, minute=0, second=0),
            "estimated_service_time": random.randint(10, 45),
            "weight": round(random.uniform(10, 500), 2),
            "volume": round(random.uniform(0.1, 5.0), 2),
            "value": round(random.uniform(1000, 50000), 2),
            "status": OrderStatus.PENDING,
            "priority": random.choice(list(OrderPriority))
        }
        
        order = Order(**order_data)
        db.add(order)
        orders.append(order)
    
    db.commit()
    print(f"Добавлено {len(orders)} новых заказов")
    return orders

def main():
    """Основная функция"""
    print("🚀 Добавление дополнительных данных в систему VRPTW...")
    
    db = create_session()
    
    try:
        # Проверяем текущее состояние
        existing_customers = db.query(Customer).count()
        existing_vehicles = db.query(Vehicle).count()
        existing_orders = db.query(Order).count()
        
        print(f"📊 Текущее состояние:")
        print(f"   - Клиенты: {existing_customers}")
        print(f"   - Транспорт: {existing_vehicles}")
        print(f"   - Заказы: {existing_orders}")
        print()
        
        # Добавляем новых клиентов
        print("👥 Добавление новых клиентов...")
        customers = add_customers(db, 5)
        
        # Добавляем новый транспорт
        print("🚛 Добавление новых транспортных средств...")
        vehicles = add_vehicles(db, 5)
        
        # Добавляем новые заказы
        print("📦 Добавление новых заказов...")
        all_customers = db.query(Customer).all()
        orders = add_orders(db, all_customers, 15)
        
        # Финальная статистика
        final_customers = db.query(Customer).count()
        final_vehicles = db.query(Vehicle).count()
        final_orders = db.query(Order).count()
        
        print()
        print("✅ Данные успешно добавлены!")
        print(f"📊 Итоговое состояние:")
        print(f"   - Клиенты: {final_customers} (+{final_customers - existing_customers})")
        print(f"   - Транспорт: {final_vehicles} (+{final_vehicles - existing_vehicles})")
        print(f"   - Заказы: {final_orders} (+{final_orders - existing_orders})")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()