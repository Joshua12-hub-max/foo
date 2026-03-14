import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { EmployeeLeaveRequest, EmployeeLeaveFilters } from '../../types';

export const useFilters = (data: EmployeeLeaveRequest[] = []) => {
  // Pending filters - what user is inputting (not applied yet)
  const [pendingFilters, setPendingFilters] = useState<EmployeeLeaveFilters>({ 
    date: '', 
    type: '', 
    status: '' 
  });
  // Applied filters - what is actually being used for filtering
  const [appliedFilters, setAppliedFilters] = useState<EmployeeLeaveFilters>({ 
    date: '', 
    type: '', 
    status: '' 
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const handleFilterChange = useCallback((field: keyof EmployeeLeaveFilters, value: string) => {
    setPendingFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Error state for filter validation
  const [filterError, setFilterError] = useState<string | null>(null);

  // Apply the pending filters
  const handleApplyFilters = useCallback(() => {
    // Check if at least one filter is selected
    const hasFilters = pendingFilters.date || pendingFilters.type || pendingFilters.status;
    if (!hasFilters) {
      setFilterError("Please select at least one filter before applying.");
      return;
    }
    setFilterError(null);
    setAppliedFilters({ ...pendingFilters });
  }, [pendingFilters]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Clear both pending and applied filters
  const handleClear = useCallback(() => {
    const emptyFilters: EmployeeLeaveFilters = { date: '', type: '', status: '' };
    setPendingFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSearchQuery('');
    setFilterError(null);
  }, []);

  // Filter data using APPLIED filters only (not pending)
  const filteredData = useMemo(() => {
    let result = data;

    // Apply date filter
    if (appliedFilters.date) {
      result = result.filter((item) => 
        item.startDate === appliedFilters.date || 
        item.endDate === appliedFilters.date ||
        (appliedFilters.date >= item.startDate && appliedFilters.date <= item.endDate)
      );
    }

    // Apply type filter
    if (appliedFilters.type) {
      result = result.filter((item) => 
        item.leaveType === appliedFilters.type
      );
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
