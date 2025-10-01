'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, Clock, TrendingUp, MapPin, AlertTriangle } from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';
import dynamic from 'next/dynamic';
import { ActiveRoutesBlock } from '@/components/dashboard/ActiveRoutesBlock';
import { RecentEventsBlock } from '@/components/dashboard/RecentEventsBlock';
import { DeliveryPerformanceBlock } from '@/components/dashboard/DeliveryPerformanceBlock';
import { RouteEfficiencyBlock } from '@/components/dashboard/RouteEfficiencyBlock';
import { RouteOptimizationModal } from '@/components/modals/RouteOptimizationModal';
import { DriverManagementModal } from '@/components/modals/DriverManagementModal';
import { AnalyticsModal } from '@/components/modals/AnalyticsModal';
import { useWebSocket, useRouteUpdates, useEventNotifications } from '@/contexts/WebSocketContext';
import { useNotifications, useRouteNotifications } from '@/contexts/NotificationContext';
import { useSystemStats } from '@/hooks/useSystemStats';
import useSWR from 'swr';
import SimulationLauncher from '@/components/dashboard/SimulationLauncher';
import { NavigationHeader } from '@/components/ui/NavigationHeader';
import { Toaster } from 'react-hot-toast';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20 dark:from-gray-900 dark:via-indigo-950/20 dark:to-purple-950/20">
      
      <NavigationHeader
        title="Маршруты"
        subtitle="Мониторинг доставки в реальном времени"
        actions={
          <div className="flex items-center space-x-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {isConnected ? 'В сети' : 'Не в сети'}
            </span>
          </div>
        }
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12">
        {/* Stats Cards - Minimalist Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <StatsCard
            title="Маршруты"
            value={stats?.total_routes || 0}
            icon={MapPin}
            change={{ value: 12, type: 'increase', period: 'за месяц' }}
            className="card-minimal"
          />
          <StatsCard
            title="Активные"
            value={stats?.active_routes || 0}
            icon={Truck}
            change={{ value: 8, type: 'increase', period: 'за месяц' }}
            className="card-minimal animate-pulse-subtle"
          />
          <StatsCard
            title="В ожидании"
            value={stats?.pending_orders || 0}
            icon={Package}
            change={{ value: 5, type: 'decrease', period: 'за месяц' }}
            className="card-minimal"
          />
          <StatsCard
            title="В срок"
            value={`${stats?.on_time_delivery_rate || 0}%`}
            icon={Clock}
            change={{ value: 3, type: 'increase', period: 'за месяц' }}
            className="card-minimal"
          />
        </div>

        {/* Analytics Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActiveRoutesBlock 
            onDetailedView={() => setShowAnalyticsModal(true)}
          />
          <RecentEventsBlock 
            onDetailedView={() => setShowAnalyticsModal(true)}
          />
          <DeliveryPerformanceBlock 
            onDetailedView={() => setShowAnalyticsModal(true)}
          />
          <RouteEfficiencyBlock 
            onDetailedView={() => setShowAnalyticsModal(true)}
          />
        </div>

        {/* Map Section with gradient border */}
        <div className="relative group">
          {/* Gradient border effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur-sm" />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-[0_4px_20px_rgba(99,102,241,0.12)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Карта маршрутов
              </h2>
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                Развернуть
              </button>
            </div>
            <RouteMap
              routes={[]}
              selectedRouteId={selectedRouteId ?? undefined}
              onRouteSelect={setSelectedRouteId}
              className="h-96 w-full rounded-xl"
            />
          </div>
        </div>
        
        {/* Simulation Launcher */}
        <SimulationLauncher />

        {/* Actions Section with gradients */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-[0_4px_20px_rgba(99,102,241,0.12)] border border-gray-100/50 dark:border-gray-800/50">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Быстрые действия
          </h2>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => {
                setRouteModalMode('create');
                setShowRouteModal(true);
              }}
              className="group relative px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl 
                       hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 font-medium text-sm
                       hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">Новый маршрут</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button 
              onClick={() => {
                setRouteModalMode('optimize');
                setShowRouteModal(true);
              }}
              className="group relative px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl 
                       hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 font-medium text-sm
                       hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">Оптимизировать</span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-green-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button 
              onClick={() => setShowDriverModal(true)}
              className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl 
                       hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50 dark:hover:bg-gray-700 
                       transition-all duration-300 font-medium text-sm border border-gray-200 dark:border-gray-700
                       hover:border-indigo-300 dark:hover:border-indigo-700 hover:scale-105 active:scale-95"
            >
              Управление водителями
            </button>
            <button 
              onClick={() => setShowAnalyticsModal(true)}
              className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl 
                       hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50 dark:hover:bg-gray-700 
                       transition-all duration-300 font-medium text-sm border border-gray-200 dark:border-gray-700
                       hover:border-purple-300 dark:hover:border-purple-700 hover:scale-105 active:scale-95"
            >
              Аналитика
            </button>
            <button 
              onClick={() => window.location.href = '/testing'}
              className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl 
                       hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:bg-gray-700 
                       transition-all duration-300 font-medium text-sm border border-gray-200 dark:border-gray-700
                       hover:border-blue-300 dark:hover:border-blue-700 hover:scale-105 active:scale-95"
            >
              Система тестирования
            </button>
          </div>
        </div>
      </div>

      {/* Модальные окна вне основного контейнера */}
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
  );
};

export default Dashboard;