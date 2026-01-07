import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for filtering and searching admin leave requests
 * Filters only apply when user clicks "Apply" button
 * @param {Array} data - Array of leave requests
 * @returns {Object} Filter state and handlers
 */
export const useAdminLeaveFilters = (data = []) => {
  // Pending filters - what user is inputting (not applied yet)
  const [pendingFilters, setPendingFilters] = useState({
    department: '',
    employee: '',
    status: '',
    fromDate: '',
    toDate: ''
  });
  // Applied filters - what is actually being used for filtering
  const [appliedFilters, setAppliedFilters] = useState({
    department: '',
    employee: '',
    status: '',
    fromDate: '',
    toDate: ''
  });
  
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

  // Get unique departments
  const departments = useMemo(() => 
    [...new Set(data.map(item => item.department))].sort(),
    [data]
  );

  // Get unique employees
  const uniqueEmployees = useMemo(() => 
    [...new Set(data.map(item => item.name))].sort(),
    [data]
  );

  // Handle changes to pending filters (not applied until user clicks Apply)
  const handleFilterChange = useCallback((field, value) => {
    setPendingFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  // Error state for filter validation
  const [filterError, setFilterError] = useState(null);

  // Apply the pending filters
  const handleApplyFilters = useCallback(() => {
    // Check if at least one filter is selected
    const hasFilters = pendingFilters.department || pendingFilters.employee || pendingFilters.status || pendingFilters.fromDate || pendingFilters.toDate;
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
    const emptyFilters = { department: '', employee: '', status: '', fromDate: '', toDate: '' };
    setPendingFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSearchQuery('');
    setFilterError(null);
  }, []);

  // Filter data using APPLIED filters only (not pending)
  const filteredData = useMemo(() => {
    let result = data;

    // Department filter
    if (appliedFilters.department) {
      result = result.filter(item => item.department === appliedFilters.department);
    }

    // Employee filter
    if (appliedFilters.employee) {
      result = result.filter(item => item.name === appliedFilters.employee);
    }

    // Status filter
    if (appliedFilters.status) {
      result = result.filter(item => 
        item.status.toLowerCase() === appliedFilters.status.toLowerCase()
      );
    }

    // Date range filters
    if (appliedFilters.fromDate) {
      result = result.filter(item => item.fromDate >= appliedFilters.fromDate);
    }
    if (appliedFilters.toDate) {
      result = result.filter(item => item.toDate <= appliedFilters.toDate);
    }

    // Search filter
    const query = debouncedSearchQuery.toLowerCase();
    if (query) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(query) ||
        String(item.id).toLowerCase().includes(query) ||
        item.department.toLowerCase().includes(query) ||
        item.leaveType.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query)
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
    departments,
    uniqueEmployees,
    filterError,              // Error when no filters selected
    handleFilterChange,
    handleApplyFilters,       // Apply filters button handler
    handleSearchChange,
    handleClear
  };
};
