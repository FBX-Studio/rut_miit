'use client';

import { useState, useEffect } from 'react';
import { 
  Truck, 
  User, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  MoreVertical,
  Eye,
  Route,
  Navigation
} from 'lucide-react';

interface RouteData {
  id: number;
  vehicle_id: number;
  driver_id: number;
  vehicle_name: string;
  driver_name: string;
  status: 'в пути' | 'завершён' | 'отменён' | 'запланирован' | 'задержка';
  current_stop: string;
  total_stops: number;
  completed_stops: number;
  progress_percentage: number;
  estimated_completion: string;
  distance_remaining: number;
  total_distance: number;
  next_delivery: {
    address: string;
    customer: string;
    eta: string;
  };
}

interface ActiveRoutesBlockProps {
  className?: string;
  onRouteDetails?: (routeId: number) => void;
}

// Mock data for demonstration
const mockRoutes: RouteData[] = [
  {
    id: 1001,
    vehicle_id: 101,
    driver_id: 201,
    vehicle_name: "ГАЗель Next А123БВ",
    driver_name: "Иванов А.П.",
    status: "в пути",
    current_stop: "ул. Тверская, 15",
    total_stops: 8,
    completed_stops: 3,
    progress_percentage: 37,
    estimated_completion: "16:30",
    distance_remaining: 12.5,
    total_distance: 45.2,
    next_delivery: {
      address: "пр. Мира, 45",
      customer: "ООО Альфа",
      eta: "14:45"
    }
  },
  {
    id: 1002,
    vehicle_id: 102,
    driver_id: 202,
    vehicle_name: "Ford Transit В456ГД",
    driver_name: "Петров С.М.",
    status: "задержка",
    current_stop: "ул. Арбат, 28",
    total_stops: 6,
    completed_stops: 2,
    progress_percentage: 33,
    estimated_completion: "17:15",
    distance_remaining: 18.3,
    total_distance: 32.1,
    next_delivery: {
      address: "ул. Новый Арбат, 12",
      customer: "Бета Групп",
      eta: "15:20"
    }
  },
  {
    id: 1003,
    vehicle_id: 103,
    driver_id: 203,
    vehicle_name: "Mercedes Sprinter Е789ЖЗ",
    driver_name: "Сидоров В.И.",
    status: "завершён",
    current_stop: "База",
    total_stops: 5,
    completed_stops: 5,
    progress_percentage: 100,
    estimated_completion: "13:45",
    distance_remaining: 0,
    total_distance: 28.7,
    next_delivery: {
      address: "—",
      customer: "—",
      eta: "—"
    }
  }
];

export const ActiveRoutesBlock = ({ className = '', onRouteDetails }: ActiveRoutesBlockProps) => {
  const [routes, setRoutes] = useState<RouteData[]>(mockRoutes);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState<{ [key: number]: boolean }>({});

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'в пути':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'задержка':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'завершён':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'отменён':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'запланирован':
        return 'text-gray-700 bg-gray-100 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'в пути':
        return <Navigation className="h-4 w-4" />;
      case 'задержка':
        return <AlertTriangle className="h-4 w-4" />;
      case 'завершён':
        return <CheckCircle className="h-4 w-4" />;
      case 'отменён':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const toggleDetails = (routeId: number) => {
    setShowDetails(prev => ({
      ...prev,
      [routeId]: !prev[routeId]
    }));
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Route className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Активные маршруты
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {routes.filter(r => r.status === 'в пути' || r.status === 'задержка').length} активных из {routes.length}
              </p>
            </div>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
            Показать все
          </button>
        </div>
      </div>

      {/* Routes List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {routes.map((route) => (
          <div key={route.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            {/* Main Route Info */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Truck className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Маршрут #{route.id}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(route.status)}`}>
                      {getStatusIcon(route.status)}
                      <span className="ml-1">{route.status}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4" />
                      <span>{route.vehicle_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{route.driver_name}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleDetails(route.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Прогресс: {route.completed_stops}/{route.total_stops} остановок</span>
                <span>{route.progress_percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${route.progress_percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Текущая точка</p>
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {route.current_stop}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Завершение</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {route.estimated_completion}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Route className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Осталось</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {route.distance_remaining} км
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Navigation className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Всего</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {route.total_distance} км
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Info (Expandable) */}
            {showDetails[route.id] && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Следующая доставка
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Адрес</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {route.next_delivery.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Клиент</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {route.next_delivery.customer}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">ETA</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {route.next_delivery.eta}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {routes.length === 0 && (
        <div className="p-12 text-center">
          <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Нет активных маршрутов
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Создайте новый маршрут или дождитесь начала запланированных маршрутов
          </p>
        </div>
      )}
    </div>
  );
};