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

  const StatCard = ({ title, value, icon: Icon, color = 'indigo', subtitle }: {
    title: string;
    value: string | number;
    icon: any;
    color?: string;
    subtitle?: string;
  }) => {
    const colorClasses = {
      indigo: {
        gradient: 'from-indigo-500 to-indigo-600',
        shadow: 'shadow-[0_0_20px_rgba(99,102,241,0.3)]',
        iconBg: 'bg-indigo-500/20',
        iconColor: 'text-indigo-400'
      },
      purple: {
        gradient: 'from-purple-500 to-purple-600',
        shadow: 'shadow-[0_0_20px_rgba(139,92,246,0.3)]',
        iconBg: 'bg-purple-500/20',
        iconColor: 'text-purple-400'
      },
      blue: {
        gradient: 'from-blue-500 to-blue-600',
        shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
        iconBg: 'bg-blue-500/20',
        iconColor: 'text-blue-400'
      },
      green: {
        gradient: 'from-green-500 to-green-600',
        shadow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
        iconBg: 'bg-green-500/20',
        iconColor: 'text-green-400'
      }
    };
    const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.indigo;

    return (
      <div className={`relative bg-gray-900/50 backdrop-blur-sm p-5 rounded-2xl border border-${color}-500/20 ${colors.shadow} hover:border-${color}-500/40 transition-all duration-300 group`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-400 mb-2">{title}</p>
            <p className={`text-3xl font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-4 rounded-xl ${colors.iconBg} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-7 w-7 ${colors.iconColor}`} />
          </div>
        </div>
      </div>
    );
  };

  const StatusBreakdown = ({ title, data, colors }: {
    title: string;
    data: Record<string, number>;
    colors: Record<string, string>;
  }) => (
    <div className="bg-gray-900/50 backdrop-blur-sm p-5 rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:border-indigo-500/40 transition-all duration-300">
      <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">{title}</h3>
      <div className="space-y-3">
        {data && Object.entries(data).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between group hover:bg-white/5 p-2 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${colors[status] || 'bg-gray-400'} shadow-[0_0_8px_currentColor]`}></div>
              <span className="text-sm text-gray-300 capitalize">
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
            <span className="text-sm font-bold text-white">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950/30 rounded-2xl shadow-[0_0_60px_rgba(99,102,241,0.3)] border border-indigo-500/20 max-w-7xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {}
        <div className="flex items-center justify-between p-6 border-b border-indigo-500/20 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20">
              <BarChart3 className="h-6 w-6 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Аналитика и статистика
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 flex items-center disabled:opacity-50 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Загрузка аналитики...</p>
            </div>
          )}

          {data && !loading && (
            <>
              {}
              {lastUpdated && (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Последнее обновление: {lastUpdated.toLocaleString('ru-RU')}
                </div>
              )}

              {}
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

              {}
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

              {}
              {data?.api_metrics && (
                <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-6 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-indigo-400" />
                    Метрики API
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">{data.api_metrics?.total_requests || 0}</p>
                      <p className="text-sm text-gray-400 mt-2">Всего запросов</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">{data.api_metrics?.avg_response_time || 0}мс</p>
                      <p className="text-sm text-gray-400 mt-2">Среднее время ответа</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">{data.api_metrics?.optimization_requests || 0}</p>
                      <p className="text-sm text-gray-400 mt-2">Оптимизаций</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <p className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">{data.api_metrics?.avg_optimization_time || 0}с</p>
                      <p className="text-sm text-gray-400 mt-2">Время оптимизации</p>
                    </div>
                  </div>
                </div>
              )}

              {}
              {data?.performance_stats && (
                <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-purple-400" />
                    Показатели эффективности
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">{data.performance_stats?.successful_deliveries || 0}</p>
                      <p className="text-sm text-gray-400 mt-2">Успешных доставок</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <p className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">{data.performance_stats?.failed_deliveries || 0}</p>
                      <p className="text-sm text-gray-400 mt-2">Неудачных доставок</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">{data.performance_stats?.average_delivery_time || 0}мин</p>
                      <p className="text-sm text-gray-400 mt-2">Среднее время доставки</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <p className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">{data.performance_stats?.customer_satisfaction || 0}/5</p>
                      <p className="text-sm text-gray-400 mt-2">Удовлетворенность клиентов</p>
                    </div>
                  </div>
                </div>
              )}

              {}
              <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  Быстрые действия
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      window.open('/api/v1/monitoring/dashboard', '_blank');
                    }}
                    className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 flex items-center shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:scale-105"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Открыть мониторинг
                  </button>
                  <button
                    onClick={() => {
                      toast('Функция экспорта в разработке');
                    }}
                    className="px-5 py-3 border border-indigo-500/30 text-gray-300 rounded-xl hover:bg-white/5 hover:border-indigo-500/50 transition-all duration-300 hover:scale-105"
                  >
                    Экспорт данных
                  </button>
                  <button
                    onClick={() => {
                      toast('Функция генерации отчетов в разработке');
                    }}
                    className="px-5 py-3 border border-purple-500/30 text-gray-300 rounded-xl hover:bg-white/5 hover:border-purple-500/50 transition-all duration-300 hover:scale-105"
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