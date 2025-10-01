'use client';

import { useState } from 'react';
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
  Cell,
  AreaChart,
  Area
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
  CheckCircle,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CHART_COLORS, AXIS_STYLES, GRID_STYLES, TOOLTIP_CURSOR } from '@/components/charts/ChartStyles';

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

const StatCard = ({ title, value, change, icon: Icon, trend, index }: any) => {
  const colors = {
    0: { gradient: 'from-indigo-500 to-indigo-600', iconBg: 'bg-indigo-500/20', iconColor: 'text-indigo-400', border: 'border-indigo-500/20', shadow: 'shadow-[0_0_20px_rgba(99,102,241,0.3)]' },
    1: { gradient: 'from-purple-500 to-purple-600', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', border: 'border-purple-500/20', shadow: 'shadow-[0_0_20px_rgba(139,92,246,0.3)]' },
    2: { gradient: 'from-blue-500 to-blue-600', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400', border: 'border-blue-500/20', shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
    3: { gradient: 'from-green-500 to-green-600', iconBg: 'bg-green-500/20', iconColor: 'text-green-400', border: 'border-green-500/20', shadow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]' },
  };
  const color = colors[index as keyof typeof colors] || colors[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border ${color.border} ${color.shadow} hover:scale-105 transition-all duration-300 group`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400 mb-2">{title}</p>
          <p className={`text-3xl font-bold bg-gradient-to-r ${color.gradient} bg-clip-text text-transparent`}>{value}</p>
          <div className={`flex items-center mt-3 text-sm ${
            trend === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            <span className="font-semibold">{change}</span>
          </div>
        </div>
        <div className={`p-4 rounded-xl ${color.iconBg} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-7 h-7 ${color.iconColor}`} />
        </div>
      </div>
    </motion.div>
  );
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('6m');
  const [selectedMetric, setSelectedMetric] = useState('deliveries');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950/30 relative overflow-hidden">
      {}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <NavigationHeader 
        title="Аналитика"
        subtitle="Анализ производительности и метрики системы"
        showBackButton={true}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-wrap gap-4 items-center justify-between"
        >
          <div className="flex gap-3">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-indigo-500/30 rounded-xl bg-gray-900/50 backdrop-blur-sm text-white hover:border-indigo-500/50 transition-all"
            >
              <option value="1m">Последний месяц</option>
              <option value="3m">Последние 3 месяца</option>
              <option value="6m">Последние 6 месяцев</option>
              <option value="1y">Последний год</option>
            </select>
            
            <select 
              value={selectedMetric} 
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-4 py-2 border border-purple-500/30 rounded-xl bg-gray-900/50 backdrop-blur-sm text-white hover:border-purple-500/50 transition-all"
            >
              <option value="deliveries">Доставки</option>
              <option value="efficiency">Эффективность</option>
              <option value="costs">Затраты</option>
            </select>
          </div>
          
          <button className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] flex items-center gap-2 hover:scale-105">
            <Download className="w-4 h-4" />
            <span>Экспорт отчета</span>
          </button>
        </motion.div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Общие доставки"
            value="8,530"
            change="+12.5%"
            icon={Package}
            trend="up"
            index={0}
          />
          <StatCard
            title="Активные водители"
            value="45"
            change="+3.2%"
            icon={Users}
            trend="up"
            index={1}
          />
          <StatCard
            title="Средняя эффективность"
            value="89.2%"
            change="+5.1%"
            icon={TrendingUp}
            trend="up"
            index={2}
          />
          <StatCard
            title="Время доставки"
            value="24 мин"
            change="-8.3%"
            icon={Clock}
            trend="up"
            index={3}
          />
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:border-indigo-500/40 transition-all duration-300"
          >
            <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-6">
              Динамика производительности
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="deliveriesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.primary[1]} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CHART_COLORS.primary[1]} stopOpacity={0.05} />
                  </linearGradient>
                  <filter id="glowDeliveries">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid {...GRID_STYLES} />
                <XAxis dataKey="month" {...AXIS_STYLES} />
                <YAxis {...AXIS_STYLES} />
                <Tooltip cursor={TOOLTIP_CURSOR} />
                <Area 
                  type="monotone" 
                  dataKey="deliveries" 
                  stroke={CHART_COLORS.primary[0]}
                  strokeWidth={3}
                  fill="url(#deliveriesGradient)"
                  filter="url(#glowDeliveries)"
                  name="Доставки"
                />
                <Area 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke={CHART_COLORS.primary[1]}
                  strokeWidth={3}
                  fill="url(#efficiencyGradient)"
                  name="Эффективность (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:border-purple-500/40 transition-all duration-300"
          >
            <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
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
                  outerRadius={90}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#1F2937"
                >
                  {routeDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHART_COLORS.pie[index]} 
                      style={{ filter: 'drop-shadow(0px 0px 8px rgba(99, 102, 241, 0.4))' }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:border-blue-500/40 transition-all duration-300 mb-8"
        >
          <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-6">
            Топ водителей по производительности
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={driverPerformance}>
              <defs>
                <linearGradient id="barGradient1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.primary[2]} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={CHART_COLORS.primary[2]} stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID_STYLES} />
              <XAxis dataKey="name" {...AXIS_STYLES} angle={-15} textAnchor="end" height={80} />
              <YAxis {...AXIS_STYLES} />
              <Tooltip 
                cursor={TOOLTIP_CURSOR}
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '12px',
                  color: '#fff'
                }}
              />
              <Bar 
                dataKey="deliveries" 
                fill="url(#barGradient1)" 
                name="Доставки"
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="efficiency" 
                fill="url(#barGradient2)" 
                name="Эффективность (%)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-indigo-500/20">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Детальная статистика водителей
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Водитель
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Доставки
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Рейтинг
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Эффективность
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {driverPerformance.map((driver, index) => (
                  <motion.tr 
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                    className="hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-white break-words max-w-xs">
                      {driver.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className="font-semibold text-indigo-400">{driver.deliveries}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className="text-yellow-400">⭐</span> {driver.rating}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="font-semibold text-purple-400">{driver.efficiency}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Активен
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}