#!/usr/bin/env python3
"""
Автономное тестирование модулей системы доставки RUT MIIT
Тестирует функциональность без подключения к базе данных
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

class StandaloneModuleTester:
    """Класс для автономного тестирования модулей"""
    
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
    
    async def test_route_optimization(self):
        """Тестирование модуля оптимизации маршрутов"""
        logger.info("🧪 Тестирование модуля оптимизации маршрутов...")
        
        # Подготавливаем тестовые данные
        test_points = [
            {"id": "depot", "lat": 55.7558, "lng": 37.6176, "demand": 0, "time_window": (0, 1440)},
            {"id": "customer1", "lat": 55.7500, "lng": 37.6200, "demand": 10, "time_window": (480, 600)},
            {"id": "customer2", "lat": 55.7600, "lng": 37.6100, "demand": 15, "time_window": (540, 720)},
            {"id": "customer3", "lat": 55.7400, "lng": 37.6300, "demand": 8, "time_window": (600, 800)},
            {"id": "customer4", "lat": 55.7650, "lng": 37.6050, "demand": 12, "time_window": (420, 660)}
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
            success = result and "route" in result and len(result["route"]) > 0
            self.log_test_result("route_optimization", "nearest_neighbor", success)
            if success:
                logger.info(f"   Маршрут: {' -> '.join(result['route'])}")
                logger.info(f"   Общее расстояние: {result.get('total_distance', 0):.2f} км")
                logger.info(f"   Общее время: {result.get('total_time', 0):.2f} мин")
        except Exception as e:
            self.log_test_result("route_optimization", "nearest_neighbor", False, str(e))
        
        try:
            # Тест 2: Генетический алгоритм
            result = await self.optimization_service.optimize_genetic_algorithm(
                test_points, vehicle_constraints, population_size=20, generations=10
            )
            success = result and "route" in result and len(result["route"]) > 0
            self.log_test_result("route_optimization", "genetic_algorithm", success)
            if success:
                logger.info(f"   Лучший маршрут: {' -> '.join(result['route'])}")
                logger.info(f"   Общее расстояние: {result.get('total_distance', 0):.2f} км")
        except Exception as e:
            self.log_test_result("route_optimization", "genetic_algorithm", False, str(e))
        
        try:
            # Тест 3: Алгоритм имитации отжига
            result = await self.optimization_service.optimize_simulated_annealing(
                test_points, vehicle_constraints, max_iterations=100
            )
            success = result and "route" in result and len(result["route"]) > 0
            self.log_test_result("route_optimization", "simulated_annealing", success)
            if success:
                logger.info(f"   Оптимизированный маршрут: {' -> '.join(result['route'])}")
        except Exception as e:
            self.log_test_result("route_optimization", "simulated_annealing", False, str(e))
        
        try:
            # Тест 4: Муравьиный алгоритм
            result = await self.optimization_service.optimize_ant_colony(
                test_points, vehicle_constraints, num_ants=10, iterations=20
            )
            success = result and "route" in result and len(result["route"]) > 0
            self.log_test_result("route_optimization", "ant_colony", success)
        except Exception as e:
            self.log_test_result("route_optimization", "ant_colony", False, str(e))
        
        try:
            # Тест 5: Алгоритм Кларка-Райта
            result = await self.optimization_service.optimize_clarke_wright(
                test_points, vehicle_constraints
            )
            success = result and "routes" in result and len(result["routes"]) > 0
            self.log_test_result("route_optimization", "clarke_wright", success)
        except Exception as e:
            self.log_test_result("route_optimization", "clarke_wright", False, str(e))
    
    async def test_parameter_modification(self):
        """Тестирование модуля модификации параметров"""
        logger.info("🧪 Тестирование модуля модификации параметров...")
        
        try:
            # Тест 1: Получение определений параметров
            definitions = self.parameter_service.get_parameter_definitions()
            success = isinstance(definitions, dict) and len(definitions) > 0
            self.log_test_result("parameter_modification", "get_parameter_definitions", success)
            if success:
                logger.info(f"   Найдено {len(definitions)} определений параметров")
        except Exception as e:
            self.log_test_result("parameter_modification", "get_parameter_definitions", False, str(e))
        
        try:
            # Тест 2: Получение категорий параметров
            categories = self.parameter_service.get_parameter_categories()
            success = isinstance(categories, list) and len(categories) > 0
            self.log_test_result("parameter_modification", "get_parameter_categories", success)
            if success:
                logger.info(f"   Найдено {len(categories)} категорий параметров")
        except Exception as e:
            self.log_test_result("parameter_modification", "get_parameter_categories", False, str(e))
        
        try:
            # Тест 3: Создание тестового сценария
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
            success = scenario_id is not None
            self.log_test_result("parameter_modification", "create_test_scenario", success)
            self.test_scenario_id = scenario_id if success else None
            
        except Exception as e:
            self.log_test_result("parameter_modification", "create_test_scenario", False, str(e))
            self.test_scenario_id = None
        
        if self.test_scenario_id:
            try:
                # Тест 4: Получение сценария
                scenario = self.parameter_service.get_test_scenario(self.test_scenario_id)
                success = scenario is not None and "parameters" in scenario
                self.log_test_result("parameter_modification", "get_test_scenario", success)
            except Exception as e:
                self.log_test_result("parameter_modification", "get_test_scenario", False, str(e))
            
            try:
                # Тест 5: Модификация сценария
                new_params = {"vehicle_capacity": 150, "max_route_distance": 250.0}
                self.parameter_service.modify_test_scenario(self.test_scenario_id, new_params)
                modified_scenario = self.parameter_service.get_test_scenario(self.test_scenario_id)
                success = (modified_scenario and 
                          modified_scenario["parameters"]["vehicle_capacity"] == 150)
                self.log_test_result("parameter_modification", "modify_test_scenario", success)
            except Exception as e:
                self.log_test_result("parameter_modification", "modify_test_scenario", False, str(e))
        
        try:
            # Тест 6: Получение пресетов
            presets = self.parameter_service.get_available_presets()
            success = isinstance(presets, dict) and len(presets) > 0
            self.log_test_result("parameter_modification", "get_available_presets", success)
            if success:
                logger.info(f"   Доступно {len(presets)} пресетов")
        except Exception as e:
            self.log_test_result("parameter_modification", "get_available_presets", False, str(e))
        
        try:
            # Тест 7: Валидация параметров
            valid_params = {"vehicle_capacity": 100, "max_route_distance": 200.0}
            invalid_params = {"vehicle_capacity": -10, "max_route_distance": "invalid"}
            
            valid_result = self.parameter_service.validate_parameters(valid_params)
            invalid_result = self.parameter_service.validate_parameters(invalid_params)
            
            success = valid_result.get("valid", False) and not invalid_result.get("valid", True)
            self.log_test_result("parameter_modification", "validate_parameters", success)
        except Exception as e:
            self.log_test_result("parameter_modification", "validate_parameters", False, str(e))
    
    async def test_realtime_simulation(self):
        """Тестирование модуля симуляции в реальном времени"""
        logger.info("🧪 Тестирование модуля симуляции в реальном времени...")
        
        try:
            # Тест 1: Запуск симуляции
            await self.simulation_service.start_simulation({
                "update_interval": 2,  # Быстрый интервал для тестирования
                "traffic_variability": 0.5,
                "weather_change_probability": 0.3
            })
            await asyncio.sleep(1)  # Даем время на инициализацию
            
            is_running = self.simulation_service.is_running()
            self.log_test_result("realtime_simulation", "start_simulation", is_running)
        except Exception as e:
            self.log_test_result("realtime_simulation", "start_simulation", False, str(e))
        
        try:
            # Тест 2: Принудительное создание событий
            traffic_event = self.simulation_service.force_event(EventType.TRAFFIC_CHANGE)
            weather_event = self.simulation_service.force_event(EventType.WEATHER_CHANGE)
            
            success = traffic_event is not None and weather_event is not None
            self.log_test_result("realtime_simulation", "force_events", success)
            if success:
                logger.info(f"   Создано событие трафика: {traffic_event.description}")
                logger.info(f"   Создано событие погоды: {weather_event.description}")
        except Exception as e:
            self.log_test_result("realtime_simulation", "force_events", False, str(e))
        
        try:
            # Тест 3: Получение текущих условий
            conditions = self.simulation_service.get_current_conditions()
            success = (conditions and 
                      "traffic" in conditions and 
                      "weather" in conditions)
            self.log_test_result("realtime_simulation", "get_current_conditions", success)
            if success:
                logger.info(f"   Трафик: {conditions['traffic']['intensity']}")
                logger.info(f"   Погода: {conditions['weather']['condition']}")
        except Exception as e:
            self.log_test_result("realtime_simulation", "get_current_conditions", False, str(e))
        
        try:
            # Тест 4: Получение статистики
            stats = self.simulation_service.get_simulation_statistics()
            success = stats and "total_events" in stats
            self.log_test_result("realtime_simulation", "get_simulation_statistics", success)
            if success:
                logger.info(f"   Всего событий: {stats['total_events']}")
                logger.info(f"   Время работы: {stats.get('uptime_seconds', 0):.1f} сек")
        except Exception as e:
            self.log_test_result("realtime_simulation", "get_simulation_statistics", False, str(e))
        
        try:
            # Тест 5: Изменение параметров симуляции
            new_params = {
                "update_interval": 3,
                "traffic_variability": 0.8
            }
            self.simulation_service.update_simulation_parameters(new_params)
            self.log_test_result("realtime_simulation", "update_parameters", True)
        except Exception as e:
            self.log_test_result("realtime_simulation", "update_parameters", False, str(e))
        
        # Ждем немного для накопления событий
        await asyncio.sleep(3)
        
        try:
            # Тест 6: Остановка симуляции
            await self.simulation_service.stop_simulation()
            is_stopped = not self.simulation_service.is_running()
            self.log_test_result("realtime_simulation", "stop_simulation", is_stopped)
        except Exception as e:
            self.log_test_result("realtime_simulation", "stop_simulation", False, str(e))
    
    async def test_data_generation(self):
        """Тестирование генерации тестовых данных"""
        logger.info("🧪 Тестирование генерации тестовых данных...")
        
        try:
            # Тест 1: Создание базовой конфигурации
            config = TestConfiguration(
                num_customers=10,
                num_drivers=5,
                num_vehicles=3,
                geographic_center=[55.7558, 37.6176],
                geographic_radius=15.0
            )
            success = config is not None
            self.log_test_result("test_data_generation", "create_configuration", success)
        except Exception as e:
            self.log_test_result("test_data_generation", "create_configuration", False, str(e))
            return
        
        try:
            # Тест 2: Генерация комплексных тестовых данных
            test_data = self.test_data_generator.generate_comprehensive_test_data(config)
            success = (test_data and 
                      "customers" in test_data and 
                      "drivers" in test_data and 
                      "vehicles" in test_data and 
                      "orders" in test_data)
            self.log_test_result("test_data_generation", "generate_comprehensive_data", success)
            
            if success:
                logger.info(f"   Клиенты: {len(test_data['customers'])}")
                logger.info(f"   Водители: {len(test_data['drivers'])}")
                logger.info(f"   Транспорт: {len(test_data['vehicles'])}")
                logger.info(f"   Заказы: {len(test_data['orders'])}")
                
                # Сохраняем данные для интеграционных тестов
                self.test_data = test_data
                
        except Exception as e:
            self.log_test_result("test_data_generation", "generate_comprehensive_data", False, str(e))
            self.test_data = None
        
        try:
            # Тест 3: Генерация сценарных данных
            scenario_data = self.test_data_generator.generate_scenario_based_orders(
                config, "urban_delivery", 5
            )
            success = scenario_data and len(scenario_data) > 0
            self.log_test_result("test_data_generation", "generate_scenario_orders", success)
            if success:
                logger.info(f"   Сценарные заказы: {len(scenario_data)}")
        except Exception as e:
            self.log_test_result("test_data_generation", "generate_scenario_orders", False, str(e))
        
        try:
            # Тест 4: Сохранение конфигурации
            config_file = "test_config_temp.json"
            self.test_data_generator.save_configuration(config, config_file)
            
            # Проверяем, что файл создан
            success = os.path.exists(config_file)
            self.log_test_result("test_data_generation", "save_configuration", success)
            
            # Удаляем временный файл
            if success:
                os.remove(config_file)
                
        except Exception as e:
            self.log_test_result("test_data_generation", "save_configuration", False, str(e))
    
    async def test_integration_scenarios(self):
        """Тестирование интеграционных сценариев"""
        logger.info("🧪 Тестирование интеграционных сценариев...")
        
        if not hasattr(self, 'test_data') or not self.test_data:
            self.log_test_result("integration", "data_availability", False, "Тестовые данные недоступны")
            return
        
        try:
            # Сценарий 1: Оптимизация маршрута с реальными данными
            logger.info("Тестирование сценария: Оптимизация с реальными данными")
            
            # Берем первые несколько заказов
            orders = self.test_data["orders"][:4]
            
            # Создаем точки для оптимизации
            optimization_points = [
                {"id": "depot", "lat": 55.7558, "lng": 37.6176, "demand": 0, "time_window": (0, 1440)}
            ]
            
            for i, order in enumerate(orders):
                optimization_points.append({
                    "id": f"order_{i}",
                    "lat": order["delivery_location"]["lat"],
                    "lng": order["delivery_location"]["lng"],
                    "demand": order["weight"],
                    "time_window": (480, 720)
                })
            
            vehicle_constraints = {
                "capacity": 100,
                "max_distance": 80.0,
                "max_time": 360,
                "speed_kmh": 35.0
            }
            
            # Тестируем разные алгоритмы
            algorithms = [
                ("nearest_neighbor", self.optimization_service.optimize_nearest_neighbor),
                ("genetic_algorithm", lambda points, constraints: 
                 self.optimization_service.optimize_genetic_algorithm(points, constraints, 15, 8))
            ]
            
            results = {}
            for alg_name, alg_func in algorithms:
                try:
                    result = await alg_func(optimization_points, vehicle_constraints)
                    if result and "route" in result:
                        results[alg_name] = result
                        logger.info(f"   {alg_name}: расстояние {result.get('total_distance', 0):.2f} км")
                except Exception as e:
                    logger.warning(f"   {alg_name}: ошибка - {e}")
            
            success = len(results) > 0
            self.log_test_result("integration", "real_data_optimization", success)
            
        except Exception as e:
            self.log_test_result("integration", "real_data_optimization", False, str(e))
        
        try:
            # Сценарий 2: Симуляция с параметрами и оптимизацией
            logger.info("Тестирование сценария: Симуляция с параметрами")
            
            # Создаем сценарий с параметрами
            scenario_params = {
                "vehicle_capacity": 80,
                "max_route_distance": 120.0,
                "traffic_multiplier": 1.5,
                "weather_impact": 0.2
            }
            
            scenario_id = self.parameter_service.create_test_scenario(
                "integration_simulation_test",
                scenario_params,
                "Интеграционный тест симуляции"
            )
            
            # Запускаем симуляцию
            await self.simulation_service.start_simulation({
                "update_interval": 1,
                "traffic_variability": scenario_params["traffic_multiplier"] - 1.0
            })
            
            # Ждем события
            await asyncio.sleep(2)
            
            # Получаем условия
            conditions = self.simulation_service.get_current_conditions()
            
            # Останавливаем симуляцию
            await self.simulation_service.stop_simulation()
            
            success = conditions is not None and scenario_id is not None
            self.log_test_result("integration", "simulation_with_parameters", success)
            
        except Exception as e:
            self.log_test_result("integration", "simulation_with_parameters", False, str(e))
        
        try:
            # Сценарий 3: Сравнение алгоритмов с разными параметрами
            logger.info("Тестирование сценария: Сравнение алгоритмов")
            
            # Создаем несколько конфигураций
            configurations = [
                {"capacity": 50, "max_distance": 60.0, "name": "small_vehicle"},
                {"capacity": 100, "max_distance": 120.0, "name": "medium_vehicle"},
                {"capacity": 150, "max_distance": 200.0, "name": "large_vehicle"}
            ]
            
            test_points = [
                {"id": "depot", "lat": 55.7558, "lng": 37.6176, "demand": 0, "time_window": (0, 1440)},
                {"id": "c1", "lat": 55.7500, "lng": 37.6200, "demand": 20, "time_window": (480, 600)},
                {"id": "c2", "lat": 55.7600, "lng": 37.6100, "demand": 25, "time_window": (540, 720)},
                {"id": "c3", "lat": 55.7400, "lng": 37.6300, "demand": 15, "time_window": (600, 800)}
            ]
            
            comparison_results = {}
            for config in configurations:
                vehicle_constraints = {
                    "capacity": config["capacity"],
                    "max_distance": config["max_distance"],
                    "max_time": 300,
                    "speed_kmh": 40.0
                }
                
                try:
                    result = await self.optimization_service.optimize_nearest_neighbor(
                        test_points, vehicle_constraints
                    )
                    if result:
                        comparison_results[config["name"]] = {
                            "distance": result.get("total_distance", 0),
                            "time": result.get("total_time", 0),
                            "feasible": result.get("feasible", False)
                        }
                except Exception as e:
                    logger.warning(f"   Конфигурация {config['name']}: ошибка - {e}")
            
            success = len(comparison_results) > 0
            self.log_test_result("integration", "algorithm_comparison", success)
            
            if success:
                logger.info("   Результаты сравнения:")
                for name, result in comparison_results.items():
                    logger.info(f"     {name}: {result['distance']:.2f} км, {result['time']:.2f} мин")
            
        except Exception as e:
            self.log_test_result("integration", "algorithm_comparison", False, str(e))
    
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
        print("🧪 ОТЧЕТ О ТЕСТИРОВАНИИ МОДУЛЕЙ СИСТЕМЫ RUT MIIT")
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
        print("📋 ЗАКЛЮЧЕНИЕ:")
        if report['status'] == 'PASSED':
            print("✅ Все модули системы работают корректно!")
            print("✅ Система готова к использованию!")
        else:
            print("⚠️  Обнаружены проблемы в некоторых модулях.")
            print("⚠️  Рекомендуется исправить ошибки перед использованием.")
        print("="*80)
    
    async def run_all_tests(self):
        """Запуск всех тестов"""
        logger.info("🚀 Запуск автономного тестирования модулей системы RUT MIIT...")
        
        # Запускаем тесты по модулям
        await self.test_route_optimization()
        await self.test_parameter_modification()
        await self.test_realtime_simulation()
        await self.test_data_generation()
        
        # Запускаем интеграционные тесты
        await self.test_integration_scenarios()
        
        # Генерируем и выводим отчет
        report = self.generate_test_report()
        self.print_test_report(report)
        
        # Сохраняем отчет в файл
        report_filename = f"module_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        logger.info(f"📄 Отчет сохранен в файл: {report_filename}")
        
        return report

async def main():
    """Главная функция"""
    tester = StandaloneModuleTester()
    report = await tester.run_all_tests()
    
    # Возвращаем код выхода в зависимости от результатов
    exit_code = 0 if report['status'] == 'PASSED' else 1
    sys.exit(exit_code)

if __name__ == "__main__":
    asyncio.run(main())