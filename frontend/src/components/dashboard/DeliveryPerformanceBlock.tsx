'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  BarChart3,
  Target,
  AlertTriangle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface PerformanceData {
  period: string;
  total_deliveries: number;
  successful_deliveries: number;
  delayed_deliveries: number;
  cancelled_deliveries: number;
  average_delivery_time: number;
  on_time_percentage: number;
  customer_satisfaction: number;
}

interface DeliveryPerformanceBlockProps {
  className?: string;
  onDetailedView?: () => void;
}

const mockPerformanceData: { [key: string]: PerformanceData } = {
  'day': {
    period: 'Сегодня',
    total_deliveries: 47,
    successful_deliveries: 42,
    delayed_deliveries: 3,
    cancelled_deliveries: 2,
    average_delivery_time: 28,
    on_time_percentage: 89.4,
    customer_satisfaction: 4.6
  },
  'week': {
    period: 'Эта неделя',
    total_deliveries: 312,
    successful_deliveries: 289,
    delayed_deliveries: 18,
    cancelled_deliveries: 5,
    average_delivery_time: 31,
    on_time_percentage: 92.6,
    customer_satisfaction: 4.5
  },
  'month': {
    period: 'Этот месяц',
    total_deliveries: 1247,
    successful_deliveries: 1156,
    delayed_deliveries: 67,
    cancelled_deliveries: 24,
    average_delivery_time: 29,
    on_time_percentage: 92.7,
    customer_satisfaction: 4.4
  }
};

const chartData = [
  { name: 'Пн', deliveries: 45, onTime: 42, delayed: 3 },
  { name: 'Вт', deliveries: 52, onTime: 48, delayed: 4 },
  { name: 'Ср', deliveries: 48, onTime: 46, delayed: 2 },
  { name: 'Чт', deliveries: 61, onTime: 56, delayed: 5 },
  { name: 'Пт', deliveries: 55, onTime: 51, delayed: 4 },
  { name: 'Сб', deliveries: 38, onTime: 35, delayed: 3 },
  { name: 'Вс', deliveries: 33, onTime: 31, delayed: 2 }
];

const pieData = [
  { name: 'В срок', value: 89.4, color: '#10B981' },
  { name: 'С задержкой', value: 6.4, color: '#F59E0B' },
  { name: 'Отменено', value: 4.2, color: '#EF4444' }
];

export const DeliveryPerformanceBlock = ({ 
  className = '', 
  onDetailedView 
}: DeliveryPerformanceBlockProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [data, setData] = useState<PerformanceData>(mockPerformanceData.week);

  useEffect(() => {
    setData(mockPerformanceData[selectedPeriod]);
  }, [selectedPeriod]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}ч ${mins}м`;
    }
    return `${mins}м`;
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 95) return 'text-green-400';
    if (percentage >= 85) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 95) return <CheckCircle className="h-5 w-5 text-green-400" />;
    if (percentage >= 85) return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    return <XCircle className="h-5 w-5 text-red-400" />;
  };

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {}
      <div className="p-6 border-b border-indigo-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/20 border border-green-500/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Производительность доставки
              </h2>
              <p className="text-sm text-gray-400">
                Статистика за {data.period.toLowerCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as 'day' | 'week' | 'month')}
              className="text-sm border border-indigo-500/30 rounded-md px-3 py-1.5 bg-gray-800/50 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="day">Сегодня</option>
              <option value="week">Эта неделя</option>
              <option value="month">Этот месяц</option>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Всего доставок</p>
                <p className="text-2xl font-bold text-white">
                  {data.total_deliveries}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Успешных</p>
                <p className="text-2xl font-bold text-green-400">
                  {data.successful_deliveries}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Среднее время</p>
                <p className="text-2xl font-bold text-white">
                  {formatTime(data.average_delivery_time)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">В срок</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(data.on_time_percentage)}`}>
                  {data.on_time_percentage}%
                </p>
              </div>
              {getPerformanceIcon(data.on_time_percentage)}
            </div>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {}
          <div>
            <h3 className="text-sm font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Динамика доставок
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="onTimeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="delayedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    stroke="#4B5563"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    stroke="#4B5563"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '12px',
                      color: '#F9FAFB',
                      boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="onTime" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#10B981', stroke: '#10B981', strokeWidth: 2 }}
                    name="В срок"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="delayed" 
                    stroke="#F59E0B" 
                    strokeWidth={3}
                    dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#F59E0B', stroke: '#F59E0B', strokeWidth: 2 }}
                    name="С задержкой"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {}
          <div>
            <h3 className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Распределение результатов
            </h3>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {pieData.map((entry, index) => (
                      <filter key={`glow-${index}`} id={`glow-${index}`}>
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    ))}
                  </defs>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke={entry.color}
                        strokeWidth={2}
                        style={{ filter: `url(#glow-${index})` }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Процент']}
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '12px',
                      color: '#F9FAFB',
                      boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-2">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-xs text-gray-400">
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Target className="h-6 w-6 text-green-400" />
            <div>
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                Цель выполнена
              </p>
              <p className="text-xs text-green-400">
                Показатель в срок: {data.on_time_percentage}% (цель: 85%)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-400" />
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                Рост эффективности
              </p>
              <p className="text-xs text-blue-400">
                +5.2% по сравнению с прошлым периодом
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm text-purple-800 dark:text-purple-200 font-medium">
                Удовлетворенность
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                {data.customer_satisfaction}/5.0 оценка клиентов
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};