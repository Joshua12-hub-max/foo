import axios from "axios";

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth`,
    withCredentials: true,
    headers: { "Content-Type": "application/json",}
});

api.interceptors.request.use((config) => {
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptors
api.interceptors.response.use((response) => response,(error) => {
    if (error.response?.status === 401) {
        // Optional: Redirect to login or clear user state if needed
    }
    return Promise.reject(error);
});

export const register = (data) => api.post("/register", data);
export const login = (data) => api.post("/login", data);
export const googleLogin = (data) => api.post("/google", data);
export const logout = () => api.post("/logout");
export const resendVerification = async (email) => {
  const response = await api.post("/resend-verification", { email });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post("/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post("/reset-password", { token, newPassword });
  return response.data;
};

// ... existing exports
export const getCurrentUser = async () => {
    const response = await api.get("/me");
    return response.data.data;
};

export const updateProfile = async (formData) => {
    const response = await api.post("/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
};

export default api;