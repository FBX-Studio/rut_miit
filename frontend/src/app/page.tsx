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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950/30 relative overflow-hidden">
      {}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <NavigationHeader
        title="Маршруты"
        subtitle="Мониторинг доставки в реальном времени"
        actions={
          <div className="flex items-center space-x-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'} ${isConnected ? 'animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : ''}`}></div>
            <span className="text-sm font-medium text-gray-300">
              {isConnected ? 'В сети' : 'Не в сети'}
            </span>
          </div>
        }
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12">
        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <div className="group bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] transition-all duration-300 hover:scale-105 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="text-sm text-green-400 font-medium">+12%</div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats?.total_routes || 0}</div>
            <div className="text-sm text-gray-400">Маршруты</div>
          </div>

          <div className="group bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.25)] transition-all duration-300 hover:scale-105 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30 group-hover:scale-110 transition-transform duration-300 animate-pulse">
                <Truck className="h-6 w-6 text-purple-400" />
              </div>
              <div className="text-sm text-green-400 font-medium">+8%</div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats?.active_routes || 0}</div>
            <div className="text-sm text-gray-400">Активные</div>
          </div>

          <div className="group bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.25)] transition-all duration-300 hover:scale-105 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                <Package className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-sm text-red-400 font-medium">-5%</div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats?.pending_orders || 0}</div>
            <div className="text-sm text-gray-400">В ожидании</div>
          </div>

          <div className="group bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:border-green-500/40 hover:shadow-[0_0_30px_rgba(34,197,94,0.25)] transition-all duration-300 hover:scale-105 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-xl border border-green-500/30 group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-6 w-6 text-green-400" />
              </div>
              <div className="text-sm text-green-400 font-medium">+3%</div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats?.on_time_delivery_rate || 0}%</div>
            <div className="text-sm text-gray-400">В срок</div>
          </div>
        </div>

        {}
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

        {}
        <div className="relative group animate-fadeIn" style={{ animationDelay: '0.5s' }}>
          {}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur-sm animate-gradient" />
          <div className="relative bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Карта маршрутов
              </h2>
              <button className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                Развернуть
              </button>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-indigo-500/20">
              <RouteMap
                routes={[]}
                selectedRouteId={selectedRouteId ?? undefined}
                onRouteSelect={setSelectedRouteId}
                className="h-96 w-full"
              />
            </div>
          </div>
        </div>
        
        {}
        <SimulationLauncher />

        {}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] animate-fadeIn" style={{ animationDelay: '0.6s' }}>
          <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Быстрые действия
          </h2>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => {
                setRouteModalMode('create');
                setShowRouteModal(true);
              }}
              className="group relative px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl 
                       shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.4)]
                       transition-all duration-300 font-medium text-sm hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">Новый маршрут</span>
            </button>
            <button 
              onClick={() => {
                setRouteModalMode('optimize');
                setShowRouteModal(true);
              }}
              className="group relative px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl 
                       shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.4)]
                       transition-all duration-300 font-medium text-sm hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">Оптимизировать</span>
            </button>
            <button 
              onClick={() => setShowDriverModal(true)}
              className="px-6 py-3 bg-gray-800/50 backdrop-blur-sm text-white rounded-xl 
                       border border-indigo-500/30 hover:border-indigo-500/50
                       transition-all duration-300 font-medium text-sm hover:scale-105 active:scale-95"
            >
              Управление водителями
            </button>
            <button 
              onClick={() => setShowAnalyticsModal(true)}
              className="px-6 py-3 bg-gray-800/50 backdrop-blur-sm text-white rounded-xl 
                       border border-purple-500/30 hover:border-purple-500/50
                       transition-all duration-300 font-medium text-sm hover:scale-105 active:scale-95"
            >
              Аналитика
            </button>
            <button 
              onClick={() => window.location.href = '/testing'}
              className="px-6 py-3 bg-gray-800/50 backdrop-blur-sm text-white rounded-xl 
                       border border-blue-500/30 hover:border-blue-500/50
                       transition-all duration-300 font-medium text-sm hover:scale-105 active:scale-95"
            >
              Система тестирования
            </button>
          </div>
        </div>
      </div>

      {}
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