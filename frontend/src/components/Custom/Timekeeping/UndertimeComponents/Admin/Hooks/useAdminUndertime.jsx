import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useOutletContext } from 'react-router-dom';
import { undertimeApi } from "@api";
import { mapUndertimeData, filterUndertimeData, calculatePagination, getUniqueDepartments, getUniqueEmployees, exportToCSV, exportToPDF, getStatusBadge as getStatusBadgeUtil } from "../Utils/adminUndertimeUtils";
import { ITEMS_PER_PAGE, MESSAGES, DELAYS, EXPORT_HEADERS, STATUS_STYLES } from "../Constants/adminUndertime.constant";

export const useAdminUndertime = () => {
  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;

  // State management - using pendingFilters and appliedFilters pattern
  // Pending filters - what user is inputting (not applied yet)
  const [pendingFilters, setPendingFilters] = useState({
    department: "",
    employee: "",
    status: "",
    fromDate: "",
    toDate: "",
  });
  // Applied filters - what is actually being used for filtering
  const [appliedFilters, setAppliedFilters] = useState({
    department: "",
    employee: "",
    status: "",
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
  const [undertimeData, setUndertimeData] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const searchTimeoutRef = useRef(null);

  // Derived data
  const uniqueDepartments = useMemo(() => getUniqueDepartments(undertimeData), [undertimeData]);
  const uniqueEmployees = useMemo(() => getUniqueEmployees(undertimeData), [undertimeData]);
  
  // Uses appliedFilters instead of immediate filters
  const filteredData = useMemo(
    () => filterUndertimeData(undertimeData, appliedFilters, debouncedSearchQuery),
    [appliedFilters, debouncedSearchQuery, undertimeData]
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
      const response = await undertimeApi.getAllRequests();
      const data = response.data.requests || [];
      const mappedData = mapUndertimeData(data);
      setUndertimeData(mappedData);
    } catch (err) {
      console.error("Error fetching undertime requests:", err);
      setError(MESSAGES.ERROR_LOAD);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, []);

  const handleApproveRequest = useCallback(async () => {
    if (!selectedRequest) return;
    setIsLoading(true);
    setLoadingType("approve");
    try {
      await undertimeApi.approveRequest(selectedRequest.id);
      await fetchUndertimeRequests(); // Refresh data
      setSuccessMessage(MESSAGES.SUCCESS_APPROVE);
      setIsApproveModalOpen(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error("Error approving request:", err);
      setError(MESSAGES.ERROR_APPROVE);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [selectedRequest, fetchUndertimeRequests]);

  const handleRejectRequest = useCallback(async (reason) => {
    if (!selectedRequest) return;
    setIsLoading(true);
    setLoadingType("reject");
    try {
      await undertimeApi.rejectRequest(selectedRequest.id, reason);
      await fetchUndertimeRequests(); // Refresh data
      setSuccessMessage(MESSAGES.SUCCESS_REJECT);
      setIsRejectModalOpen(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error("Error rejecting request:", err);
      setError(MESSAGES.ERROR_REJECT);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [selectedRequest, fetchUndertimeRequests]);

  // Event handlers
  const handleFilterChange = useCallback((field, value) => {
    setPendingFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Apply the pending filters to actually filter the data
  const handleApply = useCallback(() => {
    // Check if at least one filter is selected
    const hasFilters = pendingFilters.department || pendingFilters.employee || pendingFilters.status || pendingFilters.fromDate || pendingFilters.toDate;
    if (!hasFilters) {
      setError("Please select at least one filter before applying.");
      return;
    }
    setAppliedFilters({ ...pendingFilters });
    setSuccessMessage(MESSAGES.FILTERS_APPLIED);
  }, [pendingFilters]);

  // Clear both pending and applied filters
  const handleClear = useCallback(() => {
    setPendingFilters({ department: "", employee: "", status: "", fromDate: "", toDate: "" });
    setAppliedFilters({ department: "", employee: "", status: "", fromDate: "", toDate: "" });
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

  const handleOpenApproveModal = useCallback((request) => {
    setSelectedRequest(request);
    setIsApproveModalOpen(true);
  }, []);

  const handleOpenRejectModal = useCallback((request) => {
    setSelectedRequest(request);
    setIsRejectModalOpen(true);
  }, []);

  const handleCloseApproveModal = useCallback(() => {
    setIsApproveModalOpen(false);
    setSelectedRequest(null);
  }, []);

  const handleCloseRejectModal = useCallback(() => {
    setIsRejectModalOpen(false);
    setSelectedRequest(null);
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
      const filename = `undertime_requests_${today.replace(/\//g, '-')}.csv`;
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
  }, [appliedFilters, debouncedSearchQuery]);

  return {
    // Data
    today,
    sidebarOpen,
    filters: pendingFilters,  // For input fields
    appliedFilters,           // For checking what's currently applied
    searchQuery,
    debouncedSearchQuery,
    currentPage,
    isLoading,
    loadingType,
    error,
    successMessage,
    undertimeData,
    filteredData,
    paginationData,
    uniqueDepartments,
    uniqueEmployees,
    selectedRequest,
    isApproveModalOpen,
    isRejectModalOpen,
    
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
    handleOpenApproveModal,
    handleOpenRejectModal,
    handleCloseApproveModal,
    handleCloseRejectModal,
    handleApproveRequest,
    handleRejectRequest,
    getStatusBadge
  };
};
