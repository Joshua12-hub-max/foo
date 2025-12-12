import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useEmployeeNotificationHistory = () => {
  const { sidebarOpen } = useOutletContext() || { sidebarOpen: true };
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  // State
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 20;

  // Filter states (employee only has date filters)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`${API_URL}/api/notifications/history?${params.toString()}`, {
        withCredentials: true
      });

      setNotifications(response.data.notifications || []);
      setTotalRecords(response.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch notification history:', err);
      setError('Failed to load notification history');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handlers
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleApply = () => {
    setCurrentPage(1);
    fetchNotifications();
  };

  const handleClear = () => {
    setFilters({ startDate: '', endDate: '' });
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchNotifications();
  };

  const handleExportPDF = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`${API_URL}/api/notifications/export-pdf?${params.toString()}`, {
        withCredentials: true
      });

      if (response.data.success) {
        generatePDF(response.data.notifications, response.data.filters);
        setSuccessMessage('PDF exported successfully');
      }
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setError('Failed to export PDF');
    } finally {
      setIsLoading(false);
    }
  };

  // PDF generation
  const generatePDF = (data, appliedFilters) => {
    const printWindow = window.open('', '_blank');
    const filterInfo = [];
    if (appliedFilters.startDate) filterInfo.push(`From: ${appliedFilters.startDate}`);
    if (appliedFilters.endDate) filterInfo.push(`To: ${appliedFilters.endDate}`);

    const rows = data.map((n, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${new Date(n.created_at).toLocaleString()}</td>
        <td>${n.title || ''}</td>
        <td>${n.message || ''}</td>
        <td>${n.type || ''}</td>
        <td>${n.status || ''}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>My Notification History</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          .info { margin-bottom: 20px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; }
          tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>My Notification History</h1>
        <div class="info">
          <p>Generated: ${new Date().toLocaleString()}</p>
          ${filterInfo.length > 0 ? `<p>Filters: ${filterInfo.join(', ')}</p>` : ''}
          <p>Total Records: ${data.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Title</th>
              <th>Message</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Pagination
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  return {
    today,
    sidebarOpen,
    notifications,
    isLoading,
    error,
    successMessage,
    filters,
    currentPage,
    totalPages,
    totalRecords,
    itemsPerPage,
    setError,
    setSuccessMessage,
    handleFilterChange,
    handleApply,
    handleClear,
    handleRefresh,
    handleExportPDF,
    handlePrevPage,
    handleNextPage
  };
};
