import axios from 'axios';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`,
    withCredentials: true,
});

// Request Interceptor - Set Content-Type dynamically
api.interceptors.request.use(
    (config) => {
        // If data is FormData, let axios set the Content-Type automatically (multipart/form-data)
        // Otherwise, set it to application/json
        if (!(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        
        // Log error with clear context (suppress for auth checks)
        if (status === 401) {
            const isAuthCheck = error.config.url?.includes('/auth/me');
            if (!isAuthCheck) {
                console.warn("[Auth] Session expired or not authenticated:", message);
            }
            localStorage.removeItem("user");
            
            // List of public paths where we shouldn't redirect to login on 401
            const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
            const isPublicPath = publicPaths.some(path => window.location.pathname.startsWith(path));

            // Redirect to login page ONLY if we are not already on a public page
            if (!isPublicPath) {
                window.location.href = "/login";
            }
        } else if (status === 403) {
            console.warn("[Auth] Access forbidden:", message);
        } else if (status >= 500) {
            console.error("[Server] Internal error:", message);
        } else {
            console.error("[API] Request failed:", status, message);
        }
        
        return Promise.reject(error);
    }
);

export default api;
