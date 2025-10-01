"""
Pytest configuration and fixtures for VRPTW tests
"""

import pytest
import sys
import os
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Set test environment variables
os.environ['TESTING'] = 'true'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['DEBUG'] = 'true'


@pytest.fixture(scope='session')
def test_app():
    """Create test FastAPI application"""
    from fastapi.testclient import TestClient
    from main import app
    
    client = TestClient(app)
    yield client


@pytest.fixture(scope='session')
def test_db():
    """Create test database"""
    from app.database import Base, engine
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    yield engine
    
    # Cleanup
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope='function')
def db_session(test_db):
    """Create database session for each test"""
    from sqlalchemy.orm import Session
    
    session = Session(bind=test_db)
    
    yield session
    
    session.rollback()
    session.close()


@pytest.fixture
def sample_orders():
    """Create sample orders for testing"""
    from datetime import datetime, timedelta
    from unittest.mock import Mock
    
    base_time = datetime.now().replace(hour=9, minute=0)
    orders = []
    
    for i in range(10):
        order = Mock()
        order.id = i + 1
        order.customer_name = f"Customer {i+1}"
        order.delivery_address = f"Address {i+1}"
        order.delivery_latitude = 55.75 + (i * 0.01)
        order.delivery_longitude = 37.61 + (i * 0.01)
        order.weight = 10.0 + (i * 2)
        order.volume = 0.5 + (i * 0.1)
        order.time_window_start = base_time + timedelta(hours=i)
        order.time_window_end = base_time + timedelta(hours=i+3)
        order.estimated_service_time = 15
        order.priority = 1
        order.status = 'pending'
        orders.append(order)
    
    return orders


@pytest.fixture
def sample_vehicles():
    """Create sample vehicles for testing"""
    from unittest.mock import Mock
    
    vehicles = []
    
    for i in range(3):
        vehicle = Mock()
        vehicle.id = i + 1
        vehicle.registration_number = f"TEST-{i+1:03d}"
        vehicle.model = f"Vehicle Model {i+1}"
        vehicle.max_weight_capacity = 100.0 + (i * 50)
        vehicle.max_volume_capacity = 10.0 + (i * 5)
        vehicle.fuel_consumption = 10.0 + i
        vehicle.status = 'available'
        vehicles.append(vehicle)
    
    return vehicles


@pytest.fixture
def sample_drivers():
    """Create sample drivers for testing"""
    from unittest.mock import Mock
    
    drivers = []
    
    for i in range(3):
        driver = Mock()
        driver.id = i + 1
        driver.first_name = f"Driver{i+1}"
        driver.last_name = "Test"
        driver.phone = f"+7900000{i:04d}"
        driver.experience_years = 3 + i
        driver.max_stops_per_route = 10 + (i * 2)
        driver.status = 'available'
        drivers.append(driver)
    
    return drivers


@pytest.fixture
def sample_depot():
    """Create sample depot coordinates"""
    return (55.7558, 37.6176)  # Moscow coordinates


@pytest.fixture(autouse=True)
def reset_cache():
    """Reset cache before each test"""
    from app.core.cache import distance_cache, route_cache, geocoding_cache
    
    distance_cache.clear()
    route_cache.clear()
    geocoding_cache.clear()
    
    yield
    
    distance_cache.clear()
    route_cache.clear()
    geocoding_cache.clear()


@pytest.fixture
def mock_yandex_maps():
    """Mock Yandex Maps service"""
    from unittest.mock import Mock, AsyncMock
    
    mock_service = Mock()
    mock_service.geocode_address = AsyncMock(return_value=(55.7558, 37.6176))
    mock_service.get_route_info = AsyncMock(return_value=Mock(
        total_distance_meters=1000,
        total_time_seconds=300,
        traffic_time_seconds=350,
        geometry=[],
        traffic_segments=[]
    ))
    
    return mock_service


# Markers for test categories
def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers", "unit: Unit tests for individual components"
    )
    config.addinivalue_line(
        "markers", "integration: Integration tests for multiple components"
    )
    config.addinivalue_line(
        "markers", "slow: Tests that take a long time to run"
    )
    config.addinivalue_line(
        "markers", "api: Tests for API endpoints"
    )
    config.addinivalue_line(
        "markers", "optimization: Tests for optimization algorithms"
    )


# Custom assertions
def assert_valid_route(route_data):
    """Assert that route data is valid"""
    assert isinstance(route_data, dict)
    assert 'vehicle_id' in route_data
    assert 'driver_id' in route_data
    assert 'stops' in route_data
    assert isinstance(route_data['stops'], list)
    assert 'total_distance' in route_data
    assert 'total_time' in route_data
    

def assert_valid_optimization_result(result):
    """Assert that optimization result is valid"""
    assert isinstance(result, dict)
    assert 'success' in result
    
    if result['success']:
        assert 'routes' in result
        assert 'metrics' in result
        assert isinstance(result['routes'], list)
        assert isinstance(result['metrics'], dict)
