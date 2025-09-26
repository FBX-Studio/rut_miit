from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, date, time
from enum import Enum

# Enums
class VehicleType(str, Enum):
    VAN = "van"
    TRUCK = "truck"
    MOTORCYCLE = "motorcycle"
    CAR = "car"

class OrderStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    DELIVERED = "delivered"
    FAILED = "failed"
    CANCELLED = "cancelled"

class RouteStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REOPTIMIZING = "reoptimizing"

class EventSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# Request Schemas
class RouteOptimizationRequest(BaseModel):
    order_ids: List[int] = Field(..., description="List of order IDs to optimize")
    vehicle_ids: List[int] = Field(..., description="List of available vehicle IDs")
    driver_ids: List[int] = Field(..., description="List of available driver IDs")
    depot_location: tuple[float, float] = Field(..., description="Depot coordinates (lat, lon)")
    planned_date: Optional[date] = Field(None, description="Date for route planning")
    time_limit_seconds: Optional[int] = Field(300, description="Optimization time limit")
    enable_adaptive_monitoring: bool = Field(True, description="Enable real-time monitoring")
    
    @validator('depot_location')
    def validate_depot_location(cls, v):
        if len(v) != 2:
            raise ValueError('Depot location must be a tuple of (latitude, longitude)')
        lat, lon = v
        if not (-90 <= lat <= 90):
            raise ValueError('Latitude must be between -90 and 90')
        if not (-180 <= lon <= 180):
            raise ValueError('Longitude must be between -180 and 180')
        return v

class TimeWindowUpdate(BaseModel):
    time_window_start: datetime
    time_window_end: datetime
    customer_verified: bool = False
    
    @validator('time_window_end')
    def validate_time_window(cls, v, values):
        if 'time_window_start' in values and v <= values['time_window_start']:
            raise ValueError('End time must be after start time')
        return v

class LocationUpdate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    timestamp: Optional[datetime] = None
    accuracy: Optional[float] = Field(None, description="GPS accuracy in meters")

class RouteStatusUpdate(BaseModel):
    status: RouteStatus
    current_stop_index: Optional[int] = None
    current_location: Optional[LocationUpdate] = None
    notes: Optional[str] = None

# Response Schemas
class CustomerResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str]
    address: str
    latitude: Optional[float]
    longitude: Optional[float]
    business_name: Optional[str]
    preferred_delivery_start: Optional[time]
    preferred_delivery_end: Optional[time]
    
    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    customer: Optional[CustomerResponse]
    order_number: str
    delivery_address: str
    delivery_latitude: Optional[float]
    delivery_longitude: Optional[float]
    delivery_date: date
    time_window_start: Optional[datetime]
    time_window_end: Optional[datetime]
    customer_verified_time_window: bool
    weight: float
    volume: float
    priority: int
    status: OrderStatus
    special_requirements: Optional[str]
    estimated_service_time: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class VehicleResponse(BaseModel):
    id: int
    license_plate: str
    model: str
    brand: str
    year: int
    vehicle_type: VehicleType
    max_weight_capacity: float
    max_volume_capacity: float
    fuel_consumption_per_km: float
    max_working_hours: int
    required_break_duration: int
    current_latitude: Optional[float]
    current_longitude: Optional[float]
    depot_latitude: float
    depot_longitude: float
    status: str
    has_gps: bool
    has_temperature_control: bool
    has_lift_gate: bool
    cost_per_km: float
    cost_per_hour: float
    
    class Config:
        from_attributes = True

class DriverResponse(BaseModel):
    id: int
    name: str
    license_number: str
    phone: str
    email: Optional[str]
    experience_level: str
    max_working_hours: int
    shift_start_time: Optional[time]
    shift_end_time: Optional[time]
    current_status: str
    current_latitude: Optional[float]
    current_longitude: Optional[float]
    total_deliveries: int
    successful_deliveries: int
    average_delivery_time: Optional[float]
    
    class Config:
        from_attributes = True

class RouteStopResponse(BaseModel):
    id: int
    sequence_number: int
    stop_type: str
    latitude: float
    longitude: float
    planned_arrival_time: Optional[datetime]
    planned_departure_time: Optional[datetime]
    actual_arrival_time: Optional[datetime]
    actual_departure_time: Optional[datetime]
    planned_service_time: int
    actual_service_time: Optional[int]
    distance_from_previous: float
    status: str
    order_id: Optional[int]
    order: Optional[OrderResponse]
    delivery_notes: Optional[str]
    
    class Config:
        from_attributes = True

class RouteResponse(BaseModel):
    id: int
    vehicle_id: int
    driver_id: int
    vehicle: Optional[VehicleResponse]
    driver: Optional[DriverResponse]
    planned_date: date
    planned_start_time: Optional[datetime]
    planned_end_time: Optional[datetime]
    actual_start_time: Optional[datetime]
    actual_end_time: Optional[datetime]
    total_distance: float
    total_duration: float
    actual_distance: Optional[float]
    actual_duration: Optional[float]
    total_stops: int
    completed_stops: int
    total_weight: float
    total_volume: float
    optimization_type: str
    optimization_score: float
    reoptimization_count: int
    status: RouteStatus
    current_stop_index: Optional[int]
    current_latitude: Optional[float]
    current_longitude: Optional[float]
    estimated_cost: Optional[float]
    actual_cost: Optional[float]
    fuel_consumption: Optional[float]
    on_time_delivery_rate: Optional[float]
    route_geometry: Optional[str]
    notes: Optional[str]
    stops: List[RouteStopResponse] = []
    
    class Config:
        from_attributes = True

class EventResponse(BaseModel):
    id: int
    event_type: str
    severity: EventSeverity
    status: str
    title: str
    description: Optional[str]
    route_id: Optional[int]
    vehicle_id: Optional[int]
    driver_id: Optional[int]
    order_id: Optional[int]
    route_stop_id: Optional[int]
    latitude: Optional[float]
    longitude: Optional[float]
    timestamp: datetime
    estimated_delay_minutes: Optional[int]
    affected_orders_count: Optional[int]
    estimated_cost_impact: Optional[float]
    triggers_reoptimization: bool
    reoptimization_triggered: bool
    source_system: Optional[str]
    response_notes: Optional[str]
    resolution_notes: Optional[str]
    resolved_at: Optional[datetime]
    escalated_at: Optional[datetime]
    notification_sent: bool
    metadata: Optional[Dict[str, Any]]
    
    class Config:
        from_attributes = True

class OptimizationResult(BaseModel):
    status: str
    routes_created: int
    route_ids: List[int]
    total_distance: float
    total_duration: float
    optimization_score: float
    solver_stats: Dict[str, Any]
    adaptive_monitoring: bool

class ETAPrediction(BaseModel):
    stop_id: int
    sequence_number: int
    planned_arrival: Optional[datetime]
    predicted_arrival: datetime
    travel_time_minutes: float
    distance_km: float
    traffic_factor: float
    confidence: float
    delay_minutes: Optional[float]

class ETAResponse(BaseModel):
    route_id: int
    eta_predictions: List[ETAPrediction]
    generated_at: datetime

class MonitoringStatus(BaseModel):
    adaptive_optimizer: Dict[str, Any]
    vrptw_solver: Dict[str, Any]
    eta_predictor: Dict[str, Any]
    system_time: datetime
    status: str

class SystemStats(BaseModel):
    total_routes: int
    active_routes: int
    completed_routes: int
    total_orders: int
    delivered_orders: int
    pending_orders: int
    total_vehicles: int
    available_vehicles: int
    total_drivers: int
    available_drivers: int
    active_events: int
    optimization_score_avg: float
    on_time_delivery_rate: float
    fuel_efficiency: float

# WebSocket Message Schemas
class WebSocketMessage(BaseModel):
    type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class RouteUpdateMessage(WebSocketMessage):
    type: str = "route_update"
    route_id: int
    status: str
    current_location: Optional[LocationUpdate]
    current_stop: Optional[int]

class EventMessage(WebSocketMessage):
    type: str = "event"
    event: EventResponse

class ETAUpdateMessage(WebSocketMessage):
    type: str = "eta_update"
    route_id: int
    eta_predictions: List[ETAPrediction]

class ReoptimizationMessage(WebSocketMessage):
    type: str = "reoptimization"
    route_id: int
    trigger_type: str
    status: str
    new_route: Optional[RouteResponse]

# Bulk Operations
class BulkOrderUpdate(BaseModel):
    order_ids: List[int]
    updates: Dict[str, Any]

class BulkRouteOperation(BaseModel):
    route_ids: List[int]
    operation: str  # "start", "pause", "cancel", "reoptimize"
    parameters: Optional[Dict[str, Any]] = None

# Analytics Schemas
class RouteAnalytics(BaseModel):
    route_id: int
    planned_vs_actual_distance: float
    planned_vs_actual_duration: float
    fuel_efficiency: float
    on_time_delivery_rate: float
    customer_satisfaction_score: Optional[float]
    cost_efficiency: float
    optimization_effectiveness: float

class PerformanceMetrics(BaseModel):
    date_range: Dict[str, date]
    total_routes: int
    average_optimization_score: float
    average_delivery_success_rate: float
    average_fuel_efficiency: float
    cost_savings_percentage: float
    manual_interventions_reduced: float
    sla_compliance_rate: float

# Configuration Schemas
class OptimizationConfig(BaseModel):
    time_limit_seconds: int = 300
    enable_adaptive_monitoring: bool = True
    reoptimization_threshold_minutes: int = 15
    traffic_weight_factor: float = 1.2
    distance_weight_factor: float = 1.0
    time_window_penalty: float = 100.0
    capacity_penalty: float = 50.0
    driver_experience_factor: float = 0.8

class NotificationConfig(BaseModel):
    enable_email_notifications: bool = True
    enable_sms_notifications: bool = False
    enable_push_notifications: bool = True
    notification_threshold_minutes: int = 15
    escalation_threshold_minutes: int = 30