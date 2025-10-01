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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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
  onDetailedView?: () => void;
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

export const ActiveRoutesBlock = ({ className = '', onRouteDetails, onDetailedView }: ActiveRoutesBlockProps) => {
  const [routes, setRoutes] = useState<RouteData[]>(mockRoutes);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState<{ [key: number]: boolean }>({});

  const getStatusVariant = (status: string): "default" | "success" | "warning" | "destructive" | "secondary" => {
    switch (status) {
      case 'в пути':
        return 'default';
      case 'задержка':
        return 'warning';
      case 'завершён':
        return 'success';
      case 'отменён':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'в пути':
        return <Navigation className="h-3 w-3" />;
      case 'задержка':
        return <AlertTriangle className="h-3 w-3" />;
      case 'завершён':
        return <CheckCircle className="h-3 w-3" />;
      case 'отменён':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const toggleDetails = (routeId: number) => {
    setShowDetails(prev => ({
      ...prev,
      [routeId]: !prev[routeId]
    }));
  };

  const activeCount = routes.filter(r => r.status === 'в пути' || r.status === 'задержка').length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-xl">
              <Route className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Активные маршруты</CardTitle>
              <CardDescription>
                {activeCount} активных из {routes.length}
              </CardDescription>
            </div>
          </div>
          {onDetailedView && (
            <Button variant="ghost" size="sm" onClick={onDetailedView}>
              Показать все
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {routes.map((route, index) => (
            <div 
              key={route.id}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2.5 bg-purple-50 rounded-xl">
                    <Truck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Маршрут #{route.id}
                      </h3>
                      <Badge variant={getStatusVariant(route.status)} className="gap-1">
                        {getStatusIcon(route.status)}
                        {route.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{route.vehicle_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{route.driver_name}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleDetails(route.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <span className="font-medium">Прогресс</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {route.completed_stops}/{route.total_stops} точек • {route.progress_percentage}%
                  </span>
                </div>
                <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${route.progress_percentage}%` }}
                  />
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
            <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4">
              <Route className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Нет активных маршрутов
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Создайте новый маршрут или дождитесь начала запланированных маршрутов
            </p>
            <Button variant="default">
              Создать маршрут
            </Button>
          </div>
        )}
        </CardContent>
    </Card>
  );
};