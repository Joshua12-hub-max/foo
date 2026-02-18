import { useState, useCallback } from 'react';
import api from '../api/axios';
import { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { z } from 'zod';

interface UseAxiosResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  execute: (config?: AxiosRequestConfig) => Promise<T>;
  reset: () => void;
}

interface UseAxiosOptions<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  initialData?: T | null;
  manual?: boolean;
  schema?: z.ZodSchema<T>; // Optional runtime validation
}

/**
 * A generic hook for Axios requests with type safety and optional Zod validation.
 * @param options Configuration options for the hook
 */
export function useAxios<T = any>(options: UseAxiosOptions<T>): UseAxiosResult<T> {
  const [data, setData] = useState<T | null>(options.initialData || null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!options.manual);

  const execute = useCallback(async (config?: AxiosRequestConfig) => {
    setLoading(true);
    setError(null);

    try {
      const response: AxiosResponse<T> = await api({
        method: options.method || 'GET',
        url: options.url,
        ...config,
      });

      let result = response.data;

      // Optional Zod Validation
      if (options.schema) {
        const validation = options.schema.safeParse(result);
        if (!validation.success) {
          console.error("Type Validation Failed:", validation.error);
          throw new Error("Data validation failed");
        }
        result = validation.data;
      }

      setData(result);
      return result;
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || axiosError.message || 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [options.method, options.url, options.schema]);

  return { data, error, loading, execute, reset: () => { setData(null); setError(null); setLoading(false); } };
}
