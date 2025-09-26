from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from app.database import Base

class DriverStatus(PyEnum):
    AVAILABLE = "available"
    ON_ROUTE = "on_route"
    ON_BREAK = "on_break"
    OFF_DUTY = "off_duty"

class ExperienceLevel(PyEnum):
    NOVICE = "novice"        # < 6 months
    INTERMEDIATE = "intermediate"  # 6 months - 2 years
    EXPERIENCED = "experienced"    # 2-5 years
    EXPERT = "expert"             # > 5 years

class Driver(Base):
    __tablename__ = "drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    
    # Personal information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True)
    phone = Column(String(50), nullable=False)
    
    # License information
    license_number = Column(String(50), unique=True, nullable=False)
    license_expiry = Column(DateTime(timezone=True))
    license_categories = Column(String(20))  # A, B, C, D, etc.
    
    # Experience and skills
    experience_level = Column(Enum(ExperienceLevel), default=ExperienceLevel.NOVICE)
    years_of_experience = Column(Float, default=0.0)
    max_stops_per_route = Column(Integer, default=15)  # Based on experience
    
    # Working constraints
    max_working_hours = Column(Integer, default=8)
    shift_start_time = Column(String(5))  # HH:MM format
    shift_end_time = Column(String(5))    # HH:MM format
    
    # Current status
    status = Column(Enum(DriverStatus), default=DriverStatus.OFF_DUTY)
    current_latitude = Column(Float)
    current_longitude = Column(Float)
    
    # Performance metrics
    average_delivery_time = Column(Float, default=0.0)  # minutes
    on_time_delivery_rate = Column(Float, default=0.0)  # percentage
    customer_rating = Column(Float, default=5.0)        # 1-5 scale
    total_deliveries = Column(Integer, default=0)
    
    # Preferences and restrictions
    preferred_areas = Column(Text)  # JSON array of area codes
    restricted_areas = Column(Text) # JSON array of restricted areas
    can_handle_fragile = Column(Boolean, default=True)
    can_handle_high_value = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_active = Column(DateTime(timezone=True))
    
    # Relationships
    routes = relationship("Route", back_populates="driver")
    
    def __repr__(self):
        return f"<Driver(id={self.id}, name='{self.first_name} {self.last_name}', experience='{self.experience_level}')>"
    
    @property
    def full_name(self) -> str:
        """Get driver's full name"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_available(self) -> bool:
        """Check if driver is available for assignment"""
        return self.status == DriverStatus.AVAILABLE
    
    def can_handle_route_complexity(self, num_stops: int) -> bool:
        """Check if driver can handle route complexity based on experience"""
        return num_stops <= self.max_stops_per_route
    
    def update_performance_metrics(self, delivery_time: float, was_on_time: bool, rating: float):
        """Update driver performance metrics after delivery"""
        # Update average delivery time
        total_time = self.average_delivery_time * self.total_deliveries + delivery_time
        self.total_deliveries += 1
        self.average_delivery_time = total_time / self.total_deliveries
        
        # Update on-time delivery rate
        if was_on_time:
            on_time_count = self.on_time_delivery_rate * (self.total_deliveries - 1) / 100
            self.on_time_delivery_rate = ((on_time_count + 1) / self.total_deliveries) * 100
        else:
            on_time_count = self.on_time_delivery_rate * (self.total_deliveries - 1) / 100
            self.on_time_delivery_rate = (on_time_count / self.total_deliveries) * 100
        
        # Update customer rating (weighted average)
        total_rating = self.customer_rating * (self.total_deliveries - 1) + rating
        self.customer_rating = total_rating / self.total_deliveries