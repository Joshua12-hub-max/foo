import { useState, useMemo } from 'react';

export const useAttendanceFilters = (data) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter(item => {
      // Search filter (checks name, ID, or department)
      const matchesSearch = 
        !searchQuery || 
        (item.employee_name && item.employee_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.employee_id && item.employee_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.department && item.department.toLowerCase().includes(searchQuery.toLowerCase()));

      // Date range filter
      let matchesDate = true;
      if (dateRange.from && dateRange.to) {
        const itemDate = new Date(item.date);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        // Set times to compare dates only
        itemDate.setHours(0,0,0,0);
        fromDate.setHours(0,0,0,0);
        toDate.setHours(0,0,0,0);
        
        matchesDate = itemDate >= fromDate && itemDate <= toDate;
      }

      return matchesSearch && matchesDate;
    });
  }, [data, searchQuery, dateRange]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  
  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateRange({ from: '', to: '' });
  };

  return {
    searchQuery,
    dateRange,
    filteredData,
    handleSearchChange,
    handleDateRangeChange,
    clearFilters
  };
};
