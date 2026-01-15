import { create } from 'zustand';

interface PaginationState {
  page: number;
  limit: number;
  search: string;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  reset: () => void;
}

export const usePaginationStore = create<PaginationState>((set) => ({
  page: 1,
  limit: 10,
  search: '',
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit }),
  setSearch: (search) => set({ search, page: 1 }), // Reset to page 1 on search
  reset: () => set({ page: 1, limit: 10, search: '' }),
}));
