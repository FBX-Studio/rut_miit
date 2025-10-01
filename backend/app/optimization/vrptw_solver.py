import numpy as np
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import logging
import time
from concurrent.futures import ThreadPoolExecutor

from app.models import Order, Vehicle, Driver, Route, RouteStop
from app.core.config import settings
from app.core.cache import distance_cache, cache_result
from app.core.exceptions import (
    NoFeasibleSolutionException,
    InvalidInputException,
    TimeWindowViolationException,
    CapacityViolationException
)

logger = logging.getLogger(__name__)

class SAAVObjective:
    """
    Slot-Aware Adaptive VRPTW Objective Function
    Implements: minimize α×travel_cost + β×waiting_time + γ×adaptations
    """
    
    def __init__(self, alpha: float = 0.6, beta: float = 0.3, gamma: float = 0.1):
        """
        Initialize SAAV objective weights
        
        Args:
            alpha: Weight for travel cost (distance/time)
            beta: Weight for waiting time penalties
            gamma: Weight for adaptation penalties
        """
        self.alpha = alpha  # Travel cost weight
        self.beta = beta    # Waiting time weight  
        self.gamma = gamma  # Adaptation weight
        
        # Ensure weights sum to 1.0
        total = alpha + beta + gamma
        self.alpha /= total
        self.beta /= total
        self.gamma /= total
        
    def calculate_objective(
        self, 
        travel_cost: float, 
        waiting_time: float, 
        adaptations: int = 0,
        base_cost: float = 1000.0
    ) -> float:
        """
        Calculate SAAV objective value
        
        Args:
            travel_cost: Total travel distance/time cost
            waiting_time: Total waiting time penalties
            adaptations: Number of route adaptations made
            base_cost: Base cost for normalization
            
        Returns:
            Weighted objective value
        """
        # Normalize components
        normalized_travel = travel_cost / base_cost
        normalized_waiting = waiting_time / (base_cost * 0.1)  # Waiting typically smaller
        normalized_adaptations = adaptations / 10.0  # Assume max 10 adaptations
        
        objective = (
            self.alpha * normalized_travel +
            self.beta * normalized_waiting +
            self.gamma * normalized_adaptations
        )
        
        return objective

class VRPTWSolver:
    """
    Slot-Aware Adaptive VRPTW Solver using OR-Tools
    Implements both static morning planning and adaptive reoptimization
    """
    
    def __init__(self, objective_weights: Tuple[float, float, float] = (0.6, 0.3, 0.1)):
        self.distance_matrix = None
        self.time_matrix = None
        self.orders = []
        self.vehicles = []
        self.drivers = []
        self.depot_location = (55.7558, 37.6176)  # Moscow coordinates
        self.saav_objective = SAAVObjective(*objective_weights)
        self.adaptation_count = 0
        self.use_cache = True
        self.executor = ThreadPoolExecutor(max_workers=4)
        
    def solve_static_routes(
        self, 
        orders: List[Order], 
        vehicles: List[Vehicle], 
        drivers: List[Driver],
        depot_coords: Tuple[float, float] = None
    ) -> Dict:
        """
        Solve static VRPTW problem for morning route planning
        
        Args:
            orders: List of orders to be delivered
            vehicles: Available vehicles
            drivers: Available drivers
            depot_coords: Depot coordinates (lat, lon)
            
        Returns:
            Dictionary with optimized routes and metrics
            
        Raises:
            InvalidInputException: If input data is invalid
            NoFeasibleSolutionException: If no solution can be found
        """
        start_time = time.time()
        logger.info(f"Starting static VRPTW optimization for {len(orders)} orders")
        
        # Validate inputs
        self._validate_inputs(orders, vehicles, drivers)
        
        if depot_coords:
            self.depot_location = depot_coords
            
        self.orders = orders
        self.vehicles = vehicles[:settings.max_vehicles]  # Limit vehicles
        self.drivers = drivers
        
        try:
            # Build distance and time matrices with caching
            self._build_matrices()
            
            # Create routing model
            manager, routing, solution = self._create_and_solve_model()
            
            if solution:
                routes = self._extract_routes(manager, routing, solution)
                metrics = self._calculate_metrics(solution, routing)
                
                elapsed_time = time.time() - start_time
                metrics['computation_time'] = elapsed_time
                
                logger.info(
                    f"Static optimization completed in {elapsed_time:.2f}s. "
                    f"Total cost: {metrics['total_cost']}, "
                    f"SAAV objective: {metrics['saav_objective']:.3f}"
                )
                
                return {
                    "success": True,
                    "routes": routes,
                    "metrics": metrics,
                    "optimization_type": "static"
                }
            else:
                logger.error("No solution found for static VRPTW problem")
                raise NoFeasibleSolutionException(
                    "No feasible solution found for the given constraints",
                    details={
                        "num_orders": len(orders),
                        "num_vehicles": len(vehicles),
                        "num_drivers": len(drivers)
                    }
                )
                
        except NoFeasibleSolutionException:
            raise
        except Exception as e:
            logger.error(f"Optimization failed: {e}", exc_info=True)
            raise NoFeasibleSolutionException(
                f"Optimization failed: {str(e)}",
                details={"error_type": type(e).__name__}
            )
    
    def local_reoptimization(
        self,
        current_routes: List[Route],
        affected_orders: List[int],
        event_data: Dict
    ) -> Dict:
        """
        Perform local reoptimization using 2-opt/3-opt for adaptive changes
        
        Args:
            current_routes: Current active routes
            affected_orders: Order IDs affected by the event
            event_data: Event information for context
            
        Returns:
            Dictionary with reoptimized routes
        """
        logger.info(f"Starting local reoptimization for {len(affected_orders)} affected orders")
        
        # Increment adaptation counter for SAAV objective
        self.adaptation_count += 1
        
        # Filter routes that need reoptimization
        routes_to_optimize = [r for r in current_routes if self._route_needs_reoptimization(r, affected_orders)]
        
        if not routes_to_optimize:
            return {"success": True, "routes": current_routes, "changes": []}
        
        optimized_routes = []
        changes = []
        total_improvement = 0
        
        for route in routes_to_optimize:
            # Get unvisited stops
            unvisited_stops = [stop for stop in route.route_stops if stop.status == "pending"]
            
            if len(unvisited_stops) <= 1:
                optimized_routes.append(route)
                continue
            
            # Apply local optimization
            improved_sequence = self._apply_local_optimization(unvisited_stops, event_data)
            
            if improved_sequence:
                # Update route with new sequence
                updated_route = self._update_route_sequence(route, improved_sequence)
                optimized_routes.append(updated_route)
                improvement = improved_sequence.get("improvement", 0)
                total_improvement += improvement
                changes.append({
                    "route_id": route.id,
                    "type": "sequence_updated",
                    "improvement": improvement
                })
            else:
                optimized_routes.append(route)
        
        # Calculate SAAV objective for the reoptimization
        total_distance = sum(self._calculate_route_distance(route.route_stops) for route in optimized_routes)
        saav_objective = self.saav_objective.calculate_objective(
            travel_cost=total_distance,
            waiting_time=0,  # Simplified for local reoptimization
            adaptations=self.adaptation_count
        )
        
        logger.info(f"Local reoptimization completed with {len(changes)} changes, SAAV objective: {saav_objective:.3f}")
        return {
            "success": True,
            "routes": optimized_routes,
            "changes": changes,
            "optimization_type": "adaptive",
            "saav_objective": saav_objective,
            "total_improvement": total_improvement,
            "adaptation_count": self.adaptation_count
        }
    
    def _validate_inputs(self, orders: List[Order], vehicles: List[Vehicle], drivers: List[Driver]):
        """
        Validate input data for optimization
        
        Raises:
            InvalidInputException: If validation fails
        """
        if not orders:
            raise InvalidInputException("No orders provided")
        
        if not vehicles:
            raise InvalidInputException("No vehicles provided")
            
        if not drivers:
            raise InvalidInputException("No drivers provided")
        
        # Validate orders
        for order in orders:
            if not hasattr(order, 'delivery_latitude') or not hasattr(order, 'delivery_longitude'):
                raise InvalidInputException(f"Order {order.id} missing location coordinates")
                
            if not hasattr(order, 'time_window_start') or not hasattr(order, 'time_window_end'):
                raise InvalidInputException(f"Order {order.id} missing time window")
                
            if order.time_window_start >= order.time_window_end:
                raise TimeWindowViolationException(
                    f"Order {order.id} has invalid time window",
                    details={"start": str(order.time_window_start), "end": str(order.time_window_end)}
                )
        
        # Validate vehicles
        total_capacity = sum(v.max_weight_capacity for v in vehicles)
        total_demand = sum(o.weight for o in orders)
        
        if total_capacity < total_demand:
            raise CapacityViolationException(
                "Total vehicle capacity is insufficient for all orders",
                details={"total_capacity": total_capacity, "total_demand": total_demand}
            )
    
    def _build_matrices(self):
        """Build distance and time matrices for all locations with caching"""
        locations = [self.depot_location]
        
        # Add order locations
        for order in self.orders:
            locations.append((order.delivery_latitude, order.delivery_longitude))
        
        # Try to get from cache if enabled
        if self.use_cache:
            cached_matrix = distance_cache.get_matrix(locations)
            if cached_matrix is not None:
                logger.debug("Using cached distance matrix")
                self.distance_matrix = cached_matrix
                self._build_time_matrix_from_distance()
                return
        
        num_locations = len(locations)
        self.distance_matrix = np.zeros((num_locations, num_locations))
        
        # Calculate distances in parallel for better performance
        def calculate_distance_row(i):
            row = np.zeros(num_locations)
            lat1, lon1 = locations[i]
            for j in range(num_locations):
                if i == j:
                    row[j] = 0
                else:
                    lat2, lon2 = locations[j]
                    row[j] = self._haversine_distance(lat1, lon1, lat2, lon2)
            return i, row
        
        # Use thread pool for parallel computation
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(calculate_distance_row, i) for i in range(num_locations)]
            for future in futures:
                i, row = future.result()
                self.distance_matrix[i] = row
        
        # Cache the distance matrix
        if self.use_cache:
            distance_cache.set_matrix(locations, self.distance_matrix)
            logger.debug("Distance matrix cached")
        
        # Build time matrix from distance matrix
        self._build_time_matrix_from_distance()
    
    def _build_time_matrix_from_distance(self):
        """Build time matrix from distance matrix"""
        # Assume average speed of 40 km/h in city
        self.time_matrix = (self.distance_matrix / 40 * 60).astype(int)  # minutes
    
    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate Haversine distance between two points"""
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = np.radians(lat1)
        lat2_rad = np.radians(lat2)
        delta_lat = np.radians(lat2 - lat1)
        delta_lon = np.radians(lon2 - lon1)
        
        a = (np.sin(delta_lat / 2) ** 2 + 
             np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(delta_lon / 2) ** 2)
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
        
        return R * c
    
    def _create_and_solve_model(self):
        """Create and solve the VRPTW model using OR-Tools"""
        num_vehicles = len(self.vehicles)
        num_locations = len(self.orders) + 1  # +1 for depot
        
        # Create routing index manager
        manager = pywrapcp.RoutingIndexManager(num_locations, num_vehicles, 0)
        
        # Create routing model
        routing = pywrapcp.RoutingModel(manager)
        
        # Add distance callback
        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return int(self.distance_matrix[from_node][to_node] * 100)  # Scale for integer
        
        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        
        # Add time callback
        def time_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return int(self.time_matrix[from_node][to_node])
        
        time_callback_index = routing.RegisterTransitCallback(time_callback)
        
        # Add time window constraints
        time_dimension_name = 'Time'
        routing.AddDimension(
            time_callback_index,
            30,  # allow waiting time
            1440,  # maximum time per vehicle (24 hours in minutes)
            False,  # Don't force start cumul to zero
            time_dimension_name
        )
        time_dimension = routing.GetDimensionOrDie(time_dimension_name)
        
        # Add time window constraints for each order
        for order_idx, order in enumerate(self.orders):
            index = manager.NodeToIndex(order_idx + 1)  # +1 because depot is 0
            
            # Convert datetime to minutes from start of day
            start_minutes = order.time_window_start.hour * 60 + order.time_window_start.minute
            end_minutes = order.time_window_end.hour * 60 + order.time_window_end.minute
            
            time_dimension.CumulVar(index).SetRange(start_minutes, end_minutes)
        
        # Add capacity constraints
        def demand_callback(from_index):
            from_node = manager.IndexToNode(from_index)
            if from_node == 0:  # depot
                return 0
            return int(self.orders[from_node - 1].weight * 10)  # Scale weight
        
        demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
        routing.AddDimensionWithVehicleCapacity(
            demand_callback_index,
            0,  # null capacity slack
            [int(vehicle.max_weight_capacity * 10) for vehicle in self.vehicles],  # vehicle capacities
            True,  # start cumul to zero
            'Capacity'
        )
        
        # Add driver experience constraints
        for vehicle_idx, (vehicle, driver) in enumerate(zip(self.vehicles, self.drivers)):
            # Limit number of stops based on driver experience
            routing.solver().Add(
                routing.GetDimensionOrDie('Capacity').CumulVar(
                    routing.End(vehicle_idx)
                ) <= driver.max_stops_per_route
            )
        
        # Set search parameters
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.FromSeconds(30)  # 30 second limit
        
        # Solve the problem
        solution = routing.SolveWithParameters(search_parameters)
        
        return manager, routing, solution
    
    def _extract_routes(self, manager, routing, solution) -> List[Dict]:
        """Extract route information from the solution"""
        routes = []
        
        for vehicle_id in range(len(self.vehicles)):
            route_data = {
                "vehicle_id": self.vehicles[vehicle_id].id,
                "driver_id": self.drivers[vehicle_id].id,
                "stops": [],
                "total_distance": 0,
                "total_time": 0,
                "total_load": 0
            }
            
            index = routing.Start(vehicle_id)
            route_distance = 0
            route_load = 0
            
            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                
                if node_index == 0:  # depot
                    route_data["stops"].append({
                        "type": "depot",
                        "location": self.depot_location,
                        "order_id": None
                    })
                else:
                    order = self.orders[node_index - 1]
                    route_data["stops"].append({
                        "type": "delivery",
                        "location": (order.delivery_latitude, order.delivery_longitude),
                        "order_id": order.id,
                        "time_window": (order.time_window_start, order.time_window_end),
                        "service_time": order.estimated_service_time
                    })
                    route_load += order.weight
                
                previous_index = index
                index = solution.Value(routing.NextVar(index))
                route_distance += routing.GetArcCostForVehicle(previous_index, index, vehicle_id)
            
            # Add final depot
            route_data["stops"].append({
                "type": "depot",
                "location": self.depot_location,
                "order_id": None
            })
            
            route_data["total_distance"] = route_distance / 100  # Unscale
            route_data["total_load"] = route_load
            
            if len(route_data["stops"]) > 2:  # More than just start and end depot
                routes.append(route_data)
        
        return routes
    
    def _calculate_metrics(self, solution, routing) -> Dict:
        """Calculate optimization metrics with SAAV objective"""
        total_distance = 0
        total_time = 0
        total_waiting_time = 0
        
        for vehicle_id in range(len(self.vehicles)):
            index = routing.Start(vehicle_id)
            route_distance = 0
            route_waiting = 0
            
            while not routing.IsEnd(index):
                previous_index = index
                index = solution.Value(routing.NextVar(index))
                route_distance += routing.GetArcCostForVehicle(previous_index, index, vehicle_id)
                
                # Calculate waiting time penalties
                node_index = routing.IndexToNode(index)
                if node_index > 0:  # Not depot
                    order = self.orders[node_index - 1]
                    # Simplified waiting time calculation
                    # In real implementation, would use time variables from OR-Tools
                    route_waiting += max(0, order.time_window_start.hour - 9) * 60  # Penalty for early windows
            
            total_distance += route_distance
            total_waiting_time += route_waiting
        
        # Calculate SAAV objective
        travel_cost = total_distance / 100  # Unscale
        saav_objective = self.saav_objective.calculate_objective(
            travel_cost=travel_cost,
            waiting_time=total_waiting_time,
            adaptations=self.adaptation_count
        )
        
        return {
            "total_cost": solution.ObjectiveValue(),
            "saav_objective": saav_objective,
            "total_distance": travel_cost,
            "total_time": total_time,
            "total_waiting_time": total_waiting_time,
            "adaptation_count": self.adaptation_count,
            "vehicles_used": len([r for r in self._extract_routes(None, routing, solution) if r]),
            "orders_assigned": len(self.orders),
            "objective_components": {
                "travel_cost": travel_cost,
                "waiting_time": total_waiting_time,
                "adaptations": self.adaptation_count,
                "weights": {
                    "alpha": self.saav_objective.alpha,
                    "beta": self.saav_objective.beta,
                    "gamma": self.saav_objective.gamma
                }
            }
        }
    
    def _route_needs_reoptimization(self, route: Route, affected_orders: List[int]) -> bool:
        """Check if route needs reoptimization based on affected orders"""
        route_order_ids = [stop.order_id for stop in route.route_stops if stop.order_id]
        return any(order_id in affected_orders for order_id in route_order_ids)
    
    def _apply_local_optimization(self, stops: List[RouteStop], event_data: Dict) -> Optional[Dict]:
        """Apply 2-opt or 3-opt local optimization to route stops"""
        if len(stops) < 3:
            return None
        
        # Simple 2-opt implementation
        best_distance = self._calculate_route_distance(stops)
        best_sequence = stops.copy()
        improved = False
        
        for i in range(1, len(stops) - 1):
            for j in range(i + 1, len(stops)):
                # Create new sequence by reversing segment between i and j
                new_sequence = stops[:i] + stops[i:j+1][::-1] + stops[j+1:]
                new_distance = self._calculate_route_distance(new_sequence)
                
                if new_distance < best_distance:
                    best_distance = new_distance
                    best_sequence = new_sequence
                    improved = True
        
        if improved:
            return {
                "sequence": best_sequence,
                "improvement": (self._calculate_route_distance(stops) - best_distance),
                "method": "2-opt"
            }
        
        return None
    
    def _calculate_route_distance(self, stops: List[RouteStop]) -> float:
        """Calculate total distance for a sequence of stops"""
        total_distance = 0
        
        for i in range(len(stops) - 1):
            lat1, lon1 = stops[i].latitude, stops[i].longitude
            lat2, lon2 = stops[i + 1].latitude, stops[i + 1].longitude
            total_distance += self._haversine_distance(lat1, lon1, lat2, lon2)
        
        return total_distance
    
    def _update_route_sequence(self, route: Route, improved_sequence: Dict) -> Route:
        """Update route with new optimized sequence"""
        new_stops = improved_sequence["sequence"]
        
        # Update stop sequences
        for idx, stop in enumerate(new_stops):
            stop.stop_sequence = idx
        
        # Recalculate route metrics
        route.total_distance = self._calculate_route_distance(new_stops)
        route.reoptimization_count += 1
        route.optimization_type = "adaptive"
        
        return route