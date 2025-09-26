from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from app.database import Base

class EventType(PyEnum):
    ROUTE_STARTED = "route_started"
    ROUTE_COMPLETED = "route_completed"
    STOP_COMPLETED = "stop_completed"
    DELIVERY_FAILED = "delivery_failed"
    TRAFFIC_DELAY = "traffic_delay"
    VEHICLE_BREAKDOWN = "vehicle_breakdown"
    DRIVER_UNAVAILABLE = "driver_unavailable"
    WEATHER_ALERT = "weather_alert"
    CUSTOMER_RESCHEDULE = "customer_reschedule"
    REOPTIMIZATION_TRIGGERED = "reoptimization_triggered"
    REOPTIMIZATION_COMPLETED = "reoptimization_completed"
    MANUAL_INTERVENTION = "manual_intervention"
    GPS_DEVIATION = "gps_deviation"
    TIME_WINDOW_VIOLATION = "time_window_violation"

class EventSeverity(PyEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class EventStatus(PyEnum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    IGNORED = "ignored"
    ESCALATED = "escalated"

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Event classification
    event_type = Column(Enum(EventType), nullable=False, index=True)
    severity = Column(Enum(EventSeverity), default=EventSeverity.MEDIUM)
    status = Column(Enum(EventStatus), default=EventStatus.ACTIVE)
    
    # Event details
    title = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Related entities
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    route_stop_id = Column(Integer, ForeignKey("route_stops.id"), nullable=True)
    
    # Location information
    latitude = Column(Float)
    longitude = Column(Float)
    location_description = Column(String(255))
    
    # Timing
    event_timestamp = Column(DateTime(timezone=True), nullable=False, default=func.now())
    detected_at = Column(DateTime(timezone=True), default=func.now())
    resolved_at = Column(DateTime(timezone=True))
    
    # Impact assessment
    estimated_delay_minutes = Column(Integer, default=0)
    affected_orders_count = Column(Integer, default=0)
    cost_impact = Column(Float, default=0.0)
    
    # Reoptimization trigger
    triggers_reoptimization = Column(Boolean, default=False)
    reoptimization_threshold_exceeded = Column(Boolean, default=False)
    
    # Event data and context
    event_data = Column(JSON)  # Flexible JSON field for event-specific data
    source_system = Column(String(100))  # GPS, Yandex Maps, Manual, etc.
    
    # Response and resolution
    automated_response = Column(Text)
    manual_response = Column(Text)
    resolution_notes = Column(Text)
    resolved_by = Column(String(100))  # User ID or system component
    
    # Notification tracking
    notifications_sent = Column(Boolean, default=False)
    notification_recipients = Column(Text)  # JSON array of recipients
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    route = relationship("Route", foreign_keys=[route_id])
    vehicle = relationship("Vehicle", foreign_keys=[vehicle_id])
    driver = relationship("Driver", foreign_keys=[driver_id])
    order = relationship("Order", foreign_keys=[order_id])
    route_stop = relationship("RouteStop", foreign_keys=[route_stop_id])
    
    def __repr__(self):
        return f"<Event(id={self.id}, type='{self.event_type}', severity='{self.severity}', status='{self.status}')>"
    
    @property
    def is_active(self) -> bool:
        """Check if event is still active"""
        return self.status == EventStatus.ACTIVE
    
    @property
    def duration_minutes(self) -> int:
        """Calculate event duration in minutes"""
        if self.resolved_at:
            duration = self.resolved_at - self.detected_at
            return int(duration.total_seconds() / 60)
        else:
            current_time = func.now()
            duration = current_time - self.detected_at
            return int(duration.total_seconds() / 60)
    
    def should_trigger_reoptimization(self, threshold_minutes: int = 15) -> bool:
        """Determine if event should trigger route reoptimization"""
        if self.triggers_reoptimization:
            return True
        
        # Check if delay exceeds threshold
        if self.estimated_delay_minutes >= threshold_minutes:
            self.reoptimization_threshold_exceeded = True
            return True
        
        # Check event type criticality
        critical_events = [
            EventType.VEHICLE_BREAKDOWN,
            EventType.DRIVER_UNAVAILABLE,
            EventType.TRAFFIC_DELAY
        ]
        
        if self.event_type in critical_events and self.severity in [EventSeverity.HIGH, EventSeverity.CRITICAL]:
            return True
        
        return False
    
    def resolve(self, resolution_notes: str = None, resolved_by: str = "system"):
        """Mark event as resolved"""
        self.status = EventStatus.RESOLVED
        self.resolved_at = func.now()
        if resolution_notes:
            self.resolution_notes = resolution_notes
        self.resolved_by = resolved_by
    
    def escalate(self, escalation_notes: str = None):
        """Escalate event to higher severity"""
        self.status = EventStatus.ESCALATED
        if self.severity == EventSeverity.LOW:
            self.severity = EventSeverity.MEDIUM
        elif self.severity == EventSeverity.MEDIUM:
            self.severity = EventSeverity.HIGH
        elif self.severity == EventSeverity.HIGH:
            self.severity = EventSeverity.CRITICAL
        
        if escalation_notes:
            self.manual_response = escalation_notes
    
    @classmethod
    def create_traffic_delay_event(cls, route_id: int, estimated_delay: int, location: tuple = None):
        """Factory method to create traffic delay event"""
        event_data = {
            "delay_minutes": estimated_delay,
            "traffic_source": "yandex_maps"
        }
        
        return cls(
            event_type=EventType.TRAFFIC_DELAY,
            severity=EventSeverity.HIGH if estimated_delay > 30 else EventSeverity.MEDIUM,
            title=f"Traffic delay detected: {estimated_delay} minutes",
            description=f"Route experiencing {estimated_delay} minute delay due to traffic conditions",
            route_id=route_id,
            estimated_delay_minutes=estimated_delay,
            triggers_reoptimization=estimated_delay >= 15,
            event_data=event_data,
            latitude=location[0] if location else None,
            longitude=location[1] if location else None,
            source_system="yandex_maps"
        )