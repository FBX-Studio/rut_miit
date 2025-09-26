"""Add Product and OrderItem models

Revision ID: 001_add_product_and_orderitem_models
Revises: 
Create Date: 2025-09-27 01:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_add_product_and_orderitem_models'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create products table
    op.create_table('products',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sku', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('weight', sa.Float(), nullable=False),
        sa.Column('length', sa.Float(), nullable=True),
        sa.Column('width', sa.Float(), nullable=True),
        sa.Column('height', sa.Float(), nullable=True),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('category', sa.Enum('ELECTRONICS', 'CLOTHING', 'FOOD', 'BOOKS', 'HOME_GARDEN', 'AUTOMOTIVE', 'HEALTH_BEAUTY', 'SPORTS_OUTDOORS', 'TOYS_GAMES', 'OTHER', name='productcategory'), nullable=False),
        sa.Column('condition', sa.Enum('NEW', 'USED', 'REFURBISHED', 'DAMAGED', name='productcondition'), nullable=False),
        sa.Column('is_fragile', sa.Boolean(), nullable=False),
        sa.Column('is_hazardous', sa.Boolean(), nullable=False),
        sa.Column('requires_temperature_control', sa.Boolean(), nullable=False),
        sa.Column('min_temperature', sa.Float(), nullable=True),
        sa.Column('max_temperature', sa.Float(), nullable=True),
        sa.Column('stock_quantity', sa.Integer(), nullable=False),
        sa.Column('reserved_quantity', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('sku')
    )
    op.create_index(op.f('ix_products_category'), 'products', ['category'], unique=False)
    op.create_index(op.f('ix_products_id'), 'products', ['id'], unique=False)
    op.create_index(op.f('ix_products_is_active'), 'products', ['is_active'], unique=False)
    op.create_index(op.f('ix_products_name'), 'products', ['name'], unique=False)
    op.create_index(op.f('ix_products_sku'), 'products', ['sku'], unique=False)

    # Create order_items table
    op.create_table('order_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('total_price', sa.Float(), nullable=False),
        sa.Column('final_price', sa.Float(), nullable=False),
        sa.Column('discount_amount', sa.Float(), nullable=False),
        sa.Column('product_name', sa.String(length=255), nullable=False),
        sa.Column('product_sku', sa.String(length=100), nullable=False),
        sa.Column('product_weight', sa.Float(), nullable=False),
        sa.Column('product_volume', sa.Float(), nullable=True),
        sa.Column('is_fragile', sa.Boolean(), nullable=False),
        sa.Column('requires_temperature_control', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], name='fk_order_items_order_id'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], name='fk_order_items_product_id'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_order_items_id'), 'order_items', ['id'], unique=False)
    op.create_index(op.f('ix_order_items_order_id'), 'order_items', ['order_id'], unique=False)
    op.create_index(op.f('ix_order_items_product_id'), 'order_items', ['product_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_order_items_product_id'), table_name='order_items')
    op.drop_index(op.f('ix_order_items_order_id'), table_name='order_items')
    op.drop_index(op.f('ix_order_items_id'), table_name='order_items')
    op.drop_table('order_items')
    
    op.drop_index(op.f('ix_products_sku'), table_name='products')
    op.drop_index(op.f('ix_products_name'), table_name='products')
    op.drop_index(op.f('ix_products_is_active'), table_name='products')
    op.drop_index(op.f('ix_products_id'), table_name='products')
    op.drop_index(op.f('ix_products_category'), table_name='products')
    op.drop_table('products')