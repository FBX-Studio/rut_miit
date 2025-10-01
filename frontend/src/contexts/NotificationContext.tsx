'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  timestamp: Date;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  showSuccess: (title: string, message?: string, duration?: number) => string;
  showError: (title: string, message?: string, duration?: number) => string;
  showWarning: (title: string, message?: string, duration?: number) => string;
  showInfo: (title: string, message?: string, duration?: number) => string;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = () => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = generateId();
    const notification: Notification = {
      ...notificationData,
      id,
      timestamp: new Date(),
    };

    setNotifications(prev => [notification, ...prev]);

    if (!notification.persistent) {
      const duration = notification.duration || 5000;
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    toast.success(message || title, {
      duration: duration || 4000,
      position: 'top-right',
    });
    
    return addNotification({
      type: 'success',
      title,
      message,
      duration,
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    toast.error(message || title, {
      duration: duration || 6000,
      position: 'top-right',
    });
    
    return addNotification({
      type: 'error',
      title,
      message,
      duration,
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    toast(message || title, {
      duration: duration || 5000,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: '#FEF3C7',
        color: '#92400E',
        border: '1px solid #F59E0B',
      },
    });
    
    return addNotification({
      type: 'warning',
      title,
      message,
      duration,
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    toast(message || title, {
      duration: duration || 4000,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: '#DBEAFE',
        color: '#1E40AF',
        border: '1px solid #3B82F6',
      },
    });
    
    return addNotification({
      type: 'info',
      title,
      message,
      duration,
    });
  }, [addNotification]);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          className: '',
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          
          success: {
            duration: 4000,
            style: {
              background: '#10B981',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            },
          },
          
          error: {
            duration: 6000,
            style: {
              background: '#EF4444',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#EF4444',
            },
          },
        }}
      />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications должен использоваться внутри NotificationProvider');
  }
  return context;
};

export const useApiNotifications = () => {
  const { showSuccess, showError, showWarning } = useNotifications();
  
  return {
    onSuccess: (message: string) => showSuccess('Успех', message),
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.message || 'Произошла ошибка';
      showError('Ошибка', message);
    },
    onWarning: (message: string) => showWarning('Предупреждение', message),
  };
};

export const useRouteNotifications = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();
  
  return {
    onOptimizationComplete: (routeCount: number) => 
      showSuccess('Оптимизация завершена', `${routeCount} маршрутов было оптимизировано`),
    
    onReoptimizationTriggered: (reason: string) => 
      showInfo('Переоптимизация запущена', `Причина: ${reason}`),
    
    onRouteDelayed: (routeId: number, delay: number) => 
      showWarning('Маршрут задержан', `Маршрут ${routeId} задержан на ${delay} минут`),
    
    onDeliveryCompleted: (orderId: number) => 
      showSuccess('Доставка завершена', `Заказ ${orderId} был доставлен`),
    
    onVehicleBreakdown: (vehicleId: number) => 
      showError('Поломка транспорта', `Транспорт ${vehicleId} сообщил о поломке`),
    
    onTrafficAlert: (routeId: number, impact: string) => 
      showWarning('Предупреждение о пробках', `Маршрут ${routeId}: ${impact}`),
  };
};