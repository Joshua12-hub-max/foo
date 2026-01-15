import { create } from 'zustand';
import { AttendanceFilterValues } from '../schemas/attendanceSchema';

interface BiometricsState {
  // Enrollment State
  isEnrollmentModalOpen: boolean;
  enrollmentStep: number;
  statusMessage: string;
  selectedEmployeeId: string | null;
  
  // Logs State
  logFilters: AttendanceFilterValues;
  logPagination: {
    page: number;
    limit: number;
  };

  // Actions
  openEnrollmentModal: (employeeId?: string) => void;
  closeEnrollmentModal: () => void;
  setEnrollmentStep: (step: number) => void;
  setStatusMessage: (message: string) => void;
  resetEnrollment: () => void;

  setLogFilters: (filters: AttendanceFilterValues) => void;
  setLogPage: (page: number) => void;
  resetLogFilters: () => void;
  getLogQuery: () => any;
}

const initialEnrollmentState = {
    isEnrollmentModalOpen: false,
    enrollmentStep: 0, 
    statusMessage: '',
    selectedEmployeeId: null,
};

const initialLogFilters: AttendanceFilterValues = {
    employeeId: '',
    department: '',
    startDate: '',
    endDate: '',
};

const initialLogPagination = {
    page: 1,
    limit: 50,
};

export const useBiometricsStore = create<BiometricsState>((set, get) => ({
  ...initialEnrollmentState,
  logFilters: initialLogFilters,
  logPagination: initialLogPagination,

  openEnrollmentModal: (employeeId) => 
    set(() => ({ 
        isEnrollmentModalOpen: true, 
        selectedEmployeeId: employeeId || null,
        enrollmentStep: 0,
        statusMessage: ''
    })),

  closeEnrollmentModal: () => 
    set(() => ({ 
        isEnrollmentModalOpen: false,
        selectedEmployeeId: null 
    })),

  setEnrollmentStep: (step) => set({ enrollmentStep: step }),
  
  setStatusMessage: (message) => set({ statusMessage: message }),

  resetEnrollment: () => set(initialEnrollmentState),

  setLogFilters: (newFilters) => 
    set((state) => ({ 
        logFilters: { ...state.logFilters, ...newFilters },
        logPagination: { ...state.logPagination, page: 1 }
    })),

  setLogPage: (page) => 
    set((state) => ({ 
        logPagination: { ...state.logPagination, page } 
    })),

  resetLogFilters: () => 
    set(() => ({ 
        logFilters: initialLogFilters,
        logPagination: initialLogPagination
    })),

  getLogQuery: () => {
    const { logFilters, logPagination } = get();
    // Clean up empty strings
    const cleanFilters = Object.fromEntries(
        Object.entries(logFilters).filter(([_, v]) => v !== '' && v !== undefined)
    );
    return {
        ...cleanFilters,
        page: logPagination.page,
        limit: logPagination.limit
    };
  }
}));
