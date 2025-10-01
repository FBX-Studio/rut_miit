"""
Unit tests for VRPTW Solver
"""

import pytest
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from app.optimization.vrptw_solver import VRPTWSolver, SAAVObjective
from app.core.exceptions import (
    InvalidInputException,
    NoFeasibleSolutionException,
    TimeWindowViolationException,
    CapacityViolationException
)


class TestSAAVObjective:
    """Tests for SAAV Objective Function"""
    
    def test_initialization(self):
        """Test objective function initialization"""
        objective = SAAVObjective(alpha=0.6, beta=0.3, gamma=0.1)
        
        # Weights should sum to 1.0
        assert pytest.approx(objective.alpha + objective.beta + objective.gamma, 0.01) == 1.0
        
    def test_calculate_objective(self):
        """Test objective calculation"""
        objective = SAAVObjective(alpha=0.6, beta=0.3, gamma=0.1)
        
        result = objective.calculate_objective(
            travel_cost=1000.0,
            waiting_time=100.0,
            adaptations=2
        )
        
        assert result > 0
        assert isinstance(result, float)


class TestVRPTWSolver:
    """Tests for VRPTW Solver"""
    
    @pytest.fixture
    def solver(self):
        """Create solver instance"""
        return VRPTWSolver()
    
    @pytest.fixture
    def mock_orders(self):
        """Create mock orders"""
        orders = []
        base_time = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
        
        for i in range(5):
            order = Mock()
            order.id = i + 1
            order.delivery_latitude = 55.75 + (i * 0.01)
            order.delivery_longitude = 37.61 + (i * 0.01)
            order.time_window_start = base_time + timedelta(hours=i)
            order.time_window_end = base_time + timedelta(hours=i+2)
            order.weight = 10.0 + i
            order.estimated_service_time = 15
            orders.append(order)
        
        return orders
    
    @pytest.fixture
    def mock_vehicles(self):
        """Create mock vehicles"""
        vehicles = []
        for i in range(2):
            vehicle = Mock()
            vehicle.id = i + 1
            vehicle.max_weight_capacity = 100.0
            vehicle.registration_number = f"TEST-{i+1}"
            vehicles.append(vehicle)
        
        return vehicles
    
    @pytest.fixture
    def mock_drivers(self):
        """Create mock drivers"""
        drivers = []
        for i in range(2):
            driver = Mock()
            driver.id = i + 1
            driver.first_name = f"Driver{i+1}"
            driver.last_name = "Test"
            driver.max_stops_per_route = 10
            drivers.append(driver)
        
        return drivers
    
    def test_validate_inputs_valid(self, solver, mock_orders, mock_vehicles, mock_drivers):
        """Test validation with valid inputs"""
        # Should not raise exception
        solver._validate_inputs(mock_orders, mock_vehicles, mock_drivers)
    
    def test_validate_inputs_no_orders(self, solver, mock_vehicles, mock_drivers):
        """Test validation with no orders"""
        with pytest.raises(InvalidInputException, match="No orders provided"):
            solver._validate_inputs([], mock_vehicles, mock_drivers)
    
    def test_validate_inputs_no_vehicles(self, solver, mock_orders, mock_drivers):
        """Test validation with no vehicles"""
        with pytest.raises(InvalidInputException, match="No vehicles provided"):
            solver._validate_inputs(mock_orders, [], mock_drivers)
    
    def test_validate_inputs_invalid_time_window(self, solver, mock_vehicles, mock_drivers):
        """Test validation with invalid time window"""
        order = Mock()
        order.id = 1
        order.delivery_latitude = 55.75
        order.delivery_longitude = 37.61
        order.time_window_start = datetime.now() + timedelta(hours=2)
        order.time_window_end = datetime.now()  # End before start
        order.weight = 10.0
        
        with pytest.raises(TimeWindowViolationException):
            solver._validate_inputs([order], mock_vehicles, mock_drivers)
    
    def test_validate_inputs_insufficient_capacity(self, solver, mock_drivers):
        """Test validation with insufficient capacity"""
        orders = []
        for i in range(5):
            order = Mock()
            order.id = i + 1
            order.delivery_latitude = 55.75
            order.delivery_longitude = 37.61
            order.time_window_start = datetime.now()
            order.time_window_end = datetime.now() + timedelta(hours=2)
            order.weight = 100.0  # Heavy orders
            orders.append(order)
        
        vehicles = [Mock(id=1, max_weight_capacity=50.0)]  # Insufficient capacity
        
        with pytest.raises(CapacityViolationException):
            solver._validate_inputs(orders, vehicles, mock_drivers)
    
    def test_haversine_distance(self, solver):
        """Test Haversine distance calculation"""
        # Distance between Moscow and Saint Petersburg (approximately 635 km)
        lat1, lon1 = 55.7558, 37.6176  # Moscow
        lat2, lon2 = 59.9343, 30.3351  # Saint Petersburg
        
        distance = solver._haversine_distance(lat1, lon1, lat2, lon2)
        
        assert 600 < distance < 700  # Approximate range
    
    def test_haversine_distance_same_point(self, solver):
        """Test Haversine distance for same point"""
        lat, lon = 55.7558, 37.6176
        
        distance = solver._haversine_distance(lat, lon, lat, lon)
        
        assert distance == 0.0
    
    def test_build_matrices_caching(self, solver, mock_orders):
        """Test distance matrix building with caching"""
        solver.orders = mock_orders
        solver.use_cache = True
        
        # First build
        solver._build_matrices()
        matrix1 = solver.distance_matrix.copy()
        
        # Second build should use cache
        solver._build_matrices()
        matrix2 = solver.distance_matrix.copy()
        
        np.testing.assert_array_equal(matrix1, matrix2)
    
    def test_build_matrices_shape(self, solver, mock_orders):
        """Test that distance matrix has correct shape"""
        solver.orders = mock_orders
        solver._build_matrices()
        
        expected_size = len(mock_orders) + 1  # +1 for depot
        assert solver.distance_matrix.shape == (expected_size, expected_size)
        assert solver.time_matrix.shape == (expected_size, expected_size)
    
    def test_build_matrices_symmetry(self, solver, mock_orders):
        """Test that distance matrix is symmetric"""
        solver.orders = mock_orders
        solver._build_matrices()
        
        # Distance from A to B should equal distance from B to A
        np.testing.assert_array_almost_equal(
            solver.distance_matrix,
            solver.distance_matrix.T
        )
    
    @patch.object(VRPTWSolver, '_create_and_solve_model')
    def test_solve_static_routes_success(
        self, mock_solve, solver, mock_orders, mock_vehicles, mock_drivers
    ):
        """Test successful route optimization"""
        # Mock successful solution
        mock_manager = Mock()
        mock_routing = Mock()
        mock_solution = Mock()
        mock_solution.ObjectiveValue.return_value = 1000
        mock_solve.return_value = (mock_manager, mock_routing, mock_solution)
        
        with patch.object(solver, '_extract_routes', return_value=[]):
            with patch.object(solver, '_calculate_metrics', return_value={'total_cost': 1000}):
                result = solver.solve_static_routes(
                    mock_orders, mock_vehicles, mock_drivers
                )
        
        assert result['success'] is True
        assert 'routes' in result
        assert 'metrics' in result
        assert result['optimization_type'] == 'static'
    
    @patch.object(VRPTWSolver, '_create_and_solve_model')
    def test_solve_static_routes_no_solution(
        self, mock_solve, solver, mock_orders, mock_vehicles, mock_drivers
    ):
        """Test optimization when no solution found"""
        # Mock no solution
        mock_manager = Mock()
        mock_routing = Mock()
        mock_solve.return_value = (mock_manager, mock_routing, None)
        
        with pytest.raises(NoFeasibleSolutionException):
            solver.solve_static_routes(
                mock_orders, mock_vehicles, mock_drivers
            )
    
    def test_solve_static_routes_invalid_inputs(self, solver, mock_vehicles, mock_drivers):
        """Test optimization with invalid inputs"""
        with pytest.raises(InvalidInputException):
            solver.solve_static_routes([], mock_vehicles, mock_drivers)
    
    def test_adaptation_count_increment(self, solver):
        """Test that adaptation count increments properly"""
        initial_count = solver.adaptation_count
        
        mock_routes = []
        affected_orders = []
        event_data = {}
        
        result = solver.local_reoptimization(mock_routes, affected_orders, event_data)
        
        assert solver.adaptation_count == initial_count + 1


class TestIntegration:
    """Integration tests for VRPTW solver"""
    
    @pytest.mark.integration
    def test_end_to_end_optimization(self):
        """Test complete optimization flow"""
        # This test would require real database setup
        # and full mock data - marked as integration test
        pass
