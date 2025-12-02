import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for filtering leave requests by date range and search query
 */
export const useFilters = (data) => {
  const [filters, setFilters] = useState({ fromDate: '', toDate: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const searchTimeoutRef = useRef(null);

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ fromDate: '', toDate: '' });
    setSearchQuery('');
  }, []);

  const filteredData = useMemo(() => {
    let result = data;

    // Apply date filters
    if (filters.fromDate) {
      result = result.filter((item) => item.fromDate >= filters.fromDate);
    }
    if (filters.toDate) {
      result = result.filter((item) => item.toDate <= filters.toDate);
    }

    // Apply search filter
    const query = debouncedSearchQuery.toLowerCase();
    if (query) {
      result = result.filter(
        (item) =>
          item.id.toLowerCase().includes(query) ||
          item.leaveType.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query) ||
          item.department.toLowerCase().includes(query)
      );
    }

    return result;
  }, [data, filters, debouncedSearchQuery]);

  return {
    filters,
    searchQuery,
    debouncedSearchQuery,
    filteredData,
    handleFilterChange,
    handleSearchChange,
    handleClear
  };
};
