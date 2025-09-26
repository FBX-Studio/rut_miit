from fastapi import WebSocket, WebSocketDisconnect, Depends
from fastapi.routing import APIRouter
from sqlalchemy.orm import Session
from typing import Dict, List, Set
import json
import asyncio
import logging
from datetime import datetime

from app.database import get_db
from app.models import Route, Event, RouteStop
from app.api.schemas import (
    WebSocketMessage, RouteUpdateMessage, EventMessage, 
    ETAUpdateMessage, ReoptimizationMessage
)

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # Store active connections by type
        self.active_connections: Dict[str, Set[WebSocket]] = {
            "routes": set(),
            "events": set(),
            "eta": set(),
            "monitoring": set(),
            "all": set()
        }
        # Store connection metadata
        self.connection_metadata: Dict[WebSocket, Dict] = {}
        
    async def connect(self, websocket: WebSocket, connection_type: str = "all", **metadata):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        
        # Add to appropriate connection set
        if connection_type in self.active_connections:
            self.active_connections[connection_type].add(websocket)
        self.active_connections["all"].add(websocket)
        
        # Store metadata
        self.connection_metadata[websocket] = {
            "type": connection_type,
            "connected_at": datetime.utcnow(),
            **metadata
        }
        
        logger.info(f"WebSocket connected: {connection_type}, total connections: {len(self.active_connections['all'])}")
        
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        # Remove from all connection sets
        for connection_set in self.active_connections.values():
            connection_set.discard(websocket)
        
        # Remove metadata
        metadata = self.connection_metadata.pop(websocket, {})
        connection_type = metadata.get("type", "unknown")
        
        logger.info(f"WebSocket disconnected: {connection_type}, remaining connections: {len(self.active_connections['all'])}")
        
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket"""
        try:
            await websocket.send_text(json.dumps(message, default=str))
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            self.disconnect(websocket)
            
    async def broadcast_to_type(self, message: dict, connection_type: str):
        """Broadcast a message to all connections of a specific type"""
        if connection_type not in self.active_connections:
            return
            
        disconnected = set()
        for websocket in self.active_connections[connection_type].copy():
            try:
                await websocket.send_text(json.dumps(message, default=str))
            except Exception as e:
                logger.error(f"Error broadcasting to {connection_type}: {e}")
                disconnected.add(websocket)
        
        # Clean up disconnected websockets
        for websocket in disconnected:
            self.disconnect(websocket)
            
    async def broadcast_to_all(self, message: dict):
        """Broadcast a message to all active connections"""
        await self.broadcast_to_type(message, "all")
        
    async def send_route_update(self, route_id: int, status: str, current_location: dict = None, current_stop: int = None):
        """Send route update to relevant connections"""
        message = RouteUpdateMessage(
            route_id=route_id,
            status=status,
            current_location=current_location,
            current_stop=current_stop
        ).dict()
        
        await self.broadcast_to_type(message, "routes")
        await self.broadcast_to_type(message, "monitoring")
        
    async def send_event_notification(self, event_data: dict):
        """Send event notification to relevant connections"""
        message = EventMessage(
            event=event_data
        ).dict()
        
        await self.broadcast_to_type(message, "events")
        await self.broadcast_to_type(message, "monitoring")
        
    async def send_eta_update(self, route_id: int, eta_predictions: list):
        """Send ETA update to relevant connections"""
        message = ETAUpdateMessage(
            route_id=route_id,
            eta_predictions=eta_predictions
        ).dict()
        
        await self.broadcast_to_type(message, "eta")
        await self.broadcast_to_type(message, "monitoring")
        
    async def send_reoptimization_notification(self, route_id: int, trigger_type: str, status: str, new_route: dict = None):
        """Send reoptimization notification"""
        message = ReoptimizationMessage(
            route_id=route_id,
            trigger_type=trigger_type,
            status=status,
            new_route=new_route
        ).dict()
        
        await self.broadcast_to_type(message, "routes")
        await self.broadcast_to_type(message, "monitoring")
        
    def get_connection_stats(self):
        """Get statistics about active connections"""
        return {
            "total_connections": len(self.active_connections["all"]),
            "connections_by_type": {
                conn_type: len(connections) 
                for conn_type, connections in self.active_connections.items()
                if conn_type != "all"
            },
            "connection_metadata": [
                {
                    "type": metadata.get("type"),
                    "connected_at": metadata.get("connected_at"),
                    "duration_seconds": (
                        datetime.utcnow() - metadata.get("connected_at", datetime.utcnow())
                    ).total_seconds()
                }
                for metadata in self.connection_metadata.values()
            ]
        }

# Global connection manager instance
manager = ConnectionManager()

# WebSocket router
websocket_router = APIRouter()

@websocket_router.websocket("/ws/routes")
async def websocket_routes_endpoint(websocket: WebSocket):
    """WebSocket endpoint for route updates"""
    await manager.connect(websocket, "routes")
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "ping":
                await manager.send_personal_message({"type": "pong", "timestamp": datetime.utcnow()}, websocket)
            elif message.get("type") == "subscribe_route":
                route_id = message.get("route_id")
                if route_id:
                    # Add route-specific subscription logic here
                    await manager.send_personal_message({
                        "type": "subscription_confirmed",
                        "route_id": route_id,
                        "timestamp": datetime.utcnow()
                    }, websocket)
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error in routes endpoint: {e}")
        manager.disconnect(websocket)

@websocket_router.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    """WebSocket endpoint for event notifications"""
    await manager.connect(websocket, "events")
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await manager.send_personal_message({"type": "pong", "timestamp": datetime.utcnow()}, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error in events endpoint: {e}")
        manager.disconnect(websocket)

@websocket_router.websocket("/ws/eta")
async def websocket_eta_endpoint(websocket: WebSocket):
    """WebSocket endpoint for ETA updates"""
    await manager.connect(websocket, "eta")
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await manager.send_personal_message({"type": "pong", "timestamp": datetime.utcnow()}, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error in ETA endpoint: {e}")
        manager.disconnect(websocket)

@websocket_router.websocket("/ws/monitoring")
async def websocket_monitoring_endpoint(websocket: WebSocket):
    """WebSocket endpoint for comprehensive system monitoring"""
    await manager.connect(websocket, "monitoring")
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await manager.send_personal_message({"type": "pong", "timestamp": datetime.utcnow()}, websocket)
            elif message.get("type") == "get_stats":
                stats = manager.get_connection_stats()
                await manager.send_personal_message({
                    "type": "stats",
                    "data": stats,
                    "timestamp": datetime.utcnow()
                }, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error in monitoring endpoint: {e}")
        manager.disconnect(websocket)

# Background task for periodic updates
async def periodic_updates_task():
    """Background task to send periodic updates to connected clients"""
    while True:
        try:
            # Send periodic heartbeat to all connections
            if len(manager.active_connections["all"]) > 0:
                heartbeat_message = {
                    "type": "heartbeat",
                    "timestamp": datetime.utcnow(),
                    "active_connections": len(manager.active_connections["all"])
                }
                await manager.broadcast_to_all(heartbeat_message)
            
            # Wait for next heartbeat (every 30 seconds)
            await asyncio.sleep(30)
            
        except Exception as e:
            logger.error(f"Error in periodic updates task: {e}")
            await asyncio.sleep(30)

# Utility functions for sending notifications
async def notify_route_status_change(route_id: int, old_status: str, new_status: str, current_location: dict = None):
    """Notify about route status changes"""
    await manager.send_route_update(
        route_id=route_id,
        status=new_status,
        current_location=current_location
    )

async def notify_new_event(event_data: dict):
    """Notify about new system events"""
    await manager.send_event_notification(event_data)

async def notify_eta_change(route_id: int, eta_predictions: list):
    """Notify about ETA changes"""
    await manager.send_eta_update(route_id, eta_predictions)

async def notify_reoptimization(route_id: int, trigger_type: str, status: str, new_route: dict = None):
    """Notify about route reoptimization"""
    await manager.send_reoptimization_notification(route_id, trigger_type, status, new_route)

# Real-time monitoring functions
async def start_real_time_monitoring(db: Session):
    """Start real-time monitoring of routes and events"""
    logger.info("Starting real-time monitoring...")
    
    while True:
        try:
            # Check for active routes that need monitoring
            active_routes = db.query(Route).filter(Route.status == "in_progress").all()
            
            for route in active_routes:
                # Check if route needs ETA updates
                if route.last_eta_update is None or (
                    datetime.utcnow() - route.last_eta_update
                ).total_seconds() > 300:  # Update every 5 minutes
                    
                    # Calculate new ETAs (this would integrate with your ETA predictor)
                    # For now, we'll just send a notification that ETA calculation is needed
                    await manager.send_route_update(
                        route_id=route.id,
                        status=route.status,
                        current_location={
                            "latitude": route.current_latitude,
                            "longitude": route.current_longitude
                        } if route.current_latitude and route.current_longitude else None,
                        current_stop=route.current_stop_index
                    )
            
            # Check for new events
            recent_events = db.query(Event).filter(
                Event.notification_sent == False,
                Event.status.in_(["active", "pending"])
            ).all()
            
            for event in recent_events:
                await notify_new_event({
                    "id": event.id,
                    "event_type": event.event_type,
                    "severity": event.severity,
                    "title": event.title,
                    "description": event.description,
                    "route_id": event.route_id,
                    "timestamp": event.timestamp
                })
                
                # Mark as notified
                event.notification_sent = True
            
            db.commit()
            
            # Wait before next monitoring cycle
            await asyncio.sleep(10)  # Monitor every 10 seconds
            
        except Exception as e:
            logger.error(f"Error in real-time monitoring: {e}")
            await asyncio.sleep(10)

# Export the manager and router
__all__ = ["manager", "websocket_router", "notify_route_status_change", "notify_new_event", "notify_eta_change", "notify_reoptimization"]