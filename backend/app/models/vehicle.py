from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from app.database import Base

class VehicleType(PyEnum):
    VAN = "van"
    TRUCK = "truck"
    MOTORCYCLE = "motorcycle"
    CAR = "car"

class VehicleStatus(PyEnum):
    AVAILABLE = "available"
    IN_USE = "in_use"
    MAINTENANCE = "maintenance"
    OUT_OF_SERVICE = "out_of_service"

class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    license_plate = Column(String(20), unique=True, nullable=False, index=True)
    model = Column(String(100), nullable=False)
    brand = Column(String(50))
    year = Column(Integer)
    
    # Vehicle specifications
    vehicle_type = Column(Enum(VehicleType), nullable=False)
    max_weight_capacity = Column(Float, nullable=False)  # kg
    max_volume_capacity = Column(Float, nullable=False)  # m³
    fuel_consumption = Column(Float, default=10.0)       # L/100km
    
    # Operational constraints
    max_working_hours = Column(Integer, default=8)       # hours per day
    requires_break_every = Column(Integer, default=4)    # hours
    break_duration = Column(Integer, default=30)         # minutes
    
    # Location and status
    current_latitude = Column(Float)
    current_longitude = Column(Float)
    depot_latitude = Column(Float, nullable=False)
    depot_longitude = Column(Float, nullable=False)
    status = Column(Enum(VehicleStatus), default=VehicleStatus.AVAILABLE)
    
    # Features
    has_gps = Column(Boolean, default=True)
    has_temperature_control = Column(Boolean, default=False)
    has_lift_gate = Column(Boolean, default=False)
    
    # Costs
    cost_per_km = Column(Float, default=0.5)
    cost_per_hour = Column(Float, default=25.0)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_maintenance = Column(DateTime(timezone=True))
    next_maintenance = Column(DateTime(timezone=True))
    
    # Relationships
    routes = relationship("Route", back_populates="vehicle")
    
    def __repr__(self):
        return f"<Vehicle(id={self.id}, plate='{self.license_plate}', type='{self.vehicle_type}')>"
    
    @property
    def is_available(self) -> bool:
        """Check if vehicle is available for assignment"""
        return self.status == VehicleStatus.AVAILABLE
    
    def can_handle_order(self, weight: float, volume: float, requires_temp_control: bool = False) -> bool:
        """Check if vehicle can handle the order requirements"""
        if weight > self.max_weight_capacity:
            return False
        if volume > self.max_volume_capacity:
            return False
        if requires_temp_control and not self.has_temperature_control:
            return False
        return True