import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './card';
import { Badge } from './badge';

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
      <Card className={cn("p-6", className)}>
        <div className="animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-24"></div>
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-24"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-32"></div>
        </div>
      </Card>
    );
  }

  const ChangeIcon = change?.type === 'increase' ? TrendingUp : change?.type === 'decrease' ? TrendingDown : Minus;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card 
        className={cn(
          'p-6 transition-all duration-300 group relative',
          'hover:shadow-[0_12px_32px_rgba(99,102,241,0.2)]',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
        </div>

      
      <div className="space-y-4 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
              {title}
            </p>
            <motion.h3 
              className="text-3xl font-semibold text-gray-900 dark:text-white tabular-nums"
              animate={{ 
                scale: isHovered ? 1.05 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
            </motion.h3>
          </div>
          {Icon && (
            <motion.div 
              className={cn(
                "p-3 rounded-xl flex-shrink-0 relative overflow-hidden",
                change?.type === 'increase' && 'bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-600',
                change?.type === 'decrease' && 'bg-gradient-to-br from-red-50 to-rose-50 text-red-600',
                (!change || change.type === 'neutral') && 'bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600'
              )}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Icon className="h-5 w-5 relative z-10" />
              {/* Glow effect */}
              <div className="absolute inset-0 blur-xl opacity-30 bg-current" />
            </motion.div>
          )}
        </div>
        
        {change && (
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Badge 
              variant={change.type === 'increase' ? 'success' : change.type === 'decrease' ? 'destructive' : 'secondary'}
              className="gap-1"
            >
              <ChangeIcon className="h-3 w-3" />
              <span>{Math.abs(change.value)}%</span>
            </Badge>
            {change.period && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {change.period}
              </span>
            )}
          </motion.div>
        )}
        
        {children && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            {children}
          </div>
        )}
      </div>
      </Card>
    </motion.div>
  );
};