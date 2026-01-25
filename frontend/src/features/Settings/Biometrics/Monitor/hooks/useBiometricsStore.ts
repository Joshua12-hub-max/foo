
import { create } from 'zustand';

interface BiometricsState {
  isMonitorActive: boolean;
  setIsMonitorActive: (active: boolean) => void;
  // We can add more global UI state here if needed
}

export const useBiometricsStore = create<BiometricsState>((set) => ({
  isMonitorActive: true,
  setIsMonitorActive: (active) => set({ isMonitorActive: active }),
}));
