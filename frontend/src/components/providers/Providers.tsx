'use client';

import { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { fetcher } from '@/lib/api';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <SWRConfig
      value={{
        fetcher,
        refreshInterval: 30000,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 2000,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        onError: (error) => {
          console.error('Ошибка SWR:', error);
        },
      }}
    >
      <WebSocketProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </WebSocketProvider>
    </SWRConfig>
  );
};