import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { attendanceApi } from '../../../api/attendanceApi';

const ITEMS_PER_PAGE = 10;

export const useBiometricsLogs = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [biometricsData, setBiometricsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const [filters, setFilters] = useState({
    department: "",
    employee: "",
    fromDate: "",
    toDate: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingType, setLoadingType] = useState("");

  const searchTimeoutRef = useRef(null);

  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await attendanceApi.getRawLogs(); 
        if (response.data && response.data.success) {
            const transformedData = response.data.data.map(log => ({
                id: log.employee_id,
                name: `${log.first_name || ''} ${log.last_name || ''}`.trim(),
                department: log.department || 'N/A',
                date: new Date(log.scan_time).toLocaleDateString(),
                scan_date: new Date(log.scan_time), // Keep Date object for filtering
                time: new Date(log.scan_time).toLocaleTimeString(),
                type: log.type, 
                source: log.source,
                status: 'Logged' // Default status for raw logs
            }));
            setBiometricsData(transformedData);
        }
    } catch (err) {
        console.error(err);
        setError("Failed to fetch biometrics logs.");
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Search Debounce
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, debouncedSearchQuery]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSearchChange = useCallback((e) => setSearchQuery(e.target.value), []);

  const handleRefresh = useCallback(() => {
    setLoadingType("data");
    fetchData().finally(() => setLoadingType(""));
  }, [fetchData]);

  const handleClear = useCallback(() => {
    setFilters({ department: "", employee: "", fromDate: "", toDate: "" });
    setSearchQuery("");
  }, []);

  const handleApply = useCallback(() => {
    // Check if at least one filter is selected
    const hasFilters = filters.department || filters.employee || filters.fromDate || filters.toDate;
    if (!hasFilters) {
      setError("Please select at least one filter before applying.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setSuccessMessage("Filters applied!");
    setTimeout(() => setSuccessMessage(null), 3000);
  }, [filters]);

  // Derived Data
  const uniqueDepartments = useMemo(() => [...new Set(biometricsData.map(item => item.department))].sort(), [biometricsData]);
  const uniqueEmployees = useMemo(() => [...new Set(biometricsData.map(item => item.name))].sort(), [biometricsData]);

  const filteredData = useMemo(() => {
    let data = biometricsData;

    if (filters.department) data = data.filter((item) => item.department === filters.department);
    if (filters.employee) data = data.filter((item) => item.name === filters.employee);
    
    if (filters.fromDate) {
        const from = new Date(filters.fromDate);
        from.setHours(0,0,0,0);
        data = data.filter((item) => item.scan_date >= from);
    }
    
    if (filters.toDate) {
        const to = new Date(filters.toDate);
        to.setHours(23,59,59,999);
        data = data.filter((item) => item.scan_date <= to);
    }

    const query = debouncedSearchQuery.toLowerCase();
    if (query) {
      data = data.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query) ||
          item.department.toLowerCase().includes(query)
      );
    }

    return data;
  }, [filters, debouncedSearchQuery, biometricsData]);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentItems = filteredData.slice(startIndex, endIndex);
    return { totalPages, startIndex, endIndex, currentItems };
  }, [filteredData, currentPage]);

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(paginationData.totalPages, p + 1));

  // Export CSV
  const handleExportCSV = useCallback(async () => {
    if (filteredData.length === 0) {
      setError("No data available to export.");
      return;
    }
    setLoadingType("CSV");
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const headers = ['Employee ID', 'Name', 'Department', 'Date', 'Time', 'Type', 'Source'];
      const csvContent = [
        headers.join(','),
        ...filteredData.map(row => [
          row.id,
          row.name,
          row.department,
          row.date,
          row.time,
          row.type,
          row.source
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `biometrics_logs_${today.replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSuccessMessage("CSV exported successfully!");
    } catch (err) {
      console.error('Export to CSV failed:', err);
      setError(`CSV Export failed: ${err.message || 'Unknown error.'}`);
    } finally {
      setLoadingType("");
    }
  }, [filteredData, today]);

  // Export PDF
  const handleExportPDF = useCallback(async () => {
    if (filteredData.length === 0) {
      setError("No data available to export.");
      return;
    }
    setLoadingType("PDF");
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const headers = ['Employee ID', 'Name', 'Department', 'Date', 'Time', 'Type', 'Source'];
      
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Biometrics Logs Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
            .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background-color: #274b46; color: white; padding: 10px; text-align: left; font-weight: bold; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
            tr:hover { background-color: #f8fafc; }
            @media print {
              body { margin: 0; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <h1>Biometrics Logs Report</h1>
          <div class="meta">Generated on: ${today}</div>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(row => `
                <tr>
                  <td>${row.id}</td>
                  <td>${row.name}</td>
                  <td>${row.department}</td>
                  <td>${row.date}</td>
                  <td>${row.time}</td>
                  <td>${row.type}</td>
                  <td>${row.source}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        newWindow.onload = () => {
          setTimeout(() => {
            newWindow.print();
            URL.revokeObjectURL(url);
          }, 250);
        };
      }
      
      setSuccessMessage("PDF print dialog opened!");
    } catch (err) {
      console.error('Export to PDF failed:', err);
      setError(`PDF Export failed: ${err.message || 'Unknown error.'}`);
    } finally {
      setLoadingType("");
    }
  }, [filteredData, today]);


  return {
    today,
    sidebarOpen,
    filters,
    searchQuery,
    debouncedSearchQuery,
    currentPage,
    isLoading,
    loadingType,
    error,
    successMessage,
    filteredData,
    paginationData,
    uniqueDepartments,
    uniqueEmployees,
    setError,
    setSuccessMessage,
    handleFilterChange,
    handleApply,
    handleClear,
    handleSearchChange,
    handleRefresh,
    handlePrevPage,
    handleNextPage,
    handleExportCSV,
    handleExportPDF
  };
};
