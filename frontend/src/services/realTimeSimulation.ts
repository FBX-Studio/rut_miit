/**
 * Real-time Simulation Service
 * Управляет симуляцией маршрутов в реальном времени с поддержкой WebSocket
 */

interface SimulationVehicle {
  id: string;
  driverId: string;
  driverName: string;
  vehicleNumber: string;
  currentLocation: [number, number];
  speed: number; // км/ч
  status: 'idle' | 'moving' | 'delivering' | 'loading' | 'break';
  route: SimulationStop[];
  currentStopIndex: number;
  metrics: {
    distanceTraveled: number;
    timeElapsed: number;
    stopsCompleted: number;
    efficiency: number;
  };
}

interface SimulationStop {
  id: string;
  coordinates: [number, number];
  address: string;
  type: 'depot' | 'pickup' | 'delivery';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  estimatedArrival: Date;
  actualArrival?: Date;
  serviceTime: number; // минуты
  orderId?: string;
  customerName?: string;
}

interface OptimizationResult {
  originalRoute: SimulationStop[];
  optimizedRoute: SimulationStop[];
  timeSaved: number; // минуты
  distanceSaved: number; // км
  costSaved: number; // рубли
  improvements: {
    totalDistance: { before: number; after: number };
    totalTime: { before: number; after: number };
    stopsReordered: number;
    efficiencyGain: number; // процент
  };
}

interface SimulationEvent {
  timestamp: Date;
  vehicleId: string;
  type: 'location_update' | 'stop_arrived' | 'stop_completed' | 'route_optimized' | 'delay' | 'break_started' | 'break_ended';
  data: any;
  message: string;
}

export class RealTimeSimulationService {
  private ws: WebSocket | null = null;
  private vehicles: Map<string, SimulationVehicle> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  private simulationSpeed: number = 1; // 1x реальная скорость
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  
  constructor() {
    this.initializeWebSocket();
  }

  /**
   * Инициализация WebSocket соединения
   */
  private initializeWebSocket() {
    // Отключаем WebSocket для избежания ошибок, используем только клиентскую симуляцию
    if (typeof window === 'undefined') return;
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    
    // Не пытаемся подключиться если URL не указан
    if (!wsUrl) {
      console.log('WebSocket URL not configured, using client-side simulation only');
      return;
    }
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected for simulation');
        this.emit('connected', {});
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        // Тихо игнорируем ошибки подключения
        console.debug('WebSocket connection not available, using client-side simulation');
      };
      
      this.ws.onclose = () => {
        console.debug('WebSocket disconnected, using client-side simulation');
        this.emit('disconnected', {});
      };
    } catch (error) {
      console.debug('WebSocket not available, using client-side simulation');
    }
  }

  /**
   * Обработка сообщений от WebSocket
   */
  private handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'vehicle_update':
        this.updateVehicleLocation(data.vehicleId, data.location, data.status);
        break;
      case 'stop_completed':
        this.handleStopCompleted(data.vehicleId, data.stopId);
        break;
      case 'optimization_complete':
        this.handleOptimizationComplete(data.vehicleId, data.result);
        break;
      case 'event':
        this.emit('event', data.event);
        break;
    }
  }

  /**
   * Запуск симуляции
   */
  startSimulation(vehicles: SimulationVehicle[], speed: number = 1) {
    this.simulationSpeed = speed;
    this.isRunning = true;
    
    // Добавляем транспортные средства
    vehicles.forEach(vehicle => {
      this.vehicles.set(vehicle.id, vehicle);
    });
    
    // Запускаем обновление позиций
    this.startPositionUpdates();
    
    this.emit('simulation_started', { vehicleCount: vehicles.length, speed });
  }

  /**
   * Остановка симуляции
   */
  stopSimulation() {
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.emit('simulation_stopped', {});
  }

  /**
   * Пауза симуляции
   */
  pauseSimulation() {
    this.isRunning = false;
    this.emit('simulation_paused', {});
  }

  /**
   * Возобновление симуляции
   */
  resumeSimulation() {
    this.isRunning = true;
    this.emit('simulation_resumed', {});
  }

  /**
   * Изменение скорости симуляции
   */
  setSimulationSpeed(speed: number) {
    this.simulationSpeed = speed;
    this.emit('speed_changed', { speed });
  }

  /**
   * Запуск обновления позиций транспорта
   */
  private startPositionUpdates() {
    const updateInterval = 1000 / this.simulationSpeed; // миллисекунды
    
    this.intervalId = setInterval(() => {
      if (!this.isRunning) return;
      
      this.vehicles.forEach((vehicle, vehicleId) => {
        this.updateVehiclePosition(vehicle);
      });
    }, updateInterval);
  }

  /**
   * Обновление позиции транспортного средства
   */
  private updateVehiclePosition(vehicle: SimulationVehicle) {
    if (vehicle.currentStopIndex >= vehicle.route.length - 1) {
      // Маршрут завершен
      vehicle.status = 'idle';
      this.emit('route_completed', { vehicleId: vehicle.id });
      return;
    }
    
    const currentStop = vehicle.route[vehicle.currentStopIndex];
    const nextStop = vehicle.route[vehicle.currentStopIndex + 1];
    
    if (currentStop.status === 'in_progress') {
      // Обслуживание на остановке
      const serviceTimeMs = currentStop.serviceTime * 60 * 1000 / this.simulationSpeed;
      
      setTimeout(() => {
        this.handleStopCompleted(vehicle.id, currentStop.id);
      }, serviceTimeMs);
      
      return;
    }
    
    if (nextStop) {
      // Движение к следующей остановке
      vehicle.status = 'moving';
      
      // Рассчитываем новую позицию
      const distance = this.calculateDistance(
        vehicle.currentLocation,
        nextStop.coordinates
      );
      
      // Скорость в координатах в секунду
      const speed = vehicle.speed / 3600; // км/ч -> км/с
      const timeToNextUpdate = 1 / this.simulationSpeed; // секунды
      const distanceToMove = speed * timeToNextUpdate;
      
      if (distance <= distanceToMove) {
        // Прибыли на остановку
        vehicle.currentLocation = nextStop.coordinates;
        nextStop.status = 'in_progress';
        nextStop.actualArrival = new Date();
        vehicle.status = nextStop.type === 'delivery' ? 'delivering' : 'loading';
        
        this.emit('stop_arrived', {
          vehicleId: vehicle.id,
          stop: nextStop,
          onTime: nextStop.actualArrival <= nextStop.estimatedArrival
        });
      } else {
        // Продолжаем движение
        const ratio = distanceToMove / distance;
        vehicle.currentLocation = [
          vehicle.currentLocation[0] + (nextStop.coordinates[0] - vehicle.currentLocation[0]) * ratio,
          vehicle.currentLocation[1] + (nextStop.coordinates[1] - vehicle.currentLocation[1]) * ratio
        ];
        
        vehicle.metrics.distanceTraveled += distanceToMove;
      }
      
      // Обновляем метрики
      vehicle.metrics.timeElapsed += timeToNextUpdate / 60; // в минутах
      
      // Отправляем обновление позиции
      this.emit('location_update', {
        vehicleId: vehicle.id,
        location: vehicle.currentLocation,
        status: vehicle.status,
        metrics: vehicle.metrics
      });
    }
  }

  /**
   * Обработка завершения остановки
   */
  private handleStopCompleted(vehicleId: string, stopId: string) {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) return;
    
    const stop = vehicle.route[vehicle.currentStopIndex];
    if (stop && stop.id === stopId) {
      stop.status = 'completed';
      vehicle.currentStopIndex++;
      vehicle.metrics.stopsCompleted++;
      
      this.emit('stop_completed', {
        vehicleId,
        stop,
        stopsRemaining: vehicle.route.length - vehicle.currentStopIndex - 1
      });
    }
  }

  /**
   * Запрос оптимизации маршрута
   */
  async optimizeRoute(vehicleId: string): Promise<OptimizationResult | null> {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) return null;
    
    // Получаем оставшиеся остановки
    const remainingStops = vehicle.route.slice(vehicle.currentStopIndex + 1);
    
    if (remainingStops.length < 2) {
      // Недостаточно остановок для оптимизации
      return null;
    }
    
    try {
      // Отправляем запрос на оптимизацию на бэкенд
      const response = await fetch('/api/v1/routes/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_location: vehicle.currentLocation,
          stops: remainingStops.map(stop => ({
            lat: stop.coordinates[0],
            lng: stop.coordinates[1],
            address: stop.address,
            type: stop.type,
            service_time: stop.serviceTime,
            time_window_start: stop.estimatedArrival.toISOString(),
            time_window_end: new Date(stop.estimatedArrival.getTime() + 3600000).toISOString()
          })),
          algorithm: 'adaptive',
          consider_traffic: true,
          consider_time_windows: true
        })
      });
      
      if (!response.ok) {
        throw new Error('Optimization failed');
      }
      
      const optimizedData = await response.json();
      
      // Создаем результат оптимизации
      const result: OptimizationResult = {
        originalRoute: remainingStops,
        optimizedRoute: optimizedData.optimized_route,
        timeSaved: optimizedData.time_saved || 0,
        distanceSaved: optimizedData.distance_saved || 0,
        costSaved: optimizedData.cost_saved || 0,
        improvements: {
          totalDistance: {
            before: optimizedData.original_distance || 0,
            after: optimizedData.optimized_distance || 0
          },
          totalTime: {
            before: optimizedData.original_time || 0,
            after: optimizedData.optimized_time || 0
          },
          stopsReordered: optimizedData.stops_reordered || 0,
          efficiencyGain: optimizedData.efficiency_gain || 0
        }
      };
      
      this.emit('optimization_result', { vehicleId, result });
      
      return result;
    } catch (error) {
      console.error('Route optimization error:', error);
      this.emit('optimization_error', { vehicleId, error });
      return null;
    }
  }

  /**
   * Применение оптимизированного маршрута
   */
  applyOptimizedRoute(vehicleId: string, optimizedRoute: SimulationStop[]) {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) return;
    
    // Заменяем оставшиеся остановки оптимизированными
    vehicle.route = [
      ...vehicle.route.slice(0, vehicle.currentStopIndex + 1),
      ...optimizedRoute
    ];
    
    this.emit('route_updated', {
      vehicleId,
      newRoute: vehicle.route
    });
  }

  /**
   * Обработка результата оптимизации от WebSocket
   */
  private handleOptimizationComplete(vehicleId: string, result: OptimizationResult) {
    this.emit('optimization_complete', { vehicleId, result });
  }

  /**
   * Расчет расстояния между двумя точками (формула гаверсинусов)
   */
  private calculateDistance(point1: [number, number], point2: [number, number]): number {
    const R = 6371; // Радиус Земли в км
    const dLat = this.toRadians(point2[0] - point1[0]);
    const dLon = this.toRadians(point2[1] - point1[1]);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1[0])) * Math.cos(this.toRadians(point2[0])) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Подписка на события
   */
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Отписка от событий
   */
  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Генерация события
   */
  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Получение текущего состояния транспортного средства
   */
  getVehicle(vehicleId: string): SimulationVehicle | undefined {
    return this.vehicles.get(vehicleId);
  }

  /**
   * Получение всех транспортных средств
   */
  getAllVehicles(): SimulationVehicle[] {
    return Array.from(this.vehicles.values());
  }

  /**
   * Очистка ресурсов
   */
  cleanup() {
    this.stopSimulation();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.vehicles.clear();
    this.eventListeners.clear();
  }
}

// Singleton instance
let simulationServiceInstance: RealTimeSimulationService | null = null;

export const getSimulationService = (): RealTimeSimulationService => {
  if (!simulationServiceInstance) {
    simulationServiceInstance = new RealTimeSimulationService();
  }
  return simulationServiceInstance;
};

export default RealTimeSimulationService;
