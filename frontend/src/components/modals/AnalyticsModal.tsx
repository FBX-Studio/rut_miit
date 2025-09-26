'use client';

import { useState, useEffect } from 'react';
import { X, BarChart3, TrendingUp, Users, Truck, Package, Clock, MapPin, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AnalyticsData {
  total_orders: number;
  total_customers: number;
  total_drivers: number;
  total_vehicles: number;
  orders_by_status: {
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  drivers_by_status: {
    available: number;
    busy: number;
    offline: number;
  };
  vehicles_by_status: {
    available: number;
    in_use: number;
    maintenance: number;
  };
  api_metrics: {
    total_requests: number;
    avg_response_time: number;
    optimization_requests: number;
    avg_optimization_time: number;
  };
  performance_stats: {
    successful_deliveries: number;
    failed_deliveries: number;
    average_delivery_time: number;
    customer_satisfaction: number;
  };
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/monitoring/metrics');
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
        setLastUpdated(new Date());
      } else {
        toast.error('Ошибка загрузки аналитики');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }: {
    title: string;
    value: string | number;
    icon: any;
    color?: string;
    subtitle?: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  const StatusBreakdown = ({ title, data, colors }: {
    title: string;
    data: Record<string, number>;
    colors: Record<string, string>;
  }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {data && Object.entries(data).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${colors[status] || 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {status === 'in_progress' ? 'В процессе' :
                 status === 'pending' ? 'Ожидает' :
                 status === 'completed' ? 'Завершено' :
                 status === 'cancelled' ? 'Отменено' :
                 status === 'available' ? 'Доступен' :
                 status === 'busy' ? 'Занят' :
                 status === 'offline' ? 'Не в сети' :
                 status === 'in_use' ? 'Используется' :
                 status === 'maintenance' ? 'Обслуживание' :
                 status}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Аналитика и статистика
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Загрузка аналитики...</p>
            </div>
          )}

          {data && !loading && (
            <>
              {/* Last Updated */}
              {lastUpdated && (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Последнее обновление: {lastUpdated.toLocaleString('ru-RU')}
                </div>
              )}

              {/* Main Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Всего заказов"
                  value={data?.total_orders || 0}
                  icon={Package}
                  color="blue"
                />
                <StatCard
                  title="Клиенты"
                  value={data?.total_customers || 0}
                  icon={Users}
                  color="green"
                />
                <StatCard
                  title="Водители"
                  value={data?.total_drivers || 0}
                  icon={Users}
                  color="purple"
                />
                <StatCard
                  title="Транспорт"
                  value={data?.total_vehicles || 0}
                  icon={Truck}
                  color="orange"
                />
              </div>

              {/* Status Breakdowns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatusBreakdown
                  title="Заказы по статусам"
                  data={data?.orders_by_status || {}}
                  colors={{
                    pending: 'bg-yellow-400',
                    in_progress: 'bg-blue-400',
                    completed: 'bg-green-400',
                    cancelled: 'bg-red-400'
                  }}
                />
                <StatusBreakdown
                  title="Водители по статусам"
                  data={data?.drivers_by_status || {}}
                  colors={{
                    available: 'bg-green-400',
                    busy: 'bg-yellow-400',
                    offline: 'bg-gray-400'
                  }}
                />
                <StatusBreakdown
                  title="Транспорт по статусам"
                  data={data?.vehicles_by_status || {}}
                  colors={{
                    available: 'bg-green-400',
                    in_use: 'bg-blue-400',
                    maintenance: 'bg-red-400'
                  }}
                />
              </div>

              {/* API Metrics */}
              {data?.api_metrics && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Метрики API
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{data.api_metrics?.total_requests || 0}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Всего запросов</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{data.api_metrics?.avg_response_time || 0}мс</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Среднее время ответа</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{data.api_metrics?.optimization_requests || 0}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Оптимизаций</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{data.api_metrics?.avg_optimization_time || 0}с</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Время оптимизации</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Stats */}
              {data?.performance_stats && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Показатели эффективности
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{data.performance_stats?.successful_deliveries || 0}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Успешных доставок</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{data.performance_stats?.failed_deliveries || 0}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Неудачных доставок</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{data.performance_stats?.average_delivery_time || 0}мин</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Среднее время доставки</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{data.performance_stats?.customer_satisfaction || 0}/5</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Удовлетворенность клиентов</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Быстрые действия
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      window.open('/api/v1/monitoring/dashboard', '_blank');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Открыть мониторинг
                  </button>
                  <button
                    onClick={() => {
                      // Export data functionality (placeholder)
                      toast('Функция экспорта в разработке');
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Экспорт данных
                  </button>
                  <button
                    onClick={() => {
                      // Generate report functionality (placeholder)
                      toast('Функция генерации отчетов в разработке');
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Создать отчет
                  </button>
                </div>
              </div>
            </>
          )}

          {!loading && !data && (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Не удалось загрузить данные аналитики</p>
              <button
                onClick={fetchAnalytics}
                className="mt-2 text-blue-600 hover:text-blue-700"
              >
                Попробовать снова
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};