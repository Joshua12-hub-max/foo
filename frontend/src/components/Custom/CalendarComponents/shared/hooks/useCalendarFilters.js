import { useState } from 'react';

/**
 * Custom hook for calendar filtering logic
 * Handles search, date range, type, and employee filtering
 */
export const useCalendarFilters = (events = [], schedules = [], announcements = []) => {
  const [filters, setFilters] = useState({
    searchTerm: '',
    startDate: '',
    endDate: '',
    eventType: 'all',
    selectedEmployee: 'all'
  });

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const filterItems = () => {
    let allItems = [];

    // Combine all items based on type filter
    if (filters.eventType === 'all' || filters.eventType === 'event') {
      allItems = [...allItems, ...events.map(e => ({ ...e, type: 'event' }))];
    }
    if (filters.eventType === 'all' || filters.eventType === 'schedule') {
      allItems = [...allItems, ...schedules.map(s => ({ ...s, type: 'schedule' }))];
    }
    if (filters.eventType === 'all' || filters.eventType === 'announcement') {
      allItems = [...allItems, ...announcements.map(a => ({ ...a, type: 'announcement' }))];
    }

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      allItems = allItems.filter(item => 
        (item.title && item.title.toLowerCase().includes(searchLower)) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.content && item.content.toLowerCase().includes(searchLower))
      );
    }

    // Apply date range filter
    if (filters.startDate || filters.endDate) {
      allItems = allItems.filter(item => {
        const itemDate = new Date(item.date || item.start_date || item.created_at);
        const start = filters.startDate ? new Date(filters.startDate) : null;
        const end = filters.endDate ? new Date(filters.endDate) : null;

        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        return true;
      });
    }

    // Apply employee filter
    if (filters.selectedEmployee !== 'all') {
      allItems = allItems.filter(item => 
        item.employee_id === filters.selectedEmployee
      );
    }

    return allItems;
  };

  const exportToCSV = () => {
    const filteredItems = filterItems();
    
    if (filteredItems.length === 0) {
      alert('No data to export');
      return;
    }

    // Create CSV header
    const headers = ['Type', 'Title', 'Date', 'Time', 'Description', 'Employee ID'];
    
    // Create CSV rows
    const rows = filteredItems.map(item => [
      item.type || '',
      item.title || '',
      item.date || item.start_date || item.created_at || '',
      item.time || item.start_time || '',
      item.description || item.content || '',
      item.employee_id || ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `calendar_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    filters,
    applyFilters,
    filterItems,
    exportToCSV
  };
};
