import { useState, useEffect, useCallback, useRef } from 'react';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

interface UseOptimizedQueryOptions<T> {
  enabled?: boolean;
  refetchInterval?: number;
  cacheTime?: number;
  staleTime?: number;
  retry?: number;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface QueryResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<void>;
  isFetching: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Simple in-memory cache
const queryCache = new Map<string, CacheEntry<any>>();

export function useOptimizedQuery<T = any>(
  queryKey: string | string[],
  queryFn: () => Promise<T>,
  options: UseOptimizedQueryOptions<T> = {}
): QueryResult<T> {
  const {
    enabled = true,
    refetchInterval,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 0,
    retry = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef<number>(0);
  const refetchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cacheKey = Array.isArray(queryKey) ? queryKey.join(':') : queryKey;

  const fetchData = useCallback(async () => {
    // Check cache first
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < staleTime) {
      setData(cached.data);
      setIsLoading(false);
      setIsSuccess(true);
      return;
    }

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsFetching(true);
    setError(null);
    setIsError(false);

    try {
      const result = await queryFn();
      
      // Update cache
      queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      // Clean old cache entries
      setTimeout(() => {
        const now = Date.now();
        for (const [key, value] of queryCache.entries()) {
          if (now - value.timestamp > cacheTime) {
            queryCache.delete(key);
          }
        }
      }, 0);

      setData(result);
      setIsSuccess(true);
      setIsLoading(false);
      setIsFetching(false);
      retryCountRef.current = 0;

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        return; // Request was cancelled, don't update state
      }

      const error = err as Error;
      
      // Retry logic
      if (retryCountRef.current < retry) {
        retryCountRef.current++;
        setTimeout(() => {
          fetchData();
        }, retryDelay * retryCountRef.current);
        return;
      }

      setError(error);
      setIsError(true);
      setIsLoading(false);
      setIsFetching(false);

      if (onError) {
        onError(error);
      }
    }
  }, [cacheKey, queryFn, staleTime, cacheTime, retry, retryDelay, onSuccess, onError]);

  const refetch = useCallback(async () => {
    // Clear cache for this query
    queryCache.delete(cacheKey);
    await fetchData();
  }, [cacheKey, fetchData]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    fetchData();

    // Setup refetch interval if specified
    if (refetchInterval && refetchInterval > 0) {
      refetchIntervalRef.current = setInterval(() => {
        fetchData();
      }, refetchInterval);
    }

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refetchIntervalRef.current) {
        clearInterval(refetchIntervalRef.current);
      }
    };
  }, [enabled, fetchData, refetchInterval]);

  return {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
    isFetching,
  };
}

// Optimized mutation hook
export function useOptimizedMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
  } = {}
) {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const mutate = useCallback(
    async (variables: TVariables) => {
      setIsLoading(true);
      setError(null);
      setIsError(false);
      setIsSuccess(false);

      try {
        const result = await mutationFn(variables);
        setData(result);
        setIsSuccess(true);
        setIsLoading(false);

        if (options.onSuccess) {
          options.onSuccess(result, variables);
        }

        if (options.onSettled) {
          options.onSettled(result, null, variables);
        }

        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        setIsError(true);
        setIsLoading(false);

        if (options.onError) {
          options.onError(error, variables);
        }

        if (options.onSettled) {
          options.onSettled(undefined, error, variables);
        }

        throw error;
      }
    },
    [mutationFn, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsError(false);
    setIsSuccess(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    mutate,
    reset,
  };
}

// Helper to invalidate cache
export function invalidateQuery(queryKey: string | string[]) {
  const key = Array.isArray(queryKey) ? queryKey.join(':') : queryKey;
  queryCache.delete(key);
}

// Helper to invalidate all queries matching a pattern
export function invalidateQueries(pattern: RegExp) {
  for (const key of queryCache.keys()) {
    if (pattern.test(key)) {
      queryCache.delete(key);
    }
  }
}

// Helper to clear all cache
export function clearAllCache() {
  queryCache.clear();
}
