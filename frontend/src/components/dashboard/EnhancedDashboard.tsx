import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  Package,
  Users,
  TrendingUp,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Activity,
  DollarSign,
} from 'lucide-react';
import {
  AnimatedLineChart,
  AnimatedAreaChart,
  AnimatedBarChart,
  AnimatedPieChart,
  AnimatedRadarChart,
  AnimatedStatCard,
} from '../charts/EnhancedCharts';
import { EnhancedYandexMap } from '../maps/EnhancedYandexMap';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';

interface DashboardStats {
  totalRoutes: number;
  activeRoutes: number;
  completedToday: number;
  totalOrders: number;
  deliveredOrders: number;
  activeDrivers: number;
  totalDrivers: number;
  activeVehicles: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
  totalDistance: number;
  fuelConsumption: number;
}

export const EnhancedDashboard: React.FC = () => {
  // Fetch данных
  const { data: stats, isLoading: statsLoading } = useOptimizedQuery<DashboardStats>(
    'dashboard-stats',
    () => fetch('/api/v1/monitoring/stats').then(res => res.json()),
    {
      refetchInterval: 30000, // Обновление каждые 30 секунд
      cacheTime: 60000,
    }
  );

  const { data: routesData } = useOptimizedQuery(
    'active-routes',
    () => fetch('/api/v1/routes?status=in_progress').then(res => res.json()),
    {
      refetchInterval: 10000, // Обновление каждые 10 секунд
    }
  );

  // Демо данные для графиков (замените на реальные данные из API)
  const deliveryTrendData = [
    { name: 'Пн', delivered: 45, planned: 50, optimized: 48 },
    { name: 'Вт', delivered: 52, planned: 55, optimized: 54 },
    { name: 'Ср', delivered: 48, planned: 50, optimized: 49 },
    { name: 'Чт', delivered: 61, planned: 60, optimized: 62 },
    { name: 'Пт', delivered: 55, planned: 58, optimized: 57 },
    { name: 'Сб', delivered: 38, planned: 40, optimized: 39 },
    { name: 'Вс', delivered: 32, planned: 35, optimized: 33 },
  ];

  const performanceData = [
    { name: 'Скорость', value: 85 },
    { name: 'Точность', value: 92 },
    { name: 'Эффективность', value: 88 },
    { name: 'Экономия топлива', value: 78 },
    { name: 'Удовл. клиентов', value: 95 },
  ];

  const routeDistributionData = [
    { name: 'Завершено', value: stats?.completedToday || 0 },
    { name: 'В процессе', value: stats?.activeRoutes || 0 },
    { name: 'Ожидает', value: (stats?.totalRoutes || 0) - (stats?.completedToday || 0) - (stats?.activeRoutes || 0) },
  ];

  const hourlyDeliveriesData = [
    { name: '08:00', deliveries: 5 },
    { name: '09:00', deliveries: 12 },
    { name: '10:00', deliveries: 18 },
    { name: '11:00', deliveries: 22 },
    { name: '12:00', deliveries: 25 },
    { name: '13:00', deliveries: 20 },
    { name: '14:00', deliveries: 28 },
    { name: '15:00', deliveries: 24 },
    { name: '16:00', deliveries: 19 },
    { name: '17:00', deliveries: 15 },
    { name: '18:00', deliveries: 10 },
  ];

  const driverPerformanceData = [
    { name: 'Иванов И.', deliveries: 45, onTime: 42 },
    { name: 'Петров П.', deliveries: 38, onTime: 36 },
    { name: 'Сидоров С.', deliveries: 52, onTime: 50 },
    { name: 'Козлов К.', deliveries: 41, onTime: 39 },
    { name: 'Новиков Н.', deliveries: 35, onTime: 33 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Панель управления VRPTW
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Мониторинг и аналитика системы оптимизации маршрутов
            </p>
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-blue-500"
          >
            <Activity className="w-8 h-8" />
          </motion.div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedStatCard
            title="Всего маршрутов"
            value={stats?.totalRoutes || 0}
            subtitle="Сегодня"
            icon={<MapPin className="w-5 h-5" />}
            trend="up"
            trendValue="+12%"
            color="primary"
          />
          <AnimatedStatCard
            title="Активные доставки"
            value={stats?.activeRoutes || 0}
            subtitle="В процессе"
            icon={<Truck className="w-5 h-5" />}
            trend="up"
            trendValue="+8%"
            color="info"
          />
          <AnimatedStatCard
            title="Доставлено заказов"
            value={`${stats?.deliveredOrders || 0}/${stats?.totalOrders || 0}`}
            subtitle="Завершено сегодня"
            icon={<Package className="w-5 h-5" />}
            trend="up"
            trendValue="+15%"
            color="success"
          />
          <AnimatedStatCard
            title="Активные водители"
            value={`${stats?.activeDrivers || 0}/${stats?.totalDrivers || 0}`}
            subtitle="На маршрутах"
            icon={<Users className="w-5 h-5" />}
            trend="neutral"
            trendValue="0%"
            color="warning"
          />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedStatCard
            title="Среднее время доставки"
            value={`${stats?.averageDeliveryTime || 0} мин`}
            subtitle="Per delivery"
            icon={<Clock className="w-5 h-5" />}
            trend="down"
            trendValue="-5%"
            color="success"
          />
          <AnimatedStatCard
            title="Доставка вовремя"
            value={`${stats?.onTimeDeliveryRate || 0}%`}
            subtitle="On-time rate"
            icon={<CheckCircle2 className="w-5 h-5" />}
            trend="up"
            trendValue="+3%"
            color="success"
          />
          <AnimatedStatCard
            title="Пройдено"
            value={`${stats?.totalDistance || 0} км`}
            subtitle="Общее расстояние"
            icon={<TrendingUp className="w-5 h-5" />}
            trend="up"
            trendValue="+18%"
            color="info"
          />
          <AnimatedStatCard
            title="Расход топлива"
            value={`${stats?.fuelConsumption || 0} л`}
            subtitle="Сегодня"
            icon={<DollarSign className="w-5 h-5" />}
            trend="down"
            trendValue="-7%"
            color="success"
          />
        </div>

        {/* Map and Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            style={{ height: '500px' }}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                Активные маршруты в реальном времени
              </h3>
            </div>
            <div className="h-[calc(100%-60px)]">
              <EnhancedYandexMap
                routes={routesData?.routes || []}
                showTraffic={true}
                showDriverLocation={true}
                realTimeUpdates={true}
              />
            </div>
          </motion.div>

          {/* Performance Radar */}
          <div className="space-y-6">
            <AnimatedRadarChart
              data={performanceData}
              title="Показатели эффективности"
              height={240}
            />
            <AnimatedPieChart
              data={routeDistributionData}
              title="Распределение маршрутов"
              height={220}
            />
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatedLineChart
            data={deliveryTrendData}
            dataKeys={['delivered', 'planned', 'optimized']}
            title="Тренд доставок по дням"
            height={300}
          />
          <AnimatedAreaChart
            data={hourlyDeliveriesData}
            dataKeys={['deliveries']}
            title="Доставки по часам"
            height={300}
          />
        </div>

        {/* Driver Performance */}
        <AnimatedBarChart
          data={driverPerformanceData}
          dataKeys={['deliveries', 'onTime']}
          title="Производительность водителей"
          height={300}
          horizontal={true}
        />

        {/* Real-time Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Активность в реальном времени
          </h3>
          <div className="space-y-3">
            {[
              { type: 'success', message: 'Заказ #1234 доставлен вовремя', time: '2 мин назад' },
              { type: 'info', message: 'Маршрут #5 оптимизирован', time: '5 мин назад' },
              { type: 'warning', message: 'Водитель Иванов И. в пробке (+10 мин)', time: '7 мин назад' },
              { type: 'success', message: 'Заказ #1235 доставлен', time: '12 мин назад' },
              { type: 'info', message: 'Новый маршрут создан', time: '15 мин назад' },
            ].map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <div className={`
                  w-2 h-2 rounded-full mt-2 flex-shrink-0
                  ${activity.type === 'success' ? 'bg-green-500' : 
                    activity.type === 'warning' ? 'bg-yellow-500' : 
                    'bg-blue-500'}
                `} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {activity.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default EnhancedDashboard;
