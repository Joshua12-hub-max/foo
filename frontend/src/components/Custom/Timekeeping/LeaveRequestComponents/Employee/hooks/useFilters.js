import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for filtering leave requests by date range, status, and search query
 * Filters only apply when user clicks "Apply Filter" button
 */
export const useFilters = (data = []) => {
  // Pending filters - what user is inputting (not applied yet)
  const [pendingFilters, setPendingFilters] = useState({ fromDate: '', toDate: '', status: '' });
  // Applied filters - what is actually being used for filtering
  const [appliedFilters, setAppliedFilters] = useState({ fromDate: '', toDate: '', status: '' });
  
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

  // Handle changes to pending filters (not applied until user clicks Apply)
  const handleFilterChange = useCallback((field, value) => {
    setPendingFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Error state for filter validation
  const [filterError, setFilterError] = useState(null);

  // Apply the pending filters
  const handleApplyFilters = useCallback(() => {
    // Check if at least one filter is selected
    const hasFilters = pendingFilters.fromDate || pendingFilters.toDate || pendingFilters.status;
    if (!hasFilters) {
      setFilterError("Please select at least one filter before applying.");
      return;
    }
    setFilterError(null);
    setAppliedFilters({ ...pendingFilters });
  }, [pendingFilters]);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  // Clear both pending and applied filters
  const handleClear = useCallback(() => {
    setPendingFilters({ fromDate: '', toDate: '', status: '' });
    setAppliedFilters({ fromDate: '', toDate: '', status: '' });
    setSearchQuery('');
    setFilterError(null);
  }, []);

  // Filter data using APPLIED filters only (not pending)
  const filteredData = useMemo(() => {
    let result = data;

    // Apply date filters
    if (appliedFilters.fromDate) {
      result = result.filter((item) => item.fromDate >= appliedFilters.fromDate);
    }
    if (appliedFilters.toDate) {
      result = result.filter((item) => item.toDate <= appliedFilters.toDate);
    }

    // Apply status filter
    if (appliedFilters.status) {
      result = result.filter((item) => 
        item.status.toLowerCase() === appliedFilters.status.toLowerCase()
      );
    }

    // Apply search filter
    const query = debouncedSearchQuery.toLowerCase();
    if (query) {
      result = result.filter(
        (item) =>
          String(item.id).toLowerCase().includes(query) ||
          item.leaveType.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query) ||
          item.department.toLowerCase().includes(query)
      );
    }

    return result;
  }, [data, appliedFilters, debouncedSearchQuery]);

  return {
    filters: pendingFilters,  // For input fields
    appliedFilters,           // For checking what's currently applied
    searchQuery,
    debouncedSearchQuery,
    filteredData,
    filterError,              // Error when no filters selected
    handleFilterChange,
    handleApplyFilters,       // New: Apply filters button handler
    handleSearchChange,
    handleClear
  };
};
