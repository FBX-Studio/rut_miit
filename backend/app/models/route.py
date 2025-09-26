from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from app.database import Base

class RouteStatus(PyEnum):
    PLANNED = "planned"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    OPTIMIZING = "optimizing"

class OptimizationType(PyEnum):
    STATIC = "static"      # Morning planning
    ADAPTIVE = "adaptive"  # Real-time reoptimization
    MANUAL = "manual"      # Manual adjustment

class Route(Base):
    __tablename__ = "routes"
    
    id = Column(Integer, primary_key=True, index=True)
    route_number = Column(String(50), unique=True, nullable=False, index=True)
    
    # Assignments
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    
    # Route planning
    planned_date = Column(DateTime(timezone=True), nullable=False)
    planned_start_time = Column(DateTime(timezone=True), nullable=False)
    planned_end_time = Column(DateTime(timezone=True))
    
    # Actual execution
    actual_start_time = Column(DateTime(timezone=True))
    actual_end_time = Column(DateTime(timezone=True))
    
    # Route metrics
    total_distance = Column(Float, default=0.0)      # km
    total_duration = Column(Integer, default=0)      # minutes
    total_stops = Column(Integer, default=0)
    total_weight = Column(Float, default=0.0)        # kg
    total_volume = Column(Float, default=0.0)        # m³
    
    # Optimization metrics
    optimization_type = Column(Enum(OptimizationType), default=OptimizationType.STATIC)
    optimization_score = Column(Float, default=0.0)  # Objective function value
    reoptimization_count = Column(Integer, default=0)
    
    # Status and progress
    status = Column(Enum(RouteStatus), default=RouteStatus.PLANNED)
    current_stop_index = Column(Integer, default=0)
    completion_percentage = Column(Float, default=0.0)
    
    # Cost analysis
    fuel_cost = Column(Float, default=0.0)
    driver_cost = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    
    # Performance indicators
    on_time_deliveries = Column(Integer, default=0)
    late_deliveries = Column(Integer, default=0)
    failed_deliveries = Column(Integer, default=0)
    
    # Route geometry and waypoints
    route_geometry = Column(Text)  # Encoded polyline or GeoJSON
    waypoints = Column(Text)       # JSON array of coordinates
    
    # Notes and comments
    notes = Column(Text)
    driver_comments = Column(Text)
    
    # Дополнительные параметры для расширенного тестирования
    scenario_name = Column(String, nullable=True)
    complexity_level = Column(String, nullable=True)
    weather_condition = Column(String, nullable=True)
    traffic_condition = Column(String, nullable=True)
    special_requirements = Column(Text, nullable=True)
    risk_factors = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_optimized_at = Column(DateTime(timezone=True))
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="routes")
    driver = relationship("Driver", back_populates="routes")
    route_stops = relationship("RouteStop", back_populates="route", order_by="RouteStop.stop_sequence")
    
    def __repr__(self):
        return f"<Route(id={self.id}, number='{self.route_number}', status='{self.status}')>"
    
    @property
    def is_active(self) -> bool:
        """Check if route is currently active"""
        return self.status == RouteStatus.ACTIVE
    
    @property
    def delivery_success_rate(self) -> float:
        """Calculate delivery success rate as percentage"""
        total_deliveries = self.on_time_deliveries + self.late_deliveries + self.failed_deliveries
        if total_deliveries == 0:
            return 0.0
        successful_deliveries = self.on_time_deliveries + self.late_deliveries
        return (successful_deliveries / total_deliveries) * 100
    
    @property
    def on_time_rate(self) -> float:
        """Calculate on-time delivery rate as percentage"""
        total_deliveries = self.on_time_deliveries + self.late_deliveries + self.failed_deliveries
        if total_deliveries == 0:
            return 0.0
        return (self.on_time_deliveries / total_deliveries) * 100
    
    def calculate_efficiency_metrics(self):
        """Calculate route efficiency metrics"""
        if self.actual_start_time and self.actual_end_time:
            actual_duration = (self.actual_end_time - self.actual_start_time).total_seconds() / 60
            if self.total_duration > 0:
                time_efficiency = (self.total_duration / actual_duration) * 100
            else:
                time_efficiency = 0.0
        else:
            time_efficiency = 0.0
        
        # Distance efficiency (actual vs optimal)
        distance_efficiency = 100.0  # Placeholder - would need optimal distance calculation
        
        return {
            "time_efficiency": time_efficiency,
            "distance_efficiency": distance_efficiency,
            "delivery_success_rate": self.delivery_success_rate,
            "on_time_rate": self.on_time_rate
        }
    
    def update_progress(self, completed_stops: int):
        """Update route progress based on completed stops"""
        if self.total_stops > 0:
            self.completion_percentage = (completed_stops / self.total_stops) * 100
            self.current_stop_index = completed_stops