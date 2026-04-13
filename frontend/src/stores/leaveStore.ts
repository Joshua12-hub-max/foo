import { create } from 'zustand';
import type {
  LeaveApplication,
  LeaveBalance,
  LeaveFilters,
  ApplicationStatus,
  LeaveType,
} from '@/types/leave.types';

// ============================================================================
// Leave Store State
// ============================================================================

interface LeaveState {
  // Selected items
  selectedApplication: LeaveApplication | null;
  modalMode: 'view' | 'approve' | 'reject' | 'process' | 'finalize' | null;

  // Filters
  filters: LeaveFilters;
  searchQuery: string;
  pagination: { page: number; limit: number };

  // Credits view
  selectedCredits: LeaveBalance[] | null;
  creditsYear: number;

  // UI State
  isSubmitting: boolean;
}

interface LeaveActions {
  // Application actions
  setSelectedApplication: (app: LeaveApplication | null) => void;
  setModalMode: (mode: LeaveState['modalMode']) => void;
  openApproveModal: (app: LeaveApplication) => void;
  openRejectModal: (app: LeaveApplication) => void;
  openProcessModal: (app: LeaveApplication) => void;
  openFinalizeModal: (app: LeaveApplication) => void;
  openViewModal: (app: LeaveApplication) => void;
  closeModal: () => void;

  // Filter actions
  setFilters: (filters: Partial<LeaveFilters>) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  getQuery: () => any;

  // Credits actions
  setSelectedCredits: (credits: LeaveBalance[] | null) => void;
  setCreditsYear: (year: number) => void;

  // UI actions
  setIsSubmitting: (value: boolean) => void;
}

type LeaveStore = LeaveState & LeaveActions;

// ============================================================================
// Default Values
// ============================================================================

const defaultFilters: LeaveFilters = {
  status: '',
  leaveType: '',
  department: '',
  employeeId: '',
  startDate: '',
  endDate: '',
};

const initialPagination = {
    page: 1,
    limit: 50,
};

const initialState: LeaveState = {
  selectedApplication: null,
  modalMode: null,
  filters: defaultFilters,
  searchQuery: '',
  pagination: initialPagination,
  selectedCredits: null,
  creditsYear: new Date().getFullYear(),
  isSubmitting: false,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useLeaveStore = create<LeaveStore>((set, get) => ({
  ...initialState,

  // Application actions
  setSelectedApplication: (app) => set({ selectedApplication: app }),

  setModalMode: (mode) => set({ modalMode: mode }),

  openApproveModal: (app) => set({
    selectedApplication: app,
    modalMode: 'approve',
  }),

  openRejectModal: (app) => set({
    selectedApplication: app,
    modalMode: 'reject',
  }),

  openProcessModal: (app) => set({
    selectedApplication: app,
    modalMode: 'process',
  }),

  openFinalizeModal: (app) => set({
    selectedApplication: app,
    modalMode: 'finalize',
  }),

  openViewModal: (app) => set({
    selectedApplication: app,
    modalMode: 'view',
  }),

  closeModal: () => set({
    selectedApplication: null,
    modalMode: null,
  }),

  // Filter actions
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters },
    pagination: { ...state.pagination, page: 1 } 
  })),

  setSearchQuery: (query) => set((state) => ({ 
    searchQuery: query,
    pagination: { ...state.pagination, page: 1 } 
  })),

  resetFilters: () => set({
    filters: defaultFilters,
    searchQuery: '',
    pagination: initialPagination
  }),
  
  setPage: (page) => set((state) => ({
    pagination: { ...state.pagination, page }
  })),

  setLimit: (limit) => set((state) => ({
    pagination: { ...state.pagination, limit, page: 1 }
  })),

  getQuery: () => {
    const { filters, pagination, searchQuery } = get();
    // Clean up empty strings or undefined
    const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '' && v !== undefined)
    );
    return {
        ...cleanFilters,
        search: searchQuery || undefined,
        page: pagination.page,
        limit: pagination.limit
    };
  },

  // Credits actions
  setSelectedCredits: (credits) => set({ selectedCredits: credits }),

  setCreditsYear: (year) => set({ creditsYear: year }),

  // UI actions
  setIsSubmitting: (value) => set({ isSubmitting: value }),
}));

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const selectSelectedApplication = (state: LeaveStore) => state.selectedApplication;
export const selectModalMode = (state: LeaveStore) => state.modalMode;
export const selectFilters = (state: LeaveStore) => state.filters;
export const selectSearchQuery = (state: LeaveStore) => state.searchQuery;
export const selectIsSubmitting = (state: LeaveStore) => state.isSubmitting;
