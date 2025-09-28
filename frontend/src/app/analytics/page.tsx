'use client';

import { useState, useEffect } from 'react';
import { NavigationHeader } from '@/components/ui/NavigationHeader';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Truck, 
  Package, 
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// Mock данные для аналитики
const performanceData = [
  { month: 'Янв', deliveries: 1200, efficiency: 85, costs: 45000 },
  { month: 'Фев', deliveries: 1350, efficiency: 88, costs: 42000 },
  { month: 'Мар', deliveries: 1180, efficiency: 82, costs: 48000 },
  { month: 'Апр', deliveries: 1420, efficiency: 91, costs: 41000 },
  { month: 'Май', deliveries: 1580, efficiency: 94, costs: 39000 },
  { month: 'Июн', deliveries: 1650, efficiency: 96, costs: 37000 },
];

const driverPerformance = [
  { name: 'Иванов И.И.', deliveries: 156, rating: 4.8, efficiency: 94 },
  { name: 'Петров П.П.', deliveries: 142, rating: 4.6, efficiency: 89 },
  { name: 'Сидоров С.С.', deliveries: 138, rating: 4.7, efficiency: 91 },
  { name: 'Козлов К.К.', deliveries: 134, rating: 4.5, efficiency: 87 },
  { name: 'Морозов М.М.', deliveries: 129, rating: 4.4, efficiency: 85 },
];

const routeDistribution = [
  { name: 'Центр', value: 35, color: '#3B82F6' },
  { name: 'Север', value: 25, color: '#10B981' },
  { name: 'Юг', value: 20, color: '#F59E0B' },
  { name: 'Восток', value: 12, color: '#EF4444' },
  { name: 'Запад', value: 8, color: '#8B5CF6' },
];

const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        <div className={`flex items-center mt-2 text-sm ${
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {change}
        </div>
      </div>
      <div className={`p-3 rounded-full ${
        trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      }`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('6m');
  const [selectedMetric, setSelectedMetric] = useState('deliveries');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationHeader 
        title="Аналитика"
        subtitle="Анализ производительности и метрики системы"
        showBackButton={true}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Фильтры */}
        <div className="mb-8 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="1m">Последний месяц</option>
              <option value="3m">Последние 3 месяца</option>
              <option value="6m">Последние 6 месяцев</option>
              <option value="1y">Последний год</option>
            </select>
            
            <select 
              value={selectedMetric} 
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="deliveries">Доставки</option>
              <option value="efficiency">Эффективность</option>
              <option value="costs">Затраты</option>
            </select>
          </div>
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Экспорт отчета
          </button>
        </div>

        {/* Ключевые метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Общие доставки"
            value="8,530"
            change="+12.5%"
            icon={Package}
            trend="up"
          />
          <StatCard
            title="Активные водители"
            value="45"
            change="+3.2%"
            icon={Users}
            trend="up"
          />
          <StatCard
            title="Средняя эффективность"
            value="89.2%"
            change="+5.1%"
            icon={TrendingUp}
            trend="up"
          />
          <StatCard
            title="Время доставки"
            value="24 мин"
            change="-8.3%"
            icon={Clock}
            trend="up"
          />
        </div>

        {/* Графики */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* График производительности */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Динамика производительности
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="deliveries" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Доставки"
                />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Эффективность (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Распределение по районам */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Распределение маршрутов по районам
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={routeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {routeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Производительность водителей */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Топ водителей по производительности
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={driverPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="deliveries" fill="#3B82F6" name="Доставки" />
              <Bar dataKey="efficiency" fill="#10B981" name="Эффективность (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Детальная таблица */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Детальная статистика водителей
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Водитель
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Доставки
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Рейтинг
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Эффективность
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {driverPerformance.map((driver, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {driver.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {driver.deliveries}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      ⭐ {driver.rating}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {driver.efficiency}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Активен
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
}