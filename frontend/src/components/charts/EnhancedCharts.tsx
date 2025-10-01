import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { motion } from 'framer-motion';
import { 
  CHART_COLORS, 
  AXIS_STYLES, 
  GRID_STYLES, 
  TOOLTIP_CURSOR,
  CHART_CONTAINER_CLASS,
  CHART_TITLE_CLASS,
  CHART_SUBTITLE_CLASS
} from './ChartStyles';

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

// Neon tooltip with glow
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-gray-900/95 backdrop-blur-md p-4 rounded-xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.3)]"
    >
      <p className="font-semibold text-white text-sm mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
            style={{ backgroundColor: entry.color, color: entry.color }}
          />
          <span className="text-gray-400">{entry.name}:</span>
          <span className="font-bold text-white">
            {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          </span>
        </div>
      ))}
    </motion.div>
  );
};

// Анимированная линейная диаграмма
export const AnimatedLineChart: React.FC<{
  data: ChartData[];
  dataKeys: string[];
  title?: string;
  height?: number;
}> = ({ data, dataKeys, title, height = 300 }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={CHART_CONTAINER_CLASS}
    >
      {title && (
        <h3 className={CHART_TITLE_CLASS}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {dataKeys.map((key, index) => (
              <React.Fragment key={key}>
                <linearGradient id={`line-gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.primary[index % 3]} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={CHART_COLORS.primary[index % 3]} stopOpacity={0.05} />
                </linearGradient>
                <filter id={`glow-${key}`}>
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </React.Fragment>
            ))}
          </defs>
          <CartesianGrid {...GRID_STYLES} />
          <XAxis dataKey="name" {...AXIS_STYLES} />
          <YAxis {...AXIS_STYLES} />
          <Tooltip content={<CustomTooltip />} cursor={TOOLTIP_CURSOR} />
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={CHART_COLORS.primary[index % 3]}
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 7,
                fill: CHART_COLORS.primary[index % 3],
                strokeWidth: 0,
                filter: `url(#glow-${key})`,
              }}
              fill={`url(#line-gradient-${key})`}
              filter={`url(#glow-${key})`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// Анимированная Area диаграмма с градиентом
export const AnimatedAreaChart: React.FC<{
  data: ChartData[];
  dataKeys: string[];
  title?: string;
  height?: number;
}> = ({ data, dataKeys, title, height = 300 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            {dataKeys.map((key, index) => (
              <linearGradient key={key} id={`area-gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={COLORS.success[index % 3]}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={COLORS.success[index % 3]}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          <XAxis
            dataKey="name"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            tickLine={false}
          />
          <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            formatter={(value) => (
              <span className="text-gray-700 dark:text-gray-300">{value}</span>
            )}
          />
          {dataKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS.success[index % 3]}
              strokeWidth={2}
              fill={`url(#area-gradient-${key})`}
              animationDuration={1000}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// Анимированная Bar диаграмма
export const AnimatedBarChart: React.FC<{
  data: ChartData[];
  dataKeys: string[];
  title?: string;
  height?: number;
  horizontal?: boolean;
}> = ({ data, dataKeys, title, height = 300, horizontal = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'}>
          <defs>
            {dataKeys.map((key, index) => (
              <linearGradient key={key} id={`bar-gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.info[index % 3]} stopOpacity={0.9} />
                <stop offset="95%" stopColor={COLORS.info[index % 3]} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          {horizontal ? (
            <>
              <XAxis type="number" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
              />
            </>
          ) : (
            <>
              <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
            </>
          )}
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
            formatter={(value) => (
              <span className="text-gray-700 dark:text-gray-300">{value}</span>
            )}
          />
          {dataKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={`url(#bar-gradient-${key})`}
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
              animationBegin={index * 100}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// Анимированная Pie диаграмма
export const AnimatedPieChart: React.FC<{
  data: ChartData[];
  title?: string;
  height?: number;
}> = ({ data, title, height = 300 }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <defs>
            {data.map((entry, index) => (
              <linearGradient key={`pie-gradient-${index}`} id={`pie-gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={COLORS.purple[index % 3]} stopOpacity={1} />
                <stop offset="100%" stopColor={COLORS.primary[index % 3]} stopOpacity={0.8} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={activeIndex !== null ? 90 : 80}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            animationDuration={1000}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#pie-gradient-${index})`}
                stroke="#fff"
                strokeWidth={2}
                style={{
                  filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// Radar Chart для сравнения показателей
export const AnimatedRadarChart: React.FC<{
  data: ChartData[];
  title?: string;
  height?: number;
}> = ({ data, title, height = 300 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, rotate: -5 }}
      animate={{ opacity: 1, rotate: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data}>
          <defs>
            <linearGradient id="radar-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="#374151" strokeOpacity={0.3} />
          <PolarAngleAxis dataKey="name" tick={{ fill: '#9CA3AF' }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9CA3AF' }} />
          <Radar
            name="Performance"
            dataKey="value"
            stroke="#3B82F6"
            fill="url(#radar-gradient)"
            fillOpacity={0.6}
            animationDuration={1000}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// Статистическая карточка с анимацией
export const AnimatedStatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}> = ({ title, value, subtitle, icon, trend, trendValue, color = 'primary' }) => {
  const colorClasses = {
    primary: 'from-blue-500 to-blue-600',
    success: 'from-green-500 to-green-600',
    warning: 'from-yellow-500 to-yellow-600',
    danger: 'from-red-500 to-red-600',
    info: 'from-cyan-500 to-cyan-600',
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.3 }}
      className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 overflow-hidden"
    >
      {/* Gradient background */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} opacity-10 rounded-full -mr-16 -mt-16`}
      />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h4>
          {icon && (
            <div className={`p-2 bg-gradient-to-br ${colorClasses[color]} rounded-lg text-white`}>
              {icon}
            </div>
          )}
        </div>
        
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-3xl font-bold text-gray-900 dark:text-white mb-1"
        >
          {value}
        </motion.div>
        
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
        
        {trend && trendValue && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={`text-sm font-medium ${
                trend === 'up'
                  ? 'text-green-500'
                  : trend === 'down'
                  ? 'text-red-500'
                  : 'text-gray-500'
              }`}
            >
              {trendIcons[trend]} {trendValue}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">vs last period</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
