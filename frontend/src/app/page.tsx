'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, Clock, TrendingUp, MapPin, AlertTriangle } from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';
import dynamic from 'next/dynamic';
import { ActiveRoutes } from '@/components/routes/ActiveRoutes';
import { RecentEvents } from '@/components/events/RecentEvents';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { useWebSocket, useRouteUpdates, useEventNotifications } from '@/contexts/WebSocketContext';
import { useNotifications, useRouteNotifications } from '@/contexts/NotificationContext';
import { useSystemStats } from '@/hooks/useSystemStats';
import useSWR from 'swr';

// Dynamically import RouteMap to avoid SSR issues
const RouteMap = dynamic(() => import('@/components/maps/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading map...</p>
      </div>
    </div>
  ),
});

const Dashboard = () => {
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
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
              Failed to load dashboard data
            </div>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
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
              Route Optimization Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time monitoring and management of delivery routes
            </p>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Routes"
            value={stats?.total_routes || 0}
            icon={MapPin}
            change={{ value: 12, type: 'increase', period: 'vs last month' }}
            className="bg-white dark:bg-gray-800"
          />
          <StatsCard
            title="Active Deliveries"
            value={stats?.active_routes || 0}
            icon={Truck}
            change={{ value: 8, type: 'increase', period: 'vs last month' }}
            className="bg-white dark:bg-gray-800"
          />
          <StatsCard
            title="Pending Orders"
            value={stats?.pending_orders || 0}
            icon={Package}
            change={{ value: 5, type: 'decrease', period: 'vs last month' }}
            className="bg-white dark:bg-gray-800"
          />
          <StatsCard
            title="On-Time Rate"
            value={`${stats?.on_time_delivery_rate || 0}%`}
            icon={Clock}
            change={{ value: 3, type: 'increase', period: 'vs last month' }}
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
                  Live Route Map
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  View Full Screen
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
                  Active Routes
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  View All
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
                  Recent Events
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  View All
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
                Delivery Performance
              </h2>
              <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
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
                Route Efficiency
              </h2>
              <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
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
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Create New Route
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Optimize Routes
            </button>
            <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
              Manage Drivers
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;