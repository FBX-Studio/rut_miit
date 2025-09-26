'use client';

import { useState } from 'react';
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
} from 'recharts';

interface PerformanceData {
  timestamp: string;
  date: string;
  routes_completed: number;
  on_time_percentage: number;
  average_delay_minutes: number;
  fuel_efficiency: number;
  delivery_success_rate: number;
  total_distance: number;
  total_orders: number;
  cost_per_delivery: number;
  customer_satisfaction: number;
}

interface ChartMetric {
  key: keyof PerformanceData;
  label: string;
  color: string;
  unit?: string;
  format?: (value: number) => string;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  loading?: boolean;
  timeRange?: '24h' | '7d' | '30d' | '90d';
  onTimeRangeChange?: (range: '24h' | '7d' | '30d' | '90d') => void;
  className?: string;
}

const chartMetrics: ChartMetric[] = [
  {
    key: 'on_time_percentage',
    label: 'Вовремя %',
    color: '#10B981',
    unit: '%',
    format: (value) => `${value.toFixed(1)}%`,
  },
  {
    key: 'delivery_success_rate',
    label: 'Успешность',
    color: '#3B82F6',
    unit: '%',
    format: (value) => `${value.toFixed(1)}%`,
  },
  {
    key: 'average_delay_minutes',
    label: 'Ср. задержка',
    color: '#F59E0B',
    unit: 'мин',
    format: (value) => `${value.toFixed(0)}мин`,
  },
  {
    key: 'fuel_efficiency',
    label: 'Расход топлива',
    color: '#8B5CF6',
    unit: 'Л/100км',
    format: (value) => `${value.toFixed(1)}Л`,
  },
  {
    key: 'cost_per_delivery',
    label: 'Стоимость/Доставка',
    color: '#EF4444',
    unit: '₽',
    format: (value) => `₽${value.toFixed(2)}`,
  },
];

const chartTypes = [
  { id: 'line', label: 'Линейный график', icon: '📈' },
  { id: 'area', label: 'Площадной график', icon: '📊' },
  { id: 'bar', label: 'Столбчатый график', icon: '📊' },
] as const;

type ChartType = typeof chartTypes[number]['id'];

export const PerformanceChart = ({
  data,
  loading = false,
  timeRange = '7d',
  onTimeRangeChange,
  className = '',
}: PerformanceChartProps) => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'on_time_percentage',
    'delivery_success_rate',
  ]);
  const [chartType, setChartType] = useState<ChartType>('line');

  const timeRanges = [
    { id: '24h', label: 'Последние 24ч' },
    { id: '7d', label: 'Последние 7 дней' },
    { id: '30d', label: 'Последние 30 дней' },
    { id: '90d', label: 'Последние 90 дней' },
  ] as const;

  const toggleMetric = (metricKey: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricKey)
        ? prev.filter(key => key !== metricKey)
        : [...prev, metricKey]
    );
  };

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    switch (timeRange) {
      case '24h':
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      case '7d':
        return date.toLocaleDateString('ru-RU', { weekday: 'short' });
      case '30d':
      case '90d':
        return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
      default:
        return tickItem;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {date.toLocaleDateString('ru-RU', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric',
              hour: timeRange === '24h' ? '2-digit' : undefined,
              minute: timeRange === '24h' ? '2-digit' : undefined,
            })}
          </p>
          {payload.map((entry: any, index: number) => {
            const metric = chartMetrics.find(m => m.key === entry.dataKey);
            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {metric?.label}: {metric?.format ? metric.format(entry.value) : entry.value}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    const selectedMetricConfigs = chartMetrics.filter(metric => 
      selectedMetrics.includes(metric.key)
    );

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxisLabel}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {selectedMetricConfigs.map((metric, index) => (
              <Area
                key={metric.key}
                type="monotone"
                dataKey={metric.key}
                stackId={index < 2 ? "1" : "2"}
                stroke={metric.color}
                fill={metric.color}
                fillOpacity={0.3}
                name={metric.label}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxisLabel}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {selectedMetricConfigs.map(metric => (
              <Bar
                key={metric.key}
                dataKey={metric.key}
                fill={metric.color}
                name={metric.label}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxisLabel}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {selectedMetricConfigs.map(metric => (
              <Line
                key={metric.key}
                type="monotone"
                dataKey={metric.key}
                stroke={metric.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={metric.label}
              />
            ))}
          </LineChart>
        );
    }
  };

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Метрики производительности</h2>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
        </div>
        <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`card ${className}`}>
        <h2 className="text-lg font-semibold mb-4">Метрики производительности</h2>
        <div className="h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-gray-600 dark:text-gray-400">Нет данных о производительности</p>
            <p className="text-sm text-gray-500 mt-1">Данные появятся после завершения маршрутов</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Метрики производительности</h2>
        
        {/* Time range selector */}
        <div className="flex items-center space-x-2">
          {timeRanges.map(range => (
            <button
              key={range.id}
              onClick={() => onTimeRangeChange?.(range.id)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeRange === range.id
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        {/* Chart type selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">График:</span>
          {chartTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setChartType(type.id)}
              className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center space-x-1 ${
                chartType === type.id
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>

        {/* Metric selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Метрики:</span>
          {chartMetrics.map(metric => (
            <button
              key={metric.key}
              onClick={() => toggleMetric(metric.key)}
              className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center space-x-1 ${
                selectedMetrics.includes(metric.key)
                  ? 'text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
              style={{
                backgroundColor: selectedMetrics.includes(metric.key) ? metric.color : undefined,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: metric.color }}
              ></div>
              <span>{metric.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {selectedMetrics.slice(0, 4).map(metricKey => {
          const metric = chartMetrics.find(m => m.key === metricKey);
          if (!metric) return null;

          const latestValue = data[data.length - 1]?.[metric.key] as number;
          const previousValue = data[data.length - 2]?.[metric.key] as number;
          const change = previousValue ? ((latestValue - previousValue) / previousValue) * 100 : 0;

          return (
            <div key={metric.key} className="text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {metric.label}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {metric.format ? metric.format(latestValue || 0) : (latestValue || 0)}
              </div>
              {!isNaN(change) && (
                <div className={`text-xs ${
                  change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {change > 0 ? '↗' : change < 0 ? '↘' : '→'} {Math.abs(change).toFixed(1)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};