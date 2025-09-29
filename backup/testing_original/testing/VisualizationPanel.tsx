'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Map, 
  Activity, 
  Clock, 
  Route,
  Zap,
  Target,
  AlertCircle,
  CheckCircle,
  Download,
  Filter,
  Calendar,
  MapPin
} from 'lucide-react';

interface RouteMetrics {
  route_id: string;
  distance: number;
  duration: number;
  cost: number;
  efficiency_score: number;
  delivery_count: number;
  optimization_algorithm: string;
  timestamp: string;
}

interface ComparisonData {
  metric: string;
  before: number;
  after: number;
  improvement: number;
  unit: string;
}

interface HeatmapData {
  lat: number;
  lng: number;
  intensity: number;
  zone: string;
  delivery_count: number;
  avg_time: number;
}

interface PerformanceMetrics {
  timestamp: string;
  total_distance: number;
  total_duration: number;
  average_speed: number;
  fuel_consumption: number;
  delivery_success_rate: number;
  customer_satisfaction: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const VisualizationPanel: React.FC = () => {
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [selectedMetric, setSelectedMetric] = useState<'distance' | 'duration' | 'cost' | 'efficiency'>('efficiency');

  useEffect(() => {
    fetchVisualizationData();
    
    // Обновляем данные каждые 2 минуты
    const interval = setInterval(fetchVisualizationData, 120000);
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const fetchVisualizationData = async () => {
    setLoading(true);
    try {
      // Генерируем демонстрационные данные
      generateDemoData();
    } catch (error) {
      console.error('Error fetching visualization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDemoData = () => {
    // Генерация данных маршрутов
    const routes: RouteMetrics[] = [];
    const algorithms = ['nearest_neighbor', 'genetic', 'simulated_annealing'];
    
    for (let i = 0; i < 20; i++) {
      routes.push({
        route_id: `route_${i + 1}`,
        distance: Math.random() * 100 + 20,
        duration: Math.random() * 180 + 30,
        cost: Math.random() * 500 + 100,
        efficiency_score: Math.random() * 0.4 + 0.6,
        delivery_count: Math.floor(Math.random() * 15) + 5,
        optimization_algorithm: algorithms[Math.floor(Math.random() * algorithms.length)],
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    setRouteMetrics(routes);

    // Генерация данных сравнения
    const comparison: ComparisonData[] = [
      {
        metric: 'Общее расстояние',
        before: 1250,
        after: 980,
        improvement: -21.6,
        unit: 'км'
      },
      {
        metric: 'Время доставки',
        before: 420,
        after: 340,
        improvement: -19.0,
        unit: 'мин'
      },
      {
        metric: 'Расход топлива',
        before: 85,
        after: 68,
        improvement: -20.0,
        unit: 'л'
      },
      {
        metric: 'Стоимость доставки',
        before: 2800,
        after: 2200,
        improvement: -21.4,
        unit: '₽'
      },
      {
        metric: 'Удовлетворенность клиентов',
        before: 78,
        after: 89,
        improvement: 14.1,
        unit: '%'
      },
      {
        metric: 'Эффективность маршрутов',
        before: 72,
        after: 85,
        improvement: 18.1,
        unit: '%'
      }
    ];
    setComparisonData(comparison);

    // Генерация данных тепловой карты
    const heatmap: HeatmapData[] = [];
    const zones = ['Центр', 'Север', 'Юг', 'Восток', 'Запад'];
    
    for (let i = 0; i < 50; i++) {
      heatmap.push({
        lat: 55.7558 + (Math.random() - 0.5) * 0.2,
        lng: 37.6176 + (Math.random() - 0.5) * 0.3,
        intensity: Math.random(),
        zone: zones[Math.floor(Math.random() * zones.length)],
        delivery_count: Math.floor(Math.random() * 20) + 1,
        avg_time: Math.random() * 60 + 15
      });
    }
    setHeatmapData(heatmap);

    // Генерация данных производительности
    const performance: PerformanceMetrics[] = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      performance.push({
        timestamp: timestamp.toISOString(),
        total_distance: Math.random() * 200 + 800,
        total_duration: Math.random() * 100 + 300,
        average_speed: Math.random() * 20 + 30,
        fuel_consumption: Math.random() * 20 + 60,
        delivery_success_rate: Math.random() * 0.15 + 0.85,
        customer_satisfaction: Math.random() * 0.2 + 0.75
      });
    }
    setPerformanceData(performance);
  };

  const getMetricColor = (improvement: number) => {
    if (improvement > 0) return 'text-green-600';
    if (improvement < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getMetricIcon = (improvement: number) => {
    if (improvement > 0) return <TrendingUp className="h-4 w-4" />;
    if (improvement < 0) return <TrendingDown className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const exportData = () => {
    const data = {
      routes: routeMetrics,
      comparison: comparisonData,
      performance: performanceData,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logistics_analytics_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Визуализация и аналитика
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Графики маршрутов, тепловые карты и сравнительный анализ
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="1h">Последний час</option>
            <option value="6h">Последние 6 часов</option>
            <option value="24h">Последние 24 часа</option>
            <option value="7d">Последние 7 дней</option>
          </select>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Performance Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Производительность маршрутов
            </h2>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="efficiency">Эффективность</option>
              <option value="distance">Расстояние</option>
              <option value="duration">Время</option>
              <option value="cost">Стоимость</option>
            </select>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => formatTime(value as string)}
                formatter={(value: number, name: string) => [
                  selectedMetric === 'efficiency' || selectedMetric === 'customer_satisfaction' 
                    ? `${Math.round(value * 100)}%` 
                    : Math.round(value),
                  name
                ]}
              />
              <Legend />
              {selectedMetric === 'efficiency' && (
                <Line 
                  type="monotone" 
                  dataKey="delivery_success_rate" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Успешность доставки"
                />
              )}
              {selectedMetric === 'distance' && (
                <Line 
                  type="monotone" 
                  dataKey="total_distance" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Общее расстояние (км)"
                />
              )}
              {selectedMetric === 'duration' && (
                <Line 
                  type="monotone" 
                  dataKey="total_duration" 
                  stroke="#ffc658" 
                  strokeWidth={2}
                  name="Общее время (мин)"
                />
              )}
              {selectedMetric === 'cost' && (
                <Line 
                  type="monotone" 
                  dataKey="fuel_consumption" 
                  stroke="#ff7300" 
                  strokeWidth={2}
                  name="Расход топлива (л)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Algorithm Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Сравнение алгоритмов
          </h2>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={routeMetrics.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="route_id" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'efficiency_score' ? `${Math.round(value * 100)}%` : Math.round(value),
                  name === 'efficiency_score' ? 'Эффективность' : 
                  name === 'distance' ? 'Расстояние (км)' :
                  name === 'duration' ? 'Время (мин)' : name
                ]}
              />
              <Legend />
              <Bar dataKey="efficiency_score" fill="#8884d8" name="Эффективность" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Сравнительная таблица (до/после оптимизации)
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Метрика
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  До оптимизации
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  После оптимизации
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Изменение
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {comparisonData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {item.metric}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.before.toLocaleString('ru-RU')} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.after.toLocaleString('ru-RU')} {item.unit}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getMetricColor(item.improvement)}`}>
                    <div className="flex items-center">
                      {getMetricIcon(item.improvement)}
                      <span className="ml-1">
                        {item.improvement > 0 ? '+' : ''}{item.improvement.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {Math.abs(item.improvement) > 10 ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="text-xs">Значительное улучшение</span>
                      </div>
                    ) : Math.abs(item.improvement) > 5 ? (
                      <div className="flex items-center text-blue-600">
                        <Activity className="h-4 w-4 mr-1" />
                        <span className="text-xs">Улучшение</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-yellow-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span className="text-xs">Незначительное изменение</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Heatmap and Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Распределение по зонам
          </h2>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={heatmapData.reduce((acc, item) => {
                  const existing = acc.find(x => x.zone === item.zone);
                  if (existing) {
                    existing.count += item.delivery_count;
                  } else {
                    acc.push({ zone: item.zone, count: item.delivery_count });
                  }
                  return acc;
                }, [] as { zone: string; count: number }[])}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ zone, percent }) => `${zone} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {heatmapData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Delivery Time Heatmap */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Время доставки по зонам
          </h2>
          
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={heatmapData}>
              <CartesianGrid />
              <XAxis 
                type="number" 
                dataKey="delivery_count" 
                name="Количество доставок"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                type="number" 
                dataKey="avg_time" 
                name="Среднее время (мин)"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value, name) => [
                  name === 'avg_time' ? `${Math.round(value as number)} мин` : value,
                  name === 'avg_time' ? 'Среднее время' : 
                  name === 'delivery_count' ? 'Количество доставок' : name
                ]}
              />
              <Scatter 
                name="Зоны доставки" 
                dataKey="avg_time" 
                fill="#8884d8"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Route Efficiency Trends */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Route className="h-5 w-5 mr-2" />
          Тренды эффективности маршрутов
        </h2>
        
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatTime}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              labelFormatter={(value) => formatTime(value as string)}
              formatter={(value: number, name: string) => [
                `${Math.round(value * 100)}%`,
                name === 'delivery_success_rate' ? 'Успешность доставки' : 'Удовлетворенность клиентов'
              ]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="delivery_success_rate"
              stackId="1"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
              name="Успешность доставки"
            />
            <Area
              type="monotone"
              dataKey="customer_satisfaction"
              stackId="2"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.6}
              name="Удовлетворенность клиентов"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Route className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Активные маршруты</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {routeMetrics.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Средняя эффективность</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {Math.round(routeMetrics.reduce((acc, r) => acc + r.efficiency_score, 0) / routeMetrics.length * 100)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Среднее время</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {Math.round(routeMetrics.reduce((acc, r) => acc + r.duration, 0) / routeMetrics.length)} мин
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Общая экономия</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {Math.round(comparisonData.reduce((acc, item) => acc + Math.abs(item.improvement), 0) / comparisonData.length)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationPanel;