#!/usr/bin/env python3
"""
Скрипт для тестирования интеграции всех модулей системы доставки RUT MIIT
"""

import asyncio
import json
import sys
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging

# Добавляем путь к проекту
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.driver_management import DriverManagementService
from app.services.route_management import RouteManagementService
from app.services.route_optimization import RouteOptimizationService
from app.services.parameter_modification import ParameterModificationService
from app.services.realtime_simulation import RealtimeSimulationService, EventType
from advanced_test_data_generator import AdvancedTestDataGenerator, TestConfiguration

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class IntegrationTester:
    """Класс для тестирования интеграции всех модулей"""
    
    def __init__(self):
        self.driver_service = DriverManagementService()
        self.route_service = RouteManagementService()
        self.optimization_service = RouteOptimizationService()
        self.parameter_service = ParameterModificationService()
        self.simulation_service = RealtimeSimulationService()
        self.test_data_generator = AdvancedTestDataGenerator()
        
        self.test_results = {
            "driver_management": {"passed": 0, "failed": 0, "errors": []},
            "route_management": {"passed": 0, "failed": 0, "errors": []},
            "route_optimization": {"passed": 0, "failed": 0, "errors": []},
            "parameter_modification": {"passed": 0, "failed": 0, "errors": []},
            "realtime_simulation": {"passed": 0, "failed": 0, "errors": []},
            "integration": {"passed": 0, "failed": 0, "errors": []}
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
    
    async def test_driver_management(self):
        """Тестирование модуля управления водителями"""
        logger.info("🧪 Тестирование модуля управления водителями...")
        
        try:
            # Тест 1: Получение всех водителей
            drivers = await self.driver_service.get_all_drivers()
            self.log_test_result("driver_management", "get_all_drivers", True)
        except Exception as e:
            self.log_test_result("driver_management", "get_all_drivers", False, str(e))
        
        try:
            # Тест 2: Поиск доступных водителей
            available_drivers = await self.driver_service.find_available_drivers(
                location={"lat": 55.7558, "lng": 37.6176},
                radius_km=10.0
            )
            self.log_test_result("driver_management", "find_available_drivers", True)
        except Exception as e:
            self.log_test_result("driver_management", "find_available_drivers", False, str(e))
        
        try:
            # Тест 3: Получение статистики водителей
            stats = await self.driver_service.get_driver_statistics()
            self.log_test_result("driver_management", "get_driver_statistics", True)
        except Exception as e:
            self.log_test_result("driver_management", "get_driver_statistics", False, str(e))
    
    async def test_route_management(self):
        """Тестирование модуля управления маршрутами"""
        logger.info("🧪 Тестирование модуля управления маршрутами...")
        
        try:
            # Тест 1: Создание маршрута
            route_data = {
                "vehicle_id": 1,
                "driver_id": 1,
                "waypoints": [
                    {"lat": 55.7558, "lng": 37.6176, "address": "Москва, Красная площадь"},
                    {"lat": 55.7500, "lng": 37.6200, "address": "Москва, Тверская улица"}
                ]
            }
            route = await self.route_service.create_route(route_data)
            self.log_test_result("route_management", "create_route", True)
            
            # Сохраняем ID маршрута для дальнейших тестов
            self.test_route_id = route.get("route_id")
            
        except Exception as e:
            self.log_test_result("route_management", "create_route", False, str(e))
            self.test_route_id = None
        
        if self.test_route_id:
            try:
                # Тест 2: Получение деталей маршрута
                route_details = await self.route_service.get_route_details(self.test_route_id)
                self.log_test_result("route_management", "get_route_details", True)
            except Exception as e:
                self.log_test_result("route_management", "get_route_details", False, str(e))
            
            try:
                # Тест 3: Добавление промежуточной точки
                await self.route_service.add_waypoint(
                    self.test_route_id,
                    {"lat": 55.7600, "lng": 37.6100, "address": "Москва, Арбат"},
                    1
                )
                self.log_test_result("route_management", "add_waypoint", True)
            except Exception as e:
                self.log_test_result("route_management", "add_waypoint", False, str(e))
    
    async def test_route_optimization(self):
        """Тестирование модуля оптимизации маршрутов"""
        logger.info("🧪 Тестирование модуля оптимизации маршрутов...")
        
        # Подготавливаем тестовые данные
        test_points = [
            {"id": "depot", "lat": 55.7558, "lng": 37.6176, "demand": 0, "time_window": (0, 1440)},
            {"id": "customer1", "lat": 55.7500, "lng": 37.6200, "demand": 10, "time_window": (480, 600)},
            {"id": "customer2", "lat": 55.7600, "lng": 37.6100, "demand": 15, "time_window": (540, 720)},
            {"id": "customer3", "lat": 55.7400, "lng": 37.6300, "demand": 8, "time_window": (600, 800)}
        ]
        
        vehicle_constraints = {
            "capacity": 50,
            "max_distance": 100.0,
            "max_time": 480,
            "speed_kmh": 40.0
        }
        
        try:
            # Тест 1: Оптимизация ближайшим соседом
            result = await self.optimization_service.optimize_nearest_neighbor(
                test_points, vehicle_constraints
            )
            self.log_test_result("route_optimization", "nearest_neighbor", True)
        except Exception as e:
            self.log_test_result("route_optimization", "nearest_neighbor", False, str(e))
        
        try:
            # Тест 2: Генетический алгоритм
            result = await self.optimization_service.optimize_genetic_algorithm(
                test_points, vehicle_constraints, population_size=20, generations=10
            )
            self.log_test_result("route_optimization", "genetic_algorithm", True)
        except Exception as e:
            self.log_test_result("route_optimization", "genetic_algorithm", False, str(e))
        
        try:
            # Тест 3: Алгоритм имитации отжига
            result = await self.optimization_service.optimize_simulated_annealing(
                test_points, vehicle_constraints, max_iterations=100
            )
            self.log_test_result("route_optimization", "simulated_annealing", True)
        except Exception as e:
            self.log_test_result("route_optimization", "simulated_annealing", False, str(e))
    
    async def test_parameter_modification(self):
        """Тестирование модуля модификации параметров"""
        logger.info("🧪 Тестирование модуля модификации параметров...")
        
        try:
            # Тест 1: Получение определений параметров
            definitions = self.parameter_service.get_parameter_definitions()
            self.log_test_result("parameter_modification", "get_parameter_definitions", True)
        except Exception as e:
            self.log_test_result("parameter_modification", "get_parameter_definitions", False, str(e))
        
        try:
            # Тест 2: Создание тестового сценария
            scenario_params = {
                "vehicle_capacity": 100,
                "max_route_distance": 200.0,
                "delivery_time_window": 120,
                "traffic_multiplier": 1.2
            }
            
            scenario_id = self.parameter_service.create_test_scenario(
                "integration_test_scenario",
                scenario_params,
                "Тестовый сценарий для интеграционного тестирования"
            )
            self.log_test_result("parameter_modification", "create_test_scenario", True)
            self.test_scenario_id = scenario_id
            
        except Exception as e:
            self.log_test_result("parameter_modification", "create_test_scenario", False, str(e))
            self.test_scenario_id = None
        
        if self.test_scenario_id:
            try:
                # Тест 3: Получение сценария
                scenario = self.parameter_service.get_test_scenario(self.test_scenario_id)
                self.log_test_result("parameter_modification", "get_test_scenario", True)
            except Exception as e:
                self.log_test_result("parameter_modification", "get_test_scenario", False, str(e))
        
        try:
            # Тест 4: Получение пресетов
            presets = self.parameter_service.get_available_presets()
            self.log_test_result("parameter_modification", "get_available_presets", True)
        except Exception as e:
            self.log_test_result("parameter_modification", "get_available_presets", False, str(e))
    
    async def test_realtime_simulation(self):
        """Тестирование модуля симуляции в реальном времени"""
        logger.info("🧪 Тестирование модуля симуляции в реальном времени...")
        
        try:
            # Тест 1: Запуск симуляции
            await self.simulation_service.start_simulation({
                "update_interval": 5,  # Быстрый интервал для тестирования
                "traffic_variability": 0.5
            })
            await asyncio.sleep(2)  # Даем время на инициализацию
            self.log_test_result("realtime_simulation", "start_simulation", True)
        except Exception as e:
            self.log_test_result("realtime_simulation", "start_simulation", False, str(e))
        
        try:
            # Тест 2: Принудительное создание события
            event = self.simulation_service.force_event(EventType.TRAFFIC_CHANGE)
            self.log_test_result("realtime_simulation", "force_event", event is not None)
        except Exception as e:
            self.log_test_result("realtime_simulation", "force_event", False, str(e))
        
        try:
            # Тест 3: Получение текущих условий
            conditions = self.simulation_service.get_current_conditions()
            self.log_test_result("realtime_simulation", "get_current_conditions", True)
        except Exception as e:
            self.log_test_result("realtime_simulation", "get_current_conditions", False, str(e))
        
        try:
            # Тест 4: Получение статистики
            stats = self.simulation_service.get_simulation_statistics()
            self.log_test_result("realtime_simulation", "get_simulation_statistics", True)
        except Exception as e:
            self.log_test_result("realtime_simulation", "get_simulation_statistics", False, str(e))
        
        try:
            # Тест 5: Остановка симуляции
            await self.simulation_service.stop_simulation()
            self.log_test_result("realtime_simulation", "stop_simulation", True)
        except Exception as e:
            self.log_test_result("realtime_simulation", "stop_simulation", False, str(e))
    
    async def test_integration_scenarios(self):
        """Тестирование интеграционных сценариев"""
        logger.info("🧪 Тестирование интеграционных сценариев...")
        
        try:
            # Сценарий 1: Создание комплексного заказа с оптимизацией
            logger.info("Тестирование сценария: Создание и оптимизация заказа")
            
            # Генерируем тестовые данные
            config = TestConfiguration(
                num_customers=10,
                num_drivers=3,
                num_vehicles=3,
                geographic_center=[55.7558, 37.6176],
                geographic_radius=20.0
            )
            
            test_data = self.test_data_generator.generate_comprehensive_test_data(config)
            
            # Создаем маршрут на основе сгенерированных данных
            if test_data["orders"]:
                first_order = test_data["orders"][0]
                route_data = {
                    "vehicle_id": 1,
                    "driver_id": 1,
                    "waypoints": [
                        first_order["pickup_location"],
                        first_order["delivery_location"]
                    ]
                }
                
                route = await self.route_service.create_route(route_data)
                
                if route and route.get("route_id"):
                    # Оптимизируем маршрут
                    optimization_points = [
                        {
                            "id": "pickup",
                            "lat": first_order["pickup_location"]["lat"],
                            "lng": first_order["pickup_location"]["lng"],
                            "demand": 0,
                            "time_window": (0, 1440)
                        },
                        {
                            "id": "delivery",
                            "lat": first_order["delivery_location"]["lat"],
                            "lng": first_order["delivery_location"]["lng"],
                            "demand": first_order["weight"],
                            "time_window": (480, 720)
                        }
                    ]
                    
                    vehicle_constraints = {
                        "capacity": 100,
                        "max_distance": 50.0,
                        "max_time": 240,
                        "speed_kmh": 40.0
                    }
                    
                    optimization_result = await self.optimization_service.optimize_nearest_neighbor(
                        optimization_points, vehicle_constraints
                    )
                    
                    self.log_test_result("integration", "complex_order_optimization", True)
                else:
                    self.log_test_result("integration", "complex_order_optimization", False, "Failed to create route")
            else:
                self.log_test_result("integration", "complex_order_optimization", False, "No test orders generated")
                
        except Exception as e:
            self.log_test_result("integration", "complex_order_optimization", False, str(e))
        
        try:
            # Сценарий 2: Симуляция с изменением условий и переоптимизация
            logger.info("Тестирование сценария: Симуляция с переоптимизацией")
            
            # Запускаем симуляцию
            await self.simulation_service.start_simulation({
                "update_interval": 3,
                "traffic_variability": 0.8
            })
            
            # Ждем несколько событий
            await asyncio.sleep(5)
            
            # Получаем текущие условия
            conditions = self.simulation_service.get_current_conditions()
            
            # Создаем событие изменения трафика
            traffic_event = self.simulation_service.force_event(
                EventType.TRAFFIC_CHANGE,
                {"intensity": 0.8}
            )
            
            # Останавливаем симуляцию
            await self.simulation_service.stop_simulation()
            
            self.log_test_result("integration", "simulation_with_reoptimization", True)
            
        except Exception as e:
            self.log_test_result("integration", "simulation_with_reoptimization", False, str(e))
        
        try:
            # Сценарий 3: Тестирование параметров с различными алгоритмами
            logger.info("Тестирование сценария: Параметры с различными алгоритмами")
            
            # Создаем сценарий с параметрами
            scenario_params = {
                "vehicle_capacity": 80,
                "max_route_distance": 150.0,
                "optimization_algorithm": "genetic"
            }
            
            scenario_id = self.parameter_service.create_test_scenario(
                "algorithm_comparison_test",
                scenario_params,
                "Тест сравнения алгоритмов"
            )
            
            # Тестируем разные алгоритмы с этими параметрами
            test_points = [
                {"id": "depot", "lat": 55.7558, "lng": 37.6176, "demand": 0, "time_window": (0, 1440)},
                {"id": "c1", "lat": 55.7500, "lng": 37.6200, "demand": 20, "time_window": (480, 600)},
                {"id": "c2", "lat": 55.7600, "lng": 37.6100, "demand": 25, "time_window": (540, 720)}
            ]
            
            vehicle_constraints = {
                "capacity": scenario_params["vehicle_capacity"],
                "max_distance": scenario_params["max_route_distance"],
                "max_time": 480,
                "speed_kmh": 40.0
            }
            
            # Тестируем несколько алгоритмов
            algorithms = [
                ("nearest_neighbor", self.optimization_service.optimize_nearest_neighbor),
                ("genetic_algorithm", lambda points, constraints: 
                 self.optimization_service.optimize_genetic_algorithm(points, constraints, 10, 5))
            ]
            
            results = {}
            for alg_name, alg_func in algorithms:
                try:
                    result = await alg_func(test_points, vehicle_constraints)
                    results[alg_name] = result
                except Exception as e:
                    logger.warning(f"Алгоритм {alg_name} завершился с ошибкой: {e}")
            
            self.log_test_result("integration", "parameter_algorithm_testing", len(results) > 0)
            
        except Exception as e:
            self.log_test_result("integration", "parameter_algorithm_testing", False, str(e))
    
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
            "status": "PASSED" if total_failed == 0 else "FAILED"
        }
        
        return report
    
    def print_test_report(self, report: Dict[str, Any]):
        """Вывод отчета о тестировании"""
        print("\n" + "="*80)
        print("🧪 ОТЧЕТ О ТЕСТИРОВАНИИ ИНТЕГРАЦИИ МОДУЛЕЙ RUT MIIT")
        print("="*80)
        print(f"Время выполнения: {report['timestamp']}")
        print(f"Общий статус: {'✅ PASSED' if report['status'] == 'PASSED' else '❌ FAILED'}")
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
                status_icon = "✅" if module_results['failed'] == 0 else "❌"
                
                print(f"{status_icon} {module_name.upper().replace('_', ' ')}")
                print(f"   Пройдено: {module_results['passed']}")
                print(f"   Провалено: {module_results['failed']}")
                print(f"   Успешность: {module_success_rate:.1f}%")
                
                if module_results['errors']:
                    print("   Ошибки:")
                    for error in module_results['errors']:
                        print(f"     • {error}")
                print()
        
        print("="*80)
    
    async def run_all_tests(self):
        """Запуск всех тестов"""
        logger.info("🚀 Запуск интеграционного тестирования системы RUT MIIT...")
        
        # Запускаем тесты по модулям
        await self.test_driver_management()
        await self.test_route_management()
        await self.test_route_optimization()
        await self.test_parameter_modification()
        await self.test_realtime_simulation()
        
        # Запускаем интеграционные тесты
        await self.test_integration_scenarios()
        
        # Генерируем и выводим отчет
        report = self.generate_test_report()
        self.print_test_report(report)
        
        # Сохраняем отчет в файл
        report_filename = f"integration_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        logger.info(f"📄 Отчет сохранен в файл: {report_filename}")
        
        return report

async def main():
    """Главная функция"""
    tester = IntegrationTester()
    report = await tester.run_all_tests()
    
    # Возвращаем код выхода в зависимости от результатов
    exit_code = 0 if report['status'] == 'PASSED' else 1
    sys.exit(exit_code)

if __name__ == "__main__":
    asyncio.run(main())