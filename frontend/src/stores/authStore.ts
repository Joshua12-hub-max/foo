import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User } from '@/types';
import { getCurrentUser } from '@/Service/Auth';
import axios, { AxiosError } from 'axios';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: string | null;
  department: string | null;
  authError: string | null;
  isEmployeeView: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  updateProfile: (updates: Partial<User>) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  nukeAllStores: () => void;
  setPortalView: (isEmployee: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  role: null,
  department: null,
  authError: null,
  isEmployeeView: false,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setPortalView: (isEmployee) => {
          set({ isEmployeeView: isEmployee });
        },

        setUser: (user) => {
          set({
            user,
            isAuthenticated: !!user,
            role: user?.role || null,
            department: user?.department || null,
            isLoading: false,
          });
        },

        updateProfile: (updates) => {
          const { user } = get();
          if (user) {
            set({ user: { ...user, ...updates } });
          }
        },

        logout: () => {
             localStorage.clear();
             sessionStorage.clear();
             set({ ...initialState, isLoading: false }); 
        },

        nukeAllStores: () => {
             localStorage.clear();
             sessionStorage.clear();
             set({ ...initialState, isLoading: false });
        },

        checkAuth: async () => {
             const mightBeLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
             if (!mightBeLoggedIn) {
                 if (get().isAuthenticated || get().user) {
                    set({ ...initialState, isLoading: false });
                 } else {
                    set({ isLoading: false });
                 }
                 return;
             }

             try {
                 const user = await getCurrentUser();
                 // getCurrentUser already returns User, but we handle potential wrapping just in case
                 const response = user as User | { user: User };
                 const actualUser = (response && 'user' in response) ? response.user : response;
                 get().setUser(actualUser);
             } catch (error) {
                 if (axios.isCancel(error) || (error as AxiosError).code === 'ERR_CANCELED') {
                     return;
                 }
                 
                 console.error("Failed to fetch user:", error);
                 if (axios.isAxiosError(error) && error.response?.status === 401) {
                     localStorage.removeItem('isLoggedIn');
                 }
                 set({ ...initialState, isLoading: false });
             } finally {
                 set({ isLoading: false });
             }
        },

        clearError: () => set({ authError: null }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
            user: state.user,
            isAuthenticated: state.isAuthenticated,
            role: state.role,
            isEmployeeView: state.isEmployeeView
        }),
      }
    )
  )
);
