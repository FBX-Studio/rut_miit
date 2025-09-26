#!/usr/bin/env python3
"""
Скрипт для проверки данных в базе данных VRPTW
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models import Order, Vehicle, Driver, Customer

def check_database_data():
    """Проверяет наличие данных в основных таблицах"""
    
    # Подключение к базе данных
    database_url = settings.database_url
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    with SessionLocal() as db:
        print("=== Проверка данных в базе данных ===\n")
        
        # Проверяем заказы
        orders_count = db.query(Order).count()
        print(f"📦 Заказы: {orders_count}")
        if orders_count > 0:
            pending_orders = db.query(Order).filter(Order.status == 'PENDING').count()
            print(f"   - В ожидании: {pending_orders}")
            
            # Показываем несколько примеров
            sample_orders = db.query(Order).limit(3).all()
            for order in sample_orders:
                print(f"   - ID: {order.id}, Статус: {order.status}, Адрес: {order.delivery_address}")
        
        print()
        
        # Проверяем транспорт
        vehicles_count = db.query(Vehicle).count()
        print(f"🚛 Транспорт: {vehicles_count}")
        if vehicles_count > 0:
            available_vehicles = db.query(Vehicle).filter(Vehicle.status == 'AVAILABLE').count()
            print(f"   - Доступно: {available_vehicles}")
            
            # Показываем несколько примеров
            sample_vehicles = db.query(Vehicle).limit(3).all()
            for vehicle in sample_vehicles:
                print(f"   - ID: {vehicle.id}, Тип: {vehicle.vehicle_type}, Статус: {vehicle.status}")
        
        print()
        
        # Проверяем водителей
        drivers_count = db.query(Driver).count()
        print(f"👨‍💼 Водители: {drivers_count}")
        if drivers_count > 0:
            available_drivers = db.query(Driver).filter(Driver.status == 'AVAILABLE').count()
            print(f"   - Доступно: {available_drivers}")
            
            # Показываем несколько примеров
            sample_drivers = db.query(Driver).limit(3).all()
            for driver in sample_drivers:
                full_name = f"{driver.first_name} {driver.last_name}"
                print(f"   - ID: {driver.id}, Имя: {full_name}, Статус: {driver.status}")
        
        print()
        
        # Проверяем клиентов
        customers_count = db.query(Customer).count()
        print(f"👥 Клиенты: {customers_count}")
        if customers_count > 0:
            # Показываем несколько примеров
            sample_customers = db.query(Customer).limit(3).all()
            for customer in sample_customers:
                print(f"   - ID: {customer.id}, Имя: {customer.name}, Город: {customer.city}")
        
        print()
        
        # Проверяем связи
        print("🔗 Проверка связей:")
        orders_with_customers = db.query(Order).filter(Order.customer_id.isnot(None)).count()
        print(f"   - Заказы с клиентами: {orders_with_customers}/{orders_count}")
        
        vehicles_with_drivers = db.query(Vehicle).filter(Vehicle.driver_id.isnot(None)).count()
        print(f"   - Транспорт с водителями: {vehicles_with_drivers}/{vehicles_count}")
        
        print("\n=== Проверка завершена ===")

if __name__ == "__main__":
    try:
        check_database_data()
    except Exception as e:
        print(f"❌ Ошибка при проверке базы данных: {e}")
        sys.exit(1)