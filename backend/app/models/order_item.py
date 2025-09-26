"""
Модель элементов заказа для связи заказов с товарами
"""

from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    
    # Quantity and pricing
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False, default=0.0)  # Price per unit at time of order
    total_price = Column(Float, nullable=False, default=0.0)  # quantity * unit_price
    
    # Discounts and adjustments
    discount_amount = Column(Float, default=0.0)
    discount_percentage = Column(Float, default=0.0)
    final_price = Column(Float, nullable=False, default=0.0)  # total_price - discount_amount
    
    # Product details at time of order (for historical accuracy)
    product_name = Column(Text, nullable=False)  # Product name when ordered
    product_sku = Column(Text, nullable=False)   # Product SKU when ordered
    product_weight = Column(Float, default=0.0)  # Weight per unit
    product_volume = Column(Float, default=0.0)  # Volume per unit in m³
    
    # Special handling requirements
    special_instructions = Column(Text)
    requires_signature = Column(Boolean, default=False)
    fragile = Column(Boolean, default=False)
    temperature_controlled = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")
    
    def __repr__(self):
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, product_id={self.product_id}, quantity={self.quantity})>"
    
    @property
    def total_weight(self) -> float:
        """Calculate total weight for this order item"""
        return self.product_weight * self.quantity
    
    @property
    def total_volume(self) -> float:
        """Calculate total volume for this order item"""
        return self.product_volume * self.quantity
    
    def calculate_total_price(self) -> float:
        """Calculate total price before discounts"""
        return self.unit_price * self.quantity
    
    def calculate_final_price(self) -> float:
        """Calculate final price after discounts"""
        total = self.calculate_total_price()
        
        # Apply percentage discount first
        if self.discount_percentage > 0:
            total = total * (1 - self.discount_percentage / 100)
        
        # Apply fixed discount amount
        if self.discount_amount > 0:
            total = max(0, total - self.discount_amount)
        
        return total
    
    def update_prices(self) -> None:
        """Update calculated price fields"""
        self.total_price = self.calculate_total_price()
        self.final_price = self.calculate_final_price()
    
    def copy_product_details(self, product) -> None:
        """Copy product details for historical accuracy"""
        self.product_name = product.name
        self.product_sku = product.sku
        self.product_weight = product.weight
        self.product_volume = product.volume_m3
        self.fragile = product.fragile
        self.temperature_controlled = product.temperature_sensitive