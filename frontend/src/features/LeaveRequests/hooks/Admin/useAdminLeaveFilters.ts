import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { AdminLeaveRequest, LeaveFilters } from '../../types';

export const useAdminLeaveFilters = (data: AdminLeaveRequest[] = []) => {
  const [pendingFilters, setPendingFilters] = useState<LeaveFilters>({department: '', employee: '', fromDate: '', toDate: ''});
  const [appliedFilters, setAppliedFilters] = useState<LeaveFilters>({department: '', employee: '', fromDate: '', toDate: ''});
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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


  const handleFilterChange = useCallback((field: keyof LeaveFilters, value: string) => {
    setPendingFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const [filterError, setFilterError] = useState<string | null>(null);

  const handleApplyFilters = useCallback(() => {
    const hasFilters = pendingFilters.department || pendingFilters.employee || pendingFilters.fromDate || pendingFilters.toDate;
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

  const handleClear = useCallback(() => {
    const emptyFilters: LeaveFilters = { department: '', employee: '', fromDate: '', toDate: '' };
    setPendingFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSearchQuery('');
    setFilterError(null);
  }, []);

  const filteredData = useMemo(() => {
    let result = data;

    if (appliedFilters.department) {
      result = result.filter(item => item.department === appliedFilters.department);
    }

    if (appliedFilters.employee) {
      result = result.filter(item => item.name === appliedFilters.employee);
    }

    if (appliedFilters.fromDate) {
      result = result.filter(item => item.fromDate >= appliedFilters.fromDate);
    }
    if (appliedFilters.toDate) {
      result = result.filter(item => item.toDate <= appliedFilters.toDate);
    }

    const query = debouncedSearchQuery.toLowerCase();
    if (query) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(query) ||
        String(item.id).toLowerCase().includes(query) ||
        item.department.toLowerCase().includes(query)
      );
    }

    return result;
  }, [data, appliedFilters, debouncedSearchQuery]);

  return {
    filters: pendingFilters,
    appliedFilters,
    searchQuery,
    debouncedSearchQuery,
    filteredData,
    filterError,
    handleFilterChange,
    handleApplyFilters,
    handleSearchChange,
    handleClear
  };
};
