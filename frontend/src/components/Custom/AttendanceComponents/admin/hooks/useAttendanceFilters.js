import { useState, useMemo } from 'react';

export const useAttendanceFilters = (data) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [status, setStatus] = useState('');

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

      // Status filter
      let matchesStatus = true;
      if (status) {
        if (status === 'Absent') {
          matchesStatus = item.daily_status === 'Absent' || item.status === 'Absent' || item.absent === 'Yes';
        } else if (status === 'Late') {
          matchesStatus = (item.late > 0) || (item.late_minutes > 0);
        } else if (status === 'Leave') {
          matchesStatus = item.daily_status === 'Leave' || item.status === 'Leave' || item.on_leave === 'Yes';
        } else if (status === 'Undertime') {
           matchesStatus = (item.undertime > 0) || (item.undertime_minutes > 0);
        }
      }

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [data, searchQuery, dateRange, status]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  
  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (value) => {
    setStatus(value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateRange({ from: '', to: '' });
    setStatus('');
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
