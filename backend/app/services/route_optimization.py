import math
import random
import numpy as np
from typing import List, Tuple, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import json

@dataclass
class OptimizationPoint:
    """Точка для оптимизации маршрута"""
    id: int
    lat: float
    lng: float
    address: str
    service_time: int = 15  # минуты
    time_window_start: Optional[datetime] = None
    time_window_end: Optional[datetime] = None
    weight: float = 0.0
    volume: float = 0.0
    priority: int = 1
    is_depot: bool = False

@dataclass
class VehicleConstraints:
    """Ограничения транспортного средства"""
    max_weight: float = 1000.0
    max_volume: float = 10.0
    max_distance: float = 500.0
    max_duration: int = 480  # минуты
    cost_per_km: float = 2.0
    cost_per_hour: float = 25.0
    speed_kmh: float = 60.0

@dataclass
class OptimizationResult:
    """Результат оптимизации"""
    route_sequence: List[int]
    total_distance: float
    total_duration: int
    total_cost: float
    optimization_score: float
    algorithm_used: str
    computation_time: float
    violations: List[str] = None

class RouteOptimizationService:
    """Сервис оптимизации маршрутов с различными алгоритмами"""
    
    def __init__(self):
        self.distance_cache = {}
    
    def optimize_route(
        self,
        points: List[OptimizationPoint],
        constraints: VehicleConstraints,
        algorithm: str = "nearest_neighbor",
        algorithm_params: Dict[str, Any] = None
    ) -> OptimizationResult:
        """Основной метод оптимизации маршрута"""
        
        if len(points) < 2:
            raise ValueError("Маршрут должен содержать минимум 2 точки")
        
        start_time = datetime.now()
        
        # Выбираем алгоритм оптимизации
        if algorithm == "nearest_neighbor":
            result = self._nearest_neighbor_algorithm(points, constraints)
        elif algorithm == "genetic":
            result = self._genetic_algorithm(points, constraints, algorithm_params or {})
        elif algorithm == "simulated_annealing":
            result = self._simulated_annealing(points, constraints, algorithm_params or {})
        elif algorithm == "ant_colony":
            result = self._ant_colony_optimization(points, constraints, algorithm_params or {})
        elif algorithm == "clarke_wright":
            result = self._clarke_wright_algorithm(points, constraints)
        elif algorithm == "two_opt":
            result = self._two_opt_improvement(points, constraints)
        else:
            result = self._nearest_neighbor_algorithm(points, constraints)
        
        # Рассчитываем время выполнения
        computation_time = (datetime.now() - start_time).total_seconds()
        result.computation_time = computation_time
        result.algorithm_used = algorithm
        
        return result
    
    def _nearest_neighbor_algorithm(
        self,
        points: List[OptimizationPoint],
        constraints: VehicleConstraints
    ) -> OptimizationResult:
        """Алгоритм ближайшего соседа"""
        
        if not points:
            return OptimizationResult([], 0, 0, 0, 0, "nearest_neighbor", 0)
        
        # Находим депо (начальную точку)
        depot_idx = next((i for i, p in enumerate(points) if p.is_depot), 0)
        
        unvisited = list(range(len(points)))
        unvisited.remove(depot_idx)
        
        route = [depot_idx]
        current = depot_idx
        total_distance = 0.0
        total_weight = 0.0
        total_volume = 0.0
        violations = []
        
        while unvisited:
            # Находим ближайшую доступную точку
            nearest_idx = None
            min_distance = float('inf')
            
            for idx in unvisited:
                point = points[idx]
                
                # Проверяем ограничения по весу и объему
                if (total_weight + point.weight <= constraints.max_weight and
                    total_volume + point.volume <= constraints.max_volume):
                    
                    distance = self._calculate_distance(
                        points[current].lat, points[current].lng,
                        point.lat, point.lng
                    )
                    
                    if distance < min_distance:
                        min_distance = distance
                        nearest_idx = idx
            
            if nearest_idx is None:
                # Нет доступных точек из-за ограничений
                violations.append(f"Невозможно посетить {len(unvisited)} точек из-за ограничений")
                break
            
            route.append(nearest_idx)
            unvisited.remove(nearest_idx)
            total_distance += min_distance
            total_weight += points[nearest_idx].weight
            total_volume += points[nearest_idx].volume
            current = nearest_idx
        
        # Возвращаемся в депо
        if current != depot_idx:
            return_distance = self._calculate_distance(
                points[current].lat, points[current].lng,
                points[depot_idx].lat, points[depot_idx].lng
            )
            total_distance += return_distance
            route.append(depot_idx)
        
        # Рассчитываем общие метрики
        total_duration = self._calculate_total_duration(points, route, constraints)
        total_cost = self._calculate_total_cost(total_distance, total_duration, constraints)
        optimization_score = self._calculate_optimization_score(
            total_distance, total_duration, total_cost, len(violations)
        )
        
        return OptimizationResult(
            route_sequence=route,
            total_distance=total_distance,
            total_duration=total_duration,
            total_cost=total_cost,
            optimization_score=optimization_score,
            algorithm_used="nearest_neighbor",
            computation_time=0,
            violations=violations if violations else None
        )
    
    def _genetic_algorithm(
        self,
        points: List[OptimizationPoint],
        constraints: VehicleConstraints,
        params: Dict[str, Any]
    ) -> OptimizationResult:
        """Генетический алгоритм"""
        
        population_size = params.get('population_size', 50)
        generations = params.get('generations', 100)
        mutation_rate = params.get('mutation_rate', 0.1)
        elite_size = params.get('elite_size', 10)
        
        # Находим депо
        depot_idx = next((i for i, p in enumerate(points) if p.is_depot), 0)
        delivery_points = [i for i in range(len(points)) if i != depot_idx]
        
        if not delivery_points:
            return self._nearest_neighbor_algorithm(points, constraints)
        
        # Создаем начальную популяцию
        population = []
        for _ in range(population_size):
            individual = delivery_points.copy()
            random.shuffle(individual)
            # Добавляем депо в начало и конец
            route = [depot_idx] + individual + [depot_idx]
            population.append(route)
        
        best_route = None
        best_fitness = float('inf')
        
        for generation in range(generations):
            # Оцениваем приспособленность
            fitness_scores = []
            for route in population:
                fitness = self._calculate_route_fitness(points, route, constraints)
                fitness_scores.append(fitness)
                
                if fitness < best_fitness:
                    best_fitness = fitness
                    best_route = route.copy()
            
            # Селекция элиты
            elite_indices = sorted(range(len(fitness_scores)), key=lambda i: fitness_scores[i])[:elite_size]
            elite = [population[i] for i in elite_indices]
            
            # Создаем новую популяцию
            new_population = elite.copy()
            
            while len(new_population) < population_size:
                # Турнирная селекция
                parent1 = self._tournament_selection(population, fitness_scores)
                parent2 = self._tournament_selection(population, fitness_scores)
                
                # Скрещивание
                child = self._crossover(parent1, parent2, depot_idx)
                
                # Мутация
                if random.random() < mutation_rate:
                    child = self._mutate(child, depot_idx)
                
                new_population.append(child)
            
            population = new_population
        
        # Рассчитываем метрики лучшего маршрута
        total_distance = self._calculate_route_distance(points, best_route)
        total_duration = self._calculate_total_duration(points, best_route, constraints)
        total_cost = self._calculate_total_cost(total_distance, total_duration, constraints)
        optimization_score = self._calculate_optimization_score(
            total_distance, total_duration, total_cost, 0
        )
        
        return OptimizationResult(
            route_sequence=best_route,
            total_distance=total_distance,
            total_duration=total_duration,
            total_cost=total_cost,
            optimization_score=optimization_score,
            algorithm_used="genetic",
            computation_time=0
        )
    
    def _simulated_annealing(
        self,
        points: List[OptimizationPoint],
        constraints: VehicleConstraints,
        params: Dict[str, Any]
    ) -> OptimizationResult:
        """Алгоритм имитации отжига"""
        
        initial_temp = params.get('initial_temperature', 1000.0)
        final_temp = params.get('final_temperature', 1.0)
        cooling_rate = params.get('cooling_rate', 0.95)
        max_iterations = params.get('max_iterations', 1000)
        
        # Начинаем с решения ближайшего соседа
        current_solution = self._nearest_neighbor_algorithm(points, constraints)
        current_route = current_solution.route_sequence
        current_cost = current_solution.total_cost
        
        best_route = current_route.copy()
        best_cost = current_cost
        
        temperature = initial_temp
        
        for iteration in range(max_iterations):
            if temperature < final_temp:
                break
            
            # Создаем соседнее решение (2-opt swap)
            new_route = self._generate_neighbor_solution(current_route)
            new_distance = self._calculate_route_distance(points, new_route)
            new_duration = self._calculate_total_duration(points, new_route, constraints)
            new_cost = self._calculate_total_cost(new_distance, new_duration, constraints)
            
            # Принимаем или отклоняем новое решение
            delta = new_cost - current_cost
            
            if delta < 0 or random.random() < math.exp(-delta / temperature):
                current_route = new_route
                current_cost = new_cost
                
                if new_cost < best_cost:
                    best_route = new_route.copy()
                    best_cost = new_cost
            
            temperature *= cooling_rate
        
        # Рассчитываем финальные метрики
        total_distance = self._calculate_route_distance(points, best_route)
        total_duration = self._calculate_total_duration(points, best_route, constraints)
        optimization_score = self._calculate_optimization_score(
            total_distance, total_duration, best_cost, 0
        )
        
        return OptimizationResult(
            route_sequence=best_route,
            total_distance=total_distance,
            total_duration=total_duration,
            total_cost=best_cost,
            optimization_score=optimization_score,
            algorithm_used="simulated_annealing",
            computation_time=0
        )
    
    def _ant_colony_optimization(
        self,
        points: List[OptimizationPoint],
        constraints: VehicleConstraints,
        params: Dict[str, Any]
    ) -> OptimizationResult:
        """Алгоритм муравьиной колонии (упрощенная версия)"""
        
        num_ants = params.get('num_ants', 20)
        num_iterations = params.get('num_iterations', 100)
        alpha = params.get('alpha', 1.0)  # важность феромона
        beta = params.get('beta', 2.0)   # важность расстояния
        evaporation_rate = params.get('evaporation_rate', 0.1)
        
        n = len(points)
        
        # Инициализация матрицы феромонов
        pheromone = np.ones((n, n)) * 0.1
        
        # Матрица расстояний
        distances = np.zeros((n, n))
        for i in range(n):
            for j in range(n):
                if i != j:
                    distances[i][j] = self._calculate_distance(
                        points[i].lat, points[i].lng,
                        points[j].lat, points[j].lng
                    )
        
        best_route = None
        best_distance = float('inf')
        
        depot_idx = next((i for i, p in enumerate(points) if p.is_depot), 0)
        
        for iteration in range(num_iterations):
            routes = []
            route_distances = []
            
            for ant in range(num_ants):
                route = self._construct_ant_route(
                    points, distances, pheromone, alpha, beta, depot_idx
                )
                distance = self._calculate_route_distance(points, route)
                
                routes.append(route)
                route_distances.append(distance)
                
                if distance < best_distance:
                    best_distance = distance
                    best_route = route.copy()
            
            # Обновление феромонов
            pheromone *= (1 - evaporation_rate)
            
            for route, distance in zip(routes, route_distances):
                pheromone_deposit = 1.0 / distance
                for i in range(len(route) - 1):
                    pheromone[route[i]][route[i + 1]] += pheromone_deposit
        
        # Рассчитываем метрики
        total_distance = self._calculate_route_distance(points, best_route)
        total_duration = self._calculate_total_duration(points, best_route, constraints)
        total_cost = self._calculate_total_cost(total_distance, total_duration, constraints)
        optimization_score = self._calculate_optimization_score(
            total_distance, total_duration, total_cost, 0
        )
        
        return OptimizationResult(
            route_sequence=best_route,
            total_distance=total_distance,
            total_duration=total_duration,
            total_cost=total_cost,
            optimization_score=optimization_score,
            algorithm_used="ant_colony",
            computation_time=0
        )
    
    def _clarke_wright_algorithm(
        self,
        points: List[OptimizationPoint],
        constraints: VehicleConstraints
    ) -> OptimizationResult:
        """Алгоритм Кларка-Райта для экономии"""
        
        depot_idx = next((i for i, p in enumerate(points) if p.is_depot), 0)
        customers = [i for i in range(len(points)) if i != depot_idx]
        
        if not customers:
            return self._nearest_neighbor_algorithm(points, constraints)
        
        # Рассчитываем экономию для каждой пары клиентов
        savings = []
        for i in range(len(customers)):
            for j in range(i + 1, len(customers)):
                customer_i = customers[i]
                customer_j = customers[j]
                
                dist_depot_i = self._calculate_distance(
                    points[depot_idx].lat, points[depot_idx].lng,
                    points[customer_i].lat, points[customer_i].lng
                )
                dist_depot_j = self._calculate_distance(
                    points[depot_idx].lat, points[depot_idx].lng,
                    points[customer_j].lat, points[customer_j].lng
                )
                dist_i_j = self._calculate_distance(
                    points[customer_i].lat, points[customer_i].lng,
                    points[customer_j].lat, points[customer_j].lng
                )
                
                saving = dist_depot_i + dist_depot_j - dist_i_j
                savings.append((saving, customer_i, customer_j))
        
        # Сортируем по убыванию экономии
        savings.sort(reverse=True)
        
        # Создаем маршруты
        routes = {customer: [depot_idx, customer, depot_idx] for customer in customers}
        
        for saving, i, j in savings:
            if saving <= 0:
                break
            
            # Проверяем, можно ли объединить маршруты
            route_i = None
            route_j = None
            
            for customer, route in routes.items():
                if i in route and customer == i:
                    route_i = route
                if j in route and customer == j:
                    route_j = route
            
            if route_i and route_j and route_i != route_j:
                # Проверяем ограничения
                combined_weight = sum(points[idx].weight for idx in route_i + route_j if idx != depot_idx)
                combined_volume = sum(points[idx].volume for idx in route_i + route_j if idx != depot_idx)
                
                if (combined_weight <= constraints.max_weight and
                    combined_volume <= constraints.max_volume):
                    
                    # Объединяем маршруты
                    new_route = [depot_idx] + [idx for idx in route_i + route_j if idx != depot_idx] + [depot_idx]
                    
                    # Удаляем старые маршруты
                    del routes[i]
                    del routes[j]
                    
                    # Добавляем новый маршрут
                    routes[new_route[1]] = new_route
        
        # Выбираем лучший маршрут (самый длинный или с наименьшей стоимостью)
        best_route = max(routes.values(), key=len)
        
        # Рассчитываем метрики
        total_distance = self._calculate_route_distance(points, best_route)
        total_duration = self._calculate_total_duration(points, best_route, constraints)
        total_cost = self._calculate_total_cost(total_distance, total_duration, constraints)
        optimization_score = self._calculate_optimization_score(
            total_distance, total_duration, total_cost, 0
        )
        
        return OptimizationResult(
            route_sequence=best_route,
            total_distance=total_distance,
            total_duration=total_duration,
            total_cost=total_cost,
            optimization_score=optimization_score,
            algorithm_used="clarke_wright",
            computation_time=0
        )
    
    def _two_opt_improvement(
        self,
        points: List[OptimizationPoint],
        constraints: VehicleConstraints
    ) -> OptimizationResult:
        """Улучшение маршрута методом 2-opt"""
        
        # Начинаем с решения ближайшего соседа
        initial_solution = self._nearest_neighbor_algorithm(points, constraints)
        route = initial_solution.route_sequence.copy()
        
        improved = True
        while improved:
            improved = False
            best_distance = self._calculate_route_distance(points, route)
            
            for i in range(1, len(route) - 2):
                for j in range(i + 1, len(route) - 1):
                    # Создаем новый маршрут с обращенным сегментом
                    new_route = route[:i] + route[i:j+1][::-1] + route[j+1:]
                    new_distance = self._calculate_route_distance(points, new_route)
                    
                    if new_distance < best_distance:
                        route = new_route
                        best_distance = new_distance
                        improved = True
                        break
                
                if improved:
                    break
        
        # Рассчитываем финальные метрики
        total_distance = self._calculate_route_distance(points, route)
        total_duration = self._calculate_total_duration(points, route, constraints)
        total_cost = self._calculate_total_cost(total_distance, total_duration, constraints)
        optimization_score = self._calculate_optimization_score(
            total_distance, total_duration, total_cost, 0
        )
        
        return OptimizationResult(
            route_sequence=route,
            total_distance=total_distance,
            total_duration=total_duration,
            total_cost=total_cost,
            optimization_score=optimization_score,
            algorithm_used="two_opt",
            computation_time=0
        )
    
    # Вспомогательные методы
    
    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Расчет расстояния между двумя точками"""
        cache_key = f"{lat1},{lng1},{lat2},{lng2}"
        if cache_key in self.distance_cache:
            return self.distance_cache[cache_key]
        
        R = 6371  # Радиус Земли в км
        
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        
        a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlng / 2) * math.sin(dlng / 2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c
        
        self.distance_cache[cache_key] = distance
        return distance
    
    def _calculate_route_distance(self, points: List[OptimizationPoint], route: List[int]) -> float:
        """Расчет общего расстояния маршрута"""
        total_distance = 0.0
        for i in range(len(route) - 1):
            total_distance += self._calculate_distance(
                points[route[i]].lat, points[route[i]].lng,
                points[route[i + 1]].lat, points[route[i + 1]].lng
            )
        return total_distance
    
    def _calculate_total_duration(
        self,
        points: List[OptimizationPoint],
        route: List[int],
        constraints: VehicleConstraints
    ) -> int:
        """Расчет общего времени маршрута"""
        total_duration = 0
        
        for i in range(len(route) - 1):
            # Время в пути
            distance = self._calculate_distance(
                points[route[i]].lat, points[route[i]].lng,
                points[route[i + 1]].lat, points[route[i + 1]].lng
            )
            travel_time = (distance / constraints.speed_kmh) * 60  # минуты
            total_duration += travel_time
            
            # Время обслуживания
            if i < len(route) - 1:  # Не добавляем время обслуживания для последней точки
                total_duration += points[route[i + 1]].service_time
        
        return int(total_duration)
    
    def _calculate_total_cost(
        self,
        distance: float,
        duration: int,
        constraints: VehicleConstraints
    ) -> float:
        """Расчет общей стоимости маршрута"""
        distance_cost = distance * constraints.cost_per_km
        time_cost = (duration / 60) * constraints.cost_per_hour
        return distance_cost + time_cost
    
    def _calculate_optimization_score(
        self,
        distance: float,
        duration: int,
        cost: float,
        violations: int
    ) -> float:
        """Расчет оценки оптимизации (чем меньше, тем лучше)"""
        base_score = distance * 0.4 + (duration / 60) * 0.3 + cost * 0.3
        penalty = violations * 100
        return base_score + penalty
    
    def _calculate_route_fitness(
        self,
        points: List[OptimizationPoint],
        route: List[int],
        constraints: VehicleConstraints
    ) -> float:
        """Расчет приспособленности маршрута для генетического алгоритма"""
        distance = self._calculate_route_distance(points, route)
        duration = self._calculate_total_duration(points, route, constraints)
        cost = self._calculate_total_cost(distance, duration, constraints)
        
        # Проверяем нарушения ограничений
        violations = 0
        total_weight = sum(points[i].weight for i in route)
        total_volume = sum(points[i].volume for i in route)
        
        if total_weight > constraints.max_weight:
            violations += 1
        if total_volume > constraints.max_volume:
            violations += 1
        if distance > constraints.max_distance:
            violations += 1
        if duration > constraints.max_duration:
            violations += 1
        
        return self._calculate_optimization_score(distance, duration, cost, violations)
    
    def _tournament_selection(self, population: List[List[int]], fitness_scores: List[float]) -> List[int]:
        """Турнирная селекция для генетического алгоритма"""
        tournament_size = 3
        tournament_indices = random.sample(range(len(population)), tournament_size)
        best_idx = min(tournament_indices, key=lambda i: fitness_scores[i])
        return population[best_idx]
    
    def _crossover(self, parent1: List[int], parent2: List[int], depot_idx: int) -> List[int]:
        """Скрещивание для генетического алгоритма (Order Crossover)"""
        # Исключаем депо из скрещивания
        p1_genes = [gene for gene in parent1 if gene != depot_idx]
        p2_genes = [gene for gene in parent2 if gene != depot_idx]
        
        if len(p1_genes) < 2:
            return parent1
        
        # Выбираем случайный сегмент из первого родителя
        start = random.randint(0, len(p1_genes) - 1)
        end = random.randint(start, len(p1_genes) - 1)
        
        child_genes = [None] * len(p1_genes)
        child_genes[start:end+1] = p1_genes[start:end+1]
        
        # Заполняем оставшиеся позиции генами из второго родителя
        p2_remaining = [gene for gene in p2_genes if gene not in child_genes]
        
        j = 0
        for i in range(len(child_genes)):
            if child_genes[i] is None:
                child_genes[i] = p2_remaining[j]
                j += 1
        
        # Добавляем депо в начало и конец
        return [depot_idx] + child_genes + [depot_idx]
    
    def _mutate(self, individual: List[int], depot_idx: int) -> List[int]:
        """Мутация для генетического алгоритма"""
        genes = [gene for gene in individual if gene != depot_idx]
        
        if len(genes) < 2:
            return individual
        
        # Случайная перестановка двух генов
        i, j = random.sample(range(len(genes)), 2)
        genes[i], genes[j] = genes[j], genes[i]
        
        return [depot_idx] + genes + [depot_idx]
    
    def _generate_neighbor_solution(self, route: List[int]) -> List[int]:
        """Генерация соседнего решения для имитации отжига"""
        new_route = route.copy()
        
        if len(new_route) < 4:  # Нужно минимум 4 точки для 2-opt
            return new_route
        
        # 2-opt swap
        i = random.randint(1, len(new_route) - 3)
        j = random.randint(i + 1, len(new_route) - 2)
        
        new_route[i:j+1] = new_route[i:j+1][::-1]
        return new_route
    
    def _construct_ant_route(
        self,
        points: List[OptimizationPoint],
        distances: np.ndarray,
        pheromone: np.ndarray,
        alpha: float,
        beta: float,
        depot_idx: int
    ) -> List[int]:
        """Построение маршрута муравьем"""
        n = len(points)
        unvisited = set(range(n))
        unvisited.remove(depot_idx)
        
        route = [depot_idx]
        current = depot_idx
        
        while unvisited:
            probabilities = []
            total_prob = 0
            
            for next_city in unvisited:
                if distances[current][next_city] > 0:
                    prob = (pheromone[current][next_city] ** alpha) * \
                           ((1.0 / distances[current][next_city]) ** beta)
                    probabilities.append((next_city, prob))
                    total_prob += prob
            
            if not probabilities:
                break
            
            # Рулеточная селекция
            rand = random.random() * total_prob
            cumulative_prob = 0
            
            for city, prob in probabilities:
                cumulative_prob += prob
                if rand <= cumulative_prob:
                    route.append(city)
                    unvisited.remove(city)
                    current = city
                    break
        
        route.append(depot_idx)
        return route
    
    def __init__(self):
        self.distance_cache = {}
    
    def calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Публичный метод для расчета расстояния между двумя точками"""
        return self._calculate_distance(lat1, lng1, lat2, lng2)
    
    async def optimize_nearest_neighbor(self, points: List[Dict], constraints: Dict) -> Dict:
        """Публичный асинхронный метод для оптимизации ближайшим соседом"""
        # Преобразуем входные данные в нужный формат
        optimization_points = []
        for i, point in enumerate(points):
            opt_point = OptimizationPoint(
                id=i,
                lat=point.get("lat", 0.0),
                lng=point.get("lng", 0.0),
                address=point.get("address", f"Point {i}"),
                service_time=point.get("service_time", 15),
                weight=point.get("demand", 0.0),
                is_depot=(point.get("id") == "depot")
            )
            optimization_points.append(opt_point)
        
        # Преобразуем ограничения
        vehicle_constraints = VehicleConstraints(
            max_weight=constraints.get("capacity", 1000.0),
            max_distance=constraints.get("max_distance", 500.0),
            max_duration=constraints.get("max_time", 480),
            speed_kmh=constraints.get("speed_kmh", 60.0)
        )
        
        # Выполняем оптимизацию
        result = self._nearest_neighbor_algorithm(optimization_points, vehicle_constraints)
        
        # Возвращаем результат в виде словаря
        return {
            "route_sequence": result.route_sequence,
            "total_distance": result.total_distance,
            "total_duration": result.total_duration,
            "total_cost": result.total_cost,
            "optimization_score": result.optimization_score,
            "algorithm_used": result.algorithm_used,
            "computation_time": result.computation_time
        }