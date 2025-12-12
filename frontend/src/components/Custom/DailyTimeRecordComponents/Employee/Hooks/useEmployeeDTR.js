
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { attendanceApi } from "../../../../../api/attendanceApi";
import { useAuth } from "../../../../../hooks/useAuth";
import { filterDTRData, calculatePagination, exportToCSV, exportToPDF, getStatusBadge as getStatusBadgeUtil } from "../Utils/employeeDTRUtils";
import { ITEMS_PER_PAGE, MESSAGES, DELAYS, EXPORT_HEADERS, STATUS_STYLES } from "../Constants/employeeDTR.constant";

export const useEmployeeDTR = () => {
  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);
  const { user } = useAuth();

  // State management
  const [filters, setFilters] = useState({fromDate: "",toDate: "",});
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [dtrData, setDtrData] = useState([]);

  const searchTimeoutRef = useRef(null);

  const employeeInfo = useMemo(() => ({name: user?.name || "Employee",id: user?.employeeId || "N/A",department: user?.department || "General",}), [user]);

  // Derived data
  const filteredData = useMemo(() => filterDTRData(dtrData, filters, debouncedSearchQuery),[filters, debouncedSearchQuery, dtrData]);

  const paginationData = useMemo(() => calculatePagination(filteredData, currentPage, ITEMS_PER_PAGE),[filteredData, currentPage]);

  // API calls
  const fetchDTRRecords = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setLoadingType("data");
    setError(null);
    try {
      // Fetch my logs
      const response = await attendanceApi.getLogs({ employeeId: user.employeeId });
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
  }, [user]);

  // Event handlers
  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApply = useCallback(() => {
    setSuccessMessage(MESSAGES.FILTERS_APPLIED);
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ fromDate: "", toDate: "" });
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
      const filename = `my_dtr_${today.replace(/\//g, '-')}.csv`;
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
      await exportToPDF(filteredData, EXPORT_HEADERS, today, DELAYS.PDF_PRINT_DELAY, employeeInfo);
      setSuccessMessage(MESSAGES.PDF_EXPORTED);
    } catch (err) {
      console.error('Export to PDF failed:', err);
      setError(`${MESSAGES.ERROR_EXPORT_PDF}: ${err.message || 'Unknown error. Please try again.'}`);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [filteredData, today, employeeInfo]);

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
    filters,
    searchQuery,
    debouncedSearchQuery,
    currentPage,
    isLoading,
    loadingType,
    error,
    successMessage,
    employeeInfo,
    filteredData,
    paginationData,
    
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
