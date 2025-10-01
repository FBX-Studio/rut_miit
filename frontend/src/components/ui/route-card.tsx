import * as React from 'react';
import { MapPin, Clock, Truck, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Separator } from './separator';

interface RouteCardProps {
  route: {
    id: number;
    name: string;
    status: 'active' | 'completed' | 'pending' | 'delayed';
    driver?: string;
    vehicle?: string;
    stops: number;
    completedStops: number;
    estimatedTime?: string;
    distance?: string;
  };
  onViewDetails?: (id: number) => void;
  className?: string;
}

const statusConfig = {
  active: {
    variant: 'default' as const,
    label: 'Активен',
    icon: Truck,
    color: 'text-indigo-600'
  },
  completed: {
    variant: 'success' as const,
    label: 'Завершён',
    icon: CheckCircle2,
    color: 'text-emerald-600'
  },
  pending: {
    variant: 'secondary' as const,
    label: 'Ожидает',
    icon: Clock,
    color: 'text-gray-600'
  },
  delayed: {
    variant: 'destructive' as const,
    label: 'Задержка',
    icon: AlertCircle,
    color: 'text-rose-600'
  }
};

export function RouteCard({ route, onViewDetails, className }: RouteCardProps) {
  const config = statusConfig[route.status];
  const StatusIcon = config.icon;
  const progress = (route.completedStops / route.stops) * 100;

  return (
    <Card className={cn('group hover:shadow-xl transition-all duration-300', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 group-hover:text-indigo-600 transition-colors">
              {route.name}
            </CardTitle>
            <Badge variant={config.variant} className="gap-1.5">
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
          <div className={cn('p-2 rounded-lg bg-gray-50 dark:bg-gray-800', config.color)}>
            <StatusIcon className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Прогресс</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {route.completedStops} / {route.stops} точек
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500 rounded-full',
                route.status === 'completed' && 'bg-emerald-500',
                route.status === 'active' && 'bg-indigo-500',
                route.status === 'delayed' && 'bg-rose-500',
                route.status === 'pending' && 'bg-gray-400'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Separator />

        {/* Details */}
        <div className="grid grid-cols-2 gap-3">
          {route.driver && (
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400 truncate">
                {route.driver}
              </span>
            </div>
          )}
          {route.vehicle && (
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400 truncate">
                {route.vehicle}
              </span>
            </div>
          )}
          {route.estimatedTime && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {route.estimatedTime}
              </span>
            </div>
          )}
          {route.distance && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {route.distance}
              </span>
            </div>
          )}
        </div>

        {onViewDetails && (
          <>
            <Separator />
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onViewDetails(route.id)}
            >
              Подробнее
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
