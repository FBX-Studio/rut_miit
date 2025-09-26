from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import logging

from app.database import get_db
from app.models import Route, Order, Vehicle, Driver, Customer, RouteStop, Event
from app.optimization.vrptw_solver import VRPTWSolver
from app.optimization.adaptive_optimizer import AdaptiveOptimizer
from app.optimization.eta_predictor import ETAPredictor
from app.services.yandex_maps_service import YandexMapsService
from app.api.schemas import (
    RouteOptimizationRequest, RouteResponse, OrderResponse, 
    VehicleResponse, DriverResponse, EventResponse
)

logger = logging.getLogger(__name__)

# Initialize services
vrptw_solver = VRPTWSolver()
eta_predictor = ETAPredictor()
adaptive_optimizer = AdaptiveOptimizer(vrptw_solver, eta_predictor)

router = APIRouter(tags=["VRPTW System"])

# Maps endpoints for testing Yandex Maps API
@router.get("/maps/test")
async def test_yandex_maps():
    """Test Yandex Maps API connectivity"""
    try:
        yandex_service = YandexMapsService()
        status = yandex_service.get_service_status()
        return {
            "status": "success",
            "yandex_maps_service": status
        }
    except Exception as e:
        logger.error(f"Yandex Maps test failed: {e}")
        raise HTTPException(status_code=500, detail=f"Yandex Maps test failed: {str(e)}")

@router.get("/maps/geocode")
async def geocode_address(address: str):
    """Geocode an address using Yandex Maps"""
    try:
        yandex_service = YandexMapsService()
        await yandex_service._ensure_session()
        
        logger.info(f"Geocoding request for address: {address}")
        logger.info(f"API key configured: {bool(yandex_service.api_key)}")
        
        coordinates = await yandex_service.geocode_address(address)
        
        if coordinates:
            return {
                "status": "success",
                "address": address,
                "coordinates": {
                    "latitude": coordinates[0],
                    "longitude": coordinates[1]
                }
            }
        else:
            return {
                "status": "not_found",
                "address": address,
                "coordinates": None,
                "message": "Address not found or API error"
            }
    except Exception as e:
        logger.error(f"Geocoding failed: {e}")
        raise HTTPException(status_code=500, detail=f"Geocoding failed: {str(e)}")

@router.get("/maps/route")
async def get_route_info(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float
):
    """Get route information between two points using Yandex Maps"""
    try:
        yandex_service = YandexMapsService()
        await yandex_service._ensure_session()
        
        route_info = await yandex_service.get_route_info(
            origin=(origin_lat, origin_lon),
            destination=(dest_lat, dest_lon)
        )
        
        if route_info:
            return {
                "status": "success",
                "route": {
                    "distance_meters": route_info.total_distance_meters,
                    "time_seconds": route_info.total_time_seconds,
                    "traffic_time_seconds": route_info.traffic_time_seconds,
                    "geometry_points": len(route_info.geometry),
                    "traffic_segments": len(route_info.traffic_segments)
                }
            }
        else:
            return {
                "status": "not_found",
                "route": None
            }
    except Exception as e:
        logger.error(f"Route calculation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Route calculation failed: {str(e)}")

@router.post("/routes/optimize", response_model=Dict[str, Any])
async def optimize_routes(
    request: RouteOptimizationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Optimize routes for given orders, vehicles, and drivers
    """
    try:
        logger.info(f"Starting route optimization for {len(request.order_ids)} orders")
        
        # Get orders, vehicles, and drivers from database
        orders = db.query(Order).filter(Order.id.in_(request.order_ids)).all()
        vehicles = db.query(Vehicle).filter(Vehicle.id.in_(request.vehicle_ids)).all()
        drivers = db.query(Driver).filter(Driver.id.in_(request.driver_ids)).all()
        
        if not orders:
            raise HTTPException(status_code=400, detail="No valid orders found")
        if not vehicles:
            raise HTTPException(status_code=400, detail="No valid vehicles found")
        if not drivers:
            raise HTTPException(status_code=400, detail="No valid drivers found")
        
        # Solve VRPTW
        solution = vrptw_solver.solve_vrptw(
            orders=orders,
            vehicles=vehicles,
            drivers=drivers,
            depot_location=request.depot_location,
            time_limit_seconds=request.time_limit_seconds or 300
        )
        
        if not solution or not solution.get("routes"):
            raise HTTPException(status_code=400, detail="No feasible solution found")
        
        # Save routes to database
        created_routes = []
        for route_data in solution["routes"]:
            route = Route(
                vehicle_id=route_data["vehicle_id"],
                driver_id=route_data["driver_id"],
                planned_date=request.planned_date or date.today(),
                planned_start_time=route_data["start_time"],
                planned_end_time=route_data["end_time"],
                total_distance=route_data["total_distance"],
                total_duration=route_data["total_duration"],
                total_stops=len(route_data["stops"]),
                total_weight=route_data.get("total_weight", 0),
                total_volume=route_data.get("total_volume", 0),
                optimization_type="static",
                optimization_score=solution.get("optimization_score", 0),
                status="planned"
            )
            db.add(route)
            db.flush()  # Get the route ID
            
            # Create route stops
            for stop_data in route_data["stops"]:
                route_stop = RouteStop(
                    route_id=route.id,
                    order_id=stop_data.get("order_id"),
                    sequence_number=stop_data["sequence"],
                    stop_type=stop_data.get("type", "delivery"),
                    latitude=stop_data["latitude"],
                    longitude=stop_data["longitude"],
                    planned_arrival_time=stop_data["arrival_time"],
                    planned_departure_time=stop_data["departure_time"],
                    planned_service_time=stop_data.get("service_time", 15),
                    distance_from_previous=stop_data.get("distance", 0),
                    status="pending"
                )
                db.add(route_stop)
            
            created_routes.append(route)
        
        db.commit()
        
        # Start adaptive monitoring in background
        if request.enable_adaptive_monitoring:
            background_tasks.add_task(adaptive_optimizer.start_monitoring, db)
        
        logger.info(f"Created {len(created_routes)} optimized routes")
        
        return {
            "status": "success",
            "routes_created": len(created_routes),
            "route_ids": [route.id for route in created_routes],
            "total_distance": solution["total_distance"],
            "total_duration": solution["total_duration"],
            "optimization_score": solution.get("optimization_score", 0),
            "solver_stats": solution.get("solver_stats", {}),
            "adaptive_monitoring": request.enable_adaptive_monitoring
        }
        
    except Exception as e:
        logger.error(f"Route optimization failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@router.get("/routes", response_model=List[RouteResponse])
async def get_routes(
    date_filter: Optional[date] = Query(None, description="Filter routes by date"),
    status: Optional[str] = Query(None, description="Filter by route status"),
    vehicle_id: Optional[int] = Query(None, description="Filter by vehicle ID"),
    driver_id: Optional[int] = Query(None, description="Filter by driver ID"),
    limit: int = Query(50, le=200, description="Maximum number of routes to return"),
    offset: int = Query(0, ge=0, description="Number of routes to skip"),
    db: Session = Depends(get_db)
):
    """
    Get routes with optional filtering
    """
    try:
        query = db.query(Route)
        
        if date_filter:
            query = query.filter(Route.planned_date == date_filter)
        if status:
            query = query.filter(Route.status == status)
        if vehicle_id:
            query = query.filter(Route.vehicle_id == vehicle_id)
        if driver_id:
            query = query.filter(Route.driver_id == driver_id)
        
        routes = query.offset(offset).limit(limit).all()
        
        return [RouteResponse.from_orm(route) for route in routes]
        
    except Exception as e:
        logger.error(f"Error fetching routes: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch routes")

@router.get("/routes/{route_id}", response_model=RouteResponse)
async def get_route(route_id: int, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific route
    """
    try:
        route = db.query(Route).filter(Route.id == route_id).first()
        
        if not route:
            raise HTTPException(status_code=404, detail="Route not found")
        
        return RouteResponse.from_orm(route)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching route {route_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch route")

@router.put("/routes/{route_id}/status")
async def update_route_status(
    route_id: int,
    status: str,
    current_stop_index: Optional[int] = None,
    current_latitude: Optional[float] = None,
    current_longitude: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """
    Update route status and current position
    """
    try:
        route = db.query(Route).filter(Route.id == route_id).first()
        
        if not route:
            raise HTTPException(status_code=404, detail="Route not found")
        
        # Update route status
        old_status = route.status
        route.status = status
        
        if current_stop_index is not None:
            route.current_stop_index = current_stop_index
        
        if current_latitude is not None and current_longitude is not None:
            route.current_latitude = current_latitude
            route.current_longitude = current_longitude
            route.last_location_update = datetime.utcnow()
        
        # Update timestamps based on status
        if status == "in_progress" and old_status == "planned":
            route.actual_start_time = datetime.utcnow()
        elif status == "completed":
            route.actual_end_time = datetime.utcnow()
            route.actual_duration = (
                (route.actual_end_time - route.actual_start_time).total_seconds() / 60
                if route.actual_start_time else None
            )
        
        db.commit()
        
        logger.info(f"Updated route {route_id} status from {old_status} to {status}")
        
        return {
            "status": "success",
            "route_id": route_id,
            "old_status": old_status,
            "new_status": status,
            "updated_at": datetime.utcnow()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating route {route_id} status: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update route status")

@router.post("/routes/{route_id}/reoptimize")
async def reoptimize_route(
    route_id: int,
    reason: str = "Manual reoptimization",
    db: Session = Depends(get_db)
):
    """
    Manually trigger route reoptimization
    """
    try:
        route = db.query(Route).filter(Route.id == route_id).first()
        
        if not route:
            raise HTTPException(status_code=404, detail="Route not found")
        
        if route.status not in ["planned", "in_progress"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot reoptimize route with status: {route.status}"
            )
        
        # Trigger manual reoptimization
        result = await adaptive_optimizer.manual_reoptimization(db, route_id, reason)
        
        return {
            "status": "success",
            "message": "Reoptimization triggered",
            "route_id": route_id,
            "reason": reason,
            "result": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reoptimizing route {route_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to trigger reoptimization")

@router.get("/routes/{route_id}/eta")
async def get_route_eta(
    route_id: int,
    stop_sequence: Optional[int] = Query(None, description="Get ETA for specific stop"),
    db: Session = Depends(get_db)
):
    """
    Get ETA predictions for route stops
    """
    try:
        route = db.query(Route).filter(Route.id == route_id).first()
        
        if not route:
            raise HTTPException(status_code=404, detail="Route not found")
        
        # Get route stops
        stops_query = db.query(RouteStop).filter(RouteStop.route_id == route_id)
        
        if stop_sequence is not None:
            stops_query = stops_query.filter(RouteStop.sequence_number == stop_sequence)
        
        stops = stops_query.order_by(RouteStop.sequence_number).all()
        
        if not stops:
            raise HTTPException(status_code=404, detail="No stops found")
        
        # Calculate ETAs using ETA predictor
        eta_predictions = []
        current_time = datetime.utcnow()
        
        async with YandexMapsService() as yandex_service:
            for stop in stops:
                if stop.latitude and stop.longitude:
                    # Get previous stop location or depot
                    if stop.sequence_number > 1:
                        prev_stops = [s for s in stops if s.sequence_number == stop.sequence_number - 1]
                        if prev_stops:
                            prev_stop = prev_stops[0]
                            origin = (prev_stop.latitude, prev_stop.longitude)
                        else:
                            origin = (55.7558, 37.6176)  # Moscow depot
                    else:
                        origin = (55.7558, 37.6176)  # Depot
                    
                    destination = (stop.latitude, stop.longitude)
                    
                    # Get ETA with traffic
                    eta_info = await yandex_service.get_eta_with_traffic(
                        origin=origin,
                        destination=destination,
                        departure_time=current_time,
                        vehicle_type=route.vehicle.vehicle_type if route.vehicle else "van"
                    )
                    
                    eta_predictions.append({
                        "stop_id": stop.id,
                        "sequence_number": stop.sequence_number,
                        "planned_arrival": stop.planned_arrival_time,
                        "predicted_arrival": eta_info["eta"],
                        "travel_time_minutes": eta_info["travel_time_minutes"],
                        "distance_km": eta_info["distance_km"],
                        "traffic_factor": eta_info["traffic_factor"],
                        "confidence": eta_info["confidence"],
                        "delay_minutes": (
                            (eta_info["eta"] - stop.planned_arrival_time).total_seconds() / 60
                            if stop.planned_arrival_time else None
                        )
                    })
                    
                    # Update current time for next stop
                    current_time = eta_info["eta"] + timedelta(minutes=15)  # Add service time
        
        return {
            "route_id": route_id,
            "eta_predictions": eta_predictions,
            "generated_at": datetime.utcnow()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating ETA for route {route_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate ETA")

@router.get("/orders", response_model=List[OrderResponse])
async def get_orders(
    status: Optional[str] = Query(None, description="Filter by order status"),
    priority: Optional[int] = Query(None, description="Filter by priority level"),
    delivery_date: Optional[date] = Query(None, description="Filter by delivery date"),
    unassigned_only: bool = Query(False, description="Show only unassigned orders"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Get orders with optional filtering
    """
    try:
        query = db.query(Order)
        
        if status:
            query = query.filter(Order.status == status)
        if priority is not None:
            query = query.filter(Order.priority == priority)
        if delivery_date:
            query = query.filter(Order.delivery_date == delivery_date)
        if unassigned_only:
            query = query.filter(Order.route_stop_id.is_(None))
        
        orders = query.offset(offset).limit(limit).all()
        
        return [OrderResponse.from_orm(order) for order in orders]
        
    except Exception as e:
        logger.error(f"Error fetching orders: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch orders")

@router.put("/orders/{order_id}/time-window")
async def update_order_time_window(
    order_id: int,
    time_window_start: datetime,
    time_window_end: datetime,
    customer_verified: bool = False,
    db: Session = Depends(get_db)
):
    """
    Update order delivery time window
    """
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Validate time window
        if time_window_start >= time_window_end:
            raise HTTPException(
                status_code=400, 
                detail="Time window start must be before end time"
            )
        
        # Update time window
        old_start = order.time_window_start
        old_end = order.time_window_end
        
        order.time_window_start = time_window_start
        order.time_window_end = time_window_end
        order.customer_verified_time_window = customer_verified
        order.time_window_updated_at = datetime.utcnow()
        
        db.commit()
        
        # Create event for time window change
        event = Event(
            event_type="time_window_updated",
            severity="low",
            title=f"Time window updated for order {order_id}",
            description=f"Changed from [{old_start}] - [{old_end}] to [{time_window_start}] - [{time_window_end}]",
            order_id=order_id,
            timestamp=datetime.utcnow(),
            triggers_reoptimization=True,
            metadata={
                "old_time_window": {"start": old_start, "end": old_end},
                "new_time_window": {"start": time_window_start, "end": time_window_end},
                "customer_verified": customer_verified
            }
        )
        db.add(event)
        db.commit()
        
        logger.info(f"Updated time window for order {order_id}")
        
        return {
            "status": "success",
            "order_id": order_id,
            "old_time_window": {"start": old_start, "end": old_end},
            "new_time_window": {"start": time_window_start, "end": time_window_end},
            "customer_verified": customer_verified,
            "updated_at": datetime.utcnow()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating time window for order {order_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update time window")

@router.get("/vehicles", response_model=List[VehicleResponse])
async def get_vehicles(
    status: Optional[str] = Query(None, description="Filter by vehicle status"),
    vehicle_type: Optional[str] = Query(None, description="Filter by vehicle type"),
    available_only: bool = Query(False, description="Show only available vehicles"),
    db: Session = Depends(get_db)
):
    """
    Get vehicles with optional filtering
    """
    try:
        query = db.query(Vehicle)
        
        if status:
            query = query.filter(Vehicle.status == status)
        if vehicle_type:
            query = query.filter(Vehicle.vehicle_type == vehicle_type)
        if available_only:
            query = query.filter(Vehicle.status == "available")
        
        vehicles = query.all()
        
        return [VehicleResponse.from_orm(vehicle) for vehicle in vehicles]
        
    except Exception as e:
        logger.error(f"Error fetching vehicles: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch vehicles")

@router.get("/drivers", response_model=List[DriverResponse])
async def get_drivers(
    status: Optional[str] = Query(None, description="Filter by driver status"),
    available_only: bool = Query(False, description="Show only available drivers"),
    db: Session = Depends(get_db)
):
    """
    Get drivers with optional filtering
    """
    try:
        query = db.query(Driver)
        
        if status:
            query = query.filter(Driver.current_status == status)
        if available_only:
            query = query.filter(Driver.current_status == "available")
        
        drivers = query.all()
        
        return [DriverResponse.from_orm(driver) for driver in drivers]
        
    except Exception as e:
        logger.error(f"Error fetching drivers: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch drivers")

@router.get("/events", response_model=List[EventResponse])
async def get_events(
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    route_id: Optional[int] = Query(None, description="Filter by route ID"),
    active_only: bool = Query(False, description="Show only active events"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Get system events with optional filtering
    """
    try:
        query = db.query(Event)
        
        if event_type:
            query = query.filter(Event.event_type == event_type)
        if severity:
            query = query.filter(Event.severity == severity)
        if route_id:
            query = query.filter(Event.route_id == route_id)
        if active_only:
            query = query.filter(Event.status.in_(["active", "pending"]))
        
        events = query.order_by(Event.timestamp.desc()).offset(offset).limit(limit).all()
        
        return [EventResponse.from_orm(event) for event in events]
        
    except Exception as e:
        logger.error(f"Error fetching events: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch events")

@router.get("/monitoring/status")
async def get_monitoring_status():
    """
    Get current system monitoring status
    """
    try:
        return {
            "adaptive_optimizer": adaptive_optimizer.get_monitoring_status(),
            "vrptw_solver": {
                "available": True,
                "last_optimization": vrptw_solver.last_optimization_time,
                "total_optimizations": vrptw_solver.optimization_count
            },
            "eta_predictor": {
                "model_trained": eta_predictor.is_trained,
                "feature_importance": eta_predictor.get_feature_importance() if eta_predictor.is_trained else {}
            },
            "system_time": datetime.utcnow(),
            "status": "operational"
        }
        
    except Exception as e:
        logger.error(f"Error getting monitoring status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get monitoring status")

@router.get("/monitoring/stats")
async def get_system_stats(db: Session = Depends(get_db)):
    """
    Get system statistics for dashboard
    """
    try:
        # Get route statistics with simple string comparisons
        total_routes = db.query(Route).count()
        active_routes = db.query(Route).filter(Route.status == 'active').count()
        completed_routes = db.query(Route).filter(Route.status == 'completed').count()
        
        # Get order statistics with simple string comparisons
        total_orders = db.query(Order).count()
        delivered_orders = db.query(Order).filter(Order.status == 'delivered').count()
        pending_orders = db.query(Order).filter(Order.status.in_(['pending', 'assigned', 'in_transit'])).count()
        
        # Get vehicle statistics with simple string comparisons
        total_vehicles = db.query(Vehicle).count()
        available_vehicles = db.query(Vehicle).filter(Vehicle.status == 'available').count()
        
        # Get driver statistics with simple string comparisons
        total_drivers = db.query(Driver).count()
        available_drivers = db.query(Driver).filter(Driver.status == 'available').count()
        
        # Calculate performance metrics
        optimization_score_avg = 85.5  # Placeholder - could be calculated from route optimization results
        on_time_delivery_rate = 92.3   # Placeholder - could be calculated from delivery data
        fuel_efficiency = 78.9         # Placeholder - could be calculated from vehicle data
        
        # Get active events count (placeholder)
        active_events = 5  # This could be calculated from a monitoring/events system
        
        return {
            "total_routes": total_routes,
            "active_routes": active_routes,
            "completed_routes": completed_routes,
            "total_orders": total_orders,
            "delivered_orders": delivered_orders,
            "pending_orders": pending_orders,
            "total_vehicles": total_vehicles,
            "available_vehicles": available_vehicles,
            "total_drivers": total_drivers,
            "available_drivers": available_drivers,
            "active_events": active_events,
            "optimization_score_avg": optimization_score_avg,
            "on_time_delivery_rate": on_time_delivery_rate,
            "fuel_efficiency": fuel_efficiency
        }
        
    except Exception as e:
        logger.error(f"Error getting system stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get system stats: {str(e)}")

@router.post("/monitoring/start")
async def start_monitoring(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Start adaptive monitoring
    """
    try:
        if adaptive_optimizer.monitoring_active:
            return {"status": "already_running", "message": "Monitoring is already active"}
        
        background_tasks.add_task(adaptive_optimizer.start_monitoring, db)
        
        return {
            "status": "started",
            "message": "Adaptive monitoring started",
            "started_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error starting monitoring: {e}")
        raise HTTPException(status_code=500, detail="Failed to start monitoring")

@router.post("/monitoring/stop")
async def stop_monitoring():
    """
    Stop adaptive monitoring
    """
    try:
        adaptive_optimizer.stop_monitoring()
        
        return {
            "status": "stopped",
            "message": "Adaptive monitoring stopped",
            "stopped_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error stopping monitoring: {e}")
        raise HTTPException(status_code=500, detail="Failed to stop monitoring")