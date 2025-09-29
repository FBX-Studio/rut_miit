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
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                min-height: 100vh;
                padding: 20px;
                color: #e2e8f0;
                overflow-x: hidden;
            }
            
            /* Floating particles animation */
            .particles {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1;
            }
            
            .particle {
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(99, 102, 241, 0.3);
                border-radius: 50%;
                animation: float 20s infinite linear;
            }
            
            .particle:nth-child(2n) {
                background: rgba(139, 92, 246, 0.3);
                animation-duration: 25s;
            }
            
            .particle:nth-child(3n) {
                background: rgba(59, 130, 246, 0.3);
                animation-duration: 30s;
            }
            
            @keyframes float {
                0% {
                    transform: translateY(100vh) translateX(0px) rotate(0deg);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100px) translateX(100px) rotate(360deg);
                    opacity: 0;
                }
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                position: relative;
                z-index: 2;
            }
            
            .header {
                text-align: center;
                margin-bottom: 40px;
                position: relative;
            }
            
            .header h1 {
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 10px;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-shadow: 0 0 30px rgba(99, 102, 241, 0.3);
            }
            
            .header p {
                font-size: 1.1rem;
                color: #94a3b8;
                font-weight: 400;
            }
            
            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: 24px;
                margin-bottom: 30px;
            }
            
            .metric-card {
                background: rgba(15, 23, 42, 0.8);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(99, 102, 241, 0.2);
                border-radius: 16px;
                padding: 28px;
                position: relative;
                transition: all 0.3s ease;
                overflow: hidden;
            }
            
            .metric-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
                border-radius: 16px;
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: -1;
            }
            
            .metric-card:hover {
                transform: translateY(-4px);
                border-color: rgba(99, 102, 241, 0.4);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(99, 102, 241, 0.1);
            }
            
            .metric-card:hover::before {
                opacity: 1;
            }
            
            .metric-card h3 {
                color: #e2e8f0;
                margin-bottom: 20px;
                font-size: 1.3rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .metric-value {
                font-size: 2.2rem;
                font-weight: 700;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 8px;
            }
            
            .metric-description {
                color: #64748b;
                font-size: 0.9rem;
                font-weight: 400;
            }
            
            .status-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                gap: 12px;
                margin-top: 20px;
            }
            
            .status-item {
                background: rgba(15, 23, 42, 0.6);
                border: 1px solid rgba(99, 102, 241, 0.1);
                padding: 12px;
                border-radius: 12px;
                text-align: center;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .status-item::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
                transition: left 0.5s ease;
            }
            
            .status-item:hover {
                border-color: rgba(99, 102, 241, 0.3);
                transform: translateY(-2px);
            }
            
            .status-item:hover::before {
                left: 100%;
            }
            
            .status-item .status-label {
                font-size: 0.8rem;
                color: #94a3b8;
                margin-bottom: 6px;
                font-weight: 500;
            }
            
            .status-item .status-value {
                font-size: 1.3rem;
                font-weight: 700;
                color: #e2e8f0;
            }
            
            .refresh-btn {
                position: fixed;
                bottom: 30px;
                right: 30px;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                border: none;
                border-radius: 50px;
                padding: 16px 28px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                z-index: 10;
            }
            
            .refresh-btn:hover {
                transform: translateY(-2px) scale(1.05);
                box-shadow: 0 15px 40px rgba(99, 102, 241, 0.4);
            }
            
            .refresh-btn:active {
                transform: translateY(0) scale(1);
            }
            
            .last-updated {
                text-align: center;
                color: #64748b;
                margin-top: 30px;
                font-size: 0.9rem;
                font-weight: 400;
            }
            
            .loading {
                display: none;
                text-align: center;
                color: #e2e8f0;
                font-size: 1.1rem;
                margin: 40px 0;
            }
            
            .spinner {
                border: 3px solid rgba(99, 102, 241, 0.2);
                border-radius: 50%;
                border-top: 3px solid #6366f1;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Responsive design */
            @media (max-width: 768px) {
                .metrics-grid {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }
                
                .header h1 {
                    font-size: 2rem;
                    word-wrap: break-word;
                }
                
                .header p {
                    word-wrap: break-word;
                }
                
                .metric-card {
                    padding: 24px;
                    word-wrap: break-word;
                }
                
                .metric-value {
                    font-size: 1.8rem;
                    word-wrap: break-word;
                }
                
                .status-grid {
                    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
                }
                
                .status-item .status-value {
                    font-size: 1.1rem;
                }
                
                .refresh-btn {
                    bottom: 20px;
                    right: 20px;
                    padding: 14px 24px;
                }
            }
            
            @media (max-width: 480px) {
                .container {
                    padding: 0 15px;
                }
                
                .header h1 {
                    font-size: 1.8rem;
                }
                
                .metric-card {
                    padding: 20px;
                }
                
                .status-grid {
                    grid-template-columns: 1fr 1fr;
                }
            }
            
            /* Glowing border effect */
            .glow-border {
                position: relative;
            }
            
            .glow-border::after {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                border-radius: 18px;
                opacity: 0;
                z-index: -1;
                transition: opacity 0.3s ease;
            }
            
            .glow-border:hover::after {
                opacity: 0.5;
            }
        </style>
    </head>
    <body>
        <!-- Floating particles -->
        <div class="particles" id="particles"></div>
        
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
        
        <button class="refresh-btn glow-border" onclick="loadMetrics()">
            🔄 Обновить
        </button>
        
        <script>
            // Generate floating particles
            function generateParticles() {
                const particlesContainer = document.getElementById('particles');
                const particleCount = 20;
                
                for (let i = 0; i < particleCount; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    particle.style.left = Math.random() * 100 + '%';
                    particle.style.animationDelay = Math.random() * 20 + 's';
                    particle.style.animationDuration = (20 + Math.random() * 10) + 's';
                    particlesContainer.appendChild(particle);
                }
            }
            
            async function loadMetrics() {
                const loading = document.getElementById('loading');
                const metricsGrid = document.getElementById('metricsGrid');
                const lastUpdated = document.getElementById('lastUpdated');
                
                loading.style.display = 'block';
                
                try {
                    const response = await fetch('/api/v1/monitoring/metrics');
                    const data = await response.json();
                    
                    metricsGrid.innerHTML = `
                        <div class="metric-card glow-border">
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
                        
                        <div class="metric-card glow-border">
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
                        
                        <div class="metric-card glow-border">
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
                        
                        <div class="metric-card glow-border">
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
                        
                        <div class="metric-card glow-border">
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
                        
                        <div class="metric-card glow-border">
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
                        <div class="metric-card glow-border">
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
            
            // Генерация частиц и загрузка при открытии страницы
            generateParticles();
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