'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { YMaps, Map, Placemark, Polyline, TrafficControl, RouteButton, RoutePanel, withYMaps } from '@pbe/react-yandex-maps';

// Route data interface
interface RouteData {
  id: number;
  vehicle_id: number;
  driver_id: number;
  status: string;
  current_location?: [number, number];
  route_geometry?: [number, number][];
  stops: RouteStop[];
  total_distance?: number;
  estimated_duration?: number;
  actual_duration?: number;
  progress_percentage?: number;
}

interface RouteStop {
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

interface RouteMapProps {
  routes: RouteData[];
  selectedRouteId?: number;
  onRouteSelect?: (routeId: number) => void;
  onStopSelect?: (routeId: number, stopId: number) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  showTraffic?: boolean;
  realTimeTracking?: boolean;
  className?: string;
}

// Custom placemark options for different stop types and statuses
const getStopPlacemarkOptions = (type: string, status: string) => {
  const getColor = () => {
    if (status === 'completed') return '#10B981'; // green
    if (status === 'in_progress') return '#F59E0B'; // yellow
    if (status === 'failed') return '#EF4444'; // red
    return '#6B7280'; // gray
  };

  const getPreset = () => {
    switch (type) {
      case 'depot': return 'islands#blueHomeIcon';
      case 'pickup': return 'islands#blueDeliveryIcon';
      case 'delivery': return 'islands#blueDeliveryIcon';
      default: return 'islands#blueDotIcon';
    }
  };

  return {
    preset: getPreset(),
    iconColor: getColor(),
  };
};

// Vehicle placemark options
const getVehiclePlacemarkOptions = (status: string) => {
  const getColor = () => {
    switch (status) {
      case 'active': return '#10B981';
      case 'delayed': return '#F59E0B';
      case 'breakdown': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return {
    preset: 'islands#blueCarIcon',
    iconColor: getColor(),
  };
};

// Route colors for different routes
const routeColors = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#F97316', // orange
  '#06B6D4', // cyan
  '#84CC16', // lime
];

// Route building component
const RouteBuilder = withYMaps(({ ymaps, routes, onRouteSelect }: any) => {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [multiRoutes, setMultiRoutes] = useState<any[]>([]);

  const buildRoute = useCallback((route: RouteData) => {
    if (!ymaps || !mapInstance || !route.stops.length) return;

    const referencePoints = route.stops.map(stop => stop.location);
    
    const multiRoute = new ymaps.multiRouter.MultiRoute({
      referencePoints,
      params: {
        routingMode: 'auto',
        avoidTrafficJams: true,
      }
    }, {
      boundsAutoApply: true,
      routeActiveStrokeWidth: 6,
      routeActiveStrokeColor: routeColors[route.id % routeColors.length],
      wayPointVisible: false,
      routeStrokeWidth: 4,
      routeStrokeColor: routeColors[route.id % routeColors.length],
      opacity: 0.7,
    });

    multiRoute.events.add('click', () => {
      onRouteSelect?.(route.id);
    });

    mapInstance.geoObjects.add(multiRoute);
    return multiRoute;
  }, [ymaps, mapInstance, onRouteSelect]);

  useEffect(() => {
    if (!ymaps || !mapInstance) return;

    // Clear existing routes
    multiRoutes.forEach(route => {
      mapInstance.geoObjects.remove(route);
    });

    // Build new routes
    const newRoutes = routes.map((route: RouteData) => buildRoute(route)).filter(Boolean);
    setMultiRoutes(newRoutes);

    return () => {
      newRoutes.forEach(route => {
        if (route && mapInstance) {
          mapInstance.geoObjects.remove(route);
        }
      });
    };
  }, [routes, ymaps, mapInstance, buildRoute]);

  return null;
});

export const RouteMap = ({
  routes,
  selectedRouteId,
  onRouteSelect,
  onStopSelect,
  center = [55.7558, 37.6176], // Moscow coordinates
  zoom = 10,
  height = '400px',
  showTraffic = false,
  realTimeTracking = false,
  className = '',
}: RouteMapProps) => {
  const [mapInstance, setMapInstance] = useState<any>(null);

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRouteColor = (routeId: number) => {
    return routeColors[routeId % routeColors.length];
  };

  const handleMapLoad = (map: any) => {
    setMapInstance(map);
    
    // Auto-fit bounds to show all routes
    if (routes.length > 0) {
      const bounds: [number, number][] = [];
      
      routes.forEach(route => {
        if (route.route_geometry) {
          bounds.push(...route.route_geometry);
        }
        route.stops.forEach(stop => bounds.push(stop.location));
        if (route.current_location) {
          bounds.push(route.current_location);
        }
      });

      if (bounds.length > 0) {
        map.setBounds(bounds, { checkZoomRange: true });
      }
    }
  };

  const createBalloonContent = (stop: RouteStop) => {
    return `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-weight: bold; text-transform: capitalize;">${stop.type} Stop</h3>
        <p style="margin: 4px 0; font-size: 12px; color: #666;">Последовательность: ${stop.sequence}</p>
        ${stop.customer_name ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Клиент:</strong> ${stop.customer_name}</p>` : ''}
        ${stop.address ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Адрес:</strong> ${stop.address}</p>` : ''}
        <p style="margin: 4px 0; font-size: 12px;">
          <strong>Статус:</strong> 
          <span style="margin-left: 4px; text-transform: capitalize; color: ${
            stop.status === 'completed' ? '#10B981' :
            stop.status === 'in_progress' ? '#F59E0B' :
            stop.status === 'failed' ? '#EF4444' : '#6B7280'
          };">
            ${stop.status === 'completed' ? 'Завершено' :
              stop.status === 'in_progress' ? 'В процессе' :
              stop.status === 'failed' ? 'Ошибка' : 'Ожидание'}
          </span>
        </p>
        <div style="margin-top: 8px; font-size: 11px; color: #999;">
          <p>Планируемое: ${formatTime(stop.planned_arrival)}</p>
          ${stop.estimated_arrival ? `<p>Ожидаемое: ${formatTime(stop.estimated_arrival)}</p>` : ''}
          ${stop.actual_arrival ? `<p>Фактическое: ${formatTime(stop.actual_arrival)}</p>` : ''}
        </div>
      </div>
    `;
  };

  const createVehicleBalloonContent = (route: RouteData) => {
    return `
      <div style="padding: 10px;">
        <h3 style="margin: 0 0 8px 0; font-weight: bold;">Транспорт ${route.vehicle_id}</h3>
        <p style="margin: 4px 0; font-size: 12px; color: #666;">Маршрут: ${route.id}</p>
        <p style="margin: 4px 0; font-size: 12px;">Статус: <span style="text-transform: capitalize;">${route.status}</span></p>
        ${route.progress_percentage !== undefined ? `
          <div style="margin-top: 8px;">
            <p style="margin: 4px 0; font-size: 12px;">Прогресс: ${route.progress_percentage.toFixed(1)}%</p>
            <div style="width: 100%; background-color: #e5e7eb; border-radius: 4px; height: 8px; margin-top: 4px;">
              <div style="background-color: #3b82f6; height: 8px; border-radius: 4px; width: ${route.progress_percentage}%; transition: width 0.3s;"></div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  };

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <YMaps
        query={{
          apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY,
          lang: 'ru_RU',
          load: 'package.full',
        }}
      >
        <Map
          defaultState={{
            center,
            zoom,
            controls: ['zoomControl', 'fullscreenControl', 'geolocationControl'],
          }}
          modules={['multiRouter.MultiRoute', 'control.TrafficControl', 'control.RouteButton']}
          width="100%"
          height="100%"
          onLoad={handleMapLoad}
          options={{
            suppressMapOpenBlock: true,
          }}
        >
          {/* Traffic control */}
          {showTraffic && (
            <TrafficControl 
              options={{ 
                float: 'right',
                floatIndex: 100,
              }} 
            />
          )}

          {/* Route button for manual route building */}
          <RouteButton 
            options={{ 
              float: 'right',
              floatIndex: 200,
            }} 
          />

          {/* Route stops */}
          {routes.map(route =>
            route.stops.map(stop => (
              <Placemark
                key={`stop-${route.id}-${stop.id}`}
                geometry={stop.location}
                options={getStopPlacemarkOptions(stop.type, stop.status)}
                properties={{
                  balloonContent: createBalloonContent(stop),
                  hintContent: `${stop.type} - ${stop.status}`,
                }}
                onClick={() => onStopSelect?.(route.id, stop.id)}
              />
            ))
          )}

          {/* Vehicle current locations */}
          {routes.map(route =>
            route.current_location && realTimeTracking && (
              <Placemark
                key={`vehicle-${route.id}`}
                geometry={route.current_location}
                options={getVehiclePlacemarkOptions(route.status)}
                properties={{
                  balloonContent: createVehicleBalloonContent(route),
                  hintContent: `Транспорт ${route.vehicle_id}`,
                }}
                onClick={() => onRouteSelect?.(route.id)}
              />
            )
          )}

          {/* Route polylines (fallback if multiRouter doesn't work) */}
          {routes.map(route => (
            route.route_geometry && (
              <Polyline
                key={`route-${route.id}`}
                geometry={route.route_geometry}
                options={{
                  strokeColor: getRouteColor(route.id),
                  strokeWidth: selectedRouteId === route.id ? 6 : 4,
                  strokeOpacity: selectedRouteId ? (selectedRouteId === route.id ? 1.0 : 0.3) : 0.7,
                }}
                onClick={() => onRouteSelect?.(route.id)}
              />
            )
          ))}

          {/* Route builder for automatic routing */}
          <RouteBuilder 
            routes={routes} 
            onRouteSelect={onRouteSelect}
          />
        </Map>
      </YMaps>

      {/* Map controls overlay */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        {selectedRouteId && (
          <button
            onClick={() => onRouteSelect?.(0)}
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded shadow-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Очистить выбор
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg">
        <h4 className="text-sm font-semibold mb-2">Легенда</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Завершено</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>В процессе</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Ожидание</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Ошибка</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export as dynamic component to avoid SSR issues
export default dynamic(() => Promise.resolve(RouteMap), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Загрузка карты...</p>
      </div>
    </div>
  ),
});