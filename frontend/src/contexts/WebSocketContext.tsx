'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';

// WebSocket message types
export interface WebSocketMessage {
  type: 'route_update' | 'event_notification' | 'eta_update' | 'reoptimization_complete' | 'system_status';
  data: any;
  timestamp: string;
}

// WebSocket context type
interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  subscribe: (type: string, callback: (data: any) => void) => () => void;
  connect: (endpoint: string) => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

// WebSocket provider props
interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const connect = (endpoint: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    const fullUrl = `${wsUrl}${endpoint}`;

    try {
      wsRef.current = new WebSocket(fullUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected to:', fullUrl);
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // Notify subscribers
          const subscribers = subscribersRef.current.get(message.type);
          if (subscribers) {
            subscribers.forEach(callback => callback(message.data));
          }
          
          // Handle system notifications
          if (message.type === 'event_notification' && message.data.severity === 'high') {
            toast.error(`Alert: ${message.data.title}`);
          } else if (message.type === 'reoptimization_complete') {
            toast.success('Route optimization completed');
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect(endpoint);
          }, reconnectDelay * reconnectAttemptsRef.current);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          toast.error('Connection lost. Please refresh the page.');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  };

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message);
    }
  };

  const subscribe = (type: string, callback: (data: any) => void) => {
    if (!subscribersRef.current.has(type)) {
      subscribersRef.current.set(type, new Set());
    }
    
    subscribersRef.current.get(type)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const subscribers = subscribersRef.current.get(type);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          subscribersRef.current.delete(type);
        }
      }
    };
  };

  // Auto-connect to monitoring endpoint on mount
  useEffect(() => {
    connect('/ws/monitoring');
    
    return () => {
      disconnect();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const value: WebSocketContextType = {
    isConnected,
    lastMessage,
    sendMessage,
    subscribe,
    connect,
    disconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Custom hooks for specific WebSocket subscriptions
export const useRouteUpdates = (callback: (data: any) => void) => {
  const { subscribe } = useWebSocket();
  
  useEffect(() => {
    const unsubscribe = subscribe('route_update', callback);
    return unsubscribe;
  }, [subscribe, callback]);
};

export const useEventNotifications = (callback: (data: any) => void) => {
  const { subscribe } = useWebSocket();
  
  useEffect(() => {
    const unsubscribe = subscribe('event_notification', callback);
    return unsubscribe;
  }, [subscribe, callback]);
};

export const useETAUpdates = (callback: (data: any) => void) => {
  const { subscribe } = useWebSocket();
  
  useEffect(() => {
    const unsubscribe = subscribe('eta_update', callback);
    return unsubscribe;
  }, [subscribe, callback]);
};

export const useReoptimizationUpdates = (callback: (data: any) => void) => {
  const { subscribe } = useWebSocket();
  
  useEffect(() => {
    const unsubscribe = subscribe('reoptimization_complete', callback);
    return unsubscribe;
  }, [subscribe, callback]);
};