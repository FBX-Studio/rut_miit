'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, Package, CheckCircle, AlertTriangle, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TimeWindow {
  start: string;
  end: string;
}

interface OrderData {
  id: number;
  order_number: string;
  customer_name: string;
  delivery_address: string;
  delivery_date: string;
  current_time_window: TimeWindow;
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered';
  estimated_arrival?: string;
  driver_name?: string;
  vehicle_info?: string;
  special_instructions?: string;
  weight?: number;
  volume?: number;
}

interface CustomerPortalProps {
  customerId?: number;
  orderNumber?: string;
  onTimeWindowUpdate?: (orderId: number, timeWindow: TimeWindow) => void;
  className?: string;
}

export const CustomerPortal = ({
  customerId,
  orderNumber,
  onTimeWindowUpdate,
  className = ''
}: CustomerPortalProps) => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [newTimeWindow, setNewTimeWindow] = useState<TimeWindow>({ start: '', end: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState(orderNumber || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customerId || orderNumber) {
      fetchOrders();
    }
  }, [customerId, orderNumber]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (customerId) params.append('customer_id', customerId.toString());
      if (orderNumber) params.append('order_number', orderNumber);

      const response = await fetch(`/api/v1/customer/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
        if (data.length === 1) {
          setSelectedOrder(data[0]);
          setNewTimeWindow(data[0].current_time_window);
        }
      } else {
        toast.error('Не удалось загрузить заказы');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Ошибка при загрузке заказов');
    } finally {
      setLoading(false);
    }
  };

  const searchOrder = async () => {
    if (!searchQuery.trim()) {
      toast.error('Введите номер заказа');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/customer/orders/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setOrders(data);
          if (data.length === 1) {
            setSelectedOrder(data[0]);
            setNewTimeWindow(data[0].current_time_window);
          }
        } else {
          toast.error('Заказ не найден');
        }
      } else {
        toast.error('Заказ не найден');
      }
    } catch (error) {
      console.error('Error searching order:', error);
      toast.error('Ошибка поиска');
    } finally {
      setLoading(false);
    }
  };

  const updateTimeWindow = async () => {
    if (!selectedOrder) return;

    if (!newTimeWindow.start || !newTimeWindow.end) {
      toast.error('Укажите время начала и окончания');
      return;
    }

    if (new Date(newTimeWindow.start) >= new Date(newTimeWindow.end)) {
      toast.error('Время начала должно быть раньше времени окончания');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/v1/orders/${selectedOrder.id}/time-window`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          time_window_start: newTimeWindow.start,
          time_window_end: newTimeWindow.end,
          customer_verified: true
        }),
      });

      if (response.ok) {
        const updatedOrder = {
          ...selectedOrder,
          current_time_window: newTimeWindow
        };
        setSelectedOrder(updatedOrder);
        setOrders(orders.map(order => 
          order.id === selectedOrder.id ? updatedOrder : order
        ));
        
        onTimeWindowUpdate?.(selectedOrder.id, newTimeWindow);
        toast.success('Временное окно успешно обновлено');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Не удалось обновить временное окно');
      }
    } catch (error) {
      console.error('Error updating time window:', error);
      toast.error('Ошибка при обновлении временного окна');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'in_transit':
        return 'text-blue-600 bg-blue-100';
      case 'confirmed':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Доставлено';
      case 'in_transit':
        return 'В пути';
      case 'confirmed':
        return 'Подтверждено';
      case 'pending':
        return 'Ожидает';
      default:
        return status;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Портал клиента
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управляйте временными окнами доставки и отслеживайте заказы
          </p>
        </div>

        {}
        {!customerId && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Номер заказа
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Введите номер заказа"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && searchOrder()}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={searchOrder}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Поиск...' : 'Найти'}
                </button>
              </div>
            </div>
          </div>
        )}

        {}
        {orders.length > 1 && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Ваши заказы
            </h2>
            <div className="grid gap-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedOrder?.id === order.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedOrder(order);
                    setNewTimeWindow(order.current_time_window);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Заказ #{order.order_number}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.delivery_address}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {}
        {selectedOrder && (
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Информация о заказе
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Номер заказа</p>
                      <p className="font-medium text-gray-900 dark:text-white">#{selectedOrder.order_number}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Получатель</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.customer_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Адрес доставки</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.delivery_address}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Дата доставки</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedOrder.delivery_date).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>

                  {selectedOrder.estimated_arrival && (
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ожидаемое прибытие</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatDateTime(selectedOrder.estimated_arrival)}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedOrder.special_instructions && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Особые указания:</strong> {selectedOrder.special_instructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Временное окно доставки
                </h2>

                <div className="space-y-4">
                  {}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      Текущее временное окно
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatDateTime(selectedOrder.current_time_window.start)} - {formatDateTime(selectedOrder.current_time_window.end)}
                      </span>
                    </div>
                  </div>

                  {}
                  {selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed' ? (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Изменить временное окно
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Начало
                          </label>
                          <input
                            type="datetime-local"
                            value={newTimeWindow.start}
                            onChange={(e) => setNewTimeWindow({ ...newTimeWindow, start: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Окончание
                          </label>
                          <input
                            type="datetime-local"
                            value={newTimeWindow.end}
                            onChange={(e) => setNewTimeWindow({ ...newTimeWindow, end: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>

                      <button
                        onClick={updateTimeWindow}
                        disabled={isUpdating}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {isUpdating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Обновление...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            <span>Подтвердить изменения</span>
                          </>
                        )}
                      </button>

                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            Изменение временного окна может повлиять на маршрут доставки. 
                            Мы автоматически переоптимизируем маршруты для обеспечения своевременной доставки.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Временное окно нельзя изменить для заказов со статусом "{getStatusText(selectedOrder.status)}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {}
        {!loading && orders.length === 0 && searchQuery && (
          <div className="p-6 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Заказы не найдены
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Проверьте правильность номера заказа и попробуйте еще раз
            </p>
          </div>
        )}
      </div>
    </div>
  );
};