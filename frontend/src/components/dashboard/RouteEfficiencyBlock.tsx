'use client';

import { useState, useEffect } from 'react';
import { 
  Route, 
  TrendingUp, 
  TrendingDown, 
  Fuel, 
  Clock, 
  MapPin,
  BarChart3,
  Target,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface RouteEfficiencyData {
  route_id: number;
  route_name: string;
  planned_distance: number;
  actual_distance: number;
  planned_time: number;
  actual_time: number;
  planned_fuel: number;
  actual_fuel: number;
  efficiency_score: number;
  cost_savings: number;
  deviation_percentage: number;
}

interface RouteEfficiencyBlockProps {
  className?: string;
  onDetailedView?: () => void;
}

const mockRouteData: RouteEfficiencyData[] = [
  {
    route_id: 1001,
    route_name: "Центр-Север",
    planned_distance: 45.2,
    actual_distance: 42.8,
    planned_time: 180,
    actual_time: 165,
    planned_fuel: 8.5,
    actual_fuel: 7.9,
    efficiency_score: 94,
    cost_savings: 320,
    deviation_percentage: -5.3
  },
  {
    route_id: 1002,
    route_name: "Восток-Запад",
    planned_distance: 32.1,
    actual_distance: 35.4,
    planned_time: 150,
    actual_time: 175,
    planned_fuel: 6.2,
    actual_fuel: 7.1,
    efficiency_score: 78,
    cost_savings: -180,
    deviation_percentage: 10.3
  },
  {
    route_id: 1003,
    route_name: "Кольцевой",
    planned_distance: 28.7,
    actual_distance: 27.9,
    planned_time: 120,
    actual_time: 115,
    planned_fuel: 5.8,
    actual_fuel: 5.6,
    efficiency_score: 96,
    cost_savings: 150,
    deviation_percentage: -2.8
  },
  {
    route_id: 1004,
    route_name: "Южный",
    planned_distance: 38.9,
    actual_distance: 41.2,
    planned_time: 160,
    actual_time: 170,
    planned_fuel: 7.3,
    actual_fuel: 8.0,
    efficiency_score: 85,
    cost_savings: -95,
    deviation_percentage: 5.9
  }
];

const chartData = [
  { name: 'Пн', planned: 180, actual: 165, efficiency: 92 },
  { name: 'Вт', planned: 195, actual: 210, efficiency: 78 },
  { name: 'Ср', planned: 170, actual: 160, efficiency: 94 },
  { name: 'Чт', planned: 200, actual: 185, efficiency: 88 },
  { name: 'Пт', planned: 185, actual: 175, efficiency: 91 },
  { name: 'Сб', planned: 160, actual: 155, efficiency: 96 },
  { name: 'Вс', planned: 140, actual: 135, efficiency: 97 }
];

export const RouteEfficiencyBlock = ({ 
  className = '', 
  onDetailedView 
}: RouteEfficiencyBlockProps) => {
  const [routes, setRoutes] = useState<RouteEfficiencyData[]>(mockRouteData);
  const [selectedMetric, setSelectedMetric] = useState<'distance' | 'time' | 'fuel'>('distance');

  const calculateAverages = () => {
    const totalRoutes = routes.length;
    const avgEfficiency = routes.reduce((sum, route) => sum + route.efficiency_score, 0) / totalRoutes;
    const totalSavings = routes.reduce((sum, route) => sum + route.cost_savings, 0);
    const avgDeviation = routes.reduce((sum, route) => sum + Math.abs(route.deviation_percentage), 0) / totalRoutes;
    
    return {
      avgEfficiency: Math.round(avgEfficiency),
      totalSavings,
      avgDeviation: Math.round(avgDeviation * 10) / 10
    };
  };

  const { avgEfficiency, totalSavings, avgDeviation } = calculateAverages();

  const getEfficiencyColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 border-green-200';
    if (score >= 75) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}ч ${mins}м`;
    }
    return `${mins}м`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Route className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Эффективность маршрутов
              </h2>
              <p className="text-sm text-gray-400">
                Сравнение плановых и фактических показателей
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select 
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as 'distance' | 'time' | 'fuel')}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="distance">Расстояние</option>
              <option value="time">Время</option>
              <option value="fuel">Топливо</option>
            </select>
            <button 
              onClick={onDetailedView}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
            >
              Подробнее
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Средняя эффективность</p>
                <p className={`text-2xl font-bold ${getEfficiencyColor(avgEfficiency)}`}>
                  {avgEfficiency}%
                </p>
              </div>
              <Target className={`h-8 w-8 ${getEfficiencyColor(avgEfficiency)}`} />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Экономия/Перерасход</p>
                <p className={`text-2xl font-bold ${totalSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalSavings)}
                </p>
              </div>
              {totalSavings >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Среднее отклонение</p>
                <p className="text-2xl font-bold text-white">
                  {avgDeviation}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white mb-4">
            Динамика эффективности за неделю
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  stroke="#6B7280"
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  stroke="#6B7280"
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="#10B981"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="planned" 
                  stroke="#6B7280" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Плановое время (мин)"
                  yAxisId="left"
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Фактическое время (мин)"
                  yAxisId="left"
                />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Эффективность (%)"
                  yAxisId="right"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {}
        <div>
          <h3 className="text-sm font-medium text-white mb-4">
            Детализация по маршрутам
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-white">
                    Маршрут
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-white">
                    Эффективность
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-white">
                    Расстояние
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-white">
                    Время
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-white">
                    Топливо
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-white">
                    Экономия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {routes.map((route) => (
                  <tr key={route.route_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-white">
                          {route.route_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          #{route.route_id}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEfficiencyBgColor(route.efficiency_score)}`}>
                          {route.efficiency_score >= 90 ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : route.efficiency_score >= 75 ? (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          )}
                          {route.efficiency_score}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <p className="text-white">
                          {route.actual_distance} км
                        </p>
                        <p className="text-xs text-gray-400">
                          план: {route.planned_distance} км
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <p className="text-white">
                          {formatTime(route.actual_time)}
                        </p>
                        <p className="text-xs text-gray-400">
                          план: {formatTime(route.planned_time)}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <p className="text-white">
                          {route.actual_fuel} л
                        </p>
                        <p className="text-xs text-gray-400">
                          план: {route.planned_fuel} л
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${
                        route.cost_savings >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(route.cost_savings)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};