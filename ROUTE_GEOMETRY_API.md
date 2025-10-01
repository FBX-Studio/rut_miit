# Route Geometry API - Построение маршрутов по дорогам

## Описание

Серверный API для построения геометрии маршрутов по реальным дорогам через Yandex Maps Router API.

## Преимущества серверного подхода

✅ **Стабильность** - нет проблем с загрузкой модулей в браузере  
✅ **Безопасность** - API ключ Yandex хранится только на сервере  
✅ **Кэширование** - возможность кэшировать часто используемые маршруты  
✅ **Производительность** - обработка на сервере быстрее  
✅ **Надежность** - автоматический fallback на прямые линии при ошибках  

## API Endpoints

### 1. Простое построение маршрута

**POST** `/api/v1/route-geometry/build-simple`

Быстрое построение маршрута с учетом пробок.

**Request Body:**
```json
[
  { "lat": 55.7558, "lng": 37.6176 },
  { "lat": 55.7522, "lng": 37.6156 },
  { "lat": 55.7539, "lng": 37.6208 }
]
```

**Response:**
```json
{
  "geometry": [
    [55.7558, 37.6176],
    [55.7557, 37.6177],
    ...
    [55.7539, 37.6208]
  ],
  "distance": 2.5,
  "duration": 8.5,
  "duration_in_traffic": 12.3
}
```

### 2. Построение с опциями

**POST** `/api/v1/route-geometry/build`

Построение маршрута с дополнительными параметрами.

**Request Body:**
```json
{
  "waypoints": [
    { "lat": 55.7558, "lng": 37.6176 },
    { "lat": 55.7522, "lng": 37.6156 }
  ],
  "avoid_tolls": false,
  "avoid_unpaved": false,
  "with_traffic": true
}
```

**Response:**
```json
{
  "geometry": [[lat, lng], ...],
  "distance": 2.5,
  "duration": 8.5,
  "duration_in_traffic": 12.3
}
```

## Использование на Frontend

### Автоматическое построение

Frontend автоматически вызывает API при загрузке маршрута:

```typescript
const buildRouteGeometry = async () => {
  const response = await fetch(
    `${API_URL}/api/v1/route-geometry/build-simple`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(waypoints)
    }
  );
  
  const data = await response.json();
  setRouteGeometry(data.geometry);
};
```

### Fallback механизм

Если API недоступен или возвращает ошибку, автоматически используются прямые линии между точками.

## Настройка

### Backend

1. Добавьте API ключ Yandex в `.env`:
```env
YANDEX_API_KEY=ваш_ключ_здесь
```

2. Перезапустите бэкенд:
```bash
cd backend
python main.py
```

### Frontend

1. Убедитесь что API URL настроен в `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

2. Перезапустите frontend:
```bash
cd frontend
npm run dev
```

## Логирование

Все запросы логируются на сервере:

```
INFO: Building route for 5 waypoints
INFO: Route built successfully with 245 points
```

На клиенте можно увидеть:

```
Route geometry built via API with 245 points
Route distance: 12.5 km
Route duration: 25 min
Duration with traffic: 32 min
```

## Производительность

- **Среднее время ответа**: 500-1500ms
- **Timeout**: 30 секунд
- **Fallback**: автоматический при таймауте или ошибке
- **Кэширование**: планируется добавить в будущем

## Ограничения Yandex API

- **Бесплатный лимит**: 25,000 запросов в день
- **Rate limit**: 5 запросов в секунду
- Для production рекомендуется платный тариф

## Troubleshooting

### Маршрут отображается прямыми линиями

1. Проверьте что бэкенд запущен: `http://localhost:8000/health`
2. Проверьте API ключ в backend/.env
3. Посмотрите логи бэкенда на ошибки Yandex API
4. Проверьте консоль браузера на ошибки fetch

### Ошибка "Yandex API timeout"

- Проверьте интернет-соединение сервера
- Увеличьте timeout в `route_geometry_service.py`

### Ошибка 401 Unauthorized

- Проверьте что API ключ Yandex корректный
- Убедитесь что ключ активирован в личном кабинете Yandex

## Будущие улучшения

- [ ] Кэширование маршрутов в Redis
- [ ] Batch запросы для множественных маршрутов
- [ ] Альтернативные маршруты
- [ ] Учет типа транспорта (грузовой/легковой)
- [ ] Оптимизация порядка точек на сервере
