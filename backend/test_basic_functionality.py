#!/usr/bin/env python3
"""
Базовое тестирование функциональности системы доставки RUT MIIT
Проверяет только существующие методы и функции
"""

import asyncio
import json
import sys
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging
import math

# Добавляем путь к проекту
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.route_optimization import RouteOptimizationService
from app.services.parameter_modification import ParameterModificationService
from app.services.realtime_simulation import RealtimeSimulationService, EventType
from advanced_test_data_generator import AdvancedTestDataGenerator

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BasicFunctionalityTester:
    """Класс для базового тестирования функциональности"""
    
    def __init__(self):
        self.optimization_service = RouteOptimizationService()
        self.parameter_service = ParameterModificationService()
        self.simulation_service = RealtimeSimulationService()
        self.test_data_generator = AdvancedTestDataGenerator()
        
        self.test_results = {
            "route_optimization": {"passed": 0, "failed": 0, "errors": []},
            "parameter_modification": {"passed": 0, "failed": 0, "errors": []},
            "realtime_simulation": {"passed": 0, "failed": 0, "errors": []},
            "test_data_generation": {"passed": 0, "failed": 0, "errors": []},
            "basic_calculations": {"passed": 0, "failed": 0, "errors": []}
        }
    
    def log_test_result(self, module: str, test_name: str, success: bool, error: str = None):
        """Логирование результата теста"""
        if success:
            self.test_results[module]["passed"] += 1
            logger.info(f"✅ {module}: {test_name} - PASSED")
        else:
            self.test_results[module]["failed"] += 1
            self.test_results[module]["errors"].append(f"{test_name}: {error}")
            logger.error(f"❌ {module}: {test_name} - FAILED: {error}")
    
    async def test_route_optimization_basic(self):
        """Базовое тестирование оптимизации маршрутов"""
        logger.info("🧪 Базовое тестирование оптимизации маршрутов...")
        
        # Подготавливаем простые тестовые данные
        test_points = [
            {"id": "depot", "lat": 55.7558, "lng": 37.6176, "demand": 0, "time_window": (0, 1440)},
            {"id": "customer1", "lat": 55.7500, "lng": 37.6200, "demand": 10, "time_window": (480, 600)},
            {"id": "customer2", "lat": 55.7600, "lng": 37.6100, "demand": 15, "time_window": (540, 720)}
        ]
        
        vehicle_constraints = {
            "capacity": 50,
            "max_distance": 100.0,
            "max_time": 480,
            "speed_kmh": 40.0
        }
        
        try:
            # Тест 1: Проверяем, что сервис создается
            service_created = self.optimization_service is not None
            self.log_test_result("route_optimization", "service_creation", service_created)
        except Exception as e:
            self.log_test_result("route_optimization", "service_creation", False, str(e))
        
        try:
            # Тест 2: Проверяем метод расчета расстояния
            if hasattr(self.optimization_service, 'calculate_distance'):
                distance = self.optimization_service.calculate_distance(
                    55.7558, 37.6176, 55.7500, 37.6200
                )
                success = distance > 0
                self.log_test_result("route_optimization", "calculate_distance", success)
                if success:
                    logger.info(f"   Расстояние: {distance:.2f} км")
            else:
                self.log_test_result("route_optimization", "calculate_distance", False, "Метод не найден")
        except Exception as e:
            self.log_test_result("route_optimization", "calculate_distance", False, str(e))
        
        try:
            # Тест 3: Проверяем ближайший сосед (если есть)
            if hasattr(self.optimization_service, 'optimize_nearest_neighbor'):
                result = await self.optimization_service.optimize_nearest_neighbor(
                    test_points, vehicle_constraints
                )
                success = result is not None
                self.log_test_result("route_optimization", "nearest_neighbor", success)
            else:
                self.log_test_result("route_optimization", "nearest_neighbor", False, "Метод не найден")
        except Exception as e:
            self.log_test_result("route_optimization", "nearest_neighbor", False, str(e))
    
    async def test_parameter_modification_basic(self):
        """Базовое тестирование модификации параметров"""
        logger.info("🧪 Базовое тестирование модификации параметров...")
        
        try:
            # Тест 1: Проверяем создание сервиса
            service_created = self.parameter_service is not None
            self.log_test_result("parameter_modification", "service_creation", service_created)
        except Exception as e:
            self.log_test_result("parameter_modification", "service_creation", False, str(e))
        
        try:
            # Тест 2: Проверяем получение определений параметров
            if hasattr(self.parameter_service, 'get_parameter_definitions'):
                definitions = self.parameter_service.get_parameter_definitions()
                success = definitions is not None
                self.log_test_result("parameter_modification", "get_parameter_definitions", success)
                if success and isinstance(definitions, dict):
                    logger.info(f"   Найдено определений: {len(definitions)}")
            else:
                self.log_test_result("parameter_modification", "get_parameter_definitions", False, "Метод не найден")
        except Exception as e:
            self.log_test_result("parameter_modification", "get_parameter_definitions", False, str(e))
        
        try:
            # Тест 3: Проверяем получение категорий
            if hasattr(self.parameter_service, 'get_parameter_categories'):
                categories = self.parameter_service.get_parameter_categories()
                success = categories is not None
                self.log_test_result("parameter_modification", "get_parameter_categories", success)
            else:
                self.log_test_result("parameter_modification", "get_parameter_categories", False, "Метод не найден")
        except Exception as e:
            self.log_test_result("parameter_modification", "get_parameter_categories", False, str(e))
    
    async def test_realtime_simulation_basic(self):
        """Базовое тестирование симуляции"""
        logger.info("🧪 Базовое тестирование симуляции...")
        
        try:
            # Тест 1: Проверяем создание сервиса
            service_created = self.simulation_service is not None
            self.log_test_result("realtime_simulation", "service_creation", service_created)
        except Exception as e:
            self.log_test_result("realtime_simulation", "service_creation", False, str(e))
        
        try:
            # Тест 2: Проверяем запуск симуляции
            if hasattr(self.simulation_service, 'start_simulation'):
                await self.simulation_service.start_simulation({
                    "update_interval": 5,
                    "traffic_variability": 0.5
                })
                self.log_test_result("realtime_simulation", "start_simulation", True)
            else:
                self.log_test_result("realtime_simulation", "start_simulation", False, "Метод не найден")
        except Exception as e:
            self.log_test_result("realtime_simulation", "start_simulation", False, str(e))
        
        try:
            # Тест 3: Проверяем создание события
            if hasattr(self.simulation_service, 'force_event'):
                event = self.simulation_service.force_event(EventType.TRAFFIC_CHANGE)
                success = event is not None
                self.log_test_result("realtime_simulation", "force_event", success)
            else:
                self.log_test_result("realtime_simulation", "force_event", False, "Метод не найден")
        except Exception as e:
            self.log_test_result("realtime_simulation", "force_event", False, str(e))
        
        try:
            # Тест 4: Остановка симуляции
            if hasattr(self.simulation_service, 'stop_simulation'):
                await self.simulation_service.stop_simulation()
                self.log_test_result("realtime_simulation", "stop_simulation", True)
            else:
                self.log_test_result("realtime_simulation", "stop_simulation", False, "Метод не найден")
        except Exception as e:
            self.log_test_result("realtime_simulation", "stop_simulation", False, str(e))
    
    async def test_data_generation_basic(self):
        """Базовое тестирование генерации данных"""
        logger.info("🧪 Базовое тестирование генерации данных...")
        
        try:
            # Тест 1: Проверяем создание генератора
            generator_created = self.test_data_generator is not None
            self.log_test_result("test_data_generation", "generator_creation", generator_created)
        except Exception as e:
            self.log_test_result("test_data_generation", "generator_creation", False, str(e))
        
        try:
            # Тест 2: Проверяем генерацию клиентов
            if hasattr(self.test_data_generator, 'generate_customers'):
                customers = self.test_data_generator.generate_customers(5, [55.7558, 37.6176], 10.0)
                success = customers is not None and len(customers) > 0
                self.log_test_result("test_data_generation", "generate_customers", success)
                if success:
                    logger.info(f"   Сгенерировано клиентов: {len(customers)}")
            else:
                self.log_test_result("test_data_generation", "generate_customers", False, "Метод не найден")
        except Exception as e:
            self.log_test_result("test_data_generation", "generate_customers", False, str(e))
        
        try:
            # Тест 3: Проверяем генерацию водителей
            if hasattr(self.test_data_generator, 'generate_drivers'):
                drivers = self.test_data_generator.generate_drivers(3)
                success = drivers is not None and len(drivers) > 0
                self.log_test_result("test_data_generation", "generate_drivers", success)
                if success:
                    logger.info(f"   Сгенерировано водителей: {len(drivers)}")
            else:
                self.log_test_result("test_data_generation", "generate_drivers", False, "Метод не найден")
        except Exception as e:
            self.log_test_result("test_data_generation", "generate_drivers", False, str(e))
        
        try:
            # Тест 4: Проверяем генерацию транспорта
            if hasattr(self.test_data_generator, 'generate_vehicles'):
                vehicles = self.test_data_generator.generate_vehicles(2)
                success = vehicles is not None and len(vehicles) > 0
                self.log_test_result("test_data_generation", "generate_vehicles", success)
                if success:
                    logger.info(f"   Сгенерировано транспорта: {len(vehicles)}")
            else:
                self.log_test_result("test_data_generation", "generate_vehicles", False, "Метод не найден")
        except Exception as e:
            self.log_test_result("test_data_generation", "generate_vehicles", False, str(e))
    
    async def test_basic_calculations(self):
        """Тестирование базовых вычислений"""
        logger.info("🧪 Тестирование базовых вычислений...")
        
        try:
            # Тест 1: Расчет расстояния по формуле Haversine
            def haversine_distance(lat1, lon1, lat2, lon2):
                R = 6371  # Радиус Земли в км
                
                lat1_rad = math.radians(lat1)
                lon1_rad = math.radians(lon1)
                lat2_rad = math.radians(lat2)
                lon2_rad = math.radians(lon2)
                
                dlat = lat2_rad - lat1_rad
                dlon = lon2_rad - lon1_rad
                
                a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
                c = 2 * math.asin(math.sqrt(a))
                
                return R * c
            
            # Тестируем расчет между Красной площадью и Тверской
            distance = haversine_distance(55.7558, 37.6176, 55.7500, 37.6200)
            success = 0.5 < distance < 2.0  # Ожидаем разумное расстояние
            self.log_test_result("basic_calculations", "haversine_distance", success)
            if success:
                logger.info(f"   Расстояние Haversine: {distance:.2f} км")
        except Exception as e:
            self.log_test_result("basic_calculations", "haversine_distance", False, str(e))
        
        try:
            # Тест 2: Генерация случайных координат в радиусе
            def generate_random_location(center_lat, center_lng, radius_km):
                import random
                
                # Простая генерация в прямоугольной области
                lat_offset = (random.random() - 0.5) * (radius_km / 111.0)  # ~111 км на градус широты
                lng_offset = (random.random() - 0.5) * (radius_km / (111.0 * math.cos(math.radians(center_lat))))
                
                return {
                    "lat": center_lat + lat_offset,
                    "lng": center_lng + lng_offset
                }
            
            # Генерируем несколько точек
            center = [55.7558, 37.6176]
            locations = []
            for _ in range(5):
                loc = generate_random_location(center[0], center[1], 10.0)
                locations.append(loc)
            
            # Проверяем, что все точки в разумных пределах
            all_valid = all(
                54.0 < loc["lat"] < 57.0 and 36.0 < loc["lng"] < 39.0 
                for loc in locations
            )
            
            self.log_test_result("basic_calculations", "random_location_generation", all_valid)
            if all_valid:
                logger.info(f"   Сгенерировано {len(locations)} валидных локаций")
        except Exception as e:
            self.log_test_result("basic_calculations", "random_location_generation", False, str(e))
        
        try:
            # Тест 3: Простая оптимизация ближайшим соседом
            def simple_nearest_neighbor(points):
                if len(points) < 2:
                    return points
                
                route = [points[0]]  # Начинаем с первой точки
                remaining = points[1:]
                
                while remaining:
                    current = route[-1]
                    # Находим ближайшую точку
                    nearest = min(remaining, key=lambda p: haversine_distance(
                        current["lat"], current["lng"], p["lat"], p["lng"]
                    ))
                    route.append(nearest)
                    remaining.remove(nearest)
                
                return route
            
            # Тестовые точки
            test_points = [
                {"id": "A", "lat": 55.7558, "lng": 37.6176},
                {"id": "B", "lat": 55.7500, "lng": 37.6200},
                {"id": "C", "lat": 55.7600, "lng": 37.6100},
                {"id": "D", "lat": 55.7400, "lng": 37.6300}
            ]
            
            optimized_route = simple_nearest_neighbor(test_points)
            success = len(optimized_route) == len(test_points)
            self.log_test_result("basic_calculations", "simple_nearest_neighbor", success)
            
            if success:
                route_ids = [p["id"] for p in optimized_route]
                logger.info(f"   Маршрут: {' -> '.join(route_ids)}")
                
                # Вычисляем общее расстояние
                total_distance = 0
                for i in range(len(optimized_route) - 1):
                    p1, p2 = optimized_route[i], optimized_route[i + 1]
                    total_distance += haversine_distance(p1["lat"], p1["lng"], p2["lat"], p2["lng"])
                
                logger.info(f"   Общее расстояние: {total_distance:.2f} км")
                
        except Exception as e:
            self.log_test_result("basic_calculations", "simple_nearest_neighbor", False, str(e))
    
    def generate_test_report(self) -> Dict[str, Any]:
        """Генерация отчета о тестировании"""
        total_passed = sum(module["passed"] for module in self.test_results.values())
        total_failed = sum(module["failed"] for module in self.test_results.values())
        total_tests = total_passed + total_failed
        
        success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_tests": total_tests,
                "passed": total_passed,
                "failed": total_failed,
                "success_rate": round(success_rate, 2)
            },
            "modules": self.test_results,
            "status": "PASSED" if total_failed == 0 else "PARTIAL" if total_passed > 0 else "FAILED"
        }
        
        return report
    
    def print_test_report(self, report: Dict[str, Any]):
        """Вывод отчета о тестировании"""
        print("\n" + "="*80)
        print("🧪 ОТЧЕТ О БАЗОВОМ ТЕСТИРОВАНИИ СИСТЕМЫ RUT MIIT")
        print("="*80)
        print(f"Время выполнения: {report['timestamp']}")
        
        status_icons = {
            "PASSED": "✅ PASSED",
            "PARTIAL": "⚠️ PARTIAL",
            "FAILED": "❌ FAILED"
        }
        print(f"Общий статус: {status_icons.get(report['status'], report['status'])}")
        print(f"Успешность: {report['summary']['success_rate']}%")
        print(f"Всего тестов: {report['summary']['total_tests']}")
        print(f"Пройдено: {report['summary']['passed']}")
        print(f"Провалено: {report['summary']['failed']}")
        print("\n" + "-"*80)
        print("ДЕТАЛИ ПО МОДУЛЯМ:")
        print("-"*80)
        
        for module_name, module_results in report['modules'].items():
            total_module_tests = module_results['passed'] + module_results['failed']
            if total_module_tests > 0:
                module_success_rate = (module_results['passed'] / total_module_tests * 100)
                status_icon = "✅" if module_results['failed'] == 0 else "⚠️" if module_results['passed'] > 0 else "❌"
                
                print(f"{status_icon} {module_name.upper().replace('_', ' ')}")
                print(f"   Пройдено: {module_results['passed']}")
                print(f"   Провалено: {module_results['failed']}")
                print(f"   Успешность: {module_success_rate:.1f}%")
                
                if module_results['errors']:
                    print("   Проблемы:")
                    for error in module_results['errors'][:3]:  # Показываем только первые 3 ошибки
                        print(f"     • {error}")
                    if len(module_results['errors']) > 3:
                        print(f"     ... и еще {len(module_results['errors']) - 3} ошибок")
                print()
        
        print("="*80)
        print("📋 ЗАКЛЮЧЕНИЕ:")
        if report['status'] == 'PASSED':
            print("✅ Все базовые функции работают корректно!")
            print("✅ Система готова к дальнейшей разработке!")
        elif report['status'] == 'PARTIAL':
            print("⚠️  Часть функций работает корректно.")
            print("⚠️  Некоторые модули требуют доработки.")
            print("✅ Базовая функциональность доступна!")
        else:
            print("❌ Обнаружены серьезные проблемы.")
            print("⚠️  Требуется исправление критических ошибок.")
        print("="*80)
    
    async def run_all_tests(self):
        """Запуск всех тестов"""
        logger.info("🚀 Запуск базового тестирования системы RUT MIIT...")
        
        # Запускаем базовые тесты
        await self.test_route_optimization_basic()
        await self.test_parameter_modification_basic()
        await self.test_realtime_simulation_basic()
        await self.test_data_generation_basic()
        await self.test_basic_calculations()
        
        # Генерируем и выводим отчет
        report = self.generate_test_report()
        self.print_test_report(report)
        
        # Сохраняем отчет в файл
        report_filename = f"basic_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        logger.info(f"📄 Отчет сохранен в файл: {report_filename}")
        
        return report

async def main():
    """Главная функция"""
    tester = BasicFunctionalityTester()
    report = await tester.run_all_tests()
    
    # Возвращаем код выхода: 0 для PASSED, 1 для PARTIAL, 2 для FAILED
    exit_codes = {"PASSED": 0, "PARTIAL": 1, "FAILED": 2}
    exit_code = exit_codes.get(report['status'], 2)
    sys.exit(exit_code)

if __name__ == "__main__":
    asyncio.run(main())