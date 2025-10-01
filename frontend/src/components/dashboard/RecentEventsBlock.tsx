'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  Package, 
  Truck, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  MapPin,
  User,
  Filter,
  Calendar
} from 'lucide-react';

interface EventData {
  id: number;
  type: 'order' | 'route_change' | 'incident' | 'delivery' | 'pickup' | 'delay';
  title: string;
  description: string;
  timestamp: string;
  route_id?: number;
  driver_name?: string;
  vehicle_name?: string;
  location?: string;
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'resolved' | 'pending';
}

interface RecentEventsBlockProps {
  className?: string;
  maxEvents?: number;
  onEventDetails?: (eventId: number) => void;
}

// Mock data for demonstration
const mockEvents: EventData[] = [
  {
    id: 1,
    type: 'delivery',
    title: 'Доставка завершена',
    description: 'Заказ #2045 успешно доставлен клиенту ООО Альфа',
    timestamp: '2024-01-15T14:30:00Z',
    route_id: 1001,
    driver_name: 'Иванов А.П.',
    vehicle_name: 'ГАЗель Next А123БВ',
    location: 'ул. Тверская, 15',
    severity: 'low',
    status: 'resolved'
  },
  {
    id: 2,
    type: 'incident',
    title: 'Задержка на маршруте',
    description: 'Пробка на МКАД, ожидаемая задержка 15 минут',
    timestamp: '2024-01-15T14:15:00Z',
    route_id: 1002,
    driver_name: 'Петров С.М.',
    vehicle_name: 'Ford Transit В456ГД',
    location: 'МКАД, 45 км',
    severity: 'medium',
    status: 'active'
  },
  {
    id: 3,
    type: 'order',
    title: 'Новый заказ',
    description: 'Получен срочный заказ на доставку в центр города',
    timestamp: '2024-01-15T14:00:00Z',
    location: 'ул. Арбат, 28',
    severity: 'low',
    status: 'pending'
  },
  {
    id: 4,
    type: 'route_change',
    title: 'Изменение маршрута',
    description: 'Маршрут #1003 оптимизирован, сокращено время на 12 минут',
    timestamp: '2024-01-15T13:45:00Z',
    route_id: 1003,
    driver_name: 'Сидоров В.И.',
    vehicle_name: 'Mercedes Sprinter Е789ЖЗ',
    severity: 'low',
    status: 'resolved'
  },
  {
    id: 5,
    type: 'pickup',
    title: 'Забор груза',
    description: 'Груз забран со склада, начало доставки',
    timestamp: '2024-01-15T13:30:00Z',
    route_id: 1001,
    driver_name: 'Иванов А.П.',
    vehicle_name: 'ГАЗель Next А123БВ',
    location: 'Склад №1',
    severity: 'low',
    status: 'resolved'
  },
  {
    id: 6,
    type: 'incident',
    title: 'Поломка транспорта',
    description: 'Техническая неисправность, требуется замена автомобиля',
    timestamp: '2024-01-15T13:15:00Z',
    route_id: 1004,
    driver_name: 'Козлов Д.А.',
    vehicle_name: 'Iveco Daily И012КЛ',
    location: 'ул. Садовая, 67',
    severity: 'high',
    status: 'active'
  }
];

const eventTypeFilters = [
  { value: 'all', label: 'Все события', icon: Calendar },
  { value: 'order', label: 'Заказы', icon: Package },
  { value: 'delivery', label: 'Доставки', icon: CheckCircle },
  { value: 'incident', label: 'Инциденты', icon: AlertTriangle },
  { value: 'route_change', label: 'Изменения маршрутов', icon: MapPin }
];

export const RecentEventsBlock = ({ 
  className = '', 
  maxEvents = 6,
  onEventDetails 
}: RecentEventsBlockProps) => {
  const [events, setEvents] = useState<EventData[]>(mockEvents);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredEvents = events
    .filter(event => selectedFilter === 'all' || event.type === selectedFilter)
    .slice(0, maxEvents);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="h-4 w-4" />;
      case 'delivery':
        return <CheckCircle className="h-4 w-4" />;
      case 'pickup':
        return <Package className="h-4 w-4" />;
      case 'incident':
        return <AlertTriangle className="h-4 w-4" />;
      case 'route_change':
        return <MapPin className="h-4 w-4" />;
      case 'delay':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string, severity: string) => {
    if (severity === 'high') return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (severity === 'medium') return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    
    switch (type) {
      case 'delivery':
      case 'pickup':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'incident':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'route_change':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'order':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'только что';
    if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч назад`;
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Последние события
              </h2>
              <p className="text-sm text-gray-400">
                {filteredEvents.length} из {events.length} событий
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>
            <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
              Показать все
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {eventTypeFilters.map((filter) => {
              const IconComponent = filter.icon;
              return (
                <button
                  key={filter.value}
                  onClick={() => setSelectedFilter(filter.value)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedFilter === filter.value
                      ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-700/50 dark:text-gray-400 dark:hover:bg-gray-600'
                  }`}
                >
                  <IconComponent className="h-3 w-3 mr-1" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Events Timeline */}
      <div className="divide-y divide-gray-700/30">
        {filteredEvents.map((event, index) => (
          <div key={event.id} className="p-6 hover:bg-gray-800/30 transition-colors">
            <div className="flex items-start space-x-4">
              {/* Timeline indicator */}
              <div className="flex-shrink-0 relative">
                <div className={`p-2 rounded-full border-2 ${getEventColor(event.type, event.severity)}`}>
                  {getEventIcon(event.type)}
                </div>
                {index < filteredEvents.length - 1 && (
                  <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-700/50"></div>
                )}
              </div>

              {/* Event content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-medium text-white">
                        {event.title}
                      </h3>
                      {event.severity === 'high' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                          Критично
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      {event.description}
                    </p>
                    
                    {/* Event details */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(event.timestamp)}</span>
                      </span>
                      {event.route_id && (
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>Маршрут #{event.route_id}</span>
                        </span>
                      )}
                      {event.driver_name && (
                        <span className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{event.driver_name}</span>
                        </span>
                      )}
                      {event.vehicle_name && (
                        <span className="flex items-center space-x-1">
                          <Truck className="h-3 w-3" />
                          <span>{event.vehicle_name}</span>
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      event.status === 'active' 
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : event.status === 'resolved'
                        ? 'bg-gray-100 text-gray-700 border border-gray-200'
                        : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    }`}>
                      {event.status === 'active' ? 'Активно' : 
                       event.status === 'resolved' ? 'Завершено' : 'Ожидает'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="p-12 text-center">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-white mb-2">
            Нет событий
          </h3>
          <p className="text-sm text-gray-400">
            События появятся здесь по мере их возникновения
          </p>
        </div>
      )}
    </div>
  );
};