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
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50/30 via-transparent to-emerald-50/30 dark:from-indigo-900/20 dark:via-transparent dark:to-emerald-900/20"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-200/20 dark:bg-indigo-800/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-emerald-200/20 dark:bg-emerald-800/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Floating particles for depth */}
        <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-indigo-400/40 rounded-full animate-bounce delay-500"></div>
        <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-emerald-400/40 rounded-full animate-bounce delay-700"></div>
        <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-bounce delay-900"></div>
      </div>
      
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

        {/* Analytics Blocks - Clean Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <ActiveRoutesBlock 
            className="card-minimal"
            onDetailedView={() => setShowAnalyticsModal(true)}
          />
          <RecentEventsBlock 
            className="card-minimal"
            onDetailedView={() => setShowAnalyticsModal(true)}
          />
          <DeliveryPerformanceBlock 
            className="card-minimal"
            onDetailedView={() => setShowAnalyticsModal(true)}
          />
          <RouteEfficiencyBlock 
            className="card-minimal"
            onDetailedView={() => setShowAnalyticsModal(true)}
          />
        </div>

        {/* Map Section - Centered and Full Width */}
        <div className="space-y-8">
          <div className="card-minimal">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                Карта маршрутов
              </h2>
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors">
                Развернуть
              </button>
            </div>
            <div className="flex justify-center">
              <RouteMap
                routes={[]}
                selectedRouteId={selectedRouteId ?? undefined}
                onRouteSelect={setSelectedRouteId}
                className="h-96 w-full max-w-4xl rounded-xl"
              />
            </div>
          </div>
          
          {/* Simulation Launcher - Full Width Below Map */}
          <SimulationLauncher />
        </div>

        {/* Actions Section - Minimalist */}
        <div className="card-minimal">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight mb-6">
            Действия
          </h2>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <button 
              onClick={() => {
                setRouteModalMode('create');
                setShowRouteModal(true);
              }}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 
                       transition-all duration-200 font-medium shadow-sm hover:shadow-lg hover:scale-105
                       relative overflow-hidden group"
            >
              <span className="relative z-10">Новый маршрут</span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button 
              onClick={() => {
                setRouteModalMode('optimize');
                setShowRouteModal(true);
              }}
              className="px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 
                       transition-all duration-200 font-medium shadow-sm hover:shadow-lg hover:scale-105
                       relative overflow-hidden group"
            >
              <span className="relative z-10">Оптимизировать</span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button 
              onClick={() => setShowDriverModal(true)}
              className="px-6 py-3 bg-amber-600 text-white rounded-2xl hover:bg-amber-700 
                       transition-all duration-200 font-medium shadow-sm hover:shadow-lg hover:scale-105
                       relative overflow-hidden group"
            >
              <span className="relative z-10">Водители</span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button 
              onClick={() => setShowAnalyticsModal(true)}
              className="px-6 py-3 bg-violet-600 text-white rounded-2xl hover:bg-violet-700 
                       transition-all duration-200 font-medium shadow-sm hover:shadow-lg hover:scale-105
                       relative overflow-hidden group"
            >
              <span className="relative z-10">Аналитика</span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button 
              onClick={() => window.location.href = '/testing'}
              className="px-6 py-3 bg-slate-600 text-white rounded-2xl hover:bg-slate-700 
                       transition-all duration-200 font-medium shadow-sm hover:shadow-lg hover:scale-105
                       relative overflow-hidden group"
            >
              <span className="relative z-10">Система тестирования</span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>

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
    </div>
  );
};

export default Dashboard;