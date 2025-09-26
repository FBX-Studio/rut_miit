#!/usr/bin/env python3
"""
Скрипт для диагностики API эндпоинтов
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models import Order, Vehicle, Driver, Customer
from app.api.schemas import OrderResponse, VehicleResponse, DriverResponse
import traceback

def test_api_data_conversion():
    """Тестирует преобразование данных для API"""
    
    # Подключение к базе данных
    database_url = settings.database_url
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    with SessionLocal() as db:
        print("=== Диагностика API эндпоинтов ===\n")
        
        # Тестируем заказы
        print("📦 Тестируем API для заказов:")
        try:
            orders = db.query(Order).limit(3).all()
            print(f"   Найдено заказов в БД: {len(orders)}")
            
            for order in orders:
                print(f"   Заказ ID {order.id}:")
                print(f"     - Статус: {order.status}")
                print(f"     - Адрес: {order.delivery_address}")
                print(f"     - Клиент ID: {order.customer_id}")
                
                # Пытаемся создать OrderResponse
                try:
                    order_response = OrderResponse.from_orm(order)
                    print(f"     ✅ OrderResponse создан успешно")
                except Exception as e:
                    print(f"     ❌ Ошибка создания OrderResponse: {e}")
                    print(f"     Детали: {traceback.format_exc()}")
                    
        except Exception as e:
            print(f"   ❌ Ошибка при работе с заказами: {e}")
            print(f"   Детали: {traceback.format_exc()}")
        
        print()
        
        # Тестируем транспорт
        print("🚛 Тестируем API для транспорта:")
        try:
            vehicles = db.query(Vehicle).limit(3).all()
            print(f"   Найдено транспорта в БД: {len(vehicles)}")
            
            for vehicle in vehicles:
                print(f"   Транспорт ID {vehicle.id}:")
                print(f"     - Тип: {vehicle.vehicle_type}")
                print(f"     - Статус: {vehicle.status}")
                print(f"     - Номер: {vehicle.license_plate}")
                
                # Пытаемся создать VehicleResponse
                try:
                    vehicle_response = VehicleResponse.from_orm(vehicle)
                    print(f"     ✅ VehicleResponse создан успешно")
                except Exception as e:
                    print(f"     ❌ Ошибка создания VehicleResponse: {e}")
                    print(f"     Детали: {traceback.format_exc()}")
                    
        except Exception as e:
            print(f"   ❌ Ошибка при работе с транспортом: {e}")
            print(f"   Детали: {traceback.format_exc()}")
        
        print()
        
        # Тестируем водителей
        print("👨‍💼 Тестируем API для водителей:")
        try:
            drivers = db.query(Driver).limit(3).all()
            print(f"   Найдено водителей в БД: {len(drivers)}")
            
            for driver in drivers:
                print(f"   Водитель ID {driver.id}:")
                print(f"     - Имя: {driver.first_name} {driver.last_name}")
                print(f"     - Статус: {driver.status}")
                print(f"     - Телефон: {driver.phone}")
                
                # Пытаемся создать DriverResponse
                try:
                    # Создаем объект с нужными полями для DriverResponse
                    driver_data = {
                        'id': driver.id,
                        'employee_id': driver.employee_id,
                        'first_name': driver.first_name,
                        'last_name': driver.last_name,
                        'email': driver.email,
                        'phone': driver.phone,
                        'license_number': driver.license_number,
                        'license_expiry': driver.license_expiry,
                        'experience_level': driver.experience_level.value if driver.experience_level else None,
                        'years_of_experience': driver.years_of_experience,
                        'max_stops_per_route': driver.max_stops_per_route,
                        'max_working_hours': driver.max_working_hours,
                        'shift_start_time': driver.shift_start_time,
                        'shift_end_time': driver.shift_end_time,
                        'status': driver.status.value if driver.status else None,
                        'current_latitude': driver.current_latitude,
                        'current_longitude': driver.current_longitude,
                        'average_delivery_time': driver.average_delivery_time
                    }
                    
                    driver_response = DriverResponse(**driver_data)
                    print(f"     ✅ DriverResponse создан успешно")
                except Exception as e:
                    print(f"     ❌ Ошибка создания DriverResponse: {e}")
                    print(f"     Детали: {traceback.format_exc()}")
                    
        except Exception as e:
            print(f"   ❌ Ошибка при работе с водителями: {e}")
            print(f"   Детали: {traceback.format_exc()}")
        
        print("\n=== Диагностика завершена ===")

if __name__ == "__main__":
    try:
        test_api_data_conversion()
    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        print(f"Детали: {traceback.format_exc()}")
        sys.exit(1)