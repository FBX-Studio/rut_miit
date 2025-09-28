/**
 * Сервис интеграции симуляции с основной системой
 * Преобразует данные симуляции в формат основного приложения
 */

import { SimulationDriver, SimulationRoutePoint, SimulationMetrics } from '@/components/testing/SimulationData';

// Типы данных основного приложения
export interface MainAppRoute {
  id: number;
  vehicle_id: number;
  driver_id: number;
  vehicle_name?: string;
  driver_name?: string;
  status: 'planned' | 'active' | 'completed' | 'delayed' | 'cancelled';
  current_stop_index: number;
  total_stops: number;
  progress_percentage: number;
  estimated_completion?: string;
  actual_start?: string;
  total_distance?: number;
  completed_distance?: number;
  delays_count?: number;
  on_time_percentage?: number;
  next_stop?: {
    address: string;
    eta: string;
    type: 'pickup' | 'delivery';
    customer_name?: string;
  };
}

export interface MainAppRouteStop {
  id: number;
  sequence: number;
  location: [number, number];
  type: 'pickup' | 'delivery' | 'depot';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  planned_arrival?: string;
  actual_arrival?: string;
  estimated_arrival?: string;
  order_id?: number;
  address?: string;
  customer_name?: string;
}

export interface MainAppDriver {
  id: number;
  name: string;
  phone: string;
  license_number: string;
  experience_level: string;
  rating: number;
  status: 'available' | 'on_route' | 'break' | 'off_duty' | 'sick_leave';
  specialization: string;
  can_work_nights: boolean;
  can_work_weekends: boolean;
  current_vehicle_id?: number;
  total_deliveries: number;
  successful_deliveries: number;
  average_delivery_time: number;
  customer_feedback_score: number;
  punctuality_score: number;
  safety_score: number;
  last_active: string;
  notes: string;
}

export class SimulationIntegrationService {
  /**
   * Преобразует данные симуляции в формат маршрута основного приложения
   */
  static convertSimulationToMainRoute(simulation: SimulationDriver): MainAppRoute {
    const currentStopIndex = simulation.completedStops;
    const progressPercentage = (simulation.completedStops / simulation.totalStops) * 100;
    
    // Находим следующую остановку
    const nextStop = simulation.route.find(stop => stop.status === 'pending');
    
    return {
      id: parseInt(simulation.id.replace('driver_', '')),
      vehicle_id: parseInt(simulation.vehicleId.replace('vehicle_', '')),
      driver_id: parseInt(simulation.id.replace('driver_', '')),
      vehicle_name: simulation.vehicleType,
      driver_name: simulation.name,
      status: this.mapSimulationStatusToMainStatus(simulation.status),
      current_stop_index: currentStopIndex,
      total_stops: simulation.totalStops,
      progress_percentage: progressPercentage,
      estimated_completion: simulation.estimatedEndTime,
      actual_start: simulation.startTime,
      total_distance: this.calculateTotalDistance(simulation.route),
      completed_distance: this.calculateCompletedDistance(simulation.route),
      delays_count: this.calculateDelays(simulation.route),
      on_time_percentage: this.calculateOnTimePercentage(simulation.route),
      next_stop: nextStop ? {
        address: nextStop.address,
        eta: nextStop.estimatedArrival || '',
        type: nextStop.type as 'pickup' | 'delivery',
        customer_name: nextStop.orderInfo?.customerName
      } : undefined
    };
  }

  /**
   * Преобразует остановки симуляции в формат основного приложения
   */
  static convertSimulationStops(simulationRoute: SimulationRoutePoint[]): MainAppRouteStop[] {
    return simulationRoute.map((stop, index) => ({
      id: parseInt(stop.id.replace(/[^0-9]/g, '') || '0'),
      sequence: index,
      location: stop.coordinates,
      type: stop.type as 'pickup' | 'delivery' | 'depot',
      status: this.mapStopStatus(stop.status),
      planned_arrival: stop.estimatedArrival,
      actual_arrival: stop.actualArrival,
      estimated_arrival: stop.estimatedArrival,
      order_id: stop.orderInfo ? parseInt(stop.orderInfo.orderId.replace('ORD-', '')) : undefined,
      address: stop.address,
      customer_name: stop.orderInfo?.customerName
    }));
  }

  /**
   * Создает профиль водителя на основе данных симуляции
   */
  static createDriverProfile(simulation: SimulationDriver): MainAppDriver {
    return {
      id: parseInt(simulation.id.replace('driver_', '')),
      name: simulation.name,
      phone: '+7 (999) 123-45-67', // Мок данные
      license_number: 'AB1234567890',
      experience_level: 'experienced',
      rating: 4.7,
      status: this.mapDriverStatus(simulation.status),
      specialization: 'Городская доставка',
      can_work_nights: true,
      can_work_weekends: true,
      current_vehicle_id: parseInt(simulation.vehicleId.replace('vehicle_', '')),
      total_deliveries: 156,
      successful_deliveries: 148,
      average_delivery_time: 25.5,
      customer_feedback_score: 4.6,
      punctuality_score: 92.3,
      safety_score: 98.1,
      last_active: new Date().toISOString(),
      notes: 'Опытный водитель с отличными показателями'
    };
  }

  /**
   * Отправляет данные симуляции в основную систему
   */
  static async syncSimulationWithMainSystem(simulation: SimulationDriver): Promise<void> {
    try {
      const route = this.convertSimulationToMainRoute(simulation);
      const stops = this.convertSimulationStops(simulation.route);
      const driver = this.createDriverProfile(simulation);

      // Отправляем данные в основную систему через WebSocket или API
      if (typeof window !== 'undefined' && (window as any).simulationSync) {
        (window as any).simulationSync({
          type: 'route_update',
          data: { route, stops, driver }
        });
      }

      // Также можно отправить через API
      await this.sendToAPI('/api/v1/simulation/sync', {
        route,
        stops,
        driver,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Ошибка синхронизации симуляции:', error);
    }
  }

  /**
   * Получает реальные данные из основной системы для симуляции
   */
  static async fetchRealDataForSimulation(): Promise<{
    routes: MainAppRoute[];
    drivers: MainAppDriver[];
  }> {
    try {
      const [routesResponse, driversResponse] = await Promise.all([
        fetch('/api/v1/routes/active'),
        fetch('/api/v1/drivers')
      ]);

      const routes = routesResponse.ok ? await routesResponse.json() : [];
      const drivers = driversResponse.ok ? await driversResponse.json() : [];

      return { routes, drivers };
    } catch (error) {
      console.error('Ошибка получения данных:', error);
      return { routes: [], drivers: [] };
    }
  }

  // Вспомогательные методы
  private static mapSimulationStatusToMainStatus(status: string): 'planned' | 'active' | 'completed' | 'delayed' | 'cancelled' {
    switch (status) {
      case 'driving':
      case 'loading':
      case 'delivering':
        return 'active';
      case 'idle':
        return 'planned';
      case 'break':
        return 'delayed';
      default:
        return 'active';
    }
  }

  private static mapStopStatus(status: string): 'pending' | 'in_progress' | 'completed' | 'failed' {
    switch (status) {
      case 'pending':
        return 'pending';
      case 'in_progress':
        return 'in_progress';
      case 'completed':
        return 'completed';
      case 'delayed':
        return 'failed';
      default:
        return 'pending';
    }
  }

  private static mapDriverStatus(status: string): 'available' | 'on_route' | 'break' | 'off_duty' | 'sick_leave' {
    switch (status) {
      case 'driving':
      case 'loading':
      case 'delivering':
        return 'on_route';
      case 'break':
        return 'break';
      case 'idle':
        return 'available';
      default:
        return 'on_route';
    }
  }

  private static calculateTotalDistance(route: SimulationRoutePoint[]): number {
    // Примерный расчет расстояния между точками
    let totalDistance = 0;
    for (let i = 1; i < route.length; i++) {
      const prev = route[i - 1];
      const curr = route[i];
      totalDistance += this.calculateDistance(prev.coordinates, curr.coordinates);
    }
    return Math.round(totalDistance * 100) / 100;
  }

  private static calculateCompletedDistance(route: SimulationRoutePoint[]): number {
    let completedDistance = 0;
    for (let i = 1; i < route.length; i++) {
      const prev = route[i - 1];
      const curr = route[i];
      if (curr.status === 'completed') {
        completedDistance += this.calculateDistance(prev.coordinates, curr.coordinates);
      } else {
        break;
      }
    }
    return Math.round(completedDistance * 100) / 100;
  }

  private static calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const R = 6371; // Радиус Земли в км
    const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
    const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static calculateDelays(route: SimulationRoutePoint[]): number {
    return route.filter(stop => stop.status === 'delayed').length;
  }

  private static calculateOnTimePercentage(route: SimulationRoutePoint[]): number {
    const completedStops = route.filter(stop => stop.status === 'completed');
    if (completedStops.length === 0) return 100;
    
    const onTimeStops = completedStops.filter(stop => {
      if (!stop.estimatedArrival || !stop.actualArrival) return true;
      return new Date(stop.actualArrival) <= new Date(stop.estimatedArrival);
    });
    
    return Math.round((onTimeStops.length / completedStops.length) * 100);
  }

  private static async sendToAPI(endpoint: string, data: any): Promise<void> {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error(`Ошибка отправки данных в ${endpoint}:`, error);
    }
  }
}