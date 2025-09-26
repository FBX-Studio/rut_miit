'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';

interface SystemStats {
  total_routes: number;
  active_routes: number;
  completed_routes: number;
  total_orders: number;
  delivered_orders: number;
  pending_orders: number;
  total_vehicles: number;
  available_vehicles: number;
  total_drivers: number;
  available_drivers: number;
  active_events: number;
  optimization_score_avg: number;
  on_time_delivery_rate: number;
  fuel_efficiency: number;
}

const fetcher = async (url: string): Promise<SystemStats> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Не удалось загрузить статистику системы');
  }
  return response.json();
};

export const useSystemStats = () => {
  const { data, error, isLoading, mutate } = useSWR<SystemStats>(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/monitoring/stats`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    stats: data,
    isLoading,
    error,
    refetch: mutate,
  };
};