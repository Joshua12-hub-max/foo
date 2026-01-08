import { createContext, useState, useEffect } from 'react';
import { login as loginApi, googleLogin as googleLoginApi, getCurrentUser, resendVerification, logout as logoutApi } from '../Service/Auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // optimization: only check auth if we think we are logged in
      const mightBeLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

      if (!mightBeLoggedIn) {
          setLoading(false);
          return;
      }

      try {
        const response = await getCurrentUser();
        setUser(response); 
      } catch (error) {
         // If check fails (e.g. cookie expired), clear the flag
         localStorage.removeItem('isLoggedIn');
         
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
    
    // Check for 2FA challenge
    if (response.data.requires2FA) {
      return { 
        requires2FA: true, 
        identifier: response.data.identifier, // Actual email for OTP verification
        maskedEmail: response.data.maskedEmail // For display
      };
    }

    const userData = response.data.data;
    setUser(userData);
    localStorage.setItem('isLoggedIn', 'true');
    return userData;
  };

  const googleLogin = async (credential) => {
    const response = await googleLoginApi({ credential });
    
    // Check for 2FA challenge (Strict Google Login)
    if (response.data.requires2FA) {
      return { 
        requires2FA: true, 
        identifier: response.data.identifier, // Actual email for OTP verification
        maskedEmail: response.data.maskedEmail // For display
      };
    }

    const userData = response.data.data;
    setUser(userData);
    localStorage.setItem('isLoggedIn', 'true');
    return userData;
  };

  const logout = async () => {
    try {
        await logoutApi();
    } catch (e) {
        console.error("Logout failed", e);
    }
    localStorage.removeItem('isLoggedIn');
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