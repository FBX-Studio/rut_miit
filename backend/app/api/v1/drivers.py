"""
API эндпоинты для управления водителями
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.database import get_db
from app.services.driver_management import DriverManagementService, DriverProfile, DriverAvailability, DriverPerformanceMetrics
from app.models.driver import DriverStatus, ExperienceLevel

router = APIRouter(tags=["drivers"])

# Pydantic модели для API
class DriverProfileResponse(BaseModel):
    id: int
    name: str
    phone: str
    license_number: str
    experience_level: str
    rating: float
    status: str
    specialization: str
    can_work_nights: bool
    can_work_weekends: bool
    current_vehicle_id: Optional[int]
    total_deliveries: int
    successful_deliveries: int
    average_delivery_time: float
    customer_feedback_score: float
    punctuality_score: float
    safety_score: float
    last_active: datetime
    notes: str

class DriverUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    experience_level: Optional[ExperienceLevel] = None
    specialization: Optional[str] = None
    can_work_nights: Optional[bool] = None
    can_work_weekends: Optional[bool] = None
    notes: Optional[str] = None

class DriverAvailabilityResponse(BaseModel):
    driver_id: int
    date: datetime
    shift_start: str
    shift_end: str
    is_available: bool
    max_orders_per_day: int
    current_orders_count: int
    estimated_free_time: Optional[datetime]

class DriverPerformanceResponse(BaseModel):
    driver_id: int
    period_start: datetime
    period_end: datetime
    total_orders: int
    completed_orders: int
    cancelled_orders: int
    completion_rate: float
    average_rating: float
    on_time_delivery_rate: float
    fuel_efficiency: float
    distance_covered: float
    revenue_generated: float
    customer_complaints: int
    safety_incidents: int

class DriverRatingUpdate(BaseModel):
    rating: float = Field(..., ge=1.0, le=5.0, description="Рейтинг от 1.0 до 5.0")
    feedback: Optional[str] = Field(None, description="Комментарий к оценке")

class DriverSearchFilters(BaseModel):
    specialization: Optional[str] = None
    min_rating: Optional[float] = Field(None, ge=0.0, le=5.0)
    experience_level: Optional[ExperienceLevel] = None
    can_work_nights: Optional[bool] = None
    can_work_weekends: Optional[bool] = None
    date: Optional[datetime] = None

@router.get("/", response_model=List[DriverProfileResponse])
async def get_all_drivers(
    skip: int = Query(0, ge=0, description="Количество записей для пропуска"),
    limit: int = Query(100, ge=1, le=1000, description="Максимальное количество записей"),
    db: Session = Depends(get_db)
):
    """Получить список всех водителей"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Starting get_all_drivers with skip={skip}, limit={limit}")
        service = DriverManagementService(db)
        
        # Получаем всех водителей (упрощенная версия)
        from app.models.driver import Driver
        drivers = db.query(Driver).offset(skip).limit(limit).all()
        logger.info(f"Found {len(drivers)} drivers in database")
        
        profiles = []
        for i, driver in enumerate(drivers):
            logger.info(f"Processing driver {i+1}/{len(drivers)}: ID={driver.id}")
            try:
                profile = service.get_driver_profile(driver.id)
                if profile:
                    logger.info(f"Got profile for driver {driver.id}: {profile.name}")
                    profiles.append(DriverProfileResponse(
                        id=profile.id,
                        name=profile.name,
                        phone=profile.phone,
                        license_number=profile.license_number,
                        experience_level=profile.experience_level.value,
                        rating=profile.rating,
                        status=profile.status.value,
                        specialization=profile.specialization,
                        can_work_nights=profile.can_work_nights,
                        can_work_weekends=profile.can_work_weekends,
                        current_vehicle_id=profile.current_vehicle_id,
                        total_deliveries=profile.total_deliveries,
                        successful_deliveries=profile.successful_deliveries,
                        average_delivery_time=profile.average_delivery_time,
                        customer_feedback_score=profile.customer_feedback_score,
                        punctuality_score=profile.punctuality_score,
                        safety_score=profile.safety_score,
                        last_active=profile.last_active,
                        notes=profile.notes
                    ))
                else:
                    logger.warning(f"No profile found for driver {driver.id}")
            except Exception as driver_error:
                logger.error(f"Error processing driver {driver.id}: {driver_error}")
                continue
        
        logger.info(f"Successfully processed {len(profiles)} driver profiles")
        return profiles
    except Exception as e:
        logger.error(f"Error fetching drivers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch drivers: {str(e)}")

@router.get("/{driver_id}", response_model=DriverProfileResponse)
async def get_driver_profile(
    driver_id: int,
    db: Session = Depends(get_db)
):
    """Получить профиль водителя по ID"""
    service = DriverManagementService(db)
    profile = service.get_driver_profile(driver_id)
    
    if not profile:
        raise HTTPException(status_code=404, detail="Водитель не найден")
    
    return DriverProfileResponse(
        id=profile.id,
        name=profile.name,
        phone=profile.phone,
        license_number=profile.license_number,
        experience_level=profile.experience_level.value,
        rating=profile.rating,
        status=profile.status.value,
        specialization=profile.specialization,
        can_work_nights=profile.can_work_nights,
        can_work_weekends=profile.can_work_weekends,
        current_vehicle_id=profile.current_vehicle_id,
        total_deliveries=profile.total_deliveries,
        successful_deliveries=profile.successful_deliveries,
        average_delivery_time=profile.average_delivery_time,
        customer_feedback_score=profile.customer_feedback_score,
        punctuality_score=profile.punctuality_score,
        safety_score=profile.safety_score,
        last_active=profile.last_active,
        notes=profile.notes
    )

@router.put("/{driver_id}", response_model=Dict[str, str])
async def update_driver_profile(
    driver_id: int,
    updates: DriverUpdateRequest,
    db: Session = Depends(get_db)
):
    """Обновить профиль водителя"""
    service = DriverManagementService(db)
    
    # Конвертируем в словарь, исключая None значения
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    
    success = service.update_driver_profile(driver_id, update_data)
    
    if not success:
        raise HTTPException(status_code=404, detail="Водитель не найден")
    
    return {"message": "Профиль водителя успешно обновлен"}

@router.get("/{driver_id}/availability", response_model=DriverAvailabilityResponse)
async def get_driver_availability(
    driver_id: int,
    date: Optional[datetime] = Query(None, description="Дата для проверки доступности"),
    db: Session = Depends(get_db)
):
    """Получить информацию о доступности водителя"""
    service = DriverManagementService(db)
    
    if date is None:
        date = datetime.now()
    
    availability = service.get_driver_availability(driver_id, date)
    
    if not availability:
        raise HTTPException(status_code=404, detail="Водитель не найден")
    
    return DriverAvailabilityResponse(
        driver_id=availability.driver_id,
        date=availability.date,
        shift_start=availability.shift_start.strftime("%H:%M"),
        shift_end=availability.shift_end.strftime("%H:%M"),
        is_available=availability.is_available,
        max_orders_per_day=availability.max_orders_per_day,
        current_orders_count=availability.current_orders_count,
        estimated_free_time=availability.estimated_free_time
    )

@router.post("/search", response_model=List[DriverProfileResponse])
async def search_available_drivers(
    filters: DriverSearchFilters,
    db: Session = Depends(get_db)
):
    """Найти доступных водителей по критериям"""
    service = DriverManagementService(db)
    
    profiles = service.find_available_drivers(
        specialization=filters.specialization,
        min_rating=filters.min_rating or 0.0,
        experience_level=filters.experience_level,
        can_work_nights=filters.can_work_nights,
        can_work_weekends=filters.can_work_weekends,
        date=filters.date
    )
    
    return [
        DriverProfileResponse(
            id=profile.id,
            name=profile.name,
            phone=profile.phone,
            license_number=profile.license_number,
            experience_level=profile.experience_level.value,
            rating=profile.rating,
            status=profile.status.value,
            specialization=profile.specialization,
            can_work_nights=profile.can_work_nights,
            can_work_weekends=profile.can_work_weekends,
            current_vehicle_id=profile.current_vehicle_id,
            total_deliveries=profile.total_deliveries,
            successful_deliveries=profile.successful_deliveries,
            average_delivery_time=profile.average_delivery_time,
            customer_feedback_score=profile.customer_feedback_score,
            punctuality_score=profile.punctuality_score,
            safety_score=profile.safety_score,
            last_active=profile.last_active,
            notes=profile.notes
        )
        for profile in profiles
    ]

@router.put("/{driver_id}/status", response_model=Dict[str, str])
async def update_driver_status(
    driver_id: int,
    status: DriverStatus,
    db: Session = Depends(get_db)
):
    """Обновить статус водителя"""
    service = DriverManagementService(db)
    
    success = service.update_driver_status(driver_id, status)
    
    if not success:
        raise HTTPException(status_code=404, detail="Водитель не найден")
    
    return {"message": f"Статус водителя обновлен на {status.value}"}

@router.post("/{driver_id}/assign-order/{order_id}", response_model=Dict[str, str])
async def assign_driver_to_order(
    driver_id: int,
    order_id: int,
    db: Session = Depends(get_db)
):
    """Назначить водителя на заказ"""
    service = DriverManagementService(db)
    
    success = service.assign_driver_to_order(driver_id, order_id)
    
    if not success:
        raise HTTPException(
            status_code=400, 
            detail="Не удалось назначить водителя на заказ. Проверьте доступность водителя и существование заказа."
        )
    
    return {"message": "Водитель успешно назначен на заказ"}

@router.get("/{driver_id}/performance", response_model=DriverPerformanceResponse)
async def get_driver_performance(
    driver_id: int,
    period_start: Optional[datetime] = Query(None, description="Начало периода"),
    period_end: Optional[datetime] = Query(None, description="Конец периода"),
    db: Session = Depends(get_db)
):
    """Получить метрики производительности водителя"""
    service = DriverManagementService(db)
    
    if period_end is None:
        period_end = datetime.now()
    if period_start is None:
        period_start = period_end - timedelta(days=30)
    
    performance = service.calculate_driver_performance(driver_id, period_start, period_end)
    
    if not performance:
        raise HTTPException(status_code=404, detail="Водитель не найден")
    
    return DriverPerformanceResponse(
        driver_id=performance.driver_id,
        period_start=performance.period_start,
        period_end=performance.period_end,
        total_orders=performance.total_orders,
        completed_orders=performance.completed_orders,
        cancelled_orders=performance.cancelled_orders,
        completion_rate=performance.completion_rate,
        average_rating=performance.average_rating,
        on_time_delivery_rate=performance.on_time_delivery_rate,
        fuel_efficiency=performance.fuel_efficiency,
        distance_covered=performance.distance_covered,
        revenue_generated=performance.revenue_generated,
        customer_complaints=performance.customer_complaints,
        safety_incidents=performance.safety_incidents
    )

@router.put("/{driver_id}/rating", response_model=Dict[str, str])
async def update_driver_rating(
    driver_id: int,
    rating_update: DriverRatingUpdate,
    db: Session = Depends(get_db)
):
    """Обновить рейтинг водителя"""
    service = DriverManagementService(db)
    
    success = service.update_driver_rating(
        driver_id, 
        rating_update.rating, 
        rating_update.feedback
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Водитель не найден")
    
    return {"message": "Рейтинг водителя успешно обновлен"}

@router.get("/statistics/overview", response_model=Dict[str, Any])
async def get_drivers_statistics(db: Session = Depends(get_db)):
    """Получить общую статистику по водителям"""
    service = DriverManagementService(db)
    
    stats = service.get_driver_statistics()
    
    return stats

@router.get("/available/count", response_model=Dict[str, int])
async def get_available_drivers_count(
    specialization: Optional[str] = Query(None, description="Фильтр по специализации"),
    min_rating: Optional[float] = Query(None, ge=0.0, le=5.0, description="Минимальный рейтинг"),
    db: Session = Depends(get_db)
):
    """Получить количество доступных водителей"""
    service = DriverManagementService(db)
    
    available_drivers = service.find_available_drivers(
        specialization=specialization,
        min_rating=min_rating or 0.0
    )
    
    return {"available_count": len(available_drivers)}

@router.get("/{driver_id}/orders/current", response_model=List[Dict[str, Any]])
async def get_driver_current_orders(
    driver_id: int,
    db: Session = Depends(get_db)
):
    """Получить текущие заказы водителя"""
    from app.models.order import Order, OrderStatus
    from sqlalchemy import and_
    
    # Проверяем существование водителя
    service = DriverManagementService(db)
    profile = service.get_driver_profile(driver_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Водитель не найден")
    
    # Получаем текущие заказы
    current_orders = db.query(Order).filter(
        and_(
            Order.driver_id == driver_id,
            Order.status.in_([OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS])
        )
    ).all()
    
    orders_data = []
    for order in current_orders:
        orders_data.append({
            "id": order.id,
            "order_number": order.order_number,
            "delivery_address": order.delivery_address,
            "time_window_start": order.time_window_start,
            "time_window_end": order.time_window_end,
            "status": order.status.value,
            "priority": order.priority.value,
            "weight": order.weight,
            "volume": order.volume,
            "special_instructions": order.special_instructions
        })
    
    return orders_data