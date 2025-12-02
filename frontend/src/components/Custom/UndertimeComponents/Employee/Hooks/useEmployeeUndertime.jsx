import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { undertimeApi } from "../../../../../api/undertimeApi";
import { mapUndertimeData, filterUndertimeData, calculatePagination, exportToCSV, exportToPDF, getStatusBadge as getStatusBadgeUtil } from "../Utils/employeeUndertimeUtils";
import { ITEMS_PER_PAGE, MESSAGES, DELAYS, EXPORT_HEADERS, STATUS_STYLES } from "../Constants/employeeUndertime.constant";

export const useEmployeeUndertime = () => {
  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);

  // State management
  const [filters, setFilters] = useState({ fromDate: "",toDate: "",});
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [undertimeData, setUndertimeData] = useState([]);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const searchTimeoutRef = useRef(null);

  // Derived data
  const filteredData = useMemo(
    () => filterUndertimeData(undertimeData, filters, debouncedSearchQuery),
    [filters, debouncedSearchQuery, undertimeData]
  );

  const paginationData = useMemo(
    () => calculatePagination(filteredData, currentPage, ITEMS_PER_PAGE),
    [filteredData, currentPage]
  );

  // API calls
  const fetchUndertimeRequests = useCallback(async () => {
    setIsLoading(true);
    setLoadingType("data");
    setError(null);
    try {
      const response = await undertimeApi.getMyRequests();
      const data = response.data.requests || [];
      const mappedData = mapUndertimeData(data);
      setUndertimeData(mappedData);
      
      // Get employee info from response
      if (response.data.employee_info) {
        setEmployeeInfo(response.data.employee_info);
      }
    } catch (err) {
      console.error("Error fetching undertime requests:", err);
      setError(MESSAGES.ERROR_LOAD);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, []);

  const handleSubmitRequest = useCallback(async (requestData) => {
    setIsLoading(true);
    setLoadingType("submit");
    try {
      await undertimeApi.submitRequest(requestData);
      await fetchUndertimeRequests(); // Refresh data
      setSuccessMessage(MESSAGES.SUCCESS_SUBMIT);
      setIsSubmitModalOpen(false);
    } catch (err) {
      console.error("Error submitting request:", err);
      setError(MESSAGES.ERROR_SUBMIT);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [fetchUndertimeRequests]);

  const handleCancelRequest = useCallback(async (id) => {
    setIsLoading(true);
    setLoadingType("cancel");
    try {
      await undertimeApi.cancelRequest(id);
      await fetchUndertimeRequests(); // Refresh data
      setSuccessMessage(MESSAGES.SUCCESS_CANCEL);
    } catch (err) {
      console.error("Error cancelling request:", err);
      setError(MESSAGES.ERROR_CANCEL);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [fetchUndertimeRequests]);

  // Event handlers
  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApply = useCallback(() => {
    console.log("Filters applied:", JSON.stringify(filters, null, 2));
    setSuccessMessage(MESSAGES.FILTERS_APPLIED);
  }, [filters]);

  const handleClear = useCallback(() => {
    setFilters({ fromDate: "", toDate: "" });
    setSearchQuery("");
    setSuccessMessage(MESSAGES.FILTERS_CLEARED);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchUndertimeRequests();
    setSuccessMessage(MESSAGES.DATA_REFRESHED);
  }, [fetchUndertimeRequests]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, paginationData.totalPages));
  }, [paginationData.totalPages]);

  const handleOpenSubmitModal = useCallback(() => {
    setIsSubmitModalOpen(true);
  }, []);

  const handleCloseSubmitModal = useCallback(() => {
    setIsSubmitModalOpen(false);
  }, []);

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
      const filename = `my_undertime_requests_${today.replace(/\//g, '-')}.csv`;
      await exportToCSV(filteredData, EXPORT_HEADERS, employeeInfo, filename);
      setSuccessMessage(MESSAGES.CSV_EXPORTED);
    } catch (err) {
      console.error('Export to CSV failed:', err);
      setError(`${MESSAGES.ERROR_EXPORT_CSV}: ${err.message || 'Unknown error. Please try again.'}`);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [filteredData, today, employeeInfo]);

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
      await exportToPDF(filteredData, EXPORT_HEADERS, employeeInfo, today, DELAYS.PDF_PRINT_DELAY);
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
    fetchUndertimeRequests();
  }, [fetchUndertimeRequests]);

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
    undertimeData,
    employeeInfo,
    filteredData,
    paginationData,
    isSubmitModalOpen,
    
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
    handleSubmitRequest,
    handleCancelRequest,
    handleOpenSubmitModal,
    handleCloseSubmitModal,
    getStatusBadge
  };
};
