import { useState, useMemo } from 'react';
import { AttendanceRecord } from './useAttendanceData';

export interface DateRange {
  from: string;
  to: string;
}

export const useAttendanceFilters = (data: AttendanceRecord[] = []) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' });
  const [status, setStatus] = useState<string>('all');

  const filteredData = useMemo((): AttendanceRecord[] => {
    // Runtime defense fallback
    if (!Array.isArray(data)) return[];
    
    return data.filter((item: AttendanceRecord): boolean => {
      // 1. Strict Search Filter
      const searchLower = searchQuery.toLowerCase().trim();
      
      // Use ONLY properties explicitly defined in AttendanceRecord
      const employeeName = item.name ?? `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim();
      const employeeId = String(item.employee_id ?? ''); // Safely cast number|string to string

      const matchesSearch = 
        searchLower === '' || 
        employeeName.toLowerCase().includes(searchLower) ||
        employeeId.toLowerCase().includes(searchLower);

      // 2. Strict Date Range Filter (Zero NaN Loopholes)
      let matchesDate = true;
      if (dateRange.from.trim() !== '' && dateRange.to.trim() !== '') {
        const itemTime = new Date(item.date).getTime();
        const fromTime = new Date(dateRange.from).getTime();
        const toTime = new Date(dateRange.to).getTime();

        // Prevent Invalid Date (NaN) comparisons from failing silently
        if (!Number.isNaN(itemTime) && !Number.isNaN(fromTime) && !Number.isNaN(toTime)) {
          matchesDate = itemTime >= fromTime && itemTime <= toTime;
        }
      }

      // 3. Strict Status Filter (Case-insensitive & whitespace trimmed)
      const matchesStatus = 
        status === 'all' || 
        item.status.trim().toLowerCase() === status.trim().toLowerCase();

      return matchesSearch && matchesDate && matchesStatus;
    });
  },[data, searchQuery, dateRange, status]);

  const handleSearchChange = (query: string): void => setSearchQuery(query);
  const handleDateRangeChange = (range: DateRange): void => setDateRange(range);
  const handleStatusChange = (newStatus: string): void => setStatus(newStatus);
  
  const clearFilters = (): void => {
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
  } as const; // Freezes the return object structure for perfect type inference in consuming components
};