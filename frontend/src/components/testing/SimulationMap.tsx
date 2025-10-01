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
  AlertCircle,
  Zap,
  TrendingDown
} from 'lucide-react';
import { SimulationDriver, SimulationRoutePoint, mockSimulationData, updateDriverPosition } from './SimulationData';
import { getSimulationService } from '@/services/realTimeSimulation';
import { toast } from 'react-hot-toast';

// Declare global ymaps type
declare global {
  interface Window {
    ymaps: any;
  }
}

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
  const [trafficControl, setTrafficControl] = useState<any>(null);
  const [showOptimization, setShowOptimization] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [originalRoute, setOriginalRoute] = useState<SimulationRoutePoint[]>([]);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [totalTimeLost, setTotalTimeLost] = useState(0); // Потерянное время в минутах
  const [totalTimeSaved, setTotalTimeSaved] = useState(0); // Сэкономленное время
  const [delays, setDelays] = useState<Array<{time: number, reason: string}>>([]);
  
  // Real-time прогресс оптимизации
  const [optimizationProgress, setOptimizationProgress] = useState({
    isOptimizing: false,
    currentMetric: '',
    progress: 0,
    estimatedTimeRemaining: 0
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<any>(null);
  const simulationService = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());

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

  // Построение маршрута - используем простые линии для стабильности
  const buildRouteGeometry = useCallback(() => {
    if (driver.route.length < 2) {
      return;
    }

    // Используем прямые линии между точками
    const coords: [number, number][] = driver.route.map(stop => stop.coordinates);
    setRouteGeometry(coords);
    console.log('Route geometry built with', coords.length, 'points');
  }, [driver.route]);

  // Построить маршрут при загрузке
  useEffect(() => {
    buildRouteGeometry();
  }, [buildRouteGeometry]);

  // Симуляция случайных задержек
  const simulateRandomDelay = () => {
    if (Math.random() < 0.15) { // 15% шанс задержки
      const delayMinutes = Math.floor(Math.random() * 10) + 5; // 5-15 минут
      const reasons = [
        'Пробка на дороге',
        'Ожидание клиента',
        'Проблема с парковкой',
        'Дорожные работы',
        'Плохая погода'
      ];
      const reason = reasons[Math.floor(Math.random() * reasons.length)];
      
      setTotalTimeLost(prev => prev + delayMinutes);
      setDelays(prev => [...prev, { time: delayMinutes, reason }]);
      
      toast.error(`⚠️ Задержка: ${reason} (+${delayMinutes} мин)`, {
        duration: 5000
      });
    }
  };

  // Обновление симуляции с реальным прогрессом
  useEffect(() => {
    if (isPlaying) {
      const updateInterval = 1000 / simulationSpeed; // миллисекунды
      
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + simulationSpeed;
          
          // Обновляем позицию водителя
          if (routeGeometry.length > 0) {
            const progress = (newTime / (8 * 3600)) * routeGeometry.length; // 8 часов рабочий день
            const segmentIndex = Math.min(
              Math.floor(progress),
              routeGeometry.length - 1
            );
            
            setCurrentSegmentIndex(segmentIndex);
            
            if (segmentIndex < routeGeometry.length) {
              const newLocation = routeGeometry[segmentIndex];
              setDriver(prev => ({
                ...prev,
                currentLocation: newLocation
              }));
              
              // Следование за водителем
              if (followDriver) {
                setMapCenter(newLocation);
              }
              
              // Обновляем статус остановок
              const completedStops = Math.floor((segmentIndex / routeGeometry.length) * driver.totalStops);
              if (completedStops > driver.completedStops) {
                setDriver(prev => ({
                  ...prev,
                  completedStops
                }));
                
                // Симулируем возможную задержку при завершении остановки
                simulateRandomDelay();
              }
            }
          }
          
          return newTime;
        });
      }, updateInterval);
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
  }, [isPlaying, simulationSpeed, routeGeometry, followDriver]);

  const handlePlayPause = () => {
    if (!isPlaying && elapsedTime === 0) {
      // Начинаем новую симуляцию
      startTimeRef.current = Date.now();
    }
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
    setShowOptimization(false);
    setOptimizationResult(null);
    setOriginalRoute([]);
    setTotalTimeLost(0);
    setTotalTimeSaved(0);
    setDelays([]);
    setCurrentSegmentIndex(0);
    startTimeRef.current = Date.now();
  };

  const handleOptimizeRoute = async () => {
    if (!driver || isOptimizing) return;

    setIsOptimizing(true);
    setOriginalRoute([...driver.route]);
    
    // Запускаем симуляцию прогресса оптимизации
    setOptimizationProgress({
      isOptimizing: true,
      currentMetric: 'Анализ маршрута...',
      progress: 0,
      estimatedTimeRemaining: 15
    });

    // Симулируем этапы оптимизации
    const optimizationSteps = [
      { metric: 'Анализ маршрута...', duration: 2000, progress: 20 },
      { metric: 'Расчет расстояний...', duration: 2000, progress: 40 },
      { metric: 'Учет пробок...', duration: 2000, progress: 60 },
      { metric: 'Оптимизация порядка...', duration: 2000, progress: 80 },
      { metric: 'Финализация...', duration: 1000, progress: 100 }
    ];

    // Запускаем последовательность этапов
    for (const step of optimizationSteps) {
      await new Promise(resolve => setTimeout(resolve, step.duration));
      setOptimizationProgress({
        isOptimizing: true,
        currentMetric: step.metric,
        progress: step.progress,
        estimatedTimeRemaining: Math.ceil((100 - step.progress) / 100 * 15)
      });
    }

    try {
      // Симуляция вызова API оптимизации
      const response = await fetch('/api/v1/routes/optimize-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          driver_id: driver.id,
          current_location: driver.currentLocation,
          remaining_stops: driver.route.slice(driver.completedStops + 1).map(stop => ({
            lat: stop.coordinates[0],
            lng: stop.coordinates[1],
            address: stop.address,
            type: stop.type,
            service_time: stop.serviceTime
          })),
          consider_traffic: true,
          consider_time_windows: true
        })
      });

      // Если API не доступен, создаем симуляцию оптимизации
      let optimizedData;
      if (!response.ok) {
        // Симулируем оптимизацию локально
        const remainingStops = driver.route.slice(driver.completedStops + 1);
        const optimizedStops = [...remainingStops].sort((a, b) => {
          // Простая эвристика: сортировка по близости
          const distA = Math.abs(a.coordinates[0] - driver.currentLocation[0]) + 
                       Math.abs(a.coordinates[1] - driver.currentLocation[1]);
          const distB = Math.abs(b.coordinates[0] - driver.currentLocation[0]) + 
                       Math.abs(b.coordinates[1] - driver.currentLocation[1]);
          return distA - distB;
        });

        const originalTime = remainingStops.reduce((acc, stop) => acc + stop.serviceTime + 15, 0);
        const optimizedTime = originalTime * 0.75; // 25% экономии
        
        optimizedData = {
          optimized_route: optimizedStops,
          time_saved: originalTime - optimizedTime,
          distance_saved: 12.5,
          cost_saved: 850,
          improvements: {
            totalDistance: { before: 45.2, after: 32.7 },
            totalTime: { before: originalTime, after: optimizedTime },
            stopsReordered: 3,
            efficiencyGain: 25
          }
        };
      } else {
        optimizedData = await response.json();
      }

      setOptimizationResult(optimizedData);
      setShowOptimization(true);
      
      // Сбрасываем прогресс
      setOptimizationProgress({
        isOptimizing: false,
        currentMetric: '',
        progress: 0,
        estimatedTimeRemaining: 0
      });
      
      toast.success(`✅ Маршрут оптимизирован! Экономия: ${Math.round(optimizedData.time_saved)} мин`, { 
        duration: 5000
      });
    } catch (error) {
      console.error('Optimization error:', error);
      
      // Сбрасываем прогресс при ошибке
      setOptimizationProgress({
        isOptimizing: false,
        currentMetric: '',
        progress: 0,
        estimatedTimeRemaining: 0
      });
      
      toast.error('❌ Ошибка оптимизации маршрута');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyOptimization = () => {
    if (!optimizationResult) return;

    // Применяем оптимизированный маршрут
    const newRoute = [
      ...driver.route.slice(0, driver.completedStops + 1),
      ...optimizationResult.optimized_route
    ];

    setDriver({
      ...driver,
      route: newRoute
    });

    // Добавляем сэкономленное время
    const timeSaved = optimizationResult.time_saved || 0;
    setTotalTimeSaved(prev => prev + timeSaved);

    // Перестраиваем маршрут
    buildRouteGeometry();

    toast.success(`✅ Оптимизация применена! Экономия: ${Math.round(timeSaved)} мин`, {
      duration: 5000
    });
    setShowOptimization(false);
  };

  const handleRejectOptimization = () => {
    setShowOptimization(false);
    setOptimizationResult(null);
    toast.info('Оптимизация отменена, используется исходный маршрут');
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

            <button
              onClick={handleOptimizeRoute}
              disabled={isOptimizing || !isPlaying}
              className="flex items-center px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4 mr-1" />
              {isOptimizing ? 'Оптимизация...' : 'Оптимизировать'}
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
        <YMaps
          query={{
            apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '',
            lang: 'ru_RU',
          }}
        >
          <Map
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
            {/* Маршрутная линия по дорогам */}
            {routeGeometry.length > 0 && (
              <Polyline
                geometry={routeGeometry}
                options={{
                  balloonCloseButton: false,
                  strokeColor: '#2563EB',
                  strokeWidth: 5,
                  strokeOpacity: 0.85,
                }}
              />
            )}

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
            <TrafficControl 
              options={{ float: 'right' }} 
              instanceRef={(ref) => {
                if (ref && !trafficControl) {
                  setTrafficControl(ref);
                  setTimeout(() => ref.showTraffic(), 100);
                }
              }}
            />
            <ZoomControl options={{ float: 'right' }} />
            <GeolocationControl options={{ float: 'left' }} />
          </Map>
        </YMaps>
      </div>

      {/* Модальное окно оптимизации */}
      {showOptimization && optimizationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-indigo-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Оптимизация маршрута завершена
                    </h3>
                    <p className="text-purple-100 text-sm">
                      Найден более эффективный путь доставки
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Ключевые показатели экономии */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Экономия времени</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {Math.round(optimizationResult.time_saved)} мин
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-center mb-2">
                    <Navigation className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Экономия пути</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {optimizationResult.distance_saved?.toFixed(1) || 0} км
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingDown className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Экономия средств</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {optimizationResult.cost_saved?.toFixed(0) || 0} ₽
                    </p>
                  </div>
                </div>
              </div>

              {/* Детальное сравнение */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Улучшения маршрута
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Общее расстояние</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 line-through">
                        {optimizationResult.improvements?.totalDistance.before?.toFixed(1) || 0} км
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {optimizationResult.improvements?.totalDistance.after?.toFixed(1) || 0} км
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Общее время</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 line-through">
                        {Math.round(optimizationResult.improvements?.totalTime.before || 0)} мин
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {Math.round(optimizationResult.improvements?.totalTime.after || 0)} мин
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Остановок переупорядочено</span>
                    <span className="text-sm font-bold text-blue-600">
                      {optimizationResult.improvements?.stopsReordered || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Прирост эффективности</span>
                    <span className="text-sm font-bold text-purple-600">
                      +{optimizationResult.improvements?.efficiencyGain || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Список остановок */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Новый порядок остановок
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {optimizationResult.optimized_route?.map((stop: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {stop.name || stop.address}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {stop.type === 'delivery' ? '📦 Доставка' : '📥 Забор'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
              <button
                onClick={handleRejectOptimization}
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Отклонить
              </button>
              <button
                onClick={handleApplyOptimization}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 shadow-lg hover:shadow-xl font-medium flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Применить оптимизацию</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Прогресс оптимизации (overlay поверх карты) */}
      {optimizationProgress.isOptimizing && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
                <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Оптимизация маршрута
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {optimizationProgress.currentMetric}
              </p>
            </div>

            {/* Прогресс-бар */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Прогресс
                </span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {optimizationProgress.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                  style={{ width: `${optimizationProgress.progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Оставшееся время */}
            <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4 mr-2" />
              <span>
                Осталось примерно {optimizationProgress.estimatedTimeRemaining} сек
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Информационная панель */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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

          {/* Потерянное время */}
          {totalTimeLost > 0 && (
            <div className="text-center bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
              <div className="flex items-center justify-center mb-1">
                <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                  Потеряно
                </span>
              </div>
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                +{totalTimeLost} мин
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">
                ({delays.length} задержек)
              </div>
            </div>
          )}

          {/* Сэкономленное время */}
          {totalTimeSaved > 0 && (
            <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
              <div className="flex items-center justify-center mb-1">
                <Zap className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  Сэкономлено
                </span>
              </div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                -{totalTimeSaved} мин
              </div>
            </div>
          )}

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

        {/* Последние события (задержки) */}
        {delays.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
              Последние задержки
            </h4>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {delays.slice(-5).reverse().map((delay, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs p-2 bg-white dark:bg-gray-800 rounded"
                >
                  <span className="text-gray-600 dark:text-gray-400">{delay.reason}</span>
                  <span className="text-red-600 dark:text-red-400 font-bold">
                    +{delay.time} мин
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationMap;