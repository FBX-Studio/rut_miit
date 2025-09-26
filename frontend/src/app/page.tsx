'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, Clock, TrendingUp, MapPin, AlertTriangle } from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';
import dynamic from 'next/dynamic';
import { ActiveRoutes } from '@/components/routes/ActiveRoutes';
import { RecentEvents } from '@/components/events/RecentEvents';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { RouteOptimizationModal } from '@/components/modals/RouteOptimizationModal';
import { DriverManagementModal } from '@/components/modals/DriverManagementModal';
import { AnalyticsModal } from '@/components/modals/AnalyticsModal';
import { useWebSocket, useRouteUpdates, useEventNotifications } from '@/contexts/WebSocketContext';
import { useNotifications, useRouteNotifications } from '@/contexts/NotificationContext';
import { useSystemStats } from '@/hooks/useSystemStats';
import useSWR from 'swr';
import { Toaster } from 'react-hot-toast';

// Dynamically import RouteMap to avoid SSR issues
const RouteMap = dynamic(() => import('@/components/maps/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Загрузка карты...</p>
      </div>
    </div>
  ),
});

const Dashboard = () => {
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [routeModalMode, setRouteModalMode] = useState<'create' | 'optimize'>('create');
  const { isConnected } = useWebSocket();
  const { stats, isLoading, error, refetch } = useSystemStats();

  useEffect(() => {
    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium mb-2">
               Не удалось загрузить данные панели управления
             </div>
             <p className="text-gray-600 mb-4">{error.message}</p>
             <button
               onClick={() => refetch()}
               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
             >
               Повторить
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
               Панель управления оптимизацией маршрутов
             </h1>
             <p className="text-gray-600 dark:text-gray-400 mt-1">
               Мониторинг и управление маршрутами доставки в реальном времени
             </p>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? 'Подключено' : 'Отключено'}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Всего маршрутов"
            value={stats?.total_routes || 0}
            icon={MapPin}
            change={{ value: 12, type: 'increase', period: 'за прошлый месяц' }}
            className="bg-white dark:bg-gray-800"
          />
          <StatsCard
            title="Активные доставки"
            value={stats?.active_routes || 0}
            icon={Truck}
            change={{ value: 8, type: 'increase', period: 'за прошлый месяц' }}
            className="bg-white dark:bg-gray-800"
          />
          <StatsCard
            title="Ожидающие заказы"
            value={stats?.pending_orders || 0}
            icon={Package}
            change={{ value: 5, type: 'decrease', period: 'за прошлый месяц' }}
            className="bg-white dark:bg-gray-800"
          />
          <StatsCard
            title="Доставка в срок"
            value={`${stats?.on_time_delivery_rate || 0}%`}
            icon={Clock}
            change={{ value: 3, type: 'increase', period: 'за прошлый месяц' }}
            className="bg-white dark:bg-gray-800"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Карта маршрутов в реальном времени
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  Полноэкранный режим
                </button>
              </div>
              <RouteMap
                routes={[]}
                selectedRouteId={selectedRouteId ?? undefined}
                onRouteSelect={setSelectedRouteId}
                className="h-96"
              />
            </div>
          </div>

          {/* Active Routes */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Активные маршруты
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  Показать все
                </button>
              </div>
              <ActiveRoutes
                onRouteSelect={setSelectedRouteId}
                selectedRouteId={selectedRouteId}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Последние события
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  Показать все
                </button>
              </div>
              <RecentEvents maxEvents={5} />
            </div>
          </div>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Производительность доставки
              </h2>
              <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>Последние 7 дней</option>
                <option>Последние 30 дней</option>
                <option>Последние 90 дней</option>
              </select>
            </div>
            <PerformanceChart
              data={[]}
              timeRange="7d"
              className="h-64"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Эффективность маршрутов
              </h2>
              <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>Последние 7 дней</option>
                <option>Последние 30 дней</option>
                <option>Последние 90 дней</option>
              </select>
            </div>
            <PerformanceChart
              data={[]}
              timeRange="7d"
              className="h-64"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Быстрые действия
          </h2>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => {
                setRouteModalMode('create');
                setShowRouteModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Создать новый маршрут
            </button>
            <button 
              onClick={() => {
                setRouteModalMode('optimize');
                setShowRouteModal(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Оптимизировать маршруты
            </button>
            <button 
              onClick={() => setShowDriverModal(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Управление водителями
            </button>
            <button 
              onClick={() => setShowAnalyticsModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Просмотр аналитики
            </button>
          </div>
        </div>

        {/* Modals */}
        <RouteOptimizationModal
          isOpen={showRouteModal}
          onClose={() => setShowRouteModal(false)}
          mode={routeModalMode}
        />
        <DriverManagementModal
          isOpen={showDriverModal}
          onClose={() => setShowDriverModal(false)}
        />
        <AnalyticsModal
          isOpen={showAnalyticsModal}
          onClose={() => setShowAnalyticsModal(false)}
        />

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;