import { ReactNode, useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

const cn = clsx;

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period?: string;
  };
  icon?: LucideIcon;
  iconColor?: string;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
}

export const StatsCard = ({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-primary-600',
  loading = false,
  className = '',
  children,
}: StatsCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getChangeColor = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return 'text-success-600';
      case 'decrease':
        return 'text-danger-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getChangeIcon = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return '↗';
      case 'decrease':
        return '↘';
      case 'neutral':
        return '→';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className={cn(
        "bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700",
        className
      )}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50',
        'hover:shadow-xl transition-all duration-500 hover:-translate-y-1 hover:bg-white dark:hover:bg-gray-800',
        'group relative overflow-hidden',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glowing border effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-sm -z-20"></div>
      
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-emerald-50/30 dark:from-indigo-900/20 dark:to-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300 break-words max-w-full">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight group-hover:scale-105 transition-transform duration-300 break-words max-w-full">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <div className="flex items-center mt-1 sm:mt-2">
              <span className={`text-xs sm:text-sm font-medium ${getChangeColor(change.type)} transition-all duration-300`}>
                {getChangeIcon(change.type)} {Math.abs(change.value)}%
              </span>
              {change.period && (
                <span className="text-xs sm:text-sm text-gray-500 ml-2">
                  {change.period}
                </span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl ml-3 sm:ml-4 flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${iconColor}`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:scale-110" />
          </div>
        )}
      </div>
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
};