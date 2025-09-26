from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from app.database import Base

class StopStatus(PyEnum):
    PENDING = "pending"
    APPROACHING = "approaching"
    ARRIVED = "arrived"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

class StopType(PyEnum):
    DEPOT = "depot"
    DELIVERY = "delivery"
    PICKUP = "pickup"
    BREAK = "break"

class RouteStop(Base):
    __tablename__ = "route_stops"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Relationships
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)  # Null for depot/break stops
    
    # Stop sequence and type
    stop_sequence = Column(Integer, nullable=False)  # Order in route (0-based)
    stop_type = Column(Enum(StopType), default=StopType.DELIVERY)
    
    # Location information
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(Text, nullable=False)
    
    # Time planning
    planned_arrival_time = Column(DateTime(timezone=True), nullable=False)
    planned_departure_time = Column(DateTime(timezone=True), nullable=False)
    planned_service_time = Column(Integer, default=15)  # minutes
    
    # Actual execution
    actual_arrival_time = Column(DateTime(timezone=True))
    actual_departure_time = Column(DateTime(timezone=True))
    actual_service_time = Column(Integer)  # minutes
    
    # Status and progress
    status = Column(Enum(StopStatus), default=StopStatus.PENDING)
    
    # Distance and travel metrics
    distance_from_previous = Column(Float, default=0.0)  # km
    travel_time_from_previous = Column(Integer, default=0)  # minutes
    
    # Delivery details
    weight_delivered = Column(Float, default=0.0)  # kg
    volume_delivered = Column(Float, default=0.0)  # m³
    
    # Time window compliance
    time_window_start = Column(DateTime(timezone=True))
    time_window_end = Column(DateTime(timezone=True))
    is_within_time_window = Column(Boolean, default=True)
    time_window_violation_minutes = Column(Integer, default=0)
    
    # Delivery outcome
    delivery_successful = Column(Boolean, default=True)
    delivery_notes = Column(Text)
    failure_reason = Column(String(255))
    
    # Customer interaction
    customer_signature = Column(Text)  # Base64 encoded signature
    customer_rating = Column(Integer)  # 1-5 scale
    customer_feedback = Column(Text)
    
    # Photos and documentation
    delivery_photos = Column(Text)  # JSON array of photo URLs
    proof_of_delivery = Column(Text)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    route = relationship("Route", back_populates="route_stops")
    order = relationship("Order", back_populates="route_stops")
    
    def __repr__(self):
        return f"<RouteStop(id={self.id}, route_id={self.route_id}, sequence={self.stop_sequence}, status='{self.status}')>"
    
    @property
    def is_completed(self) -> bool:
        """Check if stop is completed"""
        return self.status == StopStatus.COMPLETED
    
    @property
    def is_on_time(self) -> bool:
        """Check if delivery was on time"""
        if not self.actual_arrival_time or not self.time_window_end:
            return True
        return self.actual_arrival_time <= self.time_window_end
    
    @property
    def delay_minutes(self) -> int:
        """Calculate delay in minutes from planned arrival"""
        if not self.actual_arrival_time or not self.planned_arrival_time:
            return 0
        delay = self.actual_arrival_time - self.planned_arrival_time
        return max(0, int(delay.total_seconds() / 60))
    
    def calculate_time_window_violation(self):
        """Calculate time window violation in minutes"""
        if not self.actual_arrival_time:
            return 0
        
        violation = 0
        if self.time_window_start and self.actual_arrival_time < self.time_window_start:
            # Early arrival
            early_minutes = (self.time_window_start - self.actual_arrival_time).total_seconds() / 60
            violation = int(early_minutes)
        elif self.time_window_end and self.actual_arrival_time > self.time_window_end:
            # Late arrival
            late_minutes = (self.actual_arrival_time - self.time_window_end).total_seconds() / 60
            violation = int(late_minutes)
        
        self.time_window_violation_minutes = violation
        self.is_within_time_window = violation == 0
        return violation
    
    def mark_completed(self, delivery_successful: bool = True, notes: str = None):
        """Mark stop as completed with outcome"""
        self.status = StopStatus.COMPLETED
        self.delivery_successful = delivery_successful
        if notes:
            self.delivery_notes = notes
        self.actual_departure_time = func.now()
        
        # Calculate actual service time
        if self.actual_arrival_time and self.actual_departure_time:
            service_duration = self.actual_departure_time - self.actual_arrival_time
            self.actual_service_time = int(service_duration.total_seconds() / 60)
        
        # Check time window compliance
        self.calculate_time_window_violation()
    
    def estimate_eta(self, current_time: DateTime, traffic_factor: float = 1.0) -> DateTime:
        """Estimate arrival time based on current time and traffic"""
        if self.travel_time_from_previous:
            travel_time_adjusted = self.travel_time_from_previous * traffic_factor
            eta = current_time + timedelta(minutes=travel_time_adjusted)
            return eta
        return self.planned_arrival_time