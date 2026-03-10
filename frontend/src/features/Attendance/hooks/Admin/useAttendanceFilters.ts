import { useState, useMemo } from 'react';
import { AttendanceRecord } from '@/types';

export interface DateRange {
  from: string;
  to: string;
}

export const useAttendanceFilters = (data: AttendanceRecord[]) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' });
  const [status, setStatus] = useState<string>('all');

  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.filter(item => {
      // Search Filter
      const searchLower = searchQuery.toLowerCase();
      const employeeName = item.employeeName || item.name || '';
      const employeeId = item.employeeId || item.employeeId;

      const matchesSearch = 
        (employeeName && employeeName.toLowerCase().includes(searchLower)) ||
        (employeeId && String(employeeId).includes(searchLower));

      // Date Range Filter
      let matchesDate = true;
      if (dateRange.from && dateRange.to) {
        const itemDate = new Date(item.date);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        // Normalize to dates only if needed, but here simple comparison works for strings usually if formatted right or Date objects
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

  const handleSearchChange = (query: string) => setSearchQuery(query);
  const handleDateRangeChange = (range: DateRange) => setDateRange(range);
  const handleStatusChange = (newStatus: string) => setStatus(newStatus);
  
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
