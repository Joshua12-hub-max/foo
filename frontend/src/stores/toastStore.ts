import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
}

interface ToastActions {
  showToast: (message: string, type?: ToastType, duration?: number) => string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

type ToastStore = ToastState & ToastActions;

const DEFAULT_DURATION = 3000;

export const useToastStore = create<ToastStore>()(
  devtools(
    (set, get) => ({
      toasts: [],

      showToast: (message, type = 'info', duration = DEFAULT_DURATION) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: Toast = { id, message, type, duration };
        
        set((state) => ({toasts: 
          [...state.toasts, newToast],}
        ));

        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        }

        return id;
      },

      success: (message, duration) => get().showToast(message, 'success', duration),
      error: (message, duration) => get().showToast(message, 'error', duration),
      warning: (message, duration) => get().showToast(message, 'warning', duration),
      info: (message, duration) => get().showToast(message, 'info', duration),

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      clearAll: () => set({ toasts: [] }),
    }),
    { name: 'toast-store' }
  )
);
