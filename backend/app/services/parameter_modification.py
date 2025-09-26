from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import json
import copy
from enum import Enum

class ParameterType(Enum):
    """Типы параметров для модификации"""
    NUMERIC = "numeric"
    BOOLEAN = "boolean"
    STRING = "string"
    ENUM = "enum"
    DATETIME = "datetime"
    COORDINATES = "coordinates"
    LIST = "list"

@dataclass
class ParameterDefinition:
    """Определение параметра для модификации"""
    name: str
    type: ParameterType
    description: str
    default_value: Any
    min_value: Optional[Union[int, float]] = None
    max_value: Optional[Union[int, float]] = None
    allowed_values: Optional[List[Any]] = None
    required: bool = True
    category: str = "general"

@dataclass
class TestScenarioParameters:
    """Параметры тестового сценария"""
    scenario_id: str
    scenario_name: str
    parameters: Dict[str, Any]
    created_at: datetime
    modified_at: datetime
    description: str = ""
    tags: List[str] = None

class ParameterModificationService:
    """Сервис для модификации параметров пользовательских тестов"""
    
    def __init__(self):
        self.parameter_definitions = self._initialize_parameter_definitions()
        self.saved_scenarios = {}
    
    def _initialize_parameter_definitions(self) -> Dict[str, ParameterDefinition]:
        """Инициализация определений параметров"""
        definitions = {
            # Параметры транспортного средства
            "vehicle_max_weight": ParameterDefinition(
                name="vehicle_max_weight",
                type=ParameterType.NUMERIC,
                description="Максимальная грузоподъемность транспортного средства (кг)",
                default_value=1000.0,
                min_value=100.0,
                max_value=10000.0,
                category="vehicle"
            ),
            "vehicle_max_volume": ParameterDefinition(
                name="vehicle_max_volume",
                type=ParameterType.NUMERIC,
                description="Максимальный объем транспортного средства (м³)",
                default_value=10.0,
                min_value=1.0,
                max_value=100.0,
                category="vehicle"
            ),
            "vehicle_speed": ParameterDefinition(
                name="vehicle_speed",
                type=ParameterType.NUMERIC,
                description="Средняя скорость транспортного средства (км/ч)",
                default_value=60.0,
                min_value=20.0,
                max_value=120.0,
                category="vehicle"
            ),
            "vehicle_cost_per_km": ParameterDefinition(
                name="vehicle_cost_per_km",
                type=ParameterType.NUMERIC,
                description="Стоимость за километр (руб/км)",
                default_value=2.0,
                min_value=0.5,
                max_value=10.0,
                category="vehicle"
            ),
            "vehicle_cost_per_hour": ParameterDefinition(
                name="vehicle_cost_per_hour",
                type=ParameterType.NUMERIC,
                description="Стоимость за час работы (руб/ч)",
                default_value=25.0,
                min_value=10.0,
                max_value=100.0,
                category="vehicle"
            ),
            
            # Параметры заказов
            "order_weight_range": ParameterDefinition(
                name="order_weight_range",
                type=ParameterType.LIST,
                description="Диапазон веса заказов [мин, макс] (кг)",
                default_value=[1.0, 50.0],
                category="order"
            ),
            "order_volume_range": ParameterDefinition(
                name="order_volume_range",
                type=ParameterType.LIST,
                description="Диапазон объема заказов [мин, макс] (м³)",
                default_value=[0.1, 2.0],
                category="order"
            ),
            "service_time_range": ParameterDefinition(
                name="service_time_range",
                type=ParameterType.LIST,
                description="Диапазон времени обслуживания [мин, макс] (минуты)",
                default_value=[5, 30],
                category="order"
            ),
            "priority_distribution": ParameterDefinition(
                name="priority_distribution",
                type=ParameterType.LIST,
                description="Распределение приоритетов [низкий%, средний%, высокий%]",
                default_value=[60, 30, 10],
                category="order"
            ),
            
            # Параметры маршрутизации
            "optimization_algorithm": ParameterDefinition(
                name="optimization_algorithm",
                type=ParameterType.ENUM,
                description="Алгоритм оптимизации маршрута",
                default_value="nearest_neighbor",
                allowed_values=["nearest_neighbor", "genetic", "simulated_annealing", 
                              "ant_colony", "clarke_wright", "two_opt"],
                category="routing"
            ),
            "max_route_duration": ParameterDefinition(
                name="max_route_duration",
                type=ParameterType.NUMERIC,
                description="Максимальная продолжительность маршрута (минуты)",
                default_value=480,
                min_value=60,
                max_value=1440,
                category="routing"
            ),
            "max_route_distance": ParameterDefinition(
                name="max_route_distance",
                type=ParameterType.NUMERIC,
                description="Максимальное расстояние маршрута (км)",
                default_value=500.0,
                min_value=50.0,
                max_value=2000.0,
                category="routing"
            ),
            
            # Параметры условий доставки
            "weather_condition": ParameterDefinition(
                name="weather_condition",
                type=ParameterType.ENUM,
                description="Погодные условия",
                default_value="clear",
                allowed_values=["clear", "rain", "snow", "fog", "storm"],
                category="conditions"
            ),
            "traffic_condition": ParameterDefinition(
                name="traffic_condition",
                type=ParameterType.ENUM,
                description="Дорожные условия",
                default_value="normal",
                allowed_values=["light", "normal", "heavy", "jam"],
                category="conditions"
            ),
            "time_window_flexibility": ParameterDefinition(
                name="time_window_flexibility",
                type=ParameterType.NUMERIC,
                description="Гибкость временных окон (часы)",
                default_value=2.0,
                min_value=0.5,
                max_value=8.0,
                category="conditions"
            ),
            
            # Параметры генерации данных
            "num_orders": ParameterDefinition(
                name="num_orders",
                type=ParameterType.NUMERIC,
                description="Количество заказов для генерации",
                default_value=50,
                min_value=5,
                max_value=1000,
                category="generation"
            ),
            "num_drivers": ParameterDefinition(
                name="num_drivers",
                type=ParameterType.NUMERIC,
                description="Количество водителей",
                default_value=10,
                min_value=1,
                max_value=100,
                category="generation"
            ),
            "num_vehicles": ParameterDefinition(
                name="num_vehicles",
                type=ParameterType.NUMERIC,
                description="Количество транспортных средств",
                default_value=8,
                min_value=1,
                max_value=50,
                category="generation"
            ),
            "geographic_area": ParameterDefinition(
                name="geographic_area",
                type=ParameterType.COORDINATES,
                description="Географическая область [центр_lat, центр_lng, радиус_км]",
                default_value=[55.7558, 37.6176, 50.0],  # Москва
                category="generation"
            ),
            
            # Параметры алгоритмов оптимизации
            "genetic_population_size": ParameterDefinition(
                name="genetic_population_size",
                type=ParameterType.NUMERIC,
                description="Размер популяции для генетического алгоритма",
                default_value=50,
                min_value=10,
                max_value=200,
                category="algorithms"
            ),
            "genetic_generations": ParameterDefinition(
                name="genetic_generations",
                type=ParameterType.NUMERIC,
                description="Количество поколений для генетического алгоритма",
                default_value=100,
                min_value=10,
                max_value=500,
                category="algorithms"
            ),
            "genetic_mutation_rate": ParameterDefinition(
                name="genetic_mutation_rate",
                type=ParameterType.NUMERIC,
                description="Вероятность мутации для генетического алгоритма",
                default_value=0.1,
                min_value=0.01,
                max_value=0.5,
                category="algorithms"
            ),
            "annealing_initial_temp": ParameterDefinition(
                name="annealing_initial_temp",
                type=ParameterType.NUMERIC,
                description="Начальная температура для имитации отжига",
                default_value=1000.0,
                min_value=100.0,
                max_value=10000.0,
                category="algorithms"
            ),
            "annealing_cooling_rate": ParameterDefinition(
                name="annealing_cooling_rate",
                type=ParameterType.NUMERIC,
                description="Скорость охлаждения для имитации отжига",
                default_value=0.95,
                min_value=0.8,
                max_value=0.99,
                category="algorithms"
            ),
            
            # Параметры реального времени
            "real_time_updates": ParameterDefinition(
                name="real_time_updates",
                type=ParameterType.BOOLEAN,
                description="Включить обновления в реальном времени",
                default_value=True,
                category="realtime"
            ),
            "update_interval": ParameterDefinition(
                name="update_interval",
                type=ParameterType.NUMERIC,
                description="Интервал обновления условий (секунды)",
                default_value=30,
                min_value=5,
                max_value=300,
                category="realtime"
            ),
            "traffic_variability": ParameterDefinition(
                name="traffic_variability",
                type=ParameterType.NUMERIC,
                description="Изменчивость трафика (0-1)",
                default_value=0.3,
                min_value=0.0,
                max_value=1.0,
                category="realtime"
            ),
            "weather_change_probability": ParameterDefinition(
                name="weather_change_probability",
                type=ParameterType.NUMERIC,
                description="Вероятность изменения погоды (0-1)",
                default_value=0.1,
                min_value=0.0,
                max_value=1.0,
                category="realtime"
            )
        }
        
        return definitions
    
    def get_parameter_definitions(self, category: Optional[str] = None) -> Dict[str, ParameterDefinition]:
        """Получить определения параметров"""
        if category:
            return {
                name: definition for name, definition in self.parameter_definitions.items()
                if definition.category == category
            }
        return self.parameter_definitions
    
    def get_parameter_categories(self) -> List[str]:
        """Получить список категорий параметров"""
        categories = set(definition.category for definition in self.parameter_definitions.values())
        return sorted(list(categories))
    
    def validate_parameter_value(self, parameter_name: str, value: Any) -> tuple[bool, str]:
        """Валидация значения параметра"""
        if parameter_name not in self.parameter_definitions:
            return False, f"Неизвестный параметр: {parameter_name}"
        
        definition = self.parameter_definitions[parameter_name]
        
        # Проверка типа
        if definition.type == ParameterType.NUMERIC:
            if not isinstance(value, (int, float)):
                return False, f"Параметр {parameter_name} должен быть числом"
            
            if definition.min_value is not None and value < definition.min_value:
                return False, f"Значение {parameter_name} должно быть >= {definition.min_value}"
            
            if definition.max_value is not None and value > definition.max_value:
                return False, f"Значение {parameter_name} должно быть <= {definition.max_value}"
        
        elif definition.type == ParameterType.BOOLEAN:
            if not isinstance(value, bool):
                return False, f"Параметр {parameter_name} должен быть булевым"
        
        elif definition.type == ParameterType.STRING:
            if not isinstance(value, str):
                return False, f"Параметр {parameter_name} должен быть строкой"
        
        elif definition.type == ParameterType.ENUM:
            if value not in definition.allowed_values:
                return False, f"Параметр {parameter_name} должен быть одним из: {definition.allowed_values}"
        
        elif definition.type == ParameterType.LIST:
            if not isinstance(value, list):
                return False, f"Параметр {parameter_name} должен быть списком"
        
        elif definition.type == ParameterType.COORDINATES:
            if not isinstance(value, list) or len(value) != 3:
                return False, f"Параметр {parameter_name} должен быть списком из 3 элементов [lat, lng, radius]"
            
            if not all(isinstance(x, (int, float)) for x in value):
                return False, f"Все элементы {parameter_name} должны быть числами"
        
        return True, "OK"
    
    def create_test_scenario(
        self,
        scenario_name: str,
        parameters: Dict[str, Any],
        description: str = "",
        tags: List[str] = None
    ) -> TestScenarioParameters:
        """Создать тестовый сценарий"""
        
        # Валидация параметров
        validated_parameters = {}
        for param_name, value in parameters.items():
            is_valid, error_message = self.validate_parameter_value(param_name, value)
            if not is_valid:
                raise ValueError(error_message)
            validated_parameters[param_name] = value
        
        # Добавляем значения по умолчанию для отсутствующих параметров
        for param_name, definition in self.parameter_definitions.items():
            if definition.required and param_name not in validated_parameters:
                validated_parameters[param_name] = definition.default_value
        
        scenario_id = f"scenario_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        scenario = TestScenarioParameters(
            scenario_id=scenario_id,
            scenario_name=scenario_name,
            parameters=validated_parameters,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            description=description,
            tags=tags or []
        )
        
        self.saved_scenarios[scenario_id] = scenario
        return scenario
    
    def modify_scenario_parameters(
        self,
        scenario_id: str,
        parameter_updates: Dict[str, Any]
    ) -> TestScenarioParameters:
        """Модифицировать параметры существующего сценария"""
        
        if scenario_id not in self.saved_scenarios:
            raise ValueError(f"Сценарий {scenario_id} не найден")
        
        scenario = copy.deepcopy(self.saved_scenarios[scenario_id])
        
        # Валидация и обновление параметров
        for param_name, value in parameter_updates.items():
            is_valid, error_message = self.validate_parameter_value(param_name, value)
            if not is_valid:
                raise ValueError(error_message)
            scenario.parameters[param_name] = value
        
        scenario.modified_at = datetime.now()
        self.saved_scenarios[scenario_id] = scenario
        
        return scenario
    
    def get_scenario(self, scenario_id: str) -> Optional[TestScenarioParameters]:
        """Получить сценарий по ID"""
        return self.saved_scenarios.get(scenario_id)
    
    def list_scenarios(self, tags: List[str] = None) -> List[TestScenarioParameters]:
        """Получить список сценариев с фильтрацией по тегам"""
        scenarios = list(self.saved_scenarios.values())
        
        if tags:
            scenarios = [
                scenario for scenario in scenarios
                if any(tag in (scenario.tags or []) for tag in tags)
            ]
        
        return sorted(scenarios, key=lambda x: x.modified_at, reverse=True)
    
    def delete_scenario(self, scenario_id: str) -> bool:
        """Удалить сценарий"""
        if scenario_id in self.saved_scenarios:
            del self.saved_scenarios[scenario_id]
            return True
        return False
    
    def export_scenario(self, scenario_id: str) -> str:
        """Экспортировать сценарий в JSON"""
        if scenario_id not in self.saved_scenarios:
            raise ValueError(f"Сценарий {scenario_id} не найден")
        
        scenario = self.saved_scenarios[scenario_id]
        scenario_dict = asdict(scenario)
        
        # Преобразуем datetime в строки
        scenario_dict['created_at'] = scenario.created_at.isoformat()
        scenario_dict['modified_at'] = scenario.modified_at.isoformat()
        
        return json.dumps(scenario_dict, ensure_ascii=False, indent=2)
    
    def import_scenario(self, json_data: str) -> TestScenarioParameters:
        """Импортировать сценарий из JSON"""
        try:
            scenario_dict = json.loads(json_data)
            
            # Преобразуем строки обратно в datetime
            scenario_dict['created_at'] = datetime.fromisoformat(scenario_dict['created_at'])
            scenario_dict['modified_at'] = datetime.fromisoformat(scenario_dict['modified_at'])
            
            scenario = TestScenarioParameters(**scenario_dict)
            
            # Валидация параметров
            for param_name, value in scenario.parameters.items():
                is_valid, error_message = self.validate_parameter_value(param_name, value)
                if not is_valid:
                    raise ValueError(f"Ошибка валидации при импорте: {error_message}")
            
            self.saved_scenarios[scenario.scenario_id] = scenario
            return scenario
            
        except Exception as e:
            raise ValueError(f"Ошибка импорта сценария: {str(e)}")
    
    def create_parameter_preset(self, preset_name: str, category: str = None) -> Dict[str, Any]:
        """Создать предустановку параметров"""
        presets = {
            "urban_delivery": {
                "scenario_name": "Городская доставка",
                "parameters": {
                    "vehicle_speed": 40.0,
                    "max_route_distance": 200.0,
                    "max_route_duration": 360,
                    "traffic_condition": "heavy",
                    "service_time_range": [10, 20],
                    "geographic_area": [55.7558, 37.6176, 25.0]
                }
            },
            "suburban_delivery": {
                "scenario_name": "Пригородная доставка",
                "parameters": {
                    "vehicle_speed": 70.0,
                    "max_route_distance": 400.0,
                    "max_route_duration": 480,
                    "traffic_condition": "normal",
                    "service_time_range": [5, 15],
                    "geographic_area": [55.7558, 37.6176, 75.0]
                }
            },
            "heavy_cargo": {
                "scenario_name": "Тяжелые грузы",
                "parameters": {
                    "vehicle_max_weight": 5000.0,
                    "vehicle_max_volume": 50.0,
                    "vehicle_speed": 50.0,
                    "order_weight_range": [100.0, 1000.0],
                    "service_time_range": [20, 60]
                }
            },
            "express_delivery": {
                "scenario_name": "Экспресс доставка",
                "parameters": {
                    "vehicle_speed": 80.0,
                    "priority_distribution": [10, 30, 60],
                    "service_time_range": [3, 10],
                    "time_window_flexibility": 0.5,
                    "optimization_algorithm": "genetic"
                }
            },
            "weather_stress_test": {
                "scenario_name": "Тест погодных условий",
                "parameters": {
                    "weather_condition": "snow",
                    "vehicle_speed": 30.0,
                    "traffic_condition": "heavy",
                    "real_time_updates": True,
                    "weather_change_probability": 0.3
                }
            },
            "optimization_comparison": {
                "scenario_name": "Сравнение алгоритмов",
                "parameters": {
                    "num_orders": 100,
                    "genetic_population_size": 100,
                    "genetic_generations": 200,
                    "annealing_initial_temp": 2000.0
                }
            }
        }
        
        if preset_name in presets:
            return presets[preset_name]
        
        # Если предустановка не найдена, возвращаем базовые параметры для категории
        if category:
            category_params = self.get_parameter_definitions(category)
            return {
                "scenario_name": f"Сценарий {category}",
                "parameters": {
                    name: definition.default_value
                    for name, definition in category_params.items()
                }
            }
        
        return {
            "scenario_name": "Базовый сценарий",
            "parameters": {
                name: definition.default_value
                for name, definition in self.parameter_definitions.items()
                if definition.required
            }
        }
    
    def get_available_presets(self) -> List[str]:
        """Получить список доступных предустановок"""
        return [
            "urban_delivery",
            "suburban_delivery", 
            "heavy_cargo",
            "express_delivery",
            "weather_stress_test",
            "optimization_comparison"
        ]
    
    def generate_parameter_combinations(
        self,
        base_parameters: Dict[str, Any],
        variable_parameters: Dict[str, List[Any]]
    ) -> List[Dict[str, Any]]:
        """Генерировать комбинации параметров для A/B тестирования"""
        
        combinations = []
        
        def generate_recursive(params, remaining_vars, current_combination):
            if not remaining_vars:
                combination = {**base_parameters, **current_combination}
                combinations.append(combination)
                return
            
            var_name = list(remaining_vars.keys())[0]
            var_values = remaining_vars[var_name]
            remaining = {k: v for k, v in remaining_vars.items() if k != var_name}
            
            for value in var_values:
                new_combination = {**current_combination, var_name: value}
                generate_recursive(params, remaining, new_combination)
        
        generate_recursive(base_parameters, variable_parameters, {})
        return combinations