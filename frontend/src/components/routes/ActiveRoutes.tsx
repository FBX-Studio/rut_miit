'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, MapPin, Truck, User, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useRouteUpdates } from '@/contexts/WebSocketContext';

interface RouteData {
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

interface ActiveRoutesProps {
  routes?: RouteData[];
  loading?: boolean;
  selectedRouteId?: number | null;
  onRouteSelect?: (routeId: number) => void;
  onRouteAction?: (routeId: number, action: 'reoptimize' | 'pause' | 'resume' | 'cancel') => void;
  className?: string;
}

export const ActiveRoutes = ({
  routes = [],
  loading = false,
  selectedRouteId,
  onRouteSelect,
  onRouteAction,
  className = '',
}: ActiveRoutesProps) => {
  const [localRoutes, setLocalRoutes] = useState<RouteData[]>(routes);

  useEffect(() => {
    if (JSON.stringify(localRoutes) !== JSON.stringify(routes)) {
      setLocalRoutes(routes);
    }
  }, [routes, localRoutes]);

  useRouteUpdates(useCallback((data) => {
    setLocalRoutes(prev => 
      prev.map(route => 
        route.id === data.route_id 
          ? { ...route, ...data }
          : route
      )
    );
  }, []));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'delayed':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'completed':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'cancelled':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'planned':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'delayed':
        return <AlertTriangle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Н/Д';
    return new Date(timeString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return 'Н/Д';
    return distance > 1000 
      ? `${(distance / 1000).toFixed(1)} км`
      : `${distance.toFixed(0)} м`;
  };

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Активные маршруты</h2>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (localRoutes.length === 0) {
    return (
      <div className={`card ${className}`}>
        <h2 className="text-lg font-semibold mb-4">Активные маршруты</h2>
        <div className="text-center py-8">
          <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Нет активных маршрутов</p>
          <p className="text-sm text-gray-500 mt-1">Маршруты появятся здесь после завершения оптимизации</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold mb-4">Активные маршруты</h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {localRoutes.length} маршрут{localRoutes.length !== 1 ? (localRoutes.length < 5 ? 'а' : 'ов') : ''}
        </span>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {localRoutes.map(route => (
          <div
            key={route.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onRouteSelect?.(route.id)}
          >
            {}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Маршрут {route.id}</span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(route.status)}`}>
                  {getStatusIcon(route.status)}
                  <span className="capitalize">{route.status === 'active' ? 'Активен' : route.status}</span>
                </div>
              </div>
              
              {onRouteAction && route.status === 'active' && (
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRouteAction(route.id, 'reoptimize');
                    }}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    title="Переоптимизировать маршрут"
                  >
                    Переопт
                  </button>
                </div>
              )}
            </div>

            {}
            <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Truck className="h-4 w-4" />
                <span>{route.vehicle_name || `Транспорт ${route.vehicle_id}`}</span>
              </div>
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{route.driver_name || `Водитель ${route.driver_id}`}</span>
              </div>
            </div>

            {}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">
                  Прогресс: {route.current_stop_index}/{route.total_stops} остановок
                </span>
                <span className="font-medium">
                  {route.progress_percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    route.status === 'delayed' ? 'bg-yellow-500' :
                    route.status === 'active' ? 'bg-green-500' :
                    route.status === 'completed' ? 'bg-blue-500' : 'bg-gray-400'
                  }`}
                  style={{ width: `${route.progress_percentage}%` }}
                ></div>
              </div>
            </div>

            {}
            {route.next_stop && route.status === 'active' && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Следующая {route.next_stop.type === 'pickup' ? 'забор' : 'доставка'}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ETA: {formatTime(route.next_stop.eta)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{route.next_stop.address}</span>
                </div>
                {route.next_stop.customer_name && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Клиент: {route.next_stop.customer_name}
                  </p>
                )}
              </div>
            )}

            {}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Расстояние:</span>
                <div className="font-medium">
                  {route.completed_distance && route.total_distance ? (
                    <>
                      {formatDistance(route.completed_distance)} / {formatDistance(route.total_distance)}
                    </>
                  ) : (
                    formatDistance(route.total_distance)
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-gray-600 dark:text-gray-400">Завершение:</span>
                <div className="font-medium">
                    {route.estimated_completion ? formatTime(route.estimated_completion) : 'Н/Д'}
                  </div>
              </div>

              {route.delays_count !== undefined && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Задержки:</span>
                  <div className={`font-medium ${route.delays_count > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {route.delays_count}
                  </div>
                </div>
              )}

              {route.on_time_percentage !== undefined && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">В срок:</span>
                  <div className={`font-medium ${
                    route.on_time_percentage >= 90 ? 'text-green-600' :
                    route.on_time_percentage >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {route.on_time_percentage.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};