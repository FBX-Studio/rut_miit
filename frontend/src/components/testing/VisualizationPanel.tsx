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
import { motion } from 'framer-motion';
import { CHART_COLORS, AXIS_STYLES, GRID_STYLES, TOOLTIP_CURSOR } from '@/components/charts/ChartStyles';

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
    if (improvement > 0) return 'text-green-400';
    if (improvement < 0) return 'text-red-400';
    return 'text-gray-400';
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
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Визуализация и аналитика
          </h1>
          <p className="text-gray-400 mt-1">
            Графики маршрутов, тепловые карты и сравнительный анализ
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-indigo-500/30 rounded-xl bg-gray-900/50 backdrop-blur-sm text-white hover:border-indigo-500/50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="1h">Последний час</option>
            <option value="6h">Последние 6 часов</option>
            <option value="24h">Последние 24 часа</option>
            <option value="7d">Последние 7 дней</option>
          </select>
          <button
            onClick={exportData}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] flex items-center gap-2 hover:scale-105"
          >
            <Download className="h-4 w-4" />
            Экспорт
          </button>
        </div>
      </motion.div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Performance Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-indigo-400" />
              Производительность маршрутов
            </h2>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="px-3 py-2 border border-purple-500/30 rounded-xl bg-gray-900/50 backdrop-blur-sm text-white text-sm hover:border-purple-500/50 transition-all"
            >
              <option value="efficiency">Эффективность</option>
              <option value="distance">Расстояние</option>
              <option value="duration">Время</option>
              <option value="cost">Стоимость</option>
            </select>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <defs>
                <linearGradient id="lineGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID_STYLES} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                {...AXIS_STYLES}
              />
              <YAxis {...AXIS_STYLES} />
              <Tooltip 
                cursor={TOOLTIP_CURSOR}
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '12px', color: '#fff' }}
                labelFormatter={(value) => formatTime(value as string)}
                formatter={(value: number, name: string) => [
                  selectedMetric === 'efficiency' || selectedMetric === 'customer_satisfaction' 
                    ? `${Math.round(value * 100)}%` 
                    : Math.round(value),
                  name
                ]}
              />
              {selectedMetric === 'efficiency' && (
                <Line 
                  type="monotone" 
                  dataKey="delivery_success_rate" 
                  stroke={CHART_COLORS.primary[0]}
                  strokeWidth={3}
                  dot={false}
                  name="Успешность доставки"
                  fill="url(#lineGrad1)"
                />
              )}
              {selectedMetric === 'distance' && (
                <Line 
                  type="monotone" 
                  dataKey="total_distance" 
                  stroke={CHART_COLORS.primary[1]}
                  strokeWidth={3}
                  dot={false}
                  name="Общее расстояние (км)"
                />
              )}
              {selectedMetric === 'duration' && (
                <Line 
                  type="monotone" 
                  dataKey="total_duration" 
                  stroke={CHART_COLORS.primary[2]}
                  strokeWidth={3}
                  dot={false}
                  name="Общее время (мин)"
                />
              )}
              {selectedMetric === 'cost' && (
                <Line 
                  type="monotone" 
                  dataKey="fuel_consumption" 
                  stroke={CHART_COLORS.primary[0]}
                  strokeWidth={3}
                  dot={false}
                  name="Расход топлива (л)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Algorithm Comparison */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
        >
          <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 flex items-center">
            <Target className="h-5 w-5 mr-2 text-purple-400" />
            Сравнение алгоритмов
          </h2>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={routeMetrics.slice(0, 10)}>
              <defs>
                <linearGradient id="barGradientEff" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.primary[1]} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={CHART_COLORS.primary[1]} stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID_STYLES} />
              <XAxis 
                dataKey="route_id" 
                {...AXIS_STYLES}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis {...AXIS_STYLES} />
              <Tooltip 
                cursor={TOOLTIP_CURSOR}
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', color: '#fff' }}
                formatter={(value: number, name: string) => [
                  name === 'efficiency_score' ? `${Math.round(value * 100)}%` : Math.round(value),
                  name === 'efficiency_score' ? 'Эффективность' : 
                  name === 'distance' ? 'Расстояние (км)' :
                  name === 'duration' ? 'Время (мин)' : name
                ]}
              />
              <Bar 
                dataKey="efficiency_score" 
                fill="url(#barGradientEff)" 
                name="Эффективность"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Comparison Table */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] p-6">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-6 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-indigo-400" />
          Сравнительная таблица (до/после оптимизации)
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-indigo-500/30">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Метрика
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  До оптимизации
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  После оптимизации
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Изменение
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {comparisonData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-800/30 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {item.metric}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {item.before.toLocaleString('ru-RU')} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {item.after.toLocaleString('ru-RU')} {item.unit}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getMetricColor(item.improvement)}`}>
                    <div className="flex items-center gap-1">
                      {getMetricIcon(item.improvement)}
                      <span>
                        {item.improvement > 0 ? '+' : ''}{item.improvement.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {Math.abs(item.improvement) > 10 ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Значительное улучшение</span>
                      </div>
                    ) : Math.abs(item.improvement) > 5 ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                        <Activity className="h-4 w-4" />
                        <span className="text-xs font-medium">Улучшение</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg border border-yellow-500/30">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Незначительное изменение</span>
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
        >
          <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent mb-6 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-indigo-400" />
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
                labelLine={true}
                label={({ zone, percent }) => `${zone} ${(percent * 100).toFixed(0)}%`}
                outerRadius={90}
                innerRadius={40}
                fill="#8884d8"
                dataKey="count"
                strokeWidth={2}
                stroke="#1F2937"
              >
                {heatmapData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS.pie[index % CHART_COLORS.pie.length]}
                    style={{ filter: 'drop-shadow(0px 0px 8px rgba(99, 102, 241, 0.4))' }}
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '12px', color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Delivery Time Heatmap */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
        >
          <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent mb-6 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-purple-400" />
            Время доставки по зонам
          </h2>
          
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={heatmapData}>
              <CartesianGrid {...GRID_STYLES} />
              <XAxis 
                type="number" 
                dataKey="delivery_count" 
                name="Количество доставок"
                {...AXIS_STYLES}
              />
              <YAxis 
                type="number" 
                dataKey="avg_time" 
                name="Среднее время (мин)"
                {...AXIS_STYLES}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '5 5', stroke: '#8B5CF6', opacity: 0.3 }}
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', color: '#fff' }}
                formatter={(value, name) => [
                  name === 'avg_time' ? `${Math.round(value as number)} мин` : value,
                  name === 'avg_time' ? 'Среднее время' : 
                  name === 'delivery_count' ? 'Количество доставок' : name
                ]}
              />
              <Scatter 
                name="Зоны доставки" 
                dataKey="avg_time" 
                fill={CHART_COLORS.primary[1]}
                fillOpacity={0.8}
              >
                {heatmapData.map((entry, index) => (
                  <Cell 
                    key={`scatter-${index}`} 
                    fill={CHART_COLORS.primary[index % CHART_COLORS.primary.length]}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Route Efficiency Trends */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
      >
        <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-6 flex items-center">
          <Route className="h-5 w-5 mr-2 text-blue-400" />
          Тренды эффективности маршрутов
        </h2>
        
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={performanceData}>
            <defs>
              <linearGradient id="areaGrad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.primary[1]} stopOpacity={0.5} />
                <stop offset="100%" stopColor={CHART_COLORS.primary[1]} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={0.5} />
                <stop offset="100%" stopColor={CHART_COLORS.success} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID_STYLES} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatTime}
              {...AXIS_STYLES}
            />
            <YAxis {...AXIS_STYLES} />
            <Tooltip 
              cursor={TOOLTIP_CURSOR}
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', color: '#fff' }}
              labelFormatter={(value) => formatTime(value as string)}
              formatter={(value: number, name: string) => [
                `${Math.round(value * 100)}%`,
                name === 'delivery_success_rate' ? 'Успешность доставки' : 'Удовлетворенность клиентов'
              ]}
            />
            <Area
              type="monotone"
              dataKey="delivery_success_rate"
              stackId="1"
              stroke={CHART_COLORS.primary[1]}
              strokeWidth={3}
              fill="url(#areaGrad1)"
              name="Успешность доставки"
            />
            <Area
              type="monotone"
              dataKey="customer_satisfaction"
              stackId="2"
              stroke={CHART_COLORS.success}
              strokeWidth={3}
              fill="url(#areaGrad2)"
              name="Удовлетворенность клиентов"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

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