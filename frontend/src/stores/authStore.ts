import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User } from '@/types';
import { getCurrentUser } from '@/Service/Auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: string | null;
  department: string | null;
  authError: string | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  updateProfile: (updates: Partial<User>) => void;
  // login: REMOVED - handled by React Query
  // googleLogin: REMOVED - handled by React Query
  logout: () => void; // Pure state clear
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  role: null,
  department: null,
  authError: null,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

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
             // 1. Wipe local browser storage
             localStorage.clear();
             sessionStorage.clear();
             
             // 2. Clear state
             set({ ...initialState, isLoading: false }); 
        },

        // Action to completely wipe all persistence for security
        nukeAllStores: () => {
             localStorage.clear();
             sessionStorage.clear();
             set({ ...initialState, isLoading: false });
        },

        checkAuth: async () => {
             // Logic mirrored from AuthContext
             const mightBeLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
             if (!mightBeLoggedIn) {
                 set({ isLoading: false });
                 return;
             }

             try {
                 const user = await getCurrentUser();
                 // Ensure we extract the user if it's wrapped (defensive)
                 const actualUser = user?.user || user;
                 get().setUser(actualUser);
             } catch (error: unknown) {
                 console.error("Failed to fetch user:", error);
                 // If 401, clear user
                 if (error && typeof error === 'object' && 'response' in error) {
                     const err = error as { response?: { status?: number } };
                     if (err.response?.status === 401) {
                         localStorage.removeItem('isLoggedIn');
                     }
                 }
                 get().setUser(null);
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
            role: state.role 
        }),
      }
    )
  )
);
