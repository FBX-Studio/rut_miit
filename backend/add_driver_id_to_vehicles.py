#!/usr/bin/env python3
"""
Скрипт для добавления колонки driver_id в таблицу vehicles
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

def add_driver_id_column():
    """Добавляет колонку driver_id в таблицу vehicles"""
    engine = create_engine(settings.database_url)
    
    try:
        with engine.begin() as connection:
            # Проверяем, существует ли уже колонка
            result = connection.execute(text("PRAGMA table_info(vehicles)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'driver_id' not in columns:
                print("Добавляем колонку driver_id в таблицу vehicles...")
                connection.execute(text("ALTER TABLE vehicles ADD COLUMN driver_id INTEGER"))
                print("Колонка driver_id успешно добавлена!")
            else:
                print("Колонка driver_id уже существует в таблице vehicles")
                
        # Проверяем результат в отдельной транзакции
        with engine.connect() as connection:
            result = connection.execute(text("PRAGMA table_info(vehicles)"))
            columns = [row[1] for row in result.fetchall()]
            print(f"Колонки в таблице vehicles: {columns}")
            
    except Exception as e:
        print(f"Ошибка при добавлении колонки: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = add_driver_id_column()
    if success:
        print("Операция завершена успешно")
    else:
        print("Операция завершена с ошибками")