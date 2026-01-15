import { create } from 'zustand';
import { DTRFilterValues, DTRQueryValues } from '../schemas/dtrSchema';

interface DTRState {
  filters: DTRFilterValues;
  pagination: {
    page: number;
    limit: number;
  };
  setFilters: (filters: DTRFilterValues) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  resetFilters: () => void;
  getQuery: () => DTRQueryValues;
}

const initialFilters: DTRFilterValues = {
    employeeId: '',
    department: '',
    startDate: '',
    endDate: '',
};

const initialPagination = {
    page: 1,
    limit: 50,
};

export const useDTRStore = create<DTRState>((set, get) => ({
  filters: initialFilters,
  pagination: initialPagination,

  setFilters: (newFilters) => 
    set((state) => ({ 
        filters: { ...state.filters, ...newFilters },
        pagination: { ...state.pagination, page: 1 } // Reset to page 1 on filter change
    })),

  setPage: (page) => 
    set((state) => ({ 
        pagination: { ...state.pagination, page } 
    })),

  setLimit: (limit) => 
    set((state) => ({ 
        pagination: { ...state.pagination, limit, page: 1 } 
    })),

  resetFilters: () => 
    set(() => ({ 
        filters: initialFilters, 
        pagination: initialPagination 
    })),

  getQuery: () => {
    const { filters, pagination } = get();
    // Clean up empty strings or undefined
    const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '' && v !== undefined)
    );
    return {
        ...cleanFilters,
        page: pagination.page,
        limit: pagination.limit
    };
  },
}));
