'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Truck, User, Calendar, Clock, Settings, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RouteOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'optimize';
}

interface OptimizationRequest {
  order_ids: number[];
  vehicle_ids: number[];
  driver_ids: number[];
  depot_location: [number, number];
  planned_date?: string;
  time_limit_seconds?: number;
  enable_adaptive_monitoring: boolean;
}

export const RouteOptimizationModal: React.FC<RouteOptimizationModalProps> = ({
  isOpen,
  onClose,
  mode
}) => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<number[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [depotLocation, setDepotLocation] = useState<[number, number]>([55.7558, 37.6176]);
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeLimit, setTimeLimit] = useState(300);
  const [adaptiveMonitoring, setAdaptiveMonitoring] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [ordersRes, vehiclesRes, driversRes] = await Promise.all([
        fetch('/api/v1/orders'),
        fetch('/api/v1/vehicles'),
        fetch('/api/v1/drivers/')
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.filter((order: any) => order.status === 'pending'));
      }

      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json();
        setVehicles(vehiclesData.filter((vehicle: any) => vehicle.status === 'available'));
      }

      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDrivers(driversData.filter((driver: any) => driver.status === 'available'));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Выберите хотя бы один заказ');
      return;
    }
    if (selectedVehicles.length === 0) {
      toast.error('Выберите хотя бы один транспорт');
      return;
    }
    if (selectedDrivers.length === 0) {
      toast.error('Выберите хотя бы одного водителя');
      return;
    }

    try {
      setLoading(true);

      const request: OptimizationRequest = {
        order_ids: selectedOrders,
        vehicle_ids: selectedVehicles,
        driver_ids: selectedDrivers,
        depot_location: depotLocation,
        planned_date: plannedDate,
        time_limit_seconds: timeLimit,
        enable_adaptive_monitoring: adaptiveMonitoring
      };

      const response = await fetch('/api/routes/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Создано ${result.routes_created} оптимизированных маршрутов`);
        onClose();
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Ошибка оптимизации маршрутов');
      }
    } catch (error) {
      console.error('Error optimizing routes:', error);
      toast.error('Ошибка при оптимизации маршрутов');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Создать новый маршрут' : 'Оптимизировать маршруты'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Загрузка данных...</p>
            </div>
          )}

          {!loading && (
            <>
              {}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Выберите заказы ({orders.length} доступно)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  {orders.map((order) => (
                    <label key={order.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders([...selectedOrders, order.id]);
                          } else {
                            setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Заказ #{order.id} - {order.customer_name || 'Клиент'} ({order.delivery_address})
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedOrders(orders.map(o => o.id))}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Выбрать все
                </button>
              </div>

              {}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Выберите транспорт ({vehicles.length} доступно)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  {vehicles.map((vehicle) => (
                    <label key={vehicle.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedVehicles.includes(vehicle.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVehicles([...selectedVehicles, vehicle.id]);
                          } else {
                            setSelectedVehicles(selectedVehicles.filter(id => id !== vehicle.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {vehicle.license_plate} - {vehicle.vehicle_type} (грузоподъемность: {vehicle.capacity_kg}кг)
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedVehicles(vehicles.map(v => v.id))}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Выбрать все
                </button>
              </div>

              {}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Выберите водителей ({drivers.length} доступно)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  {drivers.map((driver) => (
                    <label key={driver.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDrivers.includes(driver.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDrivers([...selectedDrivers, driver.id]);
                          } else {
                            setSelectedDrivers(selectedDrivers.filter(id => id !== driver.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {driver.full_name} - {driver.license_category} (рейтинг: {driver.rating}/5)
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedDrivers(drivers.map(d => d.id))}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Выбрать всех
                </button>
              </div>

              {}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Дата планирования
                  </label>
                  <input
                    type="date"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Лимит времени оптимизации (сек)
                  </label>
                  <input
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                    min="60"
                    max="1800"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adaptiveMonitoring}
                    onChange={(e) => setAdaptiveMonitoring(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <Settings className="h-4 w-4 inline mr-1" />
                    Включить адаптивный мониторинг маршрутов
                  </span>
                </label>
              </div>
            </>
          )}
        </div>

        {}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleOptimize}
            disabled={loading || selectedOrders.length === 0 || selectedVehicles.length === 0 || selectedDrivers.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Оптимизация...' : (mode === 'create' ? 'Создать маршруты' : 'Оптимизировать')}
          </button>
        </div>
      </div>
    </div>
  );
};