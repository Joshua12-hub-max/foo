import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { User } from '@/types';

interface EmployeeState {
  viewMode: 'grid' | 'list';
  searchTerm: string;
  departmentFilter: string;
  selectedEmployee: User | null;
}

interface EmployeeActions {
  setViewMode: (mode: 'grid' | 'list') => void;
  setSearchTerm: (term: string) => void;
  setDepartmentFilter: (dept: string) => void;
  setSelectedEmployee: (employee: User | null) => void;
  resetFilters: () => void;
}

const initialState: EmployeeState = {
  viewMode: 'list',
  searchTerm: '',
  departmentFilter: 'All Departments',
  selectedEmployee: null,
};

export const useEmployeeStore = create<EmployeeState & EmployeeActions>()(
  devtools(
    (set) => ({
      ...initialState,
      setViewMode: (mode) => set({ viewMode: mode }),
      setSearchTerm: (term) => set({ searchTerm: term }),
      setDepartmentFilter: (dept) => set({ departmentFilter: dept }),
      setSelectedEmployee: (employee) => set({ selectedEmployee: employee }),
      resetFilters: () => set({ ...initialState, viewMode: 'list' }), // Keep viewMode or reset all? Resetting filters usually implies search/dept
    }),
    { name: 'employee-store' }
  )
);
