import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useOutletContext } from 'react-router-dom';
import { fetchEvaluationSummary } from "@/api/performanceApi";
import { mapPerformanceData, filterPerformanceData, calculatePagination, getUniqueDepartments, getUniqueEmployees, getStatusBadge as getStatusBadgeUtil } from "@/components/Custom/Performance/Utils/adminPerformanceUtils";
import { ITEMS_PER_PAGE, MESSAGES, DELAYS, STATUS_STYLES } from "@/components/Custom/Performance/Constants/adminPerformance.constant";

export const useAdminPerformance = () => {
  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;

  // State management
  const [filters, setFilters] = useState({  department: "", employee: "", status: "" });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [stats, setStats] = useState({});

  const searchTimeoutRef = useRef(null);

  // Derived data
  const uniqueDepartments = useMemo(() => getUniqueDepartments(performanceData), [performanceData]);
  const uniqueEmployees = useMemo(() => getUniqueEmployees(performanceData), [performanceData]);
  
  const filteredData = useMemo(
    () => filterPerformanceData(performanceData, filters, debouncedSearchQuery),
    [filters, debouncedSearchQuery, performanceData]
  );

  const paginationData = useMemo(
    () => calculatePagination(filteredData, currentPage, ITEMS_PER_PAGE),
    [filteredData, currentPage]
  );

  // API calls
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setLoadingType("data");
    setError(null);
    try {
      const data = await fetchEvaluationSummary();
      
      if (data.success) {
          const mappedData = mapPerformanceData(data.employees || []);
          setPerformanceData(mappedData);
          setStats(data.stats || {});
      } else {
          setError(data.message || MESSAGES.ERROR_LOAD);
      }

    } catch (err) {
      console.error("Error fetching Performance records:", err);
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
    setSuccessMessage(MESSAGES.FILTERS_APPLIED);
  }, [filters]);

  const handleClear = useCallback(() => {
    setFilters({ department: "", employee: "", status: "" });
    setSearchQuery("");
    setSuccessMessage(MESSAGES.FILTERS_CLEARED);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchRecords();
    setSuccessMessage(MESSAGES.DATA_REFRESHED);
  }, [fetchRecords]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, paginationData.totalPages));
  }, [paginationData.totalPages]);

  // Export handlers


  const getStatusBadge = useCallback((status) => {
    return getStatusBadgeUtil(status, STATUS_STYLES);
  }, []);

  // Effects
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

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
    performanceData,
    filteredData,
    paginationData,
    uniqueDepartments,
    uniqueEmployees,
    stats,
    
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

    getStatusBadge
  };
};