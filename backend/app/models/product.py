"""
Модель товаров для системы управления доставкой
"""

from sqlalchemy import Column, Integer, String, Float, Text, Boolean, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from app.database import Base

class ProductCategory(PyEnum):
    ELECTRONICS = "electronics"
    CLOTHING = "clothing"
    FOOD = "food"
    BOOKS = "books"
    HOME_GARDEN = "home_garden"
    SPORTS = "sports"
    AUTOMOTIVE = "automotive"
    HEALTH_BEAUTY = "health_beauty"
    TOYS = "toys"
    OTHER = "other"

class ProductCondition(PyEnum):
    NEW = "new"
    USED = "used"
    REFURBISHED = "refurbished"

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(100), unique=True, nullable=False, index=True)  # Stock Keeping Unit
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    
    # Physical properties
    weight = Column(Float, nullable=False, default=0.0)  # kg
    length = Column(Float, nullable=False, default=0.0)  # cm
    width = Column(Float, nullable=False, default=0.0)   # cm
    height = Column(Float, nullable=False, default=0.0)  # cm
    
    # Pricing
    base_price = Column(Float, nullable=False, default=0.0)
    cost_price = Column(Float, default=0.0)
    
    # Categorization
    category = Column(Enum(ProductCategory), nullable=False, default=ProductCategory.OTHER)
    subcategory = Column(String(100))
    brand = Column(String(100))
    
    # Condition and handling
    condition = Column(Enum(ProductCondition), default=ProductCondition.NEW)
    fragile = Column(Boolean, default=False)
    hazardous = Column(Boolean, default=False)
    temperature_sensitive = Column(Boolean, default=False)
    min_temperature = Column(Float)  # Celsius
    max_temperature = Column(Float)  # Celsius
    
    # Inventory
    stock_quantity = Column(Integer, default=0)
    reserved_quantity = Column(Integer, default=0)
    reorder_level = Column(Integer, default=0)
    
    # Status
    active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    order_items = relationship("OrderItem", back_populates="product")
    
    def __repr__(self):
        return f"<Product(id={self.id}, sku='{self.sku}', name='{self.name}')>"
    
    @property
    def volume_cm3(self) -> float:
        """Calculate volume in cubic centimeters"""
        return self.length * self.width * self.height
    
    @property
    def volume_m3(self) -> float:
        """Calculate volume in cubic meters"""
        return self.volume_cm3 / 1_000_000
    
    @property
    def available_quantity(self) -> int:
        """Calculate available quantity (stock - reserved)"""
        return max(0, self.stock_quantity - self.reserved_quantity)
    
    @property
    def needs_reorder(self) -> bool:
        """Check if product needs reordering"""
        return self.available_quantity <= self.reorder_level
    
    def can_handle_quantity(self, quantity: int) -> bool:
        """Check if requested quantity is available"""
        return self.available_quantity >= quantity
    
    def reserve_quantity(self, quantity: int) -> bool:
        """Reserve quantity for an order"""
        if self.can_handle_quantity(quantity):
            self.reserved_quantity += quantity
            return True
        return False
    
    def release_quantity(self, quantity: int) -> None:
        """Release reserved quantity"""
        self.reserved_quantity = max(0, self.reserved_quantity - quantity)