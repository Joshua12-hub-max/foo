import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeMenu: string | null;
  isMobile: boolean;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveMenu: (menu: string | null) => void;
  setIsMobile: (isMobile: boolean) => void;
  resetUI: () => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeMenu: null,
  isMobile: false,
};

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        setActiveMenu: (menu) => set({ activeMenu: menu }),
        setIsMobile: (isMobile) => set({ isMobile }),
        resetUI: () => set(initialState),
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({ 
            sidebarOpen: state.sidebarOpen,
            sidebarCollapsed: state.sidebarCollapsed 
        }), // Only persist sidebar state
      }
    )
  )
);
