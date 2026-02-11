import { create } from 'zustand';
import { type AllowanceSchedule, type AllowanceDefinition, allowanceApi } from '../api/allowanceApi';

interface AllowanceState {
  activeSchedule: (AllowanceSchedule & { allowances: AllowanceDefinition[] }) | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchActiveSchedule: () => Promise<void>;
  setActiveSchedule: (schedule: (AllowanceSchedule & { allowances: AllowanceDefinition[] }) | null) => void;
}

export const useAllowanceStore = create<AllowanceState>((set) => ({
  activeSchedule: null,
  isLoading: false,
  error: null,

  fetchActiveSchedule: async () => {
    set({ isLoading: true, error: null });
    try {
      const schedule = await allowanceApi.getActiveSchedule();
      set({ activeSchedule: schedule, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  setActiveSchedule: (schedule) => set({ activeSchedule: schedule })
}));
