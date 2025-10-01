'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Truck, 
  MapPin, 
  User, 
  Package,
  Navigation,
  AlertCircle,
  Info
} from 'lucide-react';
import { useEventNotifications } from '@/contexts/WebSocketContext';

interface EventData {
  id: number;
  type: 'delay' | 'traffic' | 'vehicle_breakdown' | 'delivery_completed' | 'route_optimized' | 'driver_update' | 'system' | 'reoptimization';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
  route_id?: number;
  vehicle_id?: number;
  driver_id?: number;
  order_id?: number;
  location?: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'acknowledged';
  estimated_impact?: {
    delay_minutes?: number;
    affected_orders?: number;
    cost_impact?: number;
  };
}

interface RecentEventsProps {
  events?: EventData[];
  loading?: boolean;
  maxEvents?: number;
  onEventClick?: (eventId: number) => void;
  onEventAction?: (eventId: number, action: 'acknowledge' | 'resolve') => void;
  className?: string;
}

export const RecentEvents = ({
  events = [],
  loading = false,
  maxEvents = 10,
  onEventClick,
  onEventAction,
  className = '',
}: RecentEventsProps) => {
  const [localEvents, setLocalEvents] = useState<EventData[]>(events);

  useEffect(() => {
    const newEvents = events.slice(0, maxEvents);
    if (JSON.stringify(localEvents) !== JSON.stringify(newEvents)) {
      setLocalEvents(newEvents);
    }
  }, [events, maxEvents, localEvents]);

  const handleEventNotification = useCallback((data: any) => {
    setLocalEvents(prev => {
      const newEvents = [data, ...prev];
      return newEvents.slice(0, maxEvents);
    });
  }, [maxEvents]);

  useEventNotifications(handleEventNotification);

  const getEventIcon = (type: string, severity: string) => {
    const iconClass = `h-5 w-5 ${getSeverityColor(severity)}`;
    
    switch (type) {
      case 'delay':
        return <Clock className={iconClass} />;
      case 'traffic':
        return <Navigation className={iconClass} />;
      case 'vehicle_breakdown':
        return <Truck className={iconClass} />;
      case 'delivery_completed':
        return <CheckCircle className={iconClass} />;
      case 'route_optimized':
        return <MapPin className={iconClass} />;
      case 'driver_update':
        return <User className={iconClass} />;
      case 'reoptimization':
        return <Navigation className={iconClass} />;
      case 'system':
        return <Info className={iconClass} />;
      default:
        return <AlertCircle className={iconClass} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'acknowledged':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'active':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffMs = now.getTime() - eventTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    return `${diffDays} дн назад`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Последние события</h2>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse flex items-start space-x-3 p-3 border rounded-lg">
              <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (localEvents.length === 0) {
    return (
      <div className={`card ${className}`}>
        <h2 className="text-lg font-semibold mb-4">Последние события</h2>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Нет последних событий</p>
          <p className="text-sm text-gray-500 mt-1">Системные события появятся здесь</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Последние события</h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {localEvents.length} событи{localEvents.length === 1 ? 'е' : localEvents.length < 5 ? 'я' : 'й'}
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {localEvents.map(event => (
          <div
            key={event.id}
            className={`border rounded-lg p-3 transition-all duration-200 cursor-pointer hover:shadow-md ${
              event.status === 'active' ? 'border-l-4 border-l-red-500' :
              event.status === 'acknowledged' ? 'border-l-4 border-l-blue-500' :
              'border-l-4 border-l-green-500'
            }`}
            onClick={() => onEventClick?.(event.id)}
          >
            <div className="flex items-start space-x-3">
              {}
              <div className="flex-shrink-0 mt-0.5">
                {getEventIcon(event.type, event.severity)}
              </div>

              {}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {event.title}
                  </h3>
                  <div className="flex items-center space-x-2 ml-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityBadgeColor(event.severity)}`}>
                      {event.severity === 'critical' ? 'критический' : 
                       event.severity === 'high' ? 'высокий' :
                       event.severity === 'medium' ? 'средний' : 
                       event.severity === 'low' ? 'низкий' : event.severity}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                      {event.status === 'active' ? 'активный' :
                       event.status === 'resolved' ? 'решен' :
                       event.status === 'acknowledged' ? 'принят' : event.status}
                    </span>
                  </div>
                </div>

                {event.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {event.description}
                  </p>
                )}

                {}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span>{formatTime(event.timestamp)}</span>
                    {event.route_id && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>Маршрут {event.route_id}</span>
                      </span>
                    )}
                    {event.vehicle_id && (
                      <span className="flex items-center space-x-1">
                        <Truck className="h-3 w-3" />
                        <span>V{event.vehicle_id}</span>
                      </span>
                    )}
                    {event.order_id && (
                      <span className="flex items-center space-x-1">
                        <Package className="h-3 w-3" />
                        <span>O{event.order_id}</span>
                      </span>
                    )}
                  </div>
                  <span>{formatTimeAgo(event.timestamp)}</span>
                </div>

                {}
                {event.estimated_impact && (
                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                    <div className="flex items-center justify-between">
                      {event.estimated_impact.delay_minutes && (
                        <span className="text-yellow-600">
                          +{event.estimated_impact.delay_minutes} мин задержки
                        </span>
                      )}
                      {event.estimated_impact.affected_orders && (
                        <span className="text-orange-600">
                          {event.estimated_impact.affected_orders} заказов затронуто
                        </span>
                      )}
                      {event.estimated_impact.cost_impact && (
                        <span className="text-red-600">
                          ${event.estimated_impact.cost_impact} ущерб
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {}
                {onEventAction && event.status === 'active' && (
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventAction(event.id, 'acknowledge');
                      }}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Принять
                    </button>
                    {event.type !== 'system' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventAction(event.id, 'resolve');
                        }}
                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        Решить
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {}
      {localEvents.length >= maxEvents && (
        <div className="mt-4 text-center">
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Показать все события →
          </button>
        </div>
      )}
    </div>
  );
};