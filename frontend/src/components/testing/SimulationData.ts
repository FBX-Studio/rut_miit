export interface SimulationRoutePoint {
  id: string;
  name: string;
  coordinates: [number, number];
  type: 'depot' | 'pickup' | 'delivery' | 'waypoint';
  address: string;
  estimatedArrival?: string;
  actualArrival?: string;
  serviceTime: number;
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
  routeGeometry?: [number, number][];
  completedStops: number;
  totalStops: number;
  startTime: string;
  estimatedEndTime: string;
}

export interface SimulationMetrics {
  totalDistance: number;
  totalTime: number;
  averageSpeed: number;
  fuelConsumption: number;
  deliveriesCompleted: number;
  deliveriesTotal: number;
  efficiency: number;
  customerSatisfaction: number;
}

export const mockSimulationData: SimulationDriver = {
  id: 'driver_001',
  name: 'Иван Петров',
  vehicleId: 'vehicle_001',
  vehicleType: 'Газель Next',
  currentLocation: [55.7558, 37.6176],
  status: 'driving',
  startTime: '09:00',
  estimatedEndTime: '17:30',
  completedStops: 2,
  totalStops: 8,
  route: [
    {
      id: 'depot',
      name: 'Склад-депо',
      coordinates: [55.7558, 37.6176],
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
      coordinates: [55.7522, 37.6156],
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
      coordinates: [55.7539, 37.6208],
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
      coordinates: [55.7617, 37.6063],
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
      coordinates: [55.7504, 37.6174],
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
      coordinates: [55.7423, 37.6156],
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
      coordinates: [55.7687, 37.6947],
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
      coordinates: [55.7558, 37.6176],
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
  totalTime: 510,
  averageSpeed: 28.5,
  fuelConsumption: 12.8,
  deliveriesCompleted: 2,
  deliveriesTotal: 5,
  efficiency: 87.5,
  customerSatisfaction: 92.3
};

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

export const calculateDistance = (
  point1: [number, number],
  point2: [number, number]
): number => {
  const R = 6371;
  const dLat = toRadians(point2[0] - point1[0]);
  const dLon = toRadians(point2[1] - point1[1]);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(point1[0])) * Math.cos(toRadians(point2[0])) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

export const updateDriverPosition = (
  driver: SimulationDriver,
  elapsedTime: number
): SimulationDriver => {
  const updatedDriver = { ...driver };
  
  const currentStopIndex = driver.completedStops;
  const nextStop = driver.route[currentStopIndex + 1];
  
  if (nextStop && driver.status === 'driving') {
    const currentStop = driver.route[currentStopIndex];
    const progress = Math.min(elapsedTime / (nextStop.serviceTime * 60), 1);
    
    const lat = currentStop.coordinates[0] + 
      (nextStop.coordinates[0] - currentStop.coordinates[0]) * progress;
    const lng = currentStop.coordinates[1] + 
      (nextStop.coordinates[1] - currentStop.coordinates[1]) * progress;
    
    updatedDriver.currentLocation = [lat, lng];
    
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

let animationInterval: NodeJS.Timeout | null = null;

export const startRouteAnimation = (driver: SimulationDriver): void => {
  if (animationInterval) {
    clearInterval(animationInterval);
  }

  let currentIndex = 0;
  const totalPoints = driver.route.length;
  
  animationInterval = setInterval(() => {
    if (currentIndex >= totalPoints) {
      clearInterval(animationInterval!);
      animationInterval = null;
      return;
    }

    const currentPoint = driver.route[currentIndex];
    
    driver.currentLocation = currentPoint.coordinates;
    driver.status = currentPoint.type === 'delivery' ? 'delivering' : 'driving';
    
    const event = {
      timestamp: new Date().toISOString(),
      type: currentPoint.type === 'delivery' ? 'delivery_complete' : 'route_progress',
      description: currentPoint.type === 'delivery' 
        ? `Доставка по адресу: ${currentPoint.address}`
        : `Движение к точке: ${currentPoint.address}`,
      driver_id: driver.id,
      location: currentPoint
    };

    if (typeof window !== 'undefined' && (window as any).simulationEventHandler) {
      (window as any).simulationEventHandler(event);
    }

    currentIndex++;
  }, 2000);
};

export const stopRouteAnimation = (): void => {
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }
};