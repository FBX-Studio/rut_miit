#!/usr/bin/env python3
"""
Тестирование get_driver_profile после исправления ошибок
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.services.driver_management import DriverManagementService

def test_get_driver_profile():
    """Тестирует метод get_driver_profile"""
    db = SessionLocal()
    
    try:
        service = DriverManagementService(db)
        
        # Получаем список всех водителей
        from app.models.driver import Driver
        drivers = db.query(Driver).all()
        print(f"Найдено водителей в базе: {len(drivers)}")
        
        if not drivers:
            print("В базе данных нет водителей для тестирования")
            return
        
        # Тестируем первого водителя
        driver = drivers[0]
        print(f"Тестируем водителя: {driver.full_name} (ID: {driver.id})")
        
        # Вызываем get_driver_profile
        profile = service.get_driver_profile(driver.id)
        
        if profile:
            print("✅ get_driver_profile работает успешно!")
            print(f"Профиль водителя:")
            print(f"  - Имя: {profile.name}")
            print(f"  - Телефон: {profile.phone}")
            print(f"  - Номер лицензии: {profile.license_number}")
            print(f"  - Рейтинг: {profile.rating}")
            print(f"  - Статус: {profile.status}")
            print(f"  - Специализация: {profile.specialization}")
            print(f"  - Всего доставок: {profile.total_deliveries}")
            print(f"  - Успешных доставок: {profile.successful_deliveries}")
            print(f"  - Среднее время доставки: {profile.average_delivery_time}")
            print(f"  - Оценка клиентов: {profile.customer_feedback_score}")
            print(f"  - Показатель пунктуальности: {profile.punctuality_score}")
            print(f"  - Показатель безопасности: {profile.safety_score}")
            print(f"  - ID текущего ТС: {profile.current_vehicle_id}")
            print(f"  - Заметки: {profile.notes}")
        else:
            print("❌ get_driver_profile вернул None")
            
    except Exception as e:
        print(f"❌ Ошибка при тестировании get_driver_profile: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_get_driver_profile()