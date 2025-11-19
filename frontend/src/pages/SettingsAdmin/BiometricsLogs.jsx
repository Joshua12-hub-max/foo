import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Download, FileText, Search, RefreshCw, AlertCircle, Check, Calendar } from "lucide-react";

const ITEMS_PER_PAGE = 10;

const BiometricsLogsUI = () => {
  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);

  const sidebarOpen = true;

  const [filters, setFilters] = useState({
    department: "",
    employee: "",
    fromDate: "",
    toDate: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [biometricsData, setBiometricsData] = useState([
    {
      id: "EMP-001",
      name: "Juan Dela Cruz",
      department: "Human Resources",
      date: "2025-11-12",
      timeIn: "08:00 AM",
      timeOut: "05:00 PM"
    },
    {
      id: "EMP-002",
      name: "Maria Santos",
      department: "IT Department",
      date: "2025-11-12",
      timeIn: "08:15 AM",
      timeOut: "05:30 PM"
    },
    {
      id: "EMP-003",
      name: "Pedro Reyes",
      department: "Finance",
      date: "2025-11-12",
      timeIn: "07:45 AM",
      timeOut: "04:45 PM"
    },
    {
      id: "EMP-004",
      name: "Ana Garcia",
      department: "Marketing",
      date: "2025-11-12",
      timeIn: "09:00 AM",
      timeOut: "06:00 PM"
    },
    {
      id: "EMP-005",
      name: "Carlos Mendoza",
      department: "IT Department",
      date: "2025-11-11",
      timeIn: "08:30 AM",
      timeOut: "05:15 PM"
    },
  ]);

  const searchTimeoutRef = useRef(null);

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

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, debouncedSearchQuery]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApply = useCallback(() => {
    console.log("Filters applied:", filters);
    setSuccessMessage("Filters applied successfully!");
  }, [filters]);

  const handleClear = useCallback(() => {
    setFilters({ department: "", employee: "", fromDate: "", toDate: "" });
    setSearchQuery("");
    setSuccessMessage("Filters cleared successfully!");
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const uniqueDepartments = useMemo(() => {
    return [...new Set(biometricsData.map(item => item.department))].sort();
  }, [biometricsData]);

  const uniqueEmployees = useMemo(() => {
    return [...new Set(biometricsData.map(item => item.name))].sort();
  }, [biometricsData]);

  const filteredData = useMemo(() => {
    let data = biometricsData;

    if (filters.department) {
      data = data.filter((item) => item.department === filters.department);
    }

    if (filters.employee) {
      data = data.filter((item) => item.name === filters.employee);
    }

    if (filters.fromDate) {
      data = data.filter((item) => item.date >= filters.fromDate);
    }

    if (filters.toDate) {
      data = data.filter((item) => item.date <= filters.toDate);
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

  const handleExportCSV = useCallback(async () => {
    if (filteredData.length === 0) {
      setError("No data available to export.");
      return;
    }
    setIsLoading(true);
    setLoadingType("CSV");
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const headers = ['Department', 'Employee ID', 'Employee Name', 'Date', 'Time In', 'Time Out'];
      const csvContent = [
        headers.join(','),
        ...filteredData.map(row => [
          row.department,
          row.id,
          row.name,
          row.date,
          row.timeIn,
          row.timeOut
        ].map(field => `"${field.replace(/"/g, '""')}"`).join(','))
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
      setError(`CSV Export failed: ${err.message || 'Unknown error. Please try again.'}`);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [filteredData, today]);

  const handleExportPDF = useCallback(async () => {
    if (filteredData.length === 0) {
      setError("No data available to export.");
      return;
    }
    setIsLoading(true);
    setLoadingType("PDF");
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const headers = ['Department', 'Employee ID', 'Employee Name', 'Date', 'Time In', 'Time Out'];
      
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
                  <td>${row.department}</td>
                  <td>${row.id}</td>
                  <td>${row.name}</td>
                  <td>${row.date}</td>
                  <td>${row.timeIn}</td>
                  <td>${row.timeOut}</td>
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
      setError(`PDF Export failed: ${err.message || 'Unknown error. Please try again.'}`);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [filteredData, today]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLoadingType("data");
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage("Data refreshed successfully!");
    } catch (err) {
      setError("Failed to refresh data. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, []);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, paginationData.totalPages));
  }, [paginationData.totalPages]);

  const { totalPages, startIndex, endIndex, currentItems } = paginationData;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#274b46] mx-auto mb-4"></div>
          <p className="text-gray-800">Processing {loadingType === 'data' ? 'data' : loadingType}... </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-100 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Biometrics Logs</h2>
          <p className="text-sm text-gray-800 mt-1">Employee biometric attendance records and transparency</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            title="Refresh data"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-sm text-gray-800 bg-[#F8F9FA] px-4 py-2 rounded-lg border border-gray-300 shadow-sm">
            Date today: <span className="text-gray-800 font-semibold">{today}</span>
          </span>
        </div>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-start gap-3 animate-slide-down" role="alert" aria-live="assertive">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900"
            aria-label="Dismiss error"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-[#274b46] text-green-700 px-4 py-3 rounded mb-4 flex items-start gap-3 animate-slide-down" role="alert" aria-live="polite">
          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Success</p>
            <p className="text-sm">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-700 hover:text-green-900"
            aria-label="Dismiss success message"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 items-start bg-[#F8F9FA] p-4 rounded-lg shadow-md">
        {/* Department Filter */}
        <div className="md:col-span-1">
          <select
            value={filters.department}
            onChange={(e) => handleFilterChange("department", e.target.value)}
            disabled={isLoading}
            className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
            aria-label="Filter by department"
          >
            <option value="">Department</option>
            {uniqueDepartments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Employee Filter */}
        <div className="md:col-span-1">
          <select
            value={filters.employee}
            onChange={(e) => handleFilterChange("employee", e.target.value)}
            disabled={isLoading}
            className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
            aria-label="Filter by employee"
          >
            <option value="">Employee</option>
            {uniqueEmployees.map((emp) => (
              <option key={emp} value={emp}>{emp}</option>
            ))}
          </select>
        </div>

        {/* From Date Filter */}
        <div className="relative md:col-span-1">
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#274b46] pointer-events-none z-10" />
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => handleFilterChange("fromDate", e.target.value)}
            disabled={isLoading}
            className="w-full pl-10 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
            aria-label="From date"
          />
        </div>

        {/* To Date Filter */}
        <div className="relative md:col-span-1">
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#274b46] pointer-events-none z-10" />
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => handleFilterChange("toDate", e.target.value)}
            disabled={isLoading}
            className="w-full pl-10 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
            aria-label="To date"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 md:col-span-2">
          <button
            onClick={handleApply}
            disabled={isLoading}
            className="flex-1 bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold px-3 py-2 rounded-lg text-sm transition-all hover:bg-[#FFFFFF] active:scale-95 shadow-md "
            aria-label="Apply filters"
          >
            Apply
          </button>
          <button
            onClick={handleClear}
            disabled={isLoading}
            className="flex-1 bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold px-3 py-2 rounded-lg text-sm transition-all hover:bg-[#FFFFFF] active:scale-95 shadow-md "
            aria-label="Clear filters"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#274b46]" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by name, ID, or department..."
            disabled={isLoading}
            className="pl-10 pr-4 py-2 bg-[#F8F9FA] border border-gray-300 rounded-lg w-full text-sm"
            aria-label="Search employees"
          />
        </div>
        {searchQuery && (
          <div className="text-sm text-gray-600">
            Found <span className="font-semibold text-gray-800">{filteredData.length}</span> result{filteredData.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Modern Table */}
      <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
        <div className="overflow-x-auto bg-gray-50 rounded-lg">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-[#274b46] text-[#F8F9FA]">
              <tr>
                {["Department", "Employee ID", "Employee Name", "Date", "Time In", "Time Out"].map((header) => (
                  <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length ? (
                currentItems.map((item, index) => (
                  <tr key={`${item.id}-${index}`} className="hover:bg-[#34645c] transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-800">{item.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.timeIn}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.timeOut}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Search className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-lg font-medium">No records found</p>
                      <p className="text-sm mt-1">
                        {debouncedSearchQuery || Object.values(filters).some(v => v) 
                          ? "Try adjusting your filters or search terms" 
                          : "No data available"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && filteredData.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-800">
            Showing <span className="font-semibold text-gray-800">{startIndex + 1}–{Math.min(endIndex, filteredData.length)}</span> of <span className="font-semibold text-gray-800">{filteredData.length}</span> records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || isLoading}
              className="px-4 py-2 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all text-sm font-medium text-gray-800"
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="text-sm px-4 py-2 bg-gray-50 text-gray-800 rounded-lg font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0 || isLoading}
              className="px-4 py-2 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all text-sm font-medium text-gray-800"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiometricsLogsUI;