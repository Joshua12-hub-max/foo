import { useState, useCallback } from 'react';

export interface UsePaginationProps {
  initialPage?: number;
  initialLimit?: number;
  initialSearch?: string;
  defaultLimit?: number;
}

export interface UsePaginationReturn {
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
  search: string;
  setSearch: (search: string) => void;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  reset: () => void;
}

export const usePagination = ({
  initialPage = 1,
  initialLimit = 10,
  initialSearch = '',
}: UsePaginationProps = {}): UsePaginationReturn => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState(initialSearch);

  const onPageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const onSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1); // Always reset to page 1 on search
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setSearch(initialSearch);
    setLimit(initialLimit);
  }, [initialPage, initialSearch, initialLimit]);

  return {
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    onPageChange,
    onSearchChange,
    reset,
  };
};
