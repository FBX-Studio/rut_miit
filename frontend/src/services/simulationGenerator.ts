/**
 * Генератор симуляций с реальными адресами через Yandex API
 */

import { SimulationDriver, SimulationRoutePoint } from '../components/testing/SimulationData';

interface GeneratedRoute {
  stops: Array<{
    id: string;
    name: string;
    address: string;
    type: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  }>;
  route_geometry: [number, number][];
  distance: number;
  duration: number;
  duration_in_traffic: number;
}

/**
 * Генерирует новую симуляцию с реальными адресами в Москве
 */
export async function generateSimulationWithRealAddresses(
  numStops: number = 5
): Promise<SimulationDriver> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Запрашиваем генерацию маршрута с реальными адресами
    const response = await fetch(
      `${apiUrl}/api/v1/delivery-generator/generate-route?num_stops=${numStops}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Ошибка генерации маршрута');
    }

    const routeData: GeneratedRoute = await response.json();
    
    console.log('Generated route with real addresses:', routeData);
    console.log(`Distance: ${routeData.distance.toFixed(2)} km, Duration: ${routeData.duration.toFixed(1)} min`);
    console.log(`Route geometry points: ${routeData.route_geometry.length}`);
    console.log('First 5 geometry points:', routeData.route_geometry.slice(0, 5));
    
    // Преобразуем в формат SimulationDriver
    const now = new Date();
    const startTime = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    // Рассчитываем время окончания
    const endTime = new Date(now.getTime() + routeData.duration_in_traffic * 60000);
    const estimatedEndTime = endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    // Генерируем точки маршрута
    const route: SimulationRoutePoint[] = routeData.stops.map((stop, index) => {
      // Рассчитываем примерное время прибытия для каждой точки
      const arrivalMinutes = (routeData.duration_in_traffic / routeData.stops.length) * index;
      const arrivalTime = new Date(now.getTime() + arrivalMinutes * 60000);
      const estimatedArrival = arrivalTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      
      // Определяем статус
      let status: 'pending' | 'in_progress' | 'completed' | 'delayed';
      let actualArrival: string | undefined;
      
      if (index === 0) {
        // Первая точка (склад) - завершена
        status = 'completed';
        actualArrival = startTime;
      } else if (index === 1) {
        // Вторая точка - в процессе
        status = 'in_progress';
        actualArrival = undefined;
      } else {
        // Остальные - ожидают
        status = 'pending';
        actualArrival = undefined;
      }
      
      // Генерируем информацию о заказе для доставок
      const orderInfo = stop.type === 'delivery' ? {
        orderId: `ORD-${String(index).padStart(3, '0')}`,
        customerName: generateCustomerName(),
        items: generateRandomItems(),
        priority: generatePriority()
      } : undefined;
      
      return {
        id: stop.id,
        name: stop.name,
        coordinates: [stop.coordinates.lat, stop.coordinates.lng] as [number, number],
        type: stop.type as 'depot' | 'pickup' | 'delivery' | 'waypoint',
        address: stop.address,
        estimatedArrival,
        actualArrival,
        serviceTime: stop.type === 'depot' ? 30 : stop.type === 'pickup' ? 15 : 20,
        status,
        orderInfo
      };
    });
    
    // Создаем объект водителя с геометрией маршрута
    const driver: SimulationDriver = {
      id: 'driver_001',
      name: generateDriverName(),
      vehicleId: 'vehicle_001',
      vehicleType: generateVehicleType(),
      currentLocation: [route[0].coordinates[0], route[0].coordinates[1]],
      status: 'driving',
      startTime,
      estimatedEndTime,
      completedStops: 1, // Склад уже завершен
      totalStops: route.length,
      route,
      routeGeometry: routeData.route_geometry // Сохраняем геометрию маршрута по дорогам
    };
    
    return driver;
    
  } catch (error) {
    console.error('Error generating simulation:', error);
    
    // Возвращаем fallback данные если генерация не удалась
    return getFallbackSimulationData();
  }
}

/**
 * Генерирует имя водителя
 */
function generateDriverName(): string {
  const names = [
    'Иван Петров',
    'Алексей Смирнов',
    'Дмитрий Козлов',
    'Сергей Волков',
    'Михаил Соколов',
    'Андрей Морозов',
    'Владимир Новиков',
    'Николай Федоров'
  ];
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * Генерирует тип транспорта
 */
function generateVehicleType(): string {
  const vehicles = [
    'Газель Next',
    'ГАЗон Next',
    'Форд Транзит',
    'Мерседес Спринтер',
    'Пежо Боксер',
    'Рено Мастер'
  ];
  return vehicles[Math.floor(Math.random() * vehicles.length)];
}

/**
 * Генерирует имя клиента
 */
function generateCustomerName(): string {
  const prefixes = ['ООО', 'ИП', 'АО', 'ПАО'];
  const names = [
    '"Торговый дом"',
    '"Продукты+"',
    '"Рога и копыта"',
    '"МосКомплект"',
    '"ТехСнаб"',
    '"СтройМастер"',
    '"Офисная мебель"',
    '"Электроника и К"'
  ];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const name = names[Math.floor(Math.random() * names.length)];
  
  return `${prefix} ${name}`;
}

/**
 * Генерирует случайные товары
 */
function generateRandomItems(): string[] {
  const allItems = [
    'Офисная мебель',
    'Канцелярские товары',
    'Электроника',
    'Продукты питания',
    'Строительные материалы',
    'Бытовая техника',
    'Текстиль',
    'Упаковочные материалы',
    'Инструменты',
    'Компьютерная техника'
  ];
  
  const count = Math.floor(Math.random() * 3) + 1;
  const items: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const item = allItems[Math.floor(Math.random() * allItems.length)];
    if (!items.includes(item)) {
      items.push(item);
    }
  }
  
  return items;
}

/**
 * Генерирует приоритет
 */
function generatePriority(): 'low' | 'medium' | 'high' {
  const rand = Math.random();
  if (rand < 0.2) return 'high';
  if (rand < 0.6) return 'medium';
  return 'low';
}

/**
 * Возвращает fallback данные если API недоступен
 */
function getFallbackSimulationData(): SimulationDriver {
  const now = new Date();
  const startTime = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const endTime = new Date(now.getTime() + 8.5 * 3600000);
  const estimatedEndTime = endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  
  return {
    id: 'driver_001',
    name: generateDriverName(),
    vehicleId: 'vehicle_001',
    vehicleType: generateVehicleType(),
    currentLocation: [55.7558, 37.6176],
    status: 'driving',
    startTime,
    estimatedEndTime,
    completedStops: 1,
    totalStops: 6,
    route: [
      {
        id: 'depot',
        name: 'Склад-депо',
        coordinates: [55.7558, 37.6176],
        type: 'depot',
        address: 'Красная площадь, 1, Москва',
        estimatedArrival: startTime,
        actualArrival: startTime,
        serviceTime: 30,
        status: 'completed'
      },
      {
        id: 'delivery_001',
        name: 'Доставка №1',
        coordinates: [55.7539, 37.6208],
        type: 'delivery',
        address: 'Красная площадь, 3, ГУМ, Москва',
        estimatedArrival: '10:15',
        serviceTime: 20,
        status: 'in_progress',
        orderInfo: {
          orderId: 'ORD-001',
          customerName: generateCustomerName(),
          items: generateRandomItems(),
          priority: 'medium'
        }
      },
      {
        id: 'delivery_002',
        name: 'Доставка №2',
        coordinates: [55.7617, 37.6063],
        type: 'delivery',
        address: 'Тверская улица, 15, Москва',
        estimatedArrival: '11:00',
        serviceTime: 25,
        status: 'pending',
        orderInfo: {
          orderId: 'ORD-002',
          customerName: generateCustomerName(),
          items: generateRandomItems(),
          priority: 'high'
        }
      },
      {
        id: 'delivery_003',
        name: 'Доставка №3',
        coordinates: [55.7504, 37.6174],
        type: 'delivery',
        address: 'Манежная площадь, 1, Москва',
        estimatedArrival: '11:45',
        serviceTime: 15,
        status: 'pending',
        orderInfo: {
          orderId: 'ORD-003',
          customerName: generateCustomerName(),
          items: generateRandomItems(),
          priority: 'medium'
        }
      },
      {
        id: 'delivery_004',
        name: 'Доставка №4',
        coordinates: [55.7423, 37.6156],
        type: 'delivery',
        address: 'Пятницкая улица, 25, Москва',
        estimatedArrival: '12:30',
        serviceTime: 20,
        status: 'pending',
        orderInfo: {
          orderId: 'ORD-004',
          customerName: generateCustomerName(),
          items: generateRandomItems(),
          priority: 'low'
        }
      },
      {
        id: 'depot_return',
        name: 'Возврат на склад',
        coordinates: [55.7558, 37.6176],
        type: 'depot',
        address: 'Красная площадь, 1, Москва',
        estimatedArrival: '17:30',
        serviceTime: 15,
        status: 'pending'
      }
    ]
  };
}
