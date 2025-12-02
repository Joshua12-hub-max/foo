import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useOutletContext } from 'react-router-dom';
import { attendanceApi } from "../../../../../api/attendanceApi";
import { filterDTRData, calculatePagination, getUniqueDepartments, getUniqueEmployees, exportToCSV, exportToPDF, getStatusBadge as getStatusBadgeUtil } from "../Utils/adminDTRUtils";
import { ITEMS_PER_PAGE, MESSAGES, DELAYS, EXPORT_HEADERS, STATUS_STYLES } from "../Constants/adminDTR.constant";

export const useAdminDTR = () => {
  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;

  // State management
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
  const [dtrData, setDtrData] = useState([]);

  const searchTimeoutRef = useRef(null);

  // Derived data
  const uniqueDepartments = useMemo(() => getUniqueDepartments(dtrData), [dtrData]);
  const uniqueEmployees = useMemo(() => getUniqueEmployees(dtrData), [dtrData]);
  
  const filteredData = useMemo(
    () => filterDTRData(dtrData, filters, debouncedSearchQuery),
    [filters, debouncedSearchQuery, dtrData]
  );

  const paginationData = useMemo(
    () => calculatePagination(filteredData, currentPage, ITEMS_PER_PAGE),
    [filteredData, currentPage]
  );

  // API calls
  const fetchDTRRecords = useCallback(async () => {
    setIsLoading(true);
    setLoadingType("data");
    setError(null);
    try {
      // Fetch all logs
      const response = await attendanceApi.getLogs({});
      const data = response.data.data || [];
      
      // Map data
      const mappedData = data.map(item => {
          let hoursWorked = '0';
          if (item.time_in && item.time_out) {
            const start = new Date(item.time_in);
            const end = new Date(item.time_out);
            hoursWorked = ((end - start) / (1000 * 60 * 60)).toFixed(2);
          }
          return {
            id: item.employee_id,
            name: item.employee_name || `${item.first_name || ''} ${item.last_name || ''}`.trim(),
            department: item.department || 'N/A',
            date: item.date,
            timeIn: item.time_in ? new Date(item.time_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
            timeOut: item.time_out ? new Date(item.time_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
            hoursWorked: hoursWorked,
            status: item.status || 'Absent',
            remarks: '-'
          };
      });

      setDtrData(mappedData);
    } catch (err) {
      console.error("Error fetching DTR records:", err);
      setError(MESSAGES.ERROR_LOAD);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, []);

  // Event handlers
  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApply = useCallback(() => {
    console.log("Filters applied:", JSON.stringify(filters, null, 2));
    setSuccessMessage(MESSAGES.FILTERS_APPLIED);
  }, [filters]);

  const handleClear = useCallback(() => {
    setFilters({ department: "", employee: "", fromDate: "", toDate: "" });
    setSearchQuery("");
    setSuccessMessage(MESSAGES.FILTERS_CLEARED);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchDTRRecords();
    setSuccessMessage(MESSAGES.DATA_REFRESHED);
  }, [fetchDTRRecords]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, paginationData.totalPages));
  }, [paginationData.totalPages]);

  // Export handlers
  const handleExportCSV = useCallback(async () => {
    if (filteredData.length === 0) {
      setError(MESSAGES.ERROR_NO_DATA);
      return;
    }
    setIsLoading(true);
    setLoadingType("CSV");
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, DELAYS.EXPORT_DELAY));
      const filename = `dtr_${today.replace(/\//g, '-')}.csv`;
      await exportToCSV(filteredData, EXPORT_HEADERS, filename);
      setSuccessMessage(MESSAGES.CSV_EXPORTED);
    } catch (err) {
      console.error('Export to CSV failed:', err);
      setError(`${MESSAGES.ERROR_EXPORT_CSV}: ${err.message || 'Unknown error. Please try again.'}`);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [filteredData, today]);

  const handleExportPDF = useCallback(async () => {
    if (filteredData.length === 0) {
      setError(MESSAGES.ERROR_NO_DATA);
      return;
    }
    setIsLoading(true);
    setLoadingType("PDF");
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, DELAYS.EXPORT_DELAY));
      await exportToPDF(filteredData, EXPORT_HEADERS, today, DELAYS.PDF_PRINT_DELAY);
      setSuccessMessage(MESSAGES.PDF_EXPORTED);
    } catch (err) {
      console.error('Export to PDF failed:', err);
      setError(`${MESSAGES.ERROR_EXPORT_PDF}: ${err.message || 'Unknown error. Please try again.'}`);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [filteredData, today]);

  const getStatusBadge = useCallback((status) => {
    return getStatusBadgeUtil(status, STATUS_STYLES);
  }, []);

  // Effects
  useEffect(() => {
    fetchDTRRecords();
  }, [fetchDTRRecords]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, DELAYS.SEARCH_DEBOUNCE);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), DELAYS.ERROR_DISMISS);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), DELAYS.SUCCESS_DISMISS);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, debouncedSearchQuery]);

  return {
    // Data
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
    dtrData,
    filteredData,
    paginationData,
    uniqueDepartments,
    uniqueEmployees,
    
    // Setters
    setError,
    setSuccessMessage,
    
    // Handlers
    handleFilterChange,
    handleApply,
    handleClear,
    handleSearchChange,
    handleRefresh,
    handlePrevPage,
    handleNextPage,
    handleExportCSV,
    handleExportPDF,
    getStatusBadge
  };
};