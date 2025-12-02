import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response Interceptors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("user");
            // Optional: Redirect to login page
            if (window.location.pathname !== '/login') {
                 window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
