from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from app.database import Base

class OrderStatus(PyEnum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    FAILED = "failed"
    CANCELLED = "cancelled"

class OrderPriority(PyEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    
    # Customer relationship
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    
    # Driver relationship
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    
    # Delivery information
    delivery_address = Column(Text, nullable=False)
    delivery_latitude = Column(Float, nullable=False)
    delivery_longitude = Column(Float, nullable=False)
    
    # Time windows
    time_window_start = Column(DateTime(timezone=True), nullable=False)
    time_window_end = Column(DateTime(timezone=True), nullable=False)
    estimated_service_time = Column(Integer, default=15)  # minutes
    
    # Order details
    weight = Column(Float, default=0.0)  # kg
    volume = Column(Float, default=0.0)  # m³
    value = Column(Float, default=0.0)   # monetary value
    
    # Status and priority
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    priority = Column(Enum(OrderPriority), default=OrderPriority.MEDIUM)
    
    # Special requirements
    requires_signature = Column(Boolean, default=False)
    fragile = Column(Boolean, default=False)
    temperature_controlled = Column(Boolean, default=False)
    special_instructions = Column(Text)
    
    # Scheduling
    planned_delivery_time = Column(DateTime(timezone=True))
    actual_delivery_time = Column(DateTime(timezone=True))
    
    # Дополнительные поля для расширенного тестирования
    scenario_name = Column(String, nullable=True)
    complexity_level = Column(String, nullable=True)
    weather_condition = Column(String, nullable=True)
    traffic_condition = Column(String, nullable=True)
    risk_factors = Column(Text, nullable=True)
    cost_multiplier = Column(Float, default=1.0)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    customer = relationship("Customer", back_populates="orders")
    driver = relationship("Driver", back_populates="orders")
    route_stops = relationship("RouteStop", back_populates="order")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Order(id={self.id}, number='{self.order_number}', status='{self.status}')>"
    
    @property
    def time_window_duration_minutes(self) -> int:
        """Calculate time window duration in minutes"""
        if self.time_window_start and self.time_window_end:
            delta = self.time_window_end - self.time_window_start
            return int(delta.total_seconds() / 60)
        return 0
    
    def is_time_window_valid(self, delivery_time: DateTime) -> bool:
        """Check if delivery time falls within the time window"""
        return self.time_window_start <= delivery_time <= self.time_window_end
    
    @property
    def total_order_value(self) -> float:
        """Calculate total order value from order items"""
        return sum(item.final_price for item in self.order_items)
    
    @property
    def total_order_weight(self) -> float:
        """Calculate total order weight from order items"""
        return sum(item.total_weight for item in self.order_items)
    
    @property
    def total_order_volume(self) -> float:
        """Calculate total order volume from order items"""
        return sum(item.total_volume for item in self.order_items)
    
    @property
    def item_count(self) -> int:
        """Get total number of items in the order"""
        return sum(item.quantity for item in self.order_items)
    
    def has_fragile_items(self) -> bool:
        """Check if order contains fragile items"""
        return any(item.fragile for item in self.order_items)
    
    def has_temperature_controlled_items(self) -> bool:
        """Check if order contains temperature-controlled items"""
        return any(item.temperature_controlled for item in self.order_items)