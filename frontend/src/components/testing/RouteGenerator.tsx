'use client';

import React, { useState } from 'react';
import YandexMapWrapper from '../maps/YandexMapWrapper';
import { MapPin, Navigation, RefreshCw, Truck, Package } from 'lucide-react';

interface Stop {
  id: string;
  name: string;
  address: string;
  type: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface RouteData {
  stops: Stop[];
  route_geometry: [number, number][];
  distance: number;
  duration: number;
  duration_in_traffic: number;
}

const RouteGenerator: React.FC = () => {
  const [numStops, setNumStops] = useState(5);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRoute = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/api/v1/delivery-generator/generate-route?num_stops=${numStops}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка генерации маршрута');
      }

      const data = await response.json();
      setRouteData(data);
      
      console.log('Generated route:', data);
      console.log(`Route: ${data.stops.length} stops, ${data.distance.toFixed(2)} km, ${data.duration.toFixed(1)} min`);
      if (data.duration_in_traffic > 0) {
        console.log(`With traffic: ${data.duration_in_traffic.toFixed(1)} min (delay: ${(data.duration_in_traffic - data.duration).toFixed(1)} min)`);
      }
    } catch (err) {
      console.error('Error generating route:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const getMapCenter = (): [number, number] => {
    if (routeData && routeData.stops.length > 0) {
      const firstStop = routeData.stops[0];
      return [firstStop.coordinates.lat, firstStop.coordinates.lng];
    }
    return [55.7558, 37.6176]; // Москва по умолчанию
  };

  const getStopIcon = (type: string) => {
    switch (type) {
      case 'depot':
        return 'islands#redDotIcon';
      case 'pickup':
        return 'islands#blueDotIcon';
      case 'delivery':
        return 'islands#greenDotIcon';
      default:
        return 'islands#grayDotIcon';
    }
  };

  const getStopColor = (type: string) => {
    switch (type) {
      case 'depot':
        return '#EF4444';
      case 'pickup':
        return '#3B82F6';
      case 'delivery':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/20 rounded-lg">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Генератор маршрутов доставки</h2>
            <p className="text-blue-100 mt-1">
              Случайные адреса в Москве с построением маршрута по дорогам
            </p>
          </div>
        </div>
      </div>

      {/* Управление */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Количество точек доставки
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={numStops}
              onChange={(e) => setNumStops(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <button
            onClick={generateRoute}
            disabled={isLoading}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg
                     font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Генерация...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>Сгенерировать маршрут</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Карта */}
      {routeData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="h-[600px]">
            <YandexMapWrapper
              center={getMapCenter()}
              zoom={11}
              showTraffic={true}
              routes={routeData.route_geometry.length > 0 ? [{
                geometry: routeData.route_geometry,
                color: '#2563EB',
                width: 5
              }] : []}
              markers={routeData.stops.map((stop, index) => ({
                coordinates: [stop.coordinates.lat, stop.coordinates.lng] as [number, number],
                color: getStopColor(stop.type),
                icon: getStopIcon(stop.type),
                hint: `${index + 1}. ${stop.name}`,
                balloonContent: `
                  <div style="padding: 12px; min-width: 200px;">
                    <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">
                      ${index + 1}. ${stop.name}
                    </h3>
                    <p style="margin: 4px 0; font-size: 12px; color: #666;">
                      <strong>Адрес:</strong><br/>
                      ${stop.address}
                    </p>
                    <p style="margin: 4px 0; font-size: 12px;">
                      <strong>Тип:</strong> 
                      ${stop.type === 'depot' ? '🏢 Склад' : 
                        stop.type === 'pickup' ? '📦 Забор' : '🚚 Доставка'}
                    </p>
                    <p style="margin: 4px 0; font-size: 11px; color: #888;">
                      ${stop.coordinates.lat.toFixed(6)}, ${stop.coordinates.lng.toFixed(6)}
                    </p>
                  </div>
                `
              }))}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Информация о маршруте */}
      {routeData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Остановок</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {routeData.stops.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Navigation className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Расстояние</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {routeData.distance.toFixed(1)} км
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Время в пути</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {routeData.duration_in_traffic > 0 
                    ? routeData.duration_in_traffic.toFixed(0)
                    : routeData.duration.toFixed(0)} мин
                </p>
                {routeData.duration_in_traffic > routeData.duration && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    +{(routeData.duration_in_traffic - routeData.duration).toFixed(0)} мин (пробки)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Список остановок */}
      {routeData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Список остановок
          </h3>
          <div className="space-y-3">
            {routeData.stops.map((stop, index) => (
              <div
                key={stop.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                              ${stop.type === 'depot' ? 'bg-red-500' : 
                                stop.type === 'pickup' ? 'bg-blue-500' : 'bg-green-500'}`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {stop.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {stop.address}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {stop.coordinates.lat.toFixed(6)}, {stop.coordinates.lng.toFixed(6)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                                ${stop.type === 'depot' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                  stop.type === 'pickup' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                    {stop.type === 'depot' ? 'Склад' :
                     stop.type === 'pickup' ? 'Забор' : 'Доставка'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteGenerator;
