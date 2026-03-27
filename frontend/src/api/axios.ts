import axios, { InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { toCamelCase, toSnakeCase } from '@/utils/caseUtils';
import { JsonValue } from '@/types';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL || ''}/api`,
    withCredentials: true,
});

// Request Interceptor - Set Content-Type dynamically
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Transform body to snake_case for backend
        if (config.data && !(config.data instanceof FormData)) {
            config.data = toSnakeCase(config.data as JsonValue);
            config.headers['Content-Type'] = 'application/json';
        }
        
        // Transform query parameters to snake_case
        if (config.params) {
            config.params = toSnakeCase(config.params as JsonValue);
        }
        
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response Interceptors
api.interceptors.response.use(
    (response: AxiosResponse) => {
        // Transform response data to camelCase for frontend
        if (response.data && typeof response.data === 'object' && !(response.data instanceof Blob)) {
            response.data = toCamelCase(response.data as JsonValue);
        }
        return response;
    },
    (error: AxiosError<{ message?: string }>) => {
        // Ignore aborted requests (handled by specific catch blocks or silent)
        if (error.code === 'ERR_CANCELED') {
            return Promise.reject(error);
        }

        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        
        // Log error with clear context (suppress for auth checks)
        if (status === 401) {
            const isAuthCheck = error.config?.url?.includes('/auth/me');
            if (!isAuthCheck) {
                console.warn("[Auth] Session expired or not authenticated:", message);
            }
            // Just clear storage, don't force a page reload
            localStorage.removeItem('isLoggedIn');
        } else if (status === 403) {
            console.warn("[Auth] Access forbidden:", message);
        } else if (status && status >= 500) {
            console.error("[Server] Internal error:", message);
        } else {
            console.error("[API] Request failed:", status, message);
        }
        
        return Promise.reject(error);
    }
);

export default api;
