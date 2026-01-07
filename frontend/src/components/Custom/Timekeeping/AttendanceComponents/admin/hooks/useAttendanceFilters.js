import { useState, useMemo } from 'react';

export const useAttendanceFilters = (data) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [status, setStatus] = useState('all');

  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.filter(item => {
      // Search Filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (item.employeeName && item.employeeName.toLowerCase().includes(searchLower)) ||
        (item.employeeId && String(item.employeeId).includes(searchLower));

      // Date Range Filter
      let matchesDate = true;
      if (dateRange.from && dateRange.to) {
        const itemDate = new Date(item.date);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        matchesDate = itemDate >= fromDate && itemDate <= toDate;
      }

      // Status Filter
      let matchesStatus = true;
      if (status && status !== 'all') {
        matchesStatus = item.status === status;
      }

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [data, searchQuery, dateRange, status]);

  const handleSearchChange = (query) => setSearchQuery(query);
  const handleDateRangeChange = (range) => setDateRange(range);
  const handleStatusChange = (newStatus) => setStatus(newStatus);
  
  const clearFilters = () => {
    setSearchQuery('');
    setDateRange({ from: '', to: '' });
    setStatus('all');
  };

  return {
    searchQuery,
    dateRange,
    status,
    filteredData,
    handleSearchChange,
    handleDateRangeChange,
    handleStatusChange,
    clearFilters
  };
};
