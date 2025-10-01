"""
Custom exceptions for VRPTW optimization system
"""

from typing import Optional, Dict, Any


class VRPTWException(Exception):
    """Base exception for VRPTW system"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class OptimizationException(VRPTWException):
    """Exception raised when optimization fails"""
    pass


class NoFeasibleSolutionException(OptimizationException):
    """Exception raised when no feasible solution can be found"""
    pass


class InvalidInputException(VRPTWException):
    """Exception raised when input data is invalid"""
    pass


class ResourceNotFoundException(VRPTWException):
    """Exception raised when a required resource is not found"""
    pass


class ServiceUnavailableException(VRPTWException):
    """Exception raised when an external service is unavailable"""
    pass


class TimeWindowViolationException(OptimizationException):
    """Exception raised when time window constraints cannot be satisfied"""
    pass


class CapacityViolationException(OptimizationException):
    """Exception raised when capacity constraints cannot be satisfied"""
    pass


class RouteNotFoundException(ResourceNotFoundException):
    """Exception raised when a route is not found"""
    pass


class OrderNotFoundException(ResourceNotFoundException):
    """Exception raised when an order is not found"""
    pass


class VehicleNotFoundException(ResourceNotFoundException):
    """Exception raised when a vehicle is not found"""
    pass


class DriverNotFoundException(ResourceNotFoundException):
    """Exception raised when a driver is not found"""
    pass
