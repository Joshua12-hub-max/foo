import { create } from 'zustand';
import { AttendanceFilterValues, AttendanceQueryValues } from '../schemas/attendanceSchema';

interface AttendanceState {
  filters: AttendanceFilterValues;
  pagination: {
    page: number;
    limit: number;
  };
  setFilters: (filters: AttendanceFilterValues) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  resetFilters: () => void;
  getQuery: () => AttendanceQueryValues;
}

export const initialFilters: AttendanceFilterValues = {
  department: '',
  employeeId: '',
  startDate: '',
  endDate: '',
};

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  filters: initialFilters,
  pagination: {
    page: 1,
    limit: 50,
  },
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 }, // Reset to page 1 on filter change
    })),
  setPage: (page) =>
    set((state) => ({
      pagination: { ...state.pagination, page },
    })),
  setLimit: (limit) =>
    set((state) => ({
      pagination: { ...state.pagination, limit, page: 1 },
    })),
  resetFilters: () =>
    set(() => ({
      filters: initialFilters,
      pagination: { page: 1, limit: 50 },
    })),
  getQuery: () => {
    const state = get();
    const query: Record<string, string | number> = {};

    // Filter out empty strings from filters
    Object.entries(state.filters).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        query[key] = value;
      }
    });

    // Add pagination
    return {
      ...query,
      ...state.pagination,
    };
  },
}));
