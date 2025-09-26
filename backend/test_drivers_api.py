#!/usr/bin/env python3
"""
Тестирование API эндпоинта для получения списка водителей
"""

import requests
import json

def test_drivers_api():
    """Тестирует API эндпоинт /api/v1/drivers/"""
    base_url = "http://localhost:8000"
    
    try:
        print("Тестируем API эндпоинт /api/v1/drivers/")
        
        # Тестируем получение списка водителей
        response = requests.get(f"{base_url}/api/v1/drivers/")
        
        print(f"Статус код: {response.status_code}")
        print(f"Заголовки ответа: {dict(response.headers)}")
        
        if response.status_code == 200:
            drivers = response.json()
            print(f"✅ API работает успешно!")
            print(f"Получено водителей: {len(drivers)}")
            
            if drivers:
                print("\nПример данных первого водителя:")
                first_driver = drivers[0]
                for key, value in first_driver.items():
                    print(f"  {key}: {value}")
            else:
                print("Список водителей пуст")
                
        else:
            print(f"❌ API вернул ошибку: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Детали ошибки: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                print(f"Текст ошибки: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Не удается подключиться к серверу. Убедитесь, что сервер запущен на localhost:8000")
    except Exception as e:
        print(f"❌ Ошибка при тестировании API: {e}")

def test_specific_driver_api():
    """Тестирует API эндпоинт для получения конкретного водителя"""
    base_url = "http://localhost:8000"
    
    try:
        print("\nТестируем API эндпоинт /api/v1/drivers/{driver_id}")
        
        # Сначала получаем список водителей, чтобы взять ID
        response = requests.get(f"{base_url}/api/v1/drivers/")
        if response.status_code == 200:
            drivers = response.json()
            if drivers:
                driver_id = drivers[0]['id']
                print(f"Тестируем водителя с ID: {driver_id}")
                
                # Получаем конкретного водителя
                response = requests.get(f"{base_url}/api/v1/drivers/{driver_id}")
                
                print(f"Статус код: {response.status_code}")
                
                if response.status_code == 200:
                    driver = response.json()
                    print(f"✅ API для конкретного водителя работает успешно!")
                    print(f"Данные водителя:")
                    for key, value in driver.items():
                        print(f"  {key}: {value}")
                else:
                    print(f"❌ API вернул ошибку: {response.status_code}")
                    try:
                        error_data = response.json()
                        print(f"Детали ошибки: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
                    except:
                        print(f"Текст ошибки: {response.text}")
            else:
                print("Нет водителей для тестирования")
        else:
            print("Не удалось получить список водителей для тестирования")
            
    except requests.exceptions.ConnectionError:
        print("❌ Не удается подключиться к серверу")
    except Exception as e:
        print(f"❌ Ошибка при тестировании API: {e}")

if __name__ == "__main__":
    test_drivers_api()
    test_specific_driver_api()