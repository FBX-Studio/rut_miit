# 🚚 RUT MIIT - Система оптимизации маршрутов доставки (VRPTW)

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 Описание проекта

**RUT MIIT VRPTW System** - это полнофункциональная система оптимизации маршрутов доставки с временными окнами (Vehicle Routing Problem with Time Windows), разработанная для логистических компаний и служб доставки. 

### 🎯 Основные возможности

Система решает сложную задачу планирования маршрутов с учетом:
- ⏰ **Временных окон доставки** - точное соблюдение предпочитаемого времени клиентов
- 🚛 **Ограничений транспорта** - грузоподъемность, объем, типы ТС
- 👨‍✈️ **Рабочего времени водителей** - смены, опыт, лицензии
- 🗺️ **Реального времени в пути** - интеграция с Yandex Maps API
- 🚦 **Дорожной ситуации** - учет пробок и текущего трафика
- 📊 **Приоритетов заказов** - срочность, важность клиентов
- 🔄 **Динамических изменений** - адаптивная реоптимизация в реальном времени

---

## 🏗️ Архитектура системы

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 14)                     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  Dashboard     │  │  Map Interface │  │  Analytics     │    │
│  │  Management    │  │  Real-time     │  │  Reports       │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API / WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│                      Backend (FastAPI)                           │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  API Routes    │  │  WebSocket     │  │  Services      │    │
│  │  v1 Endpoints  │  │  Real-time     │  │  Integration   │    │
│  └────────┬───────┘  └────────────────┘  └────────────────┘    │
│           │                                                       │
│  ┌────────▼─────────────────────────────────────────────────┐   │
│  │            Optimization Engine (OR-Tools)                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │  VRPTW Solver│  │  Adaptive    │  │  ETA         │   │   │
│  │  │  Core Engine │  │  Optimizer   │  │  Predictor   │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│           │                                                       │
│  ┌────────▼───────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  Database      │  │  Yandex Maps   │  │  Traffic       │    │
│  │  SQLAlchemy    │  │  Geocoding     │  │  Service       │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Технологический стек

### Backend
- **Framework**: FastAPI 0.104+
- **Language**: Python 3.10+
- **Optimization**: Google OR-Tools 9.8+
- **Database**: SQLAlchemy + SQLite/PostgreSQL
- **API**: REST + WebSocket
- **Maps**: Yandex Maps API
- **Real-time**: WebSocket (python-socketio)

### Frontend
- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5.0+
- **UI**: React 18, Tailwind CSS 3.4
- **State**: Redux Toolkit, React Query (SWR)
- **Maps**: Yandex Maps JavaScript API
- **Charts**: Recharts, Lucide Icons
- **Forms**: React Hook Form

### DevOps
- **Containerization**: Docker, Docker Compose
- **Monitoring**: Prometheus metrics
- **Version Control**: Git
- **Package Managers**: pip, npm

---

## 📦 Структура проекта

```
rut_miit/
│
├── backend/                          # Backend приложение (FastAPI)
│   ├── app/
│   │   ├── api/                     # API endpoints
│   │   │   ├── v1/                 # API версия 1
│   │   │   │   ├── delivery_generator.py  # Генерация доставок
│   │   │   │   ├── drivers.py     # Управление водителями
│   │   │   │   ├── monitoring.py  # Мониторинг системы
│   │   │   │   ├── route_geometry.py  # Геометрия маршрутов
│   │   │   │   ├── routes.py      # Управление маршрутами
│   │   │   │   ├── simulation.py  # Симуляция
│   │   │   │   ├── testing.py     # Тестирование
│   │   │   │   └── traffic.py     # Дорожная ситуация
│   │   │   ├── routes.py          # Основные маршруты
│   │   │   ├── schemas.py         # Pydantic модели
│   │   │   └── websocket.py       # WebSocket endpoints
│   │   │
│   │   ├── core/                   # Ядро системы
│   │   │   ├── cache.py           # Кэширование
│   │   │   ├── config.py          # Конфигурация
│   │   │   ├── exceptions.py      # Обработка ошибок
│   │   │   └── metrics.py         # Prometheus метрики
│   │   │
│   │   ├── models/                 # SQLAlchemy модели
│   │   │   ├── customer.py        # Клиенты
│   │   │   ├── driver.py          # Водители
│   │   │   ├── event.py           # События системы
│   │   │   ├── order.py           # Заказы
│   │   │   ├── order_item.py      # Элементы заказов
│   │   │   ├── product.py         # Товары
│   │   │   ├── route.py           # Маршруты
│   │   │   ├── route_stop.py      # Остановки маршрутов
│   │   │   └── vehicle.py         # Транспортные средства
│   │   │
│   │   ├── optimization/           # Алгоритмы оптимизации
│   │   │   ├── vrptw_solver.py    # Основной решатель VRPTW
│   │   │   ├── adaptive_optimizer.py  # Адаптивная оптимизация
│   │   │   ├── eta_predictor.py   # Прогнозирование времени
│   │   │   └── intermediate_unloading.py  # Промежуточная разгрузка
│   │   │
│   │   ├── services/               # Внешние сервисы
│   │   │   ├── driver_management.py  # Управление водителями
│   │   │   ├── parameter_modification.py  # Модификация параметров
│   │   │   ├── realtime_simulation.py  # Real-time симуляция
│   │   │   ├── route_geometry_service.py  # Построение геометрии
│   │   │   ├── route_management.py  # Управление маршрутами
│   │   │   ├── route_optimization.py  # Сервис оптимизации
│   │   │   ├── traffic_service.py  # Дорожная информация
│   │   │   ├── yandex_geocoder_service.py  # Геокодирование
│   │   │   └── yandex_maps_service.py  # Yandex Maps API
│   │   │
│   │   └── database.py            # Настройка БД
│   │
│   ├── alembic/                    # Миграции БД
│   ├── tests/                      # Тесты
│   ├── main.py                     # Точка входа
│   ├── requirements.txt            # Python зависимости
│   ├── .env.example               # Пример конфигурации
│   └── Dockerfile                 # Docker образ
│
├── frontend/                       # Frontend приложение (Next.js)
│   ├── src/
│   │   ├── app/                   # Next.js App Router
│   │   │   ├── analytics/         # Страница аналитики
│   │   │   ├── settings/          # Настройки
│   │   │   ├── testing/           # Симуляция и тестирование
│   │   │   ├── layout.tsx         # Основной layout
│   │   │   └── page.tsx           # Главная страница
│   │   │
│   │   ├── components/            # React компоненты
│   │   │   ├── charts/           # Графики и диаграммы
│   │   │   ├── customer/         # Компоненты клиентов
│   │   │   ├── dashboard/        # Дашборд
│   │   │   ├── driver/           # Компоненты водителей
│   │   │   ├── events/           # События
│   │   │   ├── maps/             # Карты (Yandex Maps)
│   │   │   ├── modals/           # Модальные окна
│   │   │   ├── providers/        # React Providers
│   │   │   ├── routes/           # Маршруты
│   │   │   ├── simulation/       # Симуляция
│   │   │   ├── testing/          # Тестирование
│   │   │   └── ui/               # UI компоненты
│   │   │
│   │   ├── contexts/              # React Context
│   │   │   ├── NotificationContext.tsx
│   │   │   └── WebSocketContext.tsx
│   │   │
│   │   ├── hooks/                 # Custom hooks
│   │   │   ├── useOptimizedQuery.ts
│   │   │   └── useSystemStats.ts
│   │   │
│   │   ├── services/              # API сервисы
│   │   │   ├── realTimeSimulation.ts
│   │   │   ├── simulationGenerator.ts
│   │   │   └── simulationIntegration.ts
│   │   │
│   │   ├── store/                 # Redux store
│   │   │   ├── slices/           # Redux slices
│   │   │   └── index.ts
│   │   │
│   │   └── lib/                   # Утилиты
│   │
│   ├── public/                    # Статические файлы
│   ├── next.config.js            # Next.js конфигурация
│   ├── tailwind.config.js        # Tailwind конфигурация
│   ├── tsconfig.json             # TypeScript конфигурация
│   ├── package.json              # Node.js зависимости
│   ├── .env.local.example        # Пример конфигурации
│   └── Dockerfile                # Docker образ
│
├── nginx/                         # Nginx конфигурация
├── monitoring/                    # Prometheus/Grafana
├── docker-compose.yml            # Docker Compose
└── README.md                     # Документация

```

---

## 🔧 Требования для запуска

### Backend
- **Python**: 3.10 или выше
- **pip**: 23.0+
- **virtualenv**: рекомендуется

### Frontend
- **Node.js**: 18.0 или выше
- **npm**: 9.0+ или yarn 1.22+

### Системные требования
- **ОС**: Windows 10/11, macOS 10.15+, Ubuntu 20.04+
- **RAM**: минимум 4 ГБ, рекомендуется 8 ГБ
- **Диск**: минимум 2 ГБ свободного места
- **CPU**: 2 ядра (рекомендуется 4+)

### Внешние сервисы
- **Yandex Maps API ключ** (обязательно для карт)
- Интернет-соединение для API

---

## 📥 Установка и запуск

### Быстрый старт (Docker)

```bash
# Клонировать репозиторий
git clone <repository-url>
cd rut_miit

# Настроить переменные окружения
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Запустить через Docker Compose
docker-compose up -d

# Открыть в браузере
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Ручная установка

#### 1️⃣ Backend Setup

```bash
# Перейти в директорию backend
cd backend

# Создать виртуальное окружение
python -m venv venv

# Активировать виртуальное окружение
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Установить зависимости
pip install -r requirements.txt

# Настроить переменные окружения
cp .env.example .env
# Отредактировать .env файл

# Инициализировать базу данных
python init_database.py

# (Опционально) Сгенерировать тестовые данные
python generate_test_data.py

# Запустить сервер
python main.py

# Backend доступен на http://localhost:8000
# API документация: http://localhost:8000/docs
```

#### 2️⃣ Frontend Setup

```bash
# Перейти в директорию frontend
cd frontend

# Установить зависимости
npm install

# Настроить переменные окружения
cp .env.local.example .env.local
# Отредактировать .env.local файл

# Запустить dev сервер
npm run dev

# Frontend доступен на http://localhost:3000
```

---

## 🔑 Конфигурация

### Backend (.env)

```env
# База данных
DATABASE_URL=sqlite:///./vrptw.db

# API ключи
YANDEX_MAPS_API_KEY=your_yandex_maps_api_key
YANDEX_GEOCODER_API_KEY=your_yandex_geocoder_api_key

# Безопасность
SECRET_KEY=your_secret_key_here_min_32_chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Режим отладки
DEBUG=True
ENVIRONMENT=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Сервер
HOST=0.0.0.0
PORT=8000

# OR-Tools настройки
ORTOOLS_TIME_LIMIT=60
ORTOOLS_SOLUTION_LIMIT=100

# Мониторинг
PROMETHEUS_ENABLED=True
PROMETHEUS_PORT=9090
```

### Frontend (.env.local)

```env
# API endpoints
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Yandex Maps
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=your_yandex_maps_api_key

# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true

# Environment
NODE_ENV=development
```

---

## 📚 API Документация

### REST API Endpoints

#### Routes API
- `POST /api/v1/routes/optimize` - Оптимизация маршрута
- `GET /api/v1/routes` - Список маршрутов
- `GET /api/v1/routes/{id}` - Детали маршрута
- `PUT /api/v1/routes/{id}` - Обновление маршрута
- `DELETE /api/v1/routes/{id}` - Удаление маршрута

#### Drivers API
- `GET /api/v1/drivers` - Список водителей
- `POST /api/v1/drivers` - Создание водителя
- `GET /api/v1/drivers/{id}` - Детали водителя
- `PUT /api/v1/drivers/{id}` - Обновление водителя
- `GET /api/v1/drivers/{id}/status` - Статус водителя

#### Simulation API
- `POST /api/v1/simulation/start` - Запуск симуляции
- `POST /api/v1/simulation/stop` - Остановка симуляции
- `GET /api/v1/simulation/status` - Статус симуляции
- `POST /api/v1/simulation/generate` - Генерация данных

#### Traffic API
- `GET /api/v1/traffic/current` - Текущий трафик
- `GET /api/v1/traffic/history` - История трафика
- `GET /api/v1/traffic/predict` - Прогноз трафика

#### Monitoring API
- `GET /api/v1/monitoring/health` - Статус системы
- `GET /api/v1/monitoring/metrics` - Метрики Prometheus
- `GET /api/v1/monitoring/stats` - Статистика системы

### WebSocket Events

```javascript
// Подключение
const ws = new WebSocket('ws://localhost:8000/ws');

// События
ws.on('route_updated', data => { /* Маршрут обновлен */ });
ws.on('driver_status_changed', data => { /* Статус водителя изменен */ });
ws.on('delivery_completed', data => { /* Доставка завершена */ });
ws.on('traffic_update', data => { /* Обновление трафика */ });
ws.on('optimization_complete', data => { /* Оптимизация завершена */ });
```

### Swagger UI
Полная интерактивная документация API: `http://localhost:8000/docs`

---

## 🎮 Использование системы

### 1. Создание и оптимизация маршрута

```python
import requests

# Создать заказ
order = requests.post('http://localhost:8000/api/v1/orders', json={
    'customer_id': 1,
    'delivery_address': 'Москва, ул. Ленина, 10',
    'time_window_start': '2024-01-20T09:00:00',
    'time_window_end': '2024-01-20T18:00:00',
    'weight': 50,
    'volume': 2
})

# Оптимизировать маршрут
route = requests.post('http://localhost:8000/api/v1/routes/optimize', json={
    'order_ids': [1, 2, 3],
    'vehicle_ids': [1],
    'driver_ids': [1],
    'depot_location': {'lat': 55.7558, 'lng': 37.6176}
})

print(f"Route created: {route.json()}")
```

### 2. Запуск симуляции через Web UI

1. Откройте `http://localhost:3000/testing`
2. Выберите сценарий симуляции
3. Настройте параметры (количество заказов, водителей, скорость)
4. Нажмите "Запустить симуляцию"
5. Наблюдайте за движением водителей в реальном времени

### 3. Мониторинг в реальном времени

```typescript
// React component example
import { useWebSocket } from '@/contexts/WebSocketContext';

function RouteMonitor() {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('route_updated', (data) => {
      console.log('Route updated:', data);
      // Update UI
    });

    return unsubscribe;
  }, []);

  return <div>Real-time monitoring...</div>;
}
```

---

## 🧪 Тестирование

### Backend Tests

```bash
cd backend

# Запустить все тесты
pytest

# Запустить с coverage
pytest --cov=app --cov-report=html

# Запустить конкретный тест
pytest tests/test_vrptw_solver.py

# Запустить с выводом
pytest -v -s
```

### Frontend Tests

```bash
cd frontend

# Запустить тесты
npm test

# Запустить с coverage
npm test -- --coverage

# E2E тесты (если настроены)
npm run test:e2e
```

---

## 🔍 Алгоритмы оптимизации

### VRPTW Solver

Система использует **Google OR-Tools** для решения задачи VRPTW:

**Основные компоненты:**
- **Constraint Programming** - программирование в ограничениях
- **Local Search** - локальный поиск решений
- **Meta-heuristics** - мета-эвристики (Guided Local Search)

**Учитываемые ограничения:**
- ⏰ Временные окна доставки
- 🚛 Вместимость транспорта (вес, объем)
- 👨‍✈️ Рабочее время водителей
- 📍 Максимальное расстояние маршрута
- 🏢 Обязательное посещение склада
- 🔄 Промежуточная разгрузка

**Целевая функция:**
```
Minimize: 
  α * total_distance +
  β * total_time +
  γ * time_window_violations +
  δ * capacity_violations
```

### Adaptive Optimizer

Система адаптивной оптимизации для динамических изменений:

**Триггеры реоптимизации:**
- 🚫 Задержки более 15 минут
- 📦 Новые срочные заказы
- 🚨 Отмена заказов
- 🚗 Поломка транспорта
- 🚦 Серьезные пробки

**Алгоритм:**
1. Обнаружение изменений
2. Оценка необходимости реоптимизации
3. Частичная или полная реоптимизация
4. Плавное обновление маршрутов

### ETA Predictor

Прогнозирование времени прибытия с учетом:
- 📊 Исторических данных
- 🚦 Текущего трафика
- ⏰ Времени суток
- 📅 Дня недели
- 🌧️ Погодных условий (если доступно)

**Модель:**
```
ETA = base_travel_time * (1 + traffic_factor) + service_time + buffer
```

---

## 📊 Мониторинг и метрики

### Prometheus Metrics

Система экспортирует метрики для Prometheus:

```
# Счетчики
vrptw_requests_total          # Всего запросов оптимизации
vrptw_optimizations_success   # Успешные оптимизации
vrptw_optimizations_failed    # Неудачные оптимизации

# Гистограммы
vrptw_optimization_duration_seconds  # Время оптимизации
vrptw_route_distance_km             # Расстояние маршрута
vrptw_route_duration_minutes        # Длительность маршрута

# Gauge
vrptw_active_routes          # Активные маршруты
vrptw_active_drivers         # Активные водители
vrptw_pending_orders         # Ожидающие заказы
```

### Grafana Dashboard

Импортируйте дашборд из `monitoring/grafana/dashboards/vrptw.json`

**Визуализации:**
- 📈 Количество оптимизаций в реальном времени
- ⏱️ Время выполнения оптимизации
- 🚛 Утилизация транспорта
- ✅ Процент выполнения в срок
- 🗺️ Общий пробег
- 💰 Экономия затрат

---

## 🐳 Docker

### Docker Compose

```bash
# Запустить все сервисы
docker-compose up -d

# Просмотреть логи
docker-compose logs -f

# Остановить сервисы
docker-compose down

# Пересобрать образы
docker-compose build --no-cache

# Перезапустить конкретный сервис
docker-compose restart backend
```

### Отдельные контейнеры

```bash
# Backend
docker build -t vrptw-backend ./backend
docker run -p 8000:8000 --env-file backend/.env vrptw-backend

# Frontend
docker build -t vrptw-frontend ./frontend
docker run -p 3000:3000 --env-file frontend/.env.local vrptw-frontend
```

---

## 🛠️ Разработка

### Pre-commit hooks

```bash
# Установить pre-commit
pip install pre-commit

# Установить хуки
pre-commit install

# Запустить вручную
pre-commit run --all-files
```

### Code Style

**Backend (Python):**
- **Formatter**: Black
- **Linter**: Ruff
- **Type checker**: MyPy
- **Style guide**: PEP 8

```bash
# Форматирование
black backend/

# Линтинг
ruff check backend/

# Type checking
mypy backend/
```

**Frontend (TypeScript):**
- **Formatter**: Prettier
- **Linter**: ESLint
- **Style guide**: Airbnb

```bash
# Форматирование
npm run format

# Линтинг
npm run lint

# Type checking
npm run type-check
```

---

## 🐛 Устранение неполадок

### Backend не запускается

**Проблема**: `ModuleNotFoundError`
```bash
# Решение: переустановить зависимости
pip install -r requirements.txt --force-reinstall
```

**Проблема**: `Database locked`
```bash
# Решение: удалить lock файл
rm vrptw.db-wal vrptw.db-shm
```

**Проблема**: `Yandex API 403 Forbidden`
```bash
# Решение: проверить API ключ в .env
# Убедиться что ключ активирован в Yandex Console
```

### Frontend показывает белый экран

**Проблема**: Белый экран после запуска
```bash
# Решение 1: Очистить cache
rm -rf .next
npm run dev

# Решение 2: Переустановить зависимости
rm -rf node_modules package-lock.json
npm install

# Решение 3: Проверить .env.local
cat .env.local  # Должен содержать все необходимые переменные
```

**Проблема**: `404 Not Found` для статических файлов
```bash
# Решение: Перезапустить dev сервер
# Ctrl+C, затем npm run dev
```

### Проблемы с картами

**Проблема**: Карты не загружаются
```bash
# Проверить API ключ Yandex Maps
# Проверить доступность api-maps.yandex.ru
# Проверить консоль браузера на ошибки
```

**Проблема**: Маршруты не строятся
```bash
# Проверить backend логи
# Убедиться что Yandex Router API доступен
# Проверить формат координат (lat, lon)
```

### Проблемы с производительностью

**Проблема**: Медленная оптимизация
```bash
# Увеличить time limit в .env
ORTOOLS_TIME_LIMIT=120

# Уменьшить количество заказов в задаче
# Использовать промежуточную разгрузку
```

**Проблема**: Высокая нагрузка на CPU
```bash
# Ограничить количество параллельных оптимизаций
# Использовать кэширование маршрутов
# Масштабировать горизонтально через Docker
```

---

## 📈 Производительность

### Бенчмарки

**Типичная производительность** (Intel i7, 16GB RAM):

| Заказов | Водителей | Время оптимизации | Качество решения |
|---------|-----------|-------------------|------------------|
| 10      | 2         | 1-2 сек          | Оптимальное      |
| 25      | 3         | 3-5 сек          | Близко к опт.    |
| 50      | 5         | 10-15 сек        | Хорошее          |
| 100     | 8         | 30-60 сек        | Приемлемое       |
| 200+    | 10+       | 60-120 сек       | Эвристическое    |

### Оптимизация производительности

**Backend:**
- ✅ Используйте connection pooling для БД
- ✅ Включите Redis для кэширования
- ✅ Настройте OR-Tools time limits
- ✅ Используйте асинхронные операции

**Frontend:**
- ✅ Включите Next.js production build
- ✅ Используйте SSR для критичных страниц
- ✅ Оптимизируйте изображения
- ✅ Включите lazy loading компонентов

---

## 🔐 Безопасность

### Рекомендации

1. **API Keys**: Храните в `.env`, не коммитьте в git
2. **CORS**: Настройте только доверенные origins
3. **Rate Limiting**: Используйте для публичных endpoints
4. **Authentication**: Добавьте JWT токены для production
5. **HTTPS**: Обязательно для production
6. **Secrets**: Используйте секреты длиной минимум 32 символа
7. **SQL Injection**: OR-Tools использует параметризованные запросы
8. **XSS**: Next.js автоматически экранирует вывод

---

## 🤝 Contribution

Мы приветствуем вклад в проект!

### Процесс

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменений (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

### Code Review

- ✅ Проходят все тесты
- ✅ Соблюден code style
- ✅ Добавлена документация
- ✅ Нет критичных проблем безопасности

---

## 📄 Лицензия

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👥 Авторы

- **RUT MIIT Team** - *Разработка системы*

---

## 📞 Контакты

- **Email**: support@rutmiit.ru
- **GitHub**: [github.com/rutmiit/vrptw](https://github.com/rutmiit/vrptw)
- **Документация**: [docs.rutmiit.ru](https://docs.rutmiit.ru)

---

## 🙏 Благодарности

- [Google OR-Tools](https://developers.google.com/optimization) - оптимизационный движок
- [FastAPI](https://fastapi.tiangolo.com/) - веб фреймворк
- [Next.js](https://nextjs.org/) - React фреймворк
- [Yandex Maps](https://yandex.ru/dev/maps/) - картографический сервис
- Все контрибьюторы проекта

---

## 📚 Дополнительные ресурсы

- [VRPTW Problem Description](https://en.wikipedia.org/wiki/Vehicle_routing_problem)
- [OR-Tools Documentation](https://developers.google.com/optimization/routing)
- [FastAPI Best Practices](https://fastapi.tiangolo.com/tutorial/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Yandex Maps API](https://yandex.ru/dev/maps/jsapi/doc/2.1/)

---
