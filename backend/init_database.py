"""
Standalone database initialization script.
Creates all tables and optionally seeds with sample data.
"""

import logging
import sys
import os
from datetime import datetime, date, time

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.database import Base, engine, SessionLocal
from app.models.customer import Customer
from app.models.vehicle import Vehicle, VehicleType, VehicleStatus
from app.models.driver import Driver, DriverStatus, ExperienceLevel
from app.models.order import Order, OrderStatus, OrderPriority
from app.models.route import Route, RouteStatus
from app.models.event import Event, EventType

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_tables():
    """Create all database tables."""
    try:
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        return False


def seed_sample_data():
    """Seed database with sample data for development."""
    db = SessionLocal()
    
    try:
        logger.info("Seeding sample data...")
        
        # Check if data already exists
        if db.query(Customer).first():
            logger.info("Sample data already exists, skipping seeding")
            return True
        
        # Create sample customers
        customers = [
            Customer(
                name="John Smith",
                email="john.smith@example.com",
                phone="+1234567890",
                address="123 Main St, Downtown",
                latitude=55.7558,
                longitude=37.6176,
                city="Moscow",
                postal_code="101000",
                business_type="retail",
                preferred_delivery_start="09:00",
                preferred_delivery_end="17:00"
            ),
            Customer(
                name="Jane Doe",
                email="jane.doe@example.com",
                phone="+1234567891",
                address="456 Oak Ave, Midtown",
                latitude=55.7608,
                longitude=37.6142,
                city="Moscow",
                postal_code="101001",
                business_type="office",
                preferred_delivery_start="10:00",
                preferred_delivery_end="16:00"
            ),
            Customer(
                name="Bob Johnson",
                email="bob.johnson@example.com",
                phone="+1234567892",
                address="789 Pine Rd, Uptown",
                latitude=55.7658,
                longitude=37.6108,
                city="Moscow",
                postal_code="101002",
                business_type="restaurant",
                preferred_delivery_start="08:00",
                preferred_delivery_end="18:00"
            )
        ]
        
        for customer in customers:
            db.add(customer)
        
        # Create sample vehicles
        vehicles = [
            Vehicle(
                license_plate="ABC123",
                model="Transit Van",
                brand="Ford",
                year=2022,
                vehicle_type=VehicleType.VAN,
                max_weight_capacity=1000.0,
                max_volume_capacity=15.0,
                fuel_consumption=8.5,
                status=VehicleStatus.AVAILABLE,
                current_latitude=55.7558,
                current_longitude=37.6176,
                depot_latitude=55.7558,
                depot_longitude=37.6176
            ),
            Vehicle(
                license_plate="XYZ789",
                model="Sprinter",
                brand="Mercedes",
                year=2021,
                vehicle_type=VehicleType.TRUCK,
                max_weight_capacity=2000.0,
                max_volume_capacity=30.0,
                fuel_consumption=12.0,
                status=VehicleStatus.AVAILABLE,
                current_latitude=55.7608,
                current_longitude=37.6142,
                depot_latitude=55.7608,
                depot_longitude=37.6142
            )
        ]
        
        for vehicle in vehicles:
            db.add(vehicle)
        
        # Create sample drivers
        drivers = [
            Driver(
                employee_id="EMP001",
                first_name="Mike",
                last_name="Wilson",
                license_number="DL123456",
                phone="+1234567893",
                email="mike.wilson@company.com",
                experience_level=ExperienceLevel.EXPERIENCED,
                max_working_hours=8,
                shift_start_time="08:00",
                shift_end_time="17:00",
                status=DriverStatus.AVAILABLE,
                current_latitude=55.7558,
                current_longitude=37.6176
            ),
            Driver(
                employee_id="EMP002",
                first_name="Sarah",
                last_name="Davis",
                license_number="DL789012",
                phone="+1234567894",
                email="sarah.davis@company.com",
                experience_level=ExperienceLevel.INTERMEDIATE,
                max_working_hours=8,
                shift_start_time="09:00",
                shift_end_time="18:00",
                status=DriverStatus.AVAILABLE,
                current_latitude=55.7608,
                current_longitude=37.6142
            )
        ]
        
        for driver in drivers:
            db.add(driver)
        
        db.commit()
        
        # Get the created records for foreign keys
        customer_ids = [c.id for c in db.query(Customer).all()]
        
        # Create sample orders
        orders = [
            Order(
                customer_id=customer_ids[0],
                order_number="ORD001",
                delivery_address="123 Main St, Downtown",
                delivery_latitude=55.7558,
                delivery_longitude=37.6176,
                time_window_start=datetime.combine(date.today(), time(9, 0)),
                time_window_end=datetime.combine(date.today(), time(17, 0)),
                weight=50.0,
                volume=2.0,
                priority=OrderPriority.HIGH,
                status=OrderStatus.PENDING,
                estimated_service_time=15
            ),
            Order(
                customer_id=customer_ids[1],
                order_number="ORD002",
                delivery_address="456 Oak Ave, Midtown",
                delivery_latitude=55.7608,
                delivery_longitude=37.6142,
                time_window_start=datetime.combine(date.today(), time(10, 0)),
                time_window_end=datetime.combine(date.today(), time(16, 0)),
                weight=30.0,
                volume=1.5,
                priority=OrderPriority.MEDIUM,
                status=OrderStatus.PENDING,
                estimated_service_time=10
            ),
            Order(
                customer_id=customer_ids[2],
                order_number="ORD003",
                delivery_address="789 Pine Rd, Uptown",
                delivery_latitude=55.7658,
                delivery_longitude=37.6108,
                time_window_start=datetime.combine(date.today(), time(8, 0)),
                time_window_end=datetime.combine(date.today(), time(18, 0)),
                weight=75.0,
                volume=3.0,
                priority=OrderPriority.HIGH,
                status=OrderStatus.PENDING,
                estimated_service_time=20
            )
        ]
        
        for order in orders:
            db.add(order)
        
        db.commit()
        logger.info("Sample data seeded successfully")
        return True
        
    except Exception as e:
        logger.error(f"Failed to seed sample data: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def init_database(seed_data: bool = True):
    """Initialize database with tables and optionally seed data."""
    logger.info("Initializing database...")
    
    # Create tables
    if not create_tables():
        return False
    
    # Seed sample data if requested
    if seed_data:
        if not seed_sample_data():
            logger.warning("Failed to seed sample data, but tables were created")
    
    logger.info("Database initialization completed")
    return True


if __name__ == "__main__":
    # Run database initialization
    init_database(seed_data=True)