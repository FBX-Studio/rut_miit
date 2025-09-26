import asyncio
import logging
from typing import Dict, List, Optional, Tuple, Set
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import numpy as np
from sqlalchemy.orm import Session

from app.models import Route, RouteStop, Order, Vehicle, Driver, Event
from app.optimization.vrptw_solver import VRPTWSolver
from app.optimization.eta_predictor import ETAPredictor

logger = logging.getLogger(__name__)

class TriggerType(Enum):
    """Types of reoptimization triggers"""
    DELAY = "delay"
    TRAFFIC = "traffic"
    VEHICLE_BREAKDOWN = "vehicle_breakdown"
    DRIVER_UNAVAILABLE = "driver_unavailable"
    NEW_URGENT_ORDER = "new_urgent_order"
    CUSTOMER_RESCHEDULE = "customer_reschedule"
    WEATHER = "weather"
    MANUAL = "manual"

@dataclass
class ReoptimizationTrigger:
    """Represents a trigger for route reoptimization"""
    trigger_type: TriggerType
    severity: float  # 0.0 to 1.0
    affected_routes: List[int]
    affected_orders: List[int]
    description: str
    timestamp: datetime
    estimated_delay_minutes: Optional[float] = None
    requires_immediate_action: bool = False
    metadata: Dict = None

class AdaptiveOptimizer:
    """
    Adaptive optimizer that monitors routes and triggers reoptimization
    when significant deviations or events occur
    """
    
    def __init__(
        self,
        vrptw_solver: VRPTWSolver,
        eta_predictor: ETAPredictor,
        delay_threshold_minutes: float = 15.0,
        traffic_threshold: float = 1.5,
        reoptimization_cooldown_minutes: float = 30.0
    ):
        self.vrptw_solver = vrptw_solver
        self.eta_predictor = eta_predictor
        self.delay_threshold_minutes = delay_threshold_minutes
        self.traffic_threshold = traffic_threshold
        self.reoptimization_cooldown_minutes = reoptimization_cooldown_minutes
        
        # Track recent reoptimizations to avoid thrashing
        self.last_reoptimization: Dict[int, datetime] = {}
        
        # Active monitoring
        self.monitoring_active = False
        self.monitoring_interval_seconds = 60  # Check every minute
        
        # Trigger weights for prioritization
        self.trigger_weights = {
            TriggerType.VEHICLE_BREAKDOWN: 1.0,
            TriggerType.DRIVER_UNAVAILABLE: 0.9,
            TriggerType.NEW_URGENT_ORDER: 0.8,
            TriggerType.DELAY: 0.7,
            TriggerType.TRAFFIC: 0.6,
            TriggerType.CUSTOMER_RESCHEDULE: 0.5,
            TriggerType.WEATHER: 0.4,
            TriggerType.MANUAL: 0.3
        }
    
    async def start_monitoring(self, db: Session):
        """Start continuous monitoring of active routes"""
        self.monitoring_active = True
        logger.info("Started adaptive route monitoring")
        
        while self.monitoring_active:
            try:
                await self._monitor_routes(db)
                await asyncio.sleep(self.monitoring_interval_seconds)
            except Exception as e:
                logger.error(f"Error in route monitoring: {e}")
                await asyncio.sleep(self.monitoring_interval_seconds)
    
    def stop_monitoring(self):
        """Stop route monitoring"""
        self.monitoring_active = False
        logger.info("Stopped adaptive route monitoring")
    
    async def _monitor_routes(self, db: Session):
        """Monitor all active routes for reoptimization triggers"""
        
        # Get all active routes
        active_routes = db.query(Route).filter(
            Route.status.in_(["planned", "in_progress"])
        ).all()
        
        if not active_routes:
            return
        
        triggers = []
        
        for route in active_routes:
            # Check for various trigger conditions
            route_triggers = await self._check_route_triggers(db, route)
            triggers.extend(route_triggers)
        
        # Process triggers if any found
        if triggers:
            await self._process_triggers(db, triggers)
    
    async def _check_route_triggers(self, db: Session, route: Route) -> List[ReoptimizationTrigger]:
        """Check a single route for reoptimization triggers"""
        triggers = []
        current_time = datetime.utcnow()
        
        # Skip if recently reoptimized
        if self._is_in_cooldown(route.id, current_time):
            return triggers
        
        # Check delay trigger
        delay_trigger = self._check_delay_trigger(route, current_time)
        if delay_trigger:
            triggers.append(delay_trigger)
        
        # Check traffic trigger
        traffic_trigger = await self._check_traffic_trigger(route, current_time)
        if traffic_trigger:
            triggers.append(traffic_trigger)
        
        # Check vehicle/driver availability
        availability_trigger = self._check_availability_trigger(route, current_time)
        if availability_trigger:
            triggers.append(availability_trigger)
        
        # Check for new urgent orders in the area
        urgent_order_trigger = await self._check_urgent_orders_trigger(db, route, current_time)
        if urgent_order_trigger:
            triggers.append(urgent_order_trigger)
        
        return triggers
    
    def _check_delay_trigger(self, route: Route, current_time: datetime) -> Optional[ReoptimizationTrigger]:
        """Check if route has significant delays"""
        
        if not route.current_stop_index or route.current_stop_index == 0:
            return None
        
        # Get current route stop
        current_stops = [stop for stop in route.route_stops 
                        if stop.sequence_number == route.current_stop_index]
        
        if not current_stops:
            return None
        
        current_stop = current_stops[0]
        
        # Calculate delay
        if current_stop.planned_arrival_time and current_time > current_stop.planned_arrival_time:
            delay_minutes = (current_time - current_stop.planned_arrival_time).total_seconds() / 60
            
            if delay_minutes > self.delay_threshold_minutes:
                return ReoptimizationTrigger(
                    trigger_type=TriggerType.DELAY,
                    severity=min(1.0, delay_minutes / (self.delay_threshold_minutes * 3)),
                    affected_routes=[route.id],
                    affected_orders=[stop.order_id for stop in route.route_stops 
                                   if stop.sequence_number >= route.current_stop_index],
                    description=f"Route {route.id} delayed by {delay_minutes:.1f} minutes",
                    timestamp=current_time,
                    estimated_delay_minutes=delay_minutes,
                    requires_immediate_action=delay_minutes > self.delay_threshold_minutes * 2
                )
        
        return None
    
    async def _check_traffic_trigger(self, route: Route, current_time: datetime) -> Optional[ReoptimizationTrigger]:
        """Check for significant traffic conditions affecting the route"""
        
        # This would integrate with Yandex Maps traffic API
        # For now, simulate traffic checking
        
        # Get remaining stops
        remaining_stops = [stop for stop in route.route_stops 
                          if stop.sequence_number >= (route.current_stop_index or 1)]
        
        if len(remaining_stops) < 2:
            return None
        
        # Simulate traffic factor calculation
        # In production, this would call Yandex Maps API
        traffic_factor = np.random.uniform(1.0, 2.0)  # Simulate traffic conditions
        
        if traffic_factor > self.traffic_threshold:
            affected_orders = [stop.order_id for stop in remaining_stops if stop.order_id]
            
            return ReoptimizationTrigger(
                trigger_type=TriggerType.TRAFFIC,
                severity=min(1.0, (traffic_factor - 1.0) / 1.0),
                affected_routes=[route.id],
                affected_orders=affected_orders,
                description=f"Heavy traffic detected on route {route.id} (factor: {traffic_factor:.2f})",
                timestamp=current_time,
                estimated_delay_minutes=(traffic_factor - 1.0) * 30,
                metadata={"traffic_factor": traffic_factor}
            )
        
        return None
    
    def _check_availability_trigger(self, route: Route, current_time: datetime) -> Optional[ReoptimizationTrigger]:
        """Check if vehicle or driver becomes unavailable"""
        
        # Check vehicle status
        if route.vehicle and route.vehicle.status not in ["available", "in_transit"]:
            return ReoptimizationTrigger(
                trigger_type=TriggerType.VEHICLE_BREAKDOWN,
                severity=1.0,
                affected_routes=[route.id],
                affected_orders=[stop.order_id for stop in route.route_stops 
                               if stop.status in ["pending", "in_progress"] and stop.order_id],
                description=f"Vehicle {route.vehicle.license_plate} unavailable: {route.vehicle.status}",
                timestamp=current_time,
                requires_immediate_action=True
            )
        
        # Check driver availability
        if route.driver and not route.driver.is_available():
            return ReoptimizationTrigger(
                trigger_type=TriggerType.DRIVER_UNAVAILABLE,
                severity=0.9,
                affected_routes=[route.id],
                affected_orders=[stop.order_id for stop in route.route_stops 
                               if stop.status in ["pending", "in_progress"] and stop.order_id],
                description=f"Driver {route.driver.full_name} unavailable",
                timestamp=current_time,
                requires_immediate_action=True
            )
        
        return None
    
    async def _check_urgent_orders_trigger(
        self, 
        db: Session, 
        route: Route, 
        current_time: datetime
    ) -> Optional[ReoptimizationTrigger]:
        """Check for new urgent orders that could be added to the route"""
        
        # Find unassigned urgent orders
        urgent_orders = db.query(Order).filter(
            Order.route_stop_id.is_(None),
            Order.priority >= 4,  # High priority orders
            Order.status == "pending",
            Order.delivery_date == current_time.date()
        ).all()
        
        if not urgent_orders:
            return None
        
        # Check if any urgent orders are near the route
        route_coordinates = [(stop.latitude, stop.longitude) 
                           for stop in route.route_stops 
                           if stop.latitude and stop.longitude]
        
        nearby_urgent_orders = []
        for order in urgent_orders:
            if order.delivery_latitude and order.delivery_longitude:
                # Simple distance check (in production, use proper geospatial queries)
                for route_lat, route_lon in route_coordinates:
                    distance = self._calculate_distance(
                        order.delivery_latitude, order.delivery_longitude,
                        route_lat, route_lon
                    )
                    if distance < 5.0:  # Within 5km
                        nearby_urgent_orders.append(order)
                        break
        
        if nearby_urgent_orders:
            return ReoptimizationTrigger(
                trigger_type=TriggerType.NEW_URGENT_ORDER,
                severity=0.8,
                affected_routes=[route.id],
                affected_orders=[order.id for order in nearby_urgent_orders],
                description=f"Found {len(nearby_urgent_orders)} urgent orders near route {route.id}",
                timestamp=current_time,
                metadata={"new_orders": [order.id for order in nearby_urgent_orders]}
            )
        
        return None
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in kilometers"""
        # Simplified distance calculation (Haversine formula would be more accurate)
        lat_diff = abs(lat1 - lat2)
        lon_diff = abs(lon1 - lon2)
        return np.sqrt(lat_diff**2 + lon_diff**2) * 111  # Rough km conversion
    
    def _is_in_cooldown(self, route_id: int, current_time: datetime) -> bool:
        """Check if route is in reoptimization cooldown period"""
        if route_id not in self.last_reoptimization:
            return False
        
        last_reopt = self.last_reoptimization[route_id]
        cooldown_end = last_reopt + timedelta(minutes=self.reoptimization_cooldown_minutes)
        
        return current_time < cooldown_end
    
    async def _process_triggers(self, db: Session, triggers: List[ReoptimizationTrigger]):
        """Process and prioritize reoptimization triggers"""
        
        if not triggers:
            return
        
        # Sort triggers by priority (severity * weight)
        prioritized_triggers = sorted(
            triggers,
            key=lambda t: t.severity * self.trigger_weights.get(t.trigger_type, 0.5),
            reverse=True
        )
        
        # Group triggers by affected routes
        route_triggers: Dict[int, List[ReoptimizationTrigger]] = {}
        for trigger in prioritized_triggers:
            for route_id in trigger.affected_routes:
                if route_id not in route_triggers:
                    route_triggers[route_id] = []
                route_triggers[route_id].append(trigger)
        
        # Process each route's triggers
        for route_id, route_trigger_list in route_triggers.items():
            await self._reoptimize_route(db, route_id, route_trigger_list)
    
    async def _reoptimize_route(
        self, 
        db: Session, 
        route_id: int, 
        triggers: List[ReoptimizationTrigger]
    ):
        """Reoptimize a specific route based on triggers"""
        
        try:
            route = db.query(Route).filter(Route.id == route_id).first()
            if not route:
                logger.error(f"Route {route_id} not found for reoptimization")
                return
            
            logger.info(f"Reoptimizing route {route_id} due to {len(triggers)} triggers")
            
            # Create event for reoptimization
            event = Event(
                event_type="reoptimization",
                severity="medium",
                title=f"Route {route_id} Reoptimization",
                description=f"Triggered by: {', '.join([t.trigger_type.value for t in triggers])}",
                route_id=route_id,
                vehicle_id=route.vehicle_id,
                driver_id=route.driver_id,
                timestamp=datetime.utcnow(),
                estimated_delay_minutes=max([t.estimated_delay_minutes or 0 for t in triggers]),
                triggers_reoptimization=True,
                metadata={
                    "triggers": [
                        {
                            "type": t.trigger_type.value,
                            "severity": t.severity,
                            "description": t.description
                        } for t in triggers
                    ]
                }
            )
            db.add(event)
            
            # Determine reoptimization strategy based on trigger types
            strategy = self._determine_reoptimization_strategy(triggers)
            
            if strategy == "local":
                # Local reoptimization (2-opt, 3-opt)
                success = await self._local_reoptimization(db, route, triggers)
            elif strategy == "global":
                # Global reoptimization with other routes
                success = await self._global_reoptimization(db, route, triggers)
            else:
                # Emergency reoptimization (immediate reassignment)
                success = await self._emergency_reoptimization(db, route, triggers)
            
            if success:
                # Update last reoptimization time
                self.last_reoptimization[route_id] = datetime.utcnow()
                
                # Update route metrics
                route.reoptimization_count = (route.reoptimization_count or 0) + 1
                route.last_reoptimization_time = datetime.utcnow()
                
                event.status = "resolved"
                event.resolution_notes = f"Route reoptimized using {strategy} strategy"
                
                logger.info(f"Successfully reoptimized route {route_id}")
            else:
                event.status = "failed"
                event.resolution_notes = "Reoptimization failed"
                logger.error(f"Failed to reoptimize route {route_id}")
            
            db.commit()
            
        except Exception as e:
            logger.error(f"Error reoptimizing route {route_id}: {e}")
            db.rollback()
    
    def _determine_reoptimization_strategy(self, triggers: List[ReoptimizationTrigger]) -> str:
        """Determine the best reoptimization strategy based on triggers"""
        
        # Check for emergency situations
        emergency_triggers = [TriggerType.VEHICLE_BREAKDOWN, TriggerType.DRIVER_UNAVAILABLE]
        if any(t.trigger_type in emergency_triggers for t in triggers):
            return "emergency"
        
        # Check for high severity or multiple triggers
        max_severity = max(t.severity for t in triggers)
        if max_severity > 0.8 or len(triggers) > 2:
            return "global"
        
        # Default to local optimization
        return "local"
    
    async def _local_reoptimization(
        self, 
        db: Session, 
        route: Route, 
        triggers: List[ReoptimizationTrigger]
    ) -> bool:
        """Perform local reoptimization using 2-opt/3-opt"""
        
        try:
            # Get remaining stops
            remaining_stops = [
                stop for stop in route.route_stops 
                if stop.sequence_number >= (route.current_stop_index or 1)
                and stop.status in ["pending", "in_progress"]
            ]
            
            if len(remaining_stops) < 3:
                return True  # Nothing to optimize
            
            # Use VRPTW solver's local reoptimization
            optimized_stops = self.vrptw_solver.local_reoptimization(
                remaining_stops,
                route.vehicle,
                route.driver
            )
            
            # Update stop sequences
            for i, stop in enumerate(optimized_stops):
                stop.sequence_number = (route.current_stop_index or 1) + i
                
                # Update ETA predictions
                if i > 0:
                    prev_stop = optimized_stops[i-1]
                    eta_prediction = self.eta_predictor.predict_eta(
                        distance_km=stop.distance_from_previous or 5.0,
                        traffic_factor=1.2,  # Assume some traffic
                        current_time=prev_stop.planned_departure_time or datetime.utcnow(),
                        driver_experience=route.driver.experience_years if route.driver else 3.0,
                        vehicle_type=route.vehicle.vehicle_type if route.vehicle else "van"
                    )
                    stop.planned_arrival_time = eta_prediction["eta"]
                    stop.planned_departure_time = stop.planned_arrival_time + timedelta(minutes=15)
            
            return True
            
        except Exception as e:
            logger.error(f"Local reoptimization failed: {e}")
            return False
    
    async def _global_reoptimization(
        self, 
        db: Session, 
        route: Route, 
        triggers: List[ReoptimizationTrigger]
    ) -> bool:
        """Perform global reoptimization considering other routes"""
        
        try:
            # Get all active routes in the area
            nearby_routes = db.query(Route).filter(
                Route.status.in_(["planned", "in_progress"]),
                Route.id != route.id,
                Route.planned_date == route.planned_date
            ).all()
            
            # Collect all unfinished orders
            all_orders = []
            
            # Add orders from current route
            for stop in route.route_stops:
                if (stop.sequence_number >= (route.current_stop_index or 1) 
                    and stop.status in ["pending", "in_progress"] 
                    and stop.order):
                    all_orders.append(stop.order)
            
            # Add new urgent orders if any
            for trigger in triggers:
                if trigger.trigger_type == TriggerType.NEW_URGENT_ORDER:
                    new_order_ids = trigger.metadata.get("new_orders", [])
                    new_orders = db.query(Order).filter(Order.id.in_(new_order_ids)).all()
                    all_orders.extend(new_orders)
            
            if not all_orders:
                return True
            
            # Get available vehicles and drivers
            vehicles = [route.vehicle] if route.vehicle else []
            drivers = [route.driver] if route.driver else []
            
            # Add vehicles/drivers from nearby routes if needed
            for nearby_route in nearby_routes[:2]:  # Limit to 2 additional routes
                if nearby_route.vehicle:
                    vehicles.append(nearby_route.vehicle)
                if nearby_route.driver:
                    drivers.append(nearby_route.driver)
            
            # Solve VRPTW for the orders
            solution = self.vrptw_solver.solve_vrptw(
                orders=all_orders,
                vehicles=vehicles,
                drivers=drivers,
                depot_location=(55.7558, 37.6176)  # Moscow coordinates
            )
            
            if solution and solution.get("routes"):
                # Update the route with new solution
                # This is a simplified update - in production, you'd need more careful handling
                route.total_distance = solution["total_distance"]
                route.total_duration = solution["total_duration"]
                route.optimization_score = solution.get("optimization_score", 0.0)
                
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Global reoptimization failed: {e}")
            return False
    
    async def _emergency_reoptimization(
        self, 
        db: Session, 
        route: Route, 
        triggers: List[ReoptimizationTrigger]
    ) -> bool:
        """Handle emergency situations requiring immediate reassignment"""
        
        try:
            # Mark route as disrupted
            route.status = "disrupted"
            
            # Get unfinished orders
            unfinished_orders = []
            for stop in route.route_stops:
                if (stop.sequence_number >= (route.current_stop_index or 1) 
                    and stop.status in ["pending", "in_progress"] 
                    and stop.order):
                    unfinished_orders.append(stop.order)
                    # Reset order assignment
                    stop.order.route_stop_id = None
            
            if not unfinished_orders:
                return True
            
            # Find alternative vehicles and drivers
            available_vehicles = db.query(Vehicle).filter(
                Vehicle.status == "available",
                Vehicle.id != route.vehicle_id
            ).all()
            
            available_drivers = db.query(Driver).filter(
                Driver.current_status == "available",
                Driver.id != route.driver_id
            ).all()
            
            if not available_vehicles or not available_drivers:
                # Create emergency event for manual handling
                emergency_event = Event(
                    event_type="emergency_reassignment_needed",
                    severity="high",
                    title=f"Emergency: Route {route.id} needs manual reassignment",
                    description=f"No available resources for {len(unfinished_orders)} orders",
                    route_id=route.id,
                    timestamp=datetime.utcnow(),
                    requires_manual_intervention=True,
                    metadata={"unfinished_orders": [order.id for order in unfinished_orders]}
                )
                db.add(emergency_event)
                return False
            
            # Create new emergency routes
            emergency_solution = self.vrptw_solver.solve_vrptw(
                orders=unfinished_orders,
                vehicles=available_vehicles[:3],  # Use up to 3 vehicles
                drivers=available_drivers[:3],
                depot_location=(55.7558, 37.6176),
                time_limit_seconds=30  # Quick solution for emergency
            )
            
            if emergency_solution and emergency_solution.get("routes"):
                logger.info(f"Created {len(emergency_solution['routes'])} emergency routes")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Emergency reoptimization failed: {e}")
            return False
    
    async def manual_reoptimization(
        self, 
        db: Session, 
        route_id: int, 
        reason: str = "Manual trigger"
    ) -> Dict:
        """Manually trigger reoptimization for a route"""
        
        trigger = ReoptimizationTrigger(
            trigger_type=TriggerType.MANUAL,
            severity=0.5,
            affected_routes=[route_id],
            affected_orders=[],
            description=reason,
            timestamp=datetime.utcnow()
        )
        
        await self._reoptimize_route(db, route_id, [trigger])
        
        return {
            "status": "triggered",
            "route_id": route_id,
            "reason": reason,
            "timestamp": datetime.utcnow()
        }
    
    def get_monitoring_status(self) -> Dict:
        """Get current monitoring status and statistics"""
        return {
            "monitoring_active": self.monitoring_active,
            "monitoring_interval_seconds": self.monitoring_interval_seconds,
            "delay_threshold_minutes": self.delay_threshold_minutes,
            "traffic_threshold": self.traffic_threshold,
            "reoptimization_cooldown_minutes": self.reoptimization_cooldown_minutes,
            "recent_reoptimizations": len(self.last_reoptimization),
            "last_reoptimization_times": {
                route_id: timestamp.isoformat() 
                for route_id, timestamp in self.last_reoptimization.items()
            }
        }