import React, { useState, useEffect, useRef, useCallback } from 'react';
import { YMaps, Map, Placemark, Polyline, TrafficControl, ZoomControl, GeolocationControl } from '@pbe/react-yandex-maps';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, MapPin, Navigation, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

interface RouteStop {
  id: number;
  location: Location;
  type: 'depot' | 'delivery' | 'pickup';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  estimatedTime?: string;
  actualTime?: string;
  orderNumber?: string;
}

interface DriverRoute {
  id: number;
  driverId: number;
  driverName: string;
  vehicleNumber: string;
  stops: RouteStop[];
  currentLocation?: Location;
  status: 'not_started' | 'in_progress' | 'completed';
  trafficLevel?: 'low' | 'medium' | 'high';
}

interface EnhancedYandexMapProps {
  routes: DriverRoute[];
  center?: [number, number];
  zoom?: number;
  showTraffic?: boolean;
  showDriverLocation?: boolean;
  onStopClick?: (stop: RouteStop) => void;
  realTimeUpdates?: boolean;
}

// Цвета для маршрутов
const ROUTE_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EF4444', // red
  '#06B6D4', // cyan
];

// Цвета статусов
const STATUS_COLORS = {
  pending: '#9CA3AF',
  in_progress: '#3B82F6',
  completed: '#10B981',
  failed: '#EF4444',
};

// Иконки для остановок
const STOP_ICONS = {
  depot: '🏢',
  delivery: '📦',
  pickup: '📥',
};

export const EnhancedYandexMap: React.FC<EnhancedYandexMapProps> = ({
  routes,
  center = [55.7558, 37.6176], // Moscow
  zoom = 11,
  showTraffic = true,
  showDriverLocation = true,
  onStopClick,
  realTimeUpdates = false,
}) => {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [trafficVisible, setTrafficVisible] = useState(showTraffic);
  const [trafficControl, setTrafficControl] = useState<any>(null);
  const mapRef = useRef<any>(null);

  // Обработка клика на остановку
  const handleStopClick = useCallback((stop: RouteStop) => {
    setSelectedStop(stop);
    if (onStopClick) {
      onStopClick(stop);
    }
  }, [onStopClick]);

  // Переход к маршруту
  const focusOnRoute = useCallback((route: DriverRoute) => {
    if (!mapInstance) return;

    const bounds = route.stops.map(stop => [
      stop.location.latitude,
      stop.location.longitude,
    ]);

    if (route.currentLocation) {
      bounds.push([route.currentLocation.latitude, route.currentLocation.longitude]);
    }

    mapInstance.setBounds(bounds, {
      checkZoomRange: true,
      duration: 500,
    });

    setSelectedRoute(route.id);
  }, [mapInstance]);

  // Получение координат маршрута для линии
  const getRouteCoordinates = (route: DriverRoute): [number, number][] => {
    return route.stops.map(stop => [stop.location.latitude, stop.location.longitude]);
  };

  // Создание контента для балуна остановки
  const createStopBalloonContent = (stop: RouteStop, route: DriverRoute) => {
    return `
      <div style="padding: 12px; min-width: 250px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="font-size: 24px;">${STOP_ICONS[stop.type]}</span>
          <div>
            <div style="font-weight: 600; font-size: 16px; color: #111827;">
              ${stop.type === 'depot' ? 'Депо' : stop.type === 'delivery' ? 'Доставка' : 'Забор'}
            </div>
            ${stop.orderNumber ? `<div style="font-size: 12px; color: #6B7280;">Заказ #${stop.orderNumber}</div>` : ''}
          </div>
        </div>
        
        <div style="margin-bottom: 8px;">
          <div style="font-size: 13px; color: #374151;">
            <strong>Адрес:</strong> ${stop.location.address || 'Не указан'}
          </div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 6px; padding: 6px; background: ${STATUS_COLORS[stop.status]}20; border-radius: 6px; margin-bottom: 8px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: ${STATUS_COLORS[stop.status]};"></div>
          <span style="font-size: 12px; font-weight: 500; color: ${STATUS_COLORS[stop.status]};">
            ${stop.status === 'pending' ? 'Ожидает' : 
              stop.status === 'in_progress' ? 'В процессе' : 
              stop.status === 'completed' ? 'Завершено' : 'Ошибка'}
          </span>
        </div>
        
        ${stop.estimatedTime ? `
          <div style="font-size: 12px; color: #6B7280; margin-bottom: 4px;">
            <strong>Планируемое время:</strong> ${stop.estimatedTime}
          </div>
        ` : ''}
        
        ${stop.actualTime ? `
          <div style="font-size: 12px; color: #6B7280;">
            <strong>Фактическое время:</strong> ${stop.actualTime}
          </div>
        ` : ''}
        
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">
          <div style="font-size: 11px; color: #9CA3AF;">
            Водитель: ${route.driverName}<br/>
            ТС: ${route.vehicleNumber}
          </div>
        </div>
      </div>
    `;
  };

  // Управление отображением пробок
  useEffect(() => {
    if (!mapInstance || !trafficControl) return;

    if (trafficVisible) {
      trafficControl.showTraffic();
    } else {
      trafficControl.hideTraffic();
    }
  }, [trafficVisible, mapInstance, trafficControl]);

  // Real-time обновления позиций
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      // Здесь должна быть логика получения real-time позиций от backend
      console.log('Updating driver positions...');
    }, 5000); // Обновление каждые 5 секунд

    return () => clearInterval(interval);
  }, [realTimeUpdates]);

  return (
    <div className="relative w-full h-full">
      <YMaps
        query={{
          apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '',
          lang: 'ru_RU',
        }}
      >
        <div className="relative w-full h-full">
          {/* Карта */}
          <Map
            defaultState={{
              center,
              zoom,
              controls: [],
            }}
            width="100%"
            height="100%"
            modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
            onLoad={(ymaps) => setMapInstance(ymaps)}
            instanceRef={mapRef}
            options={{
              suppressMapOpenBlock: true,
            }}
          >
            {/* Контролы */}
            <ZoomControl options={{ float: 'right' }} />
            <GeolocationControl options={{ float: 'left' }} />
            <TrafficControl 
              options={{ float: 'right' }} 
              instanceRef={(ref) => {
                if (ref && !trafficControl) {
                  setTrafficControl(ref);
                  if (trafficVisible) {
                    setTimeout(() => ref.showTraffic(), 100);
                  }
                }
              }}
            />

            {/* Маршруты */}
            {routes.map((route, index) => (
              <React.Fragment key={route.id}>
                {/* Линия маршрута */}
                <Polyline
                  geometry={getRouteCoordinates(route)}
                  options={{
                    strokeColor: selectedRoute === route.id 
                      ? ROUTE_COLORS[index % ROUTE_COLORS.length]
                      : `${ROUTE_COLORS[index % ROUTE_COLORS.length]}80`,
                    strokeWidth: selectedRoute === route.id ? 5 : 3,
                    strokeStyle: route.status === 'completed' ? 'shortdash' : 'solid',
                    opacity: selectedRoute === route.id ? 1 : 0.6,
                  }}
                  onClick={() => setSelectedRoute(route.id)}
                />

                {/* Остановки */}
                {route.stops.map((stop, stopIndex) => (
                  <Placemark
                    key={`${route.id}-${stop.id}`}
                    geometry={[stop.location.latitude, stop.location.longitude]}
                    properties={{
                      balloonContent: createStopBalloonContent(stop, route),
                      hintContent: `${stop.type === 'depot' ? 'Депо' : `Остановка ${stopIndex + 1}`}`,
                    }}
                    options={{
                      preset: stop.type === 'depot' 
                        ? 'islands#darkBlueDotIcon'
                        : stop.status === 'completed'
                        ? 'islands#greenDotIcon'
                        : stop.status === 'in_progress'
                        ? 'islands#blueDotIcon'
                        : 'islands#grayDotIcon',
                      iconColor: STATUS_COLORS[stop.status],
                      zIndex: selectedStop?.id === stop.id ? 1000 : 100,
                    }}
                    onClick={() => handleStopClick(stop)}
                  />
                ))}

                {/* Текущая позиция водителя */}
                {showDriverLocation && route.currentLocation && route.status === 'in_progress' && (
                  <Placemark
                    geometry={[
                      route.currentLocation.latitude,
                      route.currentLocation.longitude,
                    ]}
                    properties={{
                      iconContent: '🚚',
                      hintContent: `${route.driverName} - ${route.vehicleNumber}`,
                    }}
                    options={{
                      preset: 'islands#blueStretchyIcon',
                      zIndex: 500,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </Map>

          {/* Панель управления картой */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 space-y-3 max-w-xs z-10"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              Управление картой
            </h3>

            {/* Переключатель пробок */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={trafficVisible}
                onChange={(e) => setTrafficVisible(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Показать пробки
              </span>
            </label>

            {/* Список маршрутов */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Маршруты
              </div>
              {routes.map((route, index) => (
                <motion.button
                  key={route.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => focusOnRoute(route)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                    selectedRoute === route.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ROUTE_COLORS[index % ROUTE_COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {route.driverName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {route.vehicleNumber} • {route.stops.length} остановок
                    </div>
                  </div>
                  {route.status === 'in_progress' && (
                    <Truck className="w-4 h-4 text-blue-500 animate-pulse flex-shrink-0" />
                  )}
                  {route.status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Информационная панель выбранной остановки */}
          <AnimatePresence>
            {selectedStop && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 z-10"
              >
                <button
                  onClick={() => setSelectedStop(null)}
                  className="absolute top-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <span className="text-gray-500 dark:text-gray-400">✕</span>
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{STOP_ICONS[selectedStop.type]}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {selectedStop.type === 'depot' ? 'Депо' : 
                       selectedStop.type === 'delivery' ? 'Доставка' : 'Забор'}
                    </h4>
                    {selectedStop.orderNumber && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Заказ #{selectedStop.orderNumber}
                      </p>
                    )}
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${STATUS_COLORS[selectedStop.status]}20`,
                      color: STATUS_COLORS[selectedStop.status],
                    }}
                  >
                    {selectedStop.status === 'pending' ? 'Ожидает' :
                     selectedStop.status === 'in_progress' ? 'В процессе' :
                     selectedStop.status === 'completed' ? 'Завершено' : 'Ошибка'}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {selectedStop.location.address || 'Адрес не указан'}
                    </span>
                  </div>

                  {selectedStop.estimatedTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Планируется: {selectedStop.estimatedTime}
                      </span>
                    </div>
                  )}

                  {selectedStop.actualTime && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Выполнено: {selectedStop.actualTime}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (mapInstance) {
                      mapInstance.setCenter(
                        [selectedStop.location.latitude, selectedStop.location.longitude],
                        16,
                        { duration: 500 }
                      );
                    }
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Показать на карте
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Индикатор пробок */}
          {trafficVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 z-10"
            >
              <div className="text-xs font-medium text-gray-900 dark:text-white mb-2">
                Уровень пробок
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded bg-green-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">1-3</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded bg-yellow-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">4-6</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded bg-orange-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">7-8</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded bg-red-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">9-10</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </YMaps>
    </div>
  );
};

export default EnhancedYandexMap;
