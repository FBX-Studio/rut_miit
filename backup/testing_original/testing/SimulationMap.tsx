'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { YMaps, Map, Placemark, Polyline, TrafficControl, ZoomControl, GeolocationControl } from '@pbe/react-yandex-maps';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  MapPin, 
  Truck, 
  Package, 
  Clock,
  Navigation,
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { SimulationDriver, SimulationRoutePoint, mockSimulationData, updateDriverPosition } from './SimulationData';

interface SimulationMapProps {
  className?: string;
}

const SimulationMap: React.FC<SimulationMapProps> = ({ className = '' }) => {
  const [driver, setDriver] = useState<SimulationDriver>(mockSimulationData);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1); // 1x, 2x, 4x скорость
  const [elapsedTime, setElapsedTime] = useState(0); // в секундах
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.7558, 37.6176]);
  const [mapZoom, setMapZoom] = useState(12);
  const [followDriver, setFollowDriver] = useState(true);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<any>(null);

  // Обработчик событий симуляции
  useEffect(() => {
    const handleSimulationEvent = (event: any) => {
      if (event.driver_id === driver.id && event.location) {
        setDriver(prev => ({
          ...prev,
          currentLocation: event.location.coordinates,
          status: event.type === 'delivery_complete' ? 'delivering' : 'driving'
        }));
        
        // Следование за водителем
        if (followDriver) {
          setMapCenter(event.location.coordinates);
        }
      }
    };

    // Регистрируем глобальный обработчик
    if (typeof window !== 'undefined') {
      (window as any).simulationEventHandler = handleSimulationEvent;
    }

    return () => {
      if (typeof window !== 'undefined') {
        (window as any).simulationEventHandler = null;
      }
    };
  }, [driver.id, followDriver]);

  // Обновление симуляции
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + simulationSpeed;
          const updatedDriver = updateDriverPosition(driver, newTime);
          setDriver(updatedDriver);
          
          // Следование за водителем
          if (followDriver) {
            setMapCenter(updatedDriver.currentLocation);
          }
          
          return newTime;
        });
      }, 1000); // Обновление каждую секунду
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, simulationSpeed, driver, followDriver]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setElapsedTime(0);
    setDriver(mockSimulationData);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setElapsedTime(0);
    setDriver(mockSimulationData);
    setMapCenter([55.7558, 37.6176]);
  };

  const handleSpeedChange = (speed: number) => {
    setSimulationSpeed(speed);
  };

  const getStopIcon = (stop: SimulationRoutePoint) => {
    switch (stop.type) {
      case 'depot':
        return 'islands#blueHomeIcon';
      case 'pickup':
        return 'islands#greenIcon';
      case 'delivery':
        return 'islands#redIcon';
      default:
        return 'islands#grayIcon';
    }
  };

  const getStopColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981'; // green
      case 'in_progress':
        return '#F59E0B'; // yellow
      case 'pending':
        return '#6B7280'; // gray
      case 'delayed':
        return '#EF4444'; // red
      default:
        return '#6B7280';
    }
  };

  // Создание маршрутной линии
  const routeCoordinates = driver.route.map(stop => stop.coordinates);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Панель управления */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Симуляция маршрута: {driver.name}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Транспорт: {driver.vehicleType}
            </span>
          </div>
        </div>

        {/* Кнопки управления */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePlayPause}
              className={`flex items-center px-3 py-2 rounded-lg text-white font-medium ${
                isPlaying 
                  ? 'bg-yellow-500 hover:bg-yellow-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isPlaying ? 'Пауза' : 'Старт'}
            </button>
            
            <button
              onClick={handleStop}
              className="flex items-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
            >
              <Square className="w-4 h-4 mr-1" />
              Стоп
            </button>
            
            <button
              onClick={handleReset}
              className="flex items-center px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Сброс
            </button>
          </div>

          {/* Скорость симуляции */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Скорость:</span>
            {[1, 2, 4].map(speed => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2 py-1 rounded text-sm font-medium ${
                  simulationSpeed === speed
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Следование за водителем */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={followDriver}
              onChange={(e) => setFollowDriver(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Следить за водителем
            </span>
          </label>
        </div>

        {/* Прогресс */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Прогресс маршрута
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {driver.completedStops} из {driver.totalStops} остановок
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(driver.completedStops / driver.totalStops) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Карта */}
      <div className="h-96 relative">
        <YMaps>
          <Map
            ref={mapRef}
            defaultState={{
              center: mapCenter,
              zoom: mapZoom,
            }}
            state={{
              center: mapCenter,
              zoom: mapZoom,
            }}
            width="100%"
            height="100%"
            options={{
              suppressMapOpenBlock: true,
            }}
          >
            {/* Маршрутная линия */}
            <Polyline
              geometry={routeCoordinates}
              options={{
                balloonCloseButton: false,
                strokeColor: '#2563EB',
                strokeWidth: 4,
                strokeOpacity: 0.8,
              }}
            />

            {/* Остановки маршрута */}
            {driver.route.map((stop, index) => (
              <Placemark
                key={stop.id}
                geometry={stop.coordinates}
                options={{
                  preset: getStopIcon(stop),
                  iconColor: getStopColor(stop.status),
                }}
                properties={{
                  balloonContentHeader: `${index + 1}. ${stop.name}`,
                  balloonContentBody: `
                    <div>
                      <p><strong>Адрес:</strong> ${stop.address}</p>
                      <p><strong>Тип:</strong> ${stop.type === 'depot' ? 'Склад' : stop.type === 'pickup' ? 'Забор' : 'Доставка'}</p>
                      <p><strong>Статус:</strong> ${
                        stop.status === 'completed' ? 'Завершено' :
                        stop.status === 'in_progress' ? 'В процессе' :
                        stop.status === 'pending' ? 'Ожидание' : 'Задержка'
                      }</p>
                      ${stop.estimatedArrival ? `<p><strong>Планируемое прибытие:</strong> ${stop.estimatedArrival}</p>` : ''}
                      ${stop.actualArrival ? `<p><strong>Фактическое прибытие:</strong> ${stop.actualArrival}</p>` : ''}
                      ${stop.orderInfo ? `
                        <p><strong>Заказ:</strong> ${stop.orderInfo.orderId}</p>
                        <p><strong>Клиент:</strong> ${stop.orderInfo.customerName}</p>
                        <p><strong>Товары:</strong> ${stop.orderInfo.items.join(', ')}</p>
                      ` : ''}
                    </div>
                  `,
                }}
              />
            ))}

            {/* Текущая позиция водителя */}
            <Placemark
              geometry={driver.currentLocation}
              options={{
                preset: 'islands#blueDotIcon',
                iconColor: '#10B981',
              }}
              properties={{
                balloonContentHeader: `${driver.name}`,
                balloonContentBody: `
                  <div>
                    <p><strong>Транспорт:</strong> ${driver.vehicleType}</p>
                    <p><strong>Статус:</strong> ${
                      driver.status === 'driving' ? 'В пути' :
                      driver.status === 'delivering' ? 'Доставка' :
                      driver.status === 'loading' ? 'Загрузка' :
                      driver.status === 'break' ? 'Перерыв' : 'Ожидание'
                    }</p>
                    <p><strong>Завершено остановок:</strong> ${driver.completedStops} из ${driver.totalStops}</p>
                  </div>
                `,
              }}
            />

            {/* Элементы управления картой */}
            <TrafficControl options={{ float: 'right' }} />
            <ZoomControl options={{ float: 'right' }} />
            <GeolocationControl options={{ float: 'left' }} />
          </Map>
        </YMaps>
      </div>

      {/* Информационная панель */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Время в пути
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {Math.floor(elapsedTime / 3600)}:{Math.floor((elapsedTime % 3600) / 60).toString().padStart(2, '0')}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Navigation className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Статус
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {driver.status === 'driving' ? 'В пути' :
               driver.status === 'delivering' ? 'Доставка' :
               driver.status === 'loading' ? 'Загрузка' :
               driver.status === 'break' ? 'Перерыв' : 'Ожидание'}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="w-4 h-4 text-purple-500 mr-1" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Следующая остановка
              </span>
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {driver.route[driver.completedStops + 1]?.name || 'Завершено'}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="w-4 h-4 text-orange-500 mr-1" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Прогресс
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {Math.round((driver.completedStops / driver.totalStops) * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationMap;