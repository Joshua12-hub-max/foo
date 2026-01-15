import { useAuthStore } from '@/stores/authStore';

export const useAuth = () => {
  const store = useAuthStore();

  return {
    // State
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    loading: store.isLoading,
    role: store.role,
    department: store.department,
    
    // Actions
    setUser: store.setUser,
    updateProfile: store.updateProfile,
    logout: store.logout,
    
    // Error state
    authError: store.authError
  };
};

export default useAuth;
