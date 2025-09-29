// Тестовые данные для симуляции маршрута водителя
export interface SimulationRoutePoint {
  id: string;
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  type: 'depot' | 'pickup' | 'delivery' | 'waypoint';
  address: string;
  estimatedArrival?: string;
  actualArrival?: string;
  serviceTime: number; // в минутах
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  orderInfo?: {
    orderId: string;
    customerName: string;
    items: string[];
    priority: 'low' | 'medium' | 'high';
  };
}

export interface SimulationDriver {
  id: string;
  name: string;
  vehicleId: string;
  vehicleType: string;
  currentLocation: [number, number];
  status: 'idle' | 'driving' | 'loading' | 'delivering' | 'break';
  route: SimulationRoutePoint[];
  completedStops: number;
  totalStops: number;
  startTime: string;
  estimatedEndTime: string;
}

export interface SimulationMetrics {
  totalDistance: number; // в км
  totalTime: number; // в минутах
  averageSpeed: number; // км/ч
  fuelConsumption: number; // литры
  deliveriesCompleted: number;
  deliveriesTotal: number;
  efficiency: number; // процент
  customerSatisfaction: number; // процент
}

// Тестовые данные для симуляции в Москве
export const mockSimulationData: SimulationDriver = {
  id: 'driver_001',
  name: 'Иван Петров',
  vehicleId: 'vehicle_001',
  vehicleType: 'Газель Next',
  currentLocation: [55.7558, 37.6176], // Красная площадь (начальная точка)
  status: 'driving',
  startTime: '09:00',
  estimatedEndTime: '17:30',
  completedStops: 2,
  totalStops: 8,
  route: [
    {
      id: 'depot',
      name: 'Склад-депо',
      coordinates: [55.7558, 37.6176], // Красная площадь
      type: 'depot',
      address: 'Красная площадь, 1, Москва',
      estimatedArrival: '09:00',
      actualArrival: '09:00',
      serviceTime: 30,
      status: 'completed'
    },
    {
      id: 'pickup_001',
      name: 'Забор товара',
      coordinates: [55.7522, 37.6156], // Большой театр
      type: 'pickup',
      address: 'Театральная площадь, 1, Москва',
      estimatedArrival: '09:45',
      actualArrival: '09:42',
      serviceTime: 15,
      status: 'completed',
      orderInfo: {
        orderId: 'ORD-001',
        customerName: 'ООО "Театральные товары"',
        items: ['Сценические костюмы', 'Реквизит'],
        priority: 'high'
      }
    },
    {
      id: 'delivery_001',
      name: 'Доставка №1',
      coordinates: [55.7539, 37.6208], // ГУМ
      type: 'delivery',
      address: 'Красная площадь, 3, ГУМ, Москва',
      estimatedArrival: '10:15',
      actualArrival: '10:18',
      serviceTime: 20,
      status: 'completed',
      orderInfo: {
        orderId: 'ORD-002',
        customerName: 'Бутик "Элегант"',
        items: ['Модная одежда', 'Аксессуары'],
        priority: 'medium'
      }
    },
    {
      id: 'delivery_002',
      name: 'Доставка №2',
      coordinates: [55.7617, 37.6063], // Тверская улица
      type: 'delivery',
      address: 'Тверская улица, 15, Москва',
      estimatedArrival: '11:00',
      actualArrival: null,
      serviceTime: 25,
      status: 'in_progress',
      orderInfo: {
        orderId: 'ORD-003',
        customerName: 'Кафе "Московское"',
        items: ['Продукты питания', 'Напитки'],
        priority: 'high'
      }
    },
    {
      id: 'delivery_003',
      name: 'Доставка №3',
      coordinates: [55.7504, 37.6174], // Манежная площадь
      type: 'delivery',
      address: 'Манежная площадь, 1, Москва',
      estimatedArrival: '11:45',
      actualArrival: null,
      serviceTime: 15,
      status: 'pending',
      orderInfo: {
        orderId: 'ORD-004',
        customerName: 'Отель "Метрополь"',
        items: ['Постельное белье', 'Полотенца'],
        priority: 'medium'
      }
    },
    {
      id: 'delivery_004',
      name: 'Доставка №4',
      coordinates: [55.7423, 37.6156], // Замоскворечье
      type: 'delivery',
      address: 'Пятницкая улица, 25, Москва',
      estimatedArrival: '12:30',
      actualArrival: null,
      serviceTime: 20,
      status: 'pending',
      orderInfo: {
        orderId: 'ORD-005',
        customerName: 'Магазин "Домашний уют"',
        items: ['Товары для дома', 'Декор'],
        priority: 'low'
      }
    },
    {
      id: 'delivery_005',
      name: 'Доставка №5',
      coordinates: [55.7687, 37.6947], // Сокольники
      type: 'delivery',
      address: 'Сокольническая площадь, 4, Москва',
      estimatedArrival: '13:45',
      actualArrival: null,
      serviceTime: 30,
      status: 'pending',
      orderInfo: {
        orderId: 'ORD-006',
        customerName: 'Спортивный клуб "Энергия"',
        items: ['Спортивное оборудование', 'Инвентарь'],
        priority: 'medium'
      }
    },
    {
      id: 'return_depot',
      name: 'Возврат на склад',
      coordinates: [55.7558, 37.6176], // Красная площадь
      type: 'depot',
      address: 'Красная площадь, 1, Москва',
      estimatedArrival: '15:30',
      actualArrival: null,
      serviceTime: 15,
      status: 'pending'
    }
  ]
};

export const mockSimulationMetrics: SimulationMetrics = {
  totalDistance: 45.2,
  totalTime: 510, // 8.5 часов
  averageSpeed: 28.5,
  fuelConsumption: 12.8,
  deliveriesCompleted: 2,
  deliveriesTotal: 5,
  efficiency: 87.5,
  customerSatisfaction: 92.3
};

// Функция для генерации промежуточных точек маршрута (для анимации)
export const generateRouteAnimation = (
  start: [number, number],
  end: [number, number],
  steps: number = 20
): [number, number][] => {
  const points: [number, number][] = [];
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = start[0] + (end[0] - start[0]) * ratio;
    const lng = start[1] + (end[1] - start[1]) * ratio;
    points.push([lat, lng]);
  }
  
  return points;
};

// Функция для обновления позиции водителя в реальном времени
export const updateDriverPosition = (
  driver: SimulationDriver,
  elapsedTime: number // в секундах
): SimulationDriver => {
  const updatedDriver = { ...driver };
  
  // Найти текущий сегмент маршрута
  const currentStopIndex = driver.completedStops;
  const nextStop = driver.route[currentStopIndex + 1];
  
  if (nextStop && driver.status === 'driving') {
    const currentStop = driver.route[currentStopIndex];
    const progress = Math.min(elapsedTime / (nextStop.serviceTime * 60), 1);
    
    // Интерполяция позиции между текущей и следующей точкой
    const lat = currentStop.coordinates[0] + 
      (nextStop.coordinates[0] - currentStop.coordinates[0]) * progress;
    const lng = currentStop.coordinates[1] + 
      (nextStop.coordinates[1] - currentStop.coordinates[1]) * progress;
    
    updatedDriver.currentLocation = [lat, lng];
    
    // Если достиг следующей точки
    if (progress >= 1) {
      updatedDriver.completedStops += 1;
      updatedDriver.status = 'delivering';
      nextStop.status = 'in_progress';
      nextStop.actualArrival = new Date().toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
  
  return updatedDriver;
};

// Глобальная переменная для хранения ID интервала анимации
let animationInterval: NodeJS.Timeout | null = null;

// Функция для запуска анимации маршрута
export const startRouteAnimation = (driver: SimulationDriver): void => {
  // Останавливаем предыдущую анимацию если она была
  if (animationInterval) {
    clearInterval(animationInterval);
  }

  let currentIndex = 0;
  const totalPoints = driver.route.length;
  
  // Обновляем позицию каждые 2 секунды
  animationInterval = setInterval(() => {
    if (currentIndex >= totalPoints) {
      // Анимация завершена
      clearInterval(animationInterval!);
      animationInterval = null;
      return;
    }

    const currentPoint = driver.route[currentIndex];
    
    // Обновляем текущую позицию водителя
    driver.currentLocation = currentPoint.coordinates;
    driver.status = currentPoint.type === 'delivery' ? 'delivering' : 'driving';
    
    // Создаем событие для системы
    const event = {
      timestamp: new Date().toISOString(),
      type: currentPoint.type === 'delivery' ? 'delivery_complete' : 'route_progress',
      description: currentPoint.type === 'delivery' 
        ? `Доставка по адресу: ${currentPoint.address}`
        : `Движение к точке: ${currentPoint.address}`,
      driver_id: driver.id,
      location: currentPoint
    };

    // Отправляем событие в глобальный обработчик (если есть)
    if (typeof window !== 'undefined' && (window as any).simulationEventHandler) {
      (window as any).simulationEventHandler(event);
    }

    currentIndex++;
  }, 2000); // Обновление каждые 2 секунды
};

// Функция для остановки анимации маршрута
export const stopRouteAnimation = (): void => {
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }
};