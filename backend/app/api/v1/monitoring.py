from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.customer import Customer
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.order import Order
from app.core.metrics import (
    api_requests_total, api_request_duration_seconds, optimization_duration_seconds,
    orders_total, vehicles_total, drivers_total,
    update_business_metrics, get_metrics, CONTENT_TYPE_LATEST
)
from datetime import datetime, timedelta
import json

router = APIRouter()

@router.get("/dashboard", response_class=HTMLResponse)
async def monitoring_dashboard():
    """Веб-интерфейс для мониторинга системы"""
    html_content = """
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RUT MIIT - Мониторинг системы</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .header {
                text-align: center;
                color: white;
                margin-bottom: 30px;
            }
            
            .header h1 {
                font-size: 2.5rem;
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            
            .header p {
                font-size: 1.1rem;
                opacity: 0.9;
            }
            
            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .metric-card {
                background: white;
                border-radius: 15px;
                padding: 25px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            
            .metric-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 40px rgba(0,0,0,0.15);
            }
            
            .metric-card h3 {
                color: #333;
                margin-bottom: 15px;
                font-size: 1.3rem;
                border-bottom: 2px solid #667eea;
                padding-bottom: 10px;
            }
            
            .metric-value {
                font-size: 2rem;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 10px;
            }
            
            .metric-description {
                color: #666;
                font-size: 0.9rem;
            }
            
            .status-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                gap: 10px;
                margin-top: 15px;
            }
            
            .status-item {
                background: #f8f9fa;
                padding: 10px;
                border-radius: 8px;
                text-align: center;
                border-left: 4px solid #667eea;
            }
            
            .status-item .status-label {
                font-size: 0.8rem;
                color: #666;
                margin-bottom: 5px;
            }
            
            .status-item .status-value {
                font-size: 1.2rem;
                font-weight: bold;
                color: #333;
            }
            
            .refresh-btn {
                position: fixed;
                bottom: 30px;
                right: 30px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 50px;
                padding: 15px 25px;
                font-size: 1rem;
                cursor: pointer;
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
                transition: all 0.3s ease;
            }
            
            .refresh-btn:hover {
                background: #5a6fd8;
                transform: scale(1.05);
            }
            
            .last-updated {
                text-align: center;
                color: white;
                margin-top: 20px;
                opacity: 0.8;
            }
            
            .loading {
                display: none;
                text-align: center;
                color: white;
                font-size: 1.1rem;
                margin: 20px 0;
            }
            
            .spinner {
                border: 3px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top: 3px solid white;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @media (max-width: 768px) {
                .metrics-grid {
                    grid-template-columns: 1fr;
                }
                
                .header h1 {
                    font-size: 2rem;
                }
                
                .metric-card {
                    padding: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚛 RUT MIIT</h1>
                <p>Система мониторинга маршрутизации транспорта</p>
            </div>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <div>Загрузка данных...</div>
            </div>
            
            <div class="metrics-grid" id="metricsGrid">
                <!-- Метрики будут загружены динамически -->
            </div>
            
            <div class="last-updated" id="lastUpdated">
                Последнее обновление: загрузка...
            </div>
        </div>
        
        <button class="refresh-btn" onclick="loadMetrics()">
            🔄 Обновить
        </button>
        
        <script>
            async function loadMetrics() {
                const loading = document.getElementById('loading');
                const metricsGrid = document.getElementById('metricsGrid');
                const lastUpdated = document.getElementById('lastUpdated');
                
                loading.style.display = 'block';
                
                try {
                    const response = await fetch('/api/v1/monitoring/metrics');
                    const data = await response.json();
                    
                    metricsGrid.innerHTML = `
                        <div class="metric-card">
                            <h3>📊 Общая статистика</h3>
                            <div class="status-grid">
                                <div class="status-item">
                                    <div class="status-label">Заказы</div>
                                    <div class="status-value">${data.business_metrics.total_orders}</div>
                                </div>
                                <div class="status-item">
                                    <div class="status-label">Клиенты</div>
                                    <div class="status-value">${data.business_metrics.total_customers}</div>
                                </div>
                                <div class="status-item">
                                    <div class="status-label">Водители</div>
                                    <div class="status-value">${data.business_metrics.total_drivers}</div>
                                </div>
                                <div class="status-item">
                                    <div class="status-label">Транспорт</div>
                                    <div class="status-value">${data.business_metrics.total_vehicles}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="metric-card">
                            <h3>📦 Статус заказов</h3>
                            <div class="status-grid">
                                <div class="status-item">
                                    <div class="status-label">Ожидают</div>
                                    <div class="status-value">${data.business_metrics.orders_by_status.pending || 0}</div>
                                </div>
                                <div class="status-item">
                                    <div class="status-label">В пути</div>
                                    <div class="status-value">${data.business_metrics.orders_by_status.in_progress || 0}</div>
                                </div>
                                <div class="status-item">
                                    <div class="status-label">Доставлены</div>
                                    <div class="status-value">${data.business_metrics.orders_by_status.delivered || 0}</div>
                                </div>
                                <div class="status-item">
                                    <div class="status-label">Отменены</div>
                                    <div class="status-value">${data.business_metrics.orders_by_status.cancelled || 0}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="metric-card">
                            <h3>🚛 Статус транспорта</h3>
                            <div class="status-grid">
                                <div class="status-item">
                                    <div class="status-label">Доступен</div>
                                    <div class="status-value">${data.business_metrics.vehicles_by_status.available || 0}</div>
                                </div>
                                <div class="status-item">
                                    <div class="status-label">В пути</div>
                                    <div class="status-value">${data.business_metrics.vehicles_by_status.in_transit || 0}</div>
                                </div>
                                <div class="status-item">
                                    <div class="status-label">На обслуживании</div>
                                    <div class="status-value">${data.business_metrics.vehicles_by_status.maintenance || 0}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="metric-card">
                            <h3>👨‍💼 Статус водителей</h3>
                            <div class="status-grid">
                                <div class="status-item">
                                    <div class="status-label">Доступны</div>
                                    <div class="status-value">${data.business_metrics.drivers_by_status.available || 0}</div>
                                </div>
                                <div class="status-item">
                                    <div class="status-label">На маршруте</div>
                                    <div class="status-value">${data.business_metrics.drivers_by_status.on_route || 0}</div>
                                </div>
                                <div class="status-item">
                                    <div class="status-label">Отдыхают</div>
                                    <div class="status-value">${data.business_metrics.drivers_by_status.off_duty || 0}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="metric-card">
                            <h3>⚡ Производительность API</h3>
                            <div class="metric-value">${data.api_metrics.total_requests}</div>
                            <div class="metric-description">Всего запросов к API</div>
                            <div style="margin-top: 15px;">
                                <div class="status-item">
                                    <div class="status-label">Среднее время ответа</div>
                                    <div class="status-value">${data.api_metrics.avg_response_time}мс</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="metric-card">
                            <h3>🎯 Оптимизация маршрутов</h3>
                            <div class="metric-value">${data.optimization_metrics.total_optimizations}</div>
                            <div class="metric-description">Всего оптимизаций</div>
                            <div style="margin-top: 15px;">
                                <div class="status-item">
                                    <div class="status-label">Среднее время</div>
                                    <div class="status-value">${data.optimization_metrics.avg_duration}с</div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    lastUpdated.textContent = `Последнее обновление: ${new Date().toLocaleString('ru-RU')}`;
                    
                } catch (error) {
                    console.error('Ошибка загрузки метрик:', error);
                    metricsGrid.innerHTML = `
                        <div class="metric-card">
                            <h3>❌ Ошибка</h3>
                            <div class="metric-description">Не удалось загрузить данные мониторинга</div>
                        </div>
                    `;
                } finally {
                    loading.style.display = 'none';
                }
            }
            
            // Автоматическое обновление каждые 30 секунд
            setInterval(loadMetrics, 30000);
            
            // Загрузка при открытии страницы
            loadMetrics();
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@router.get("/metrics")
async def get_metrics_data(db: Session = Depends(get_db)):
    """API для получения данных мониторинга"""
    
    try:
        # Получаем статистику по заказам
        orders_stats = db.query(
            Order.status,
            func.count(Order.id).label('count')
        ).group_by(Order.status).all()
        
        orders_by_status = {status: count for status, count in orders_stats}
        
        # Получаем статистику по транспорту
        vehicles_stats = db.query(
            Vehicle.status,
            func.count(Vehicle.id).label('count')
        ).group_by(Vehicle.status).all()
        
        vehicles_by_status = {status: count for status, count in vehicles_stats}
        
        # Получаем статистику по водителям
        drivers_stats = db.query(
            Driver.status,
            func.count(Driver.id).label('count')
        ).group_by(Driver.status).all()
        
        drivers_by_status = {status: count for status, count in drivers_stats}
        
        # Получаем общие счетчики
        total_orders = db.query(func.count(Order.id)).scalar() or 0
        total_customers = db.query(func.count(Customer.id)).scalar() or 0
        total_drivers = db.query(func.count(Driver.id)).scalar() or 0
        total_vehicles = db.query(func.count(Vehicle.id)).scalar() or 0
        
        # Безопасное получение метрик Prometheus
        try:
            total_requests = 0
            avg_response_time = 0
            total_optimizations = 0
            avg_optimization_duration = 0
            
            # Пытаемся получить метрики, если они доступны
            if hasattr(api_requests_total, '_value'):
                total_requests = int(sum(api_requests_total._value.values()))
            
            if hasattr(api_request_duration_seconds, '_sum') and total_requests > 0:
                avg_response_time = round(sum(api_request_duration_seconds._sum.values()) / total_requests * 1000, 2)
            
            if hasattr(optimization_duration_seconds, '_count'):
                total_optimizations = int(sum(optimization_duration_seconds._count.values()))
            
            if hasattr(optimization_duration_seconds, '_sum') and total_optimizations > 0:
                avg_optimization_duration = round(sum(optimization_duration_seconds._sum.values()) / total_optimizations, 2)
                
        except Exception as metrics_error:
            print(f"Error getting Prometheus metrics: {metrics_error}")
            # Используем значения по умолчанию
            pass
        
        return {
            "timestamp": datetime.now().isoformat(),
            "business_metrics": {
                "total_orders": total_orders,
                "total_customers": total_customers,
                "total_drivers": total_drivers,
                "total_vehicles": total_vehicles,
                "orders_by_status": orders_by_status,
                "vehicles_by_status": vehicles_by_status,
                "drivers_by_status": drivers_by_status
            },
            "api_metrics": {
                "total_requests": total_requests,
                "avg_response_time": avg_response_time
            },
            "optimization_metrics": {
                "total_optimizations": total_optimizations,
                "avg_duration": avg_optimization_duration
            }
        }
    except Exception as e:
        print(f"Error in get_metrics_data: {e}")
        # Возвращаем базовые данные в случае ошибки
        return {
            "timestamp": datetime.now().isoformat(),
            "business_metrics": {
                "total_orders": 0,
                "total_customers": 0,
                "total_drivers": 0,
                "total_vehicles": 0,
                "orders_by_status": {},
                "vehicles_by_status": {},
                "drivers_by_status": {}
            },
            "api_metrics": {
                "total_requests": 0,
                "avg_response_time": 0
            },
            "optimization_metrics": {
                "total_optimizations": 0,
                "avg_duration": 0
            }
        }