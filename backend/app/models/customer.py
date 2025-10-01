from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True)
    phone = Column(String(50))
    
    # Address information
    address = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    city = Column(String(100))
    postal_code = Column(String(20))
    
    # Business information
    business_type = Column(String(100))
    is_active = Column(Boolean, default=True)
    
    # Time preferences
    preferred_delivery_start = Column(String(5))  # HH:MM format
    preferred_delivery_end = Column(String(5))    # HH:MM format
    
    # Extended time windows (for manual corrections)
    actual_working_hours_start = Column(String(5))  # Реальное время начала работы
    actual_working_hours_end = Column(String(5))    # Реальное время окончания работы
    lunch_break_start = Column(String(5))           # Время начала обеда
    lunch_break_end = Column(String(5))             # Время окончания обеда
    
    # Special requirements
    preferred_driver_ids = Column(Text)  # JSON array of preferred driver IDs
    restricted_driver_ids = Column(Text)  # JSON array of restricted driver IDs
    entry_restrictions = Column(Text)     # Особенности въезда на территорию
    requires_unloading_help = Column(Boolean, default=False)
    has_unloading_equipment = Column(Boolean, default=True)
    max_vehicle_size = Column(String(50))  # Ограничения по размеру ТС
    parking_availability = Column(String(100))  # Информация о парковке
    
    # Client behavior metrics
    average_unloading_time = Column(Integer, default=15)  # минуты
    reliability_score = Column(Float, default=5.0)  # 1-5 шкала надежности
    historical_delays = Column(Integer, default=0)  # Количество задержек
    
    # Additional notes
    notes = Column(Text)  # Дополнительные заметки для логистов
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    orders = relationship("Order", back_populates="customer")
    
    def __repr__(self):
        return f"<Customer(id={self.id}, name='{self.name}', city='{self.city}')>"