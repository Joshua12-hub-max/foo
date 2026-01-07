import { createContext, useState, useEffect } from 'react';
import { login as loginApi, googleLogin as googleLoginApi, getCurrentUser, resendVerification, logout as logoutApi } from '../Service/Auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await getCurrentUser();
        setUser(response); 
      } catch (error) {
        // Silent failure is expected if no cookie
        if (error.response?.status !== 401) {
             console.error("Failed to fetch user:", error);
        }
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const response = await loginApi(credentials);
    const userData = response.data.data;
    setUser(userData);
    return userData;
  };

  const googleLogin = async (credential) => {
    const response = await googleLoginApi({ credential });
    const userData = response.data.data;
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
        await logoutApi();
    } catch (e) {
        console.error("Logout failed", e);
    }
    setUser(null);
  };

  // Update user profile (for syncing changes across app)
  const updateProfile = (updates) => {
    setUser(prev => ({
      ...prev,
      ...updates
    }));
  };

  const value = {
    user,
    setUser,
    updateProfile,
    role: user?.role,
    department: user?.department,
    loading,
    login,
    googleLogin,
    logout,
    resendVerification,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};