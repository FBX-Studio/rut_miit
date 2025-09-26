'use client';

import { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Phone, 
  CheckCircle, 
  AlertTriangle, 
  Truck, 
  Package,
  Route,
  Play,
  Pause,
  RotateCcw,
  MessageSquare,
  Battery,
  Signal
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RouteStop {
  id: number;
  order_id: number;
  customer_name: string;
  delivery_address: string;
  phone: string;
  time_window_start: string;
  time_window_end: string;
  estimated_arrival: string;
  actual_arrival?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  special_instructions?: string;
  packages_count: number;
  weight: number;
  sequence_number: number;
}

interface DriverRoute {
  id: number;
  route_name: string;
  driver_id: number;
  vehicle_id: number;
  status: 'pending' | 'active' | 'completed' | 'paused';
  total_stops: number;
  completed_stops: number;
  estimated_duration: number;
  actual_start_time?: string;
  estimated_completion?: string;
  stops: RouteStop[];
}

interface DriverInfo {
  id: number;
  name: string;
  phone: string;
  license_number: string;
  experience_years: number;
  vehicle: {
    id: number;
    license_plate: string;
    model: string;
    capacity: number;
  };
}

interface DriverAppProps {
  driverId: number;
  className?: string;
}

export const DriverApp = ({ driverId, className = '' }: DriverAppProps) => {
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [currentRoute, setCurrentRoute] = useState<DriverRoute | null>(null);
  const [currentStop, setCurrentStop] = useState<RouteStop | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  // Initialize app
  useEffect(() => {
    fetchDriverData();
    startLocationTracking();
    checkBatteryStatus();
    
    // Network status monitoring
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [driverId]);

  const fetchDriverData = async () => {
    try {
      const [driverResponse, routeResponse] = await Promise.all([
        fetch(`/api/v1/drivers/${driverId}`),
        fetch(`/api/v1/drivers/${driverId}/current-route`)
      ]);

      if (driverResponse.ok) {
        const driverData = await driverResponse.json();
        setDriver(driverData);
      }

      if (routeResponse.ok) {
        const routeData = await routeResponse.json();
        setCurrentRoute(routeData);
        
        // Find current stop
        const activeStop = routeData.stops.find((stop: RouteStop) => 
          stop.status === 'in_progress'
        );
        const nextStop = routeData.stops.find((stop: RouteStop) => 
          stop.status === 'pending'
        );
        
        setCurrentStop(activeStop || nextStop || null);
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = () => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(newLocation);
          
          // Send location to server
          sendLocationUpdate(newLocation);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Не удалось получить местоположение');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
    
    return undefined;
  };

  const checkBatteryStatus = async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        setBatteryLevel(Math.round(battery.level * 100));
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      } catch (error) {
        console.error('Battery API not supported');
      }
    }
  };

  const sendLocationUpdate = async (location: { lat: number; lng: number }) => {
    if (!isOnline || !currentRoute) return;

    try {
      await fetch(`/api/v1/drivers/${driverId}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route_id: currentRoute.id,
          latitude: location.lat,
          longitude: location.lng,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Error sending location update:', error);
    }
  };

  const startRoute = async () => {
    if (!currentRoute) return;

    try {
      const response = await fetch(`/api/v1/routes/${currentRoute.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driver_id: driverId,
          start_time: new Date().toISOString(),
          location: location
        }),
      });

      if (response.ok) {
        const updatedRoute = await response.json();
        setCurrentRoute(updatedRoute);
        toast.success('Маршрут начат');
      } else {
        toast.error('Не удалось начать маршрут');
      }
    } catch (error) {
      console.error('Error starting route:', error);
      toast.error('Ошибка при начале маршрута');
    }
  };

  const pauseRoute = async () => {
    if (!currentRoute) return;

    try {
      const response = await fetch(`/api/v1/routes/${currentRoute.id}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driver_id: driverId,
          pause_time: new Date().toISOString(),
          location: location
        }),
      });

      if (response.ok) {
        const updatedRoute = await response.json();
        setCurrentRoute(updatedRoute);
        toast.success('Маршрут приостановлен');
      } else {
        toast.error('Не удалось приостановить маршрут');
      }
    } catch (error) {
      console.error('Error pausing route:', error);
      toast.error('Ошибка при приостановке маршрута');
    }
  };

  const arriveAtStop = async () => {
    if (!currentStop || !currentRoute) return;

    try {
      const response = await fetch(`/api/v1/route-stops/${currentStop.id}/arrive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          arrival_time: new Date().toISOString(),
          location: location
        }),
      });

      if (response.ok) {
        const updatedStop = await response.json();
        setCurrentStop({ ...currentStop, ...updatedStop });
        toast.success('Прибытие зафиксировано');
      } else {
        toast.error('Не удалось зафиксировать прибытие');
      }
    } catch (error) {
      console.error('Error marking arrival:', error);
      toast.error('Ошибка при фиксации прибытия');
    }
  };

  const completeStop = async (success: boolean, notes?: string) => {
    if (!currentStop || !currentRoute) return;

    try {
      const response = await fetch(`/api/v1/route-stops/${currentStop.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completion_time: new Date().toISOString(),
          success: success,
          notes: notes,
          location: location
        }),
      });

      if (response.ok) {
        // Move to next stop
        const nextStopIndex = currentRoute.stops.findIndex(stop => stop.id === currentStop.id) + 1;
        const nextStop = nextStopIndex < currentRoute.stops.length ? currentRoute.stops[nextStopIndex] : null;
        
        setCurrentStop(nextStop);
        toast.success(success ? 'Доставка завершена' : 'Остановка отмечена как неуспешная');
        
        // Refresh route data
        fetchDriverData();
      } else {
        toast.error('Не удалось завершить остановку');
      }
    } catch (error) {
      console.error('Error completing stop:', error);
      toast.error('Ошибка при завершении остановки');
    }
  };

  const openNavigation = () => {
    if (!currentStop) return;

    const address = encodeURIComponent(currentStop.delivery_address);
    const url = `https://yandex.ru/maps/?text=${address}&rtext=~${address}`;
    window.open(url, '_blank');
  };

  const callCustomer = () => {
    if (!currentStop) return;
    window.location.href = `tel:${currentStop.phone}`;
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Завершено';
      case 'in_progress':
        return 'В процессе';
      case 'failed':
        return 'Неуспешно';
      case 'pending':
        return 'Ожидает';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Status Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Truck className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">
                {driver?.name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {driver?.vehicle.license_plate} • {driver?.vehicle.model}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Battery Level */}
            {batteryLevel !== null && (
              <div className="flex items-center space-x-1">
                <Battery className={`h-4 w-4 ${batteryLevel < 20 ? 'text-red-500' : 'text-gray-400'}`} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{batteryLevel}%</span>
              </div>
            )}
            
            {/* Network Status */}
            <div className="flex items-center space-x-1">
              <Signal className={`h-4 w-4 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {isOnline ? 'Онлайн' : 'Офлайн'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Route Overview */}
      {currentRoute && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {currentRoute.route_name}
            </h2>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(currentRoute.status)}`}>
              {getStatusText(currentRoute.status)}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{currentRoute.completed_stops}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Завершено</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentRoute.total_stops}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Всего остановок</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {Math.round((currentRoute.completed_stops / currentRoute.total_stops) * 100)}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Прогресс</p>
            </div>
          </div>

          {/* Route Controls */}
          <div className="flex space-x-2 mt-4">
            {currentRoute.status === 'pending' && (
              <button
                onClick={startRoute}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Начать маршрут</span>
              </button>
            )}
            
            {currentRoute.status === 'active' && (
              <button
                onClick={pauseRoute}
                className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
              >
                <Pause className="h-4 w-4" />
                <span>Приостановить</span>
              </button>
            )}
            
            {currentRoute.status === 'paused' && (
              <button
                onClick={startRoute}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Продолжить</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Current Stop */}
      {currentStop && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Текущая остановка #{currentStop.sequence_number}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(currentStop.status)}`}>
              {getStatusText(currentStop.status)}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{currentStop.customer_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{currentStop.delivery_address}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Временное окно</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatTime(currentStop.time_window_start)} - {formatTime(currentStop.time_window_end)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Груз</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {currentStop.packages_count} мест, {currentStop.weight} кг
                </p>
              </div>
            </div>

            {currentStop.special_instructions && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Особые указания:</strong> {currentStop.special_instructions}
                </p>
              </div>
            )}
          </div>

          {/* Stop Actions */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={openNavigation}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
            >
              <Navigation className="h-4 w-4" />
              <span>Навигация</span>
            </button>
            
            <button
              onClick={callCustomer}
              className="bg-green-600 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
            >
              <Phone className="h-4 w-4" />
              <span>Позвонить</span>
            </button>
          </div>

          {/* Delivery Actions */}
          {currentStop.status === 'pending' && (
            <button
              onClick={arriveAtStop}
              className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg font-medium mt-2 flex items-center justify-center space-x-2"
            >
              <MapPin className="h-4 w-4" />
              <span>Прибыл на место</span>
            </button>
          )}

          {currentStop.status === 'in_progress' && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => completeStop(true)}
                className="bg-green-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Доставлено</span>
              </button>
              
              <button
                onClick={() => completeStop(false, 'Клиент отсутствует')}
                className="bg-red-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Не доставлено</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upcoming Stops */}
      {currentRoute && currentRoute.stops.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Следующие остановки
          </h3>
          
          <div className="space-y-3">
            {currentRoute.stops
              .filter(stop => stop.status === 'pending' && stop.id !== currentStop?.id)
              .slice(0, 3)
              .map((stop, index) => (
                <div key={stop.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {stop.sequence_number}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {stop.customer_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {stop.delivery_address}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {formatTime(stop.time_window_start)} - {formatTime(stop.time_window_end)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* No Route */}
      {!currentRoute && (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Route className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Нет активного маршрута
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Ожидайте назначения маршрута от диспетчера
          </p>
          <button
            onClick={fetchDriverData}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Обновить</span>
          </button>
        </div>
      )}
    </div>
  );
};