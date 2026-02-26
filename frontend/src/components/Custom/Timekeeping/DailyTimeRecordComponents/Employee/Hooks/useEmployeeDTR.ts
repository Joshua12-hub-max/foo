import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { attendanceApi } from "@/api/attendanceApi";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from '@tanstack/react-query';
import { 
  filterDTRData, 
  calculatePagination, 
  exportToCSV, 
  exportToPDF, 
  getStatusBadge as getStatusBadgeUtil,
  EmployeeDTRRecord,
  EmployeeDTRFilters,
  EmployeePaginationResult,
  EmployeeInfo,
  DTRApiResponse
} from "../Utils/employeeDTRUtils";
import { ITEMS_PER_PAGE, MESSAGES, DELAYS, EXPORT_HEADERS, STATUS_STYLES } from "../Constants/employeeDTR.constant";

export const useEmployeeDTR = () => {
  const { user } = useAuth();
  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);

  // State management
  const [filters, setFilters] = useState<EmployeeDTRFilters>({
    fromDate: "",
    toDate: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingType, setLoadingType] = useState<string>(""); // For export loading
  const [errorLocal, setErrorLocal] = useState<string | null>(null); // For non-query errors
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Employee info for exports
  const employeeInfo = useMemo<EmployeeInfo | null>(() => user ? {
      id: user.employeeId as string | number,
      name: user.name as string,
      department: user.department as string
  } : null, [user]);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // React Query: Fetch Data
  const { data: dtrData = [], isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['employee-dtr-logs', user?.employeeId],
    queryFn: async () => {
        if (!user?.employeeId) return [];
        const response = await attendanceApi.getLogs({ employeeId: String(user.employeeId) });
        const data = response.data.data || [];
        
        // Map data
        return data.map((item: DTRApiResponse): EmployeeDTRRecord => {
            let hoursWorked = '0';
            if (item.time_in && item.time_out) {
              const start = new Date(String(item.time_in)).getTime();
              const end = new Date(String(item.time_out)).getTime();
              hoursWorked = ((end - start) / (1000 * 60 * 60)).toFixed(2);
            }
            return {
              id: item.id ?? item.record_id ?? '',
              date: String(item.date ?? ''),
              timeIn: item.time_in ? new Date(String(item.time_in)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
              timeOut: item.time_out ? new Date(String(item.time_out)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
              hoursWorked: hoursWorked,
              status: item.status ? String(item.status) : 'Absent',
              remarks: item.remarks ? String(item.remarks) : '-'
            };
        });
    },
    initialData: [],
    enabled: !!user?.employeeId,
  });

  const error = queryError ? (queryError as Error).message : errorLocal;

  // Derived data
  const filteredData = useMemo(
    () => filterDTRData(dtrData, filters, debouncedSearchQuery),
    [filters, debouncedSearchQuery, dtrData]
  );

  const paginationData: EmployeePaginationResult = useMemo(
    () => calculatePagination(filteredData, currentPage, ITEMS_PER_PAGE),
    [filteredData, currentPage]
  );

  // Event handlers
  const handleFilterChange = useCallback((field: keyof EmployeeDTRFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApply = useCallback(() => {
    // Check if at least one filter is selected
    const hasFilters = filters.fromDate || filters.toDate;
    if (!hasFilters) {
      setErrorLocal("Please select at least one filter before applying.");
      return;
    }
    setSuccessMessage(MESSAGES.FILTERS_APPLIED);
  }, [filters]);

  const handleClear = useCallback(() => {
    setFilters({ fromDate: "", toDate: "" });
    setSearchQuery("");
    setSuccessMessage(MESSAGES.FILTERS_CLEARED);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleRefresh = useCallback(async () => {
    await refetch();
    setSuccessMessage(MESSAGES.DATA_REFRESHED);
  }, [refetch]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, paginationData.totalPages));
  }, [paginationData.totalPages]);

  // Export handlers
  const handleExportCSV = useCallback(async () => {
    if (filteredData.length === 0) {
      setErrorLocal(MESSAGES.ERROR_NO_DATA);
      return;
    }
    setLoadingType("CSV");
    setErrorLocal(null);
    try {
      await new Promise(resolve => setTimeout(resolve, DELAYS.EXPORT_DELAY));
      const filename = `my_dtr_${today.replace(/\//g, '-')}.csv`;
      await exportToCSV(filteredData, EXPORT_HEADERS, employeeInfo, filename);
      setSuccessMessage(MESSAGES.CSV_EXPORTED);
    } catch (err: unknown) {
      console.error('Export to CSV failed:', err);
      setErrorLocal(`${MESSAGES.ERROR_EXPORT_CSV}: ${err instanceof Error ? err.message : 'Unknown error. Please try again.'}`);
    } finally {
      setLoadingType("");
    }
  }, [filteredData, today, employeeInfo]);

  const handleExportPDF = useCallback(async () => {
    if (filteredData.length === 0) {
      setErrorLocal(MESSAGES.ERROR_NO_DATA);
      return;
    }
    setLoadingType("PDF");
    setErrorLocal(null);
    try {
      await new Promise(resolve => setTimeout(resolve, DELAYS.EXPORT_DELAY));
      await exportToPDF(filteredData, EXPORT_HEADERS, employeeInfo, today, DELAYS.PDF_PRINT_DELAY);
      setSuccessMessage(MESSAGES.PDF_EXPORTED);
    } catch (err: unknown) {
      console.error('Export to PDF failed:', err);
      setErrorLocal(`${MESSAGES.ERROR_EXPORT_PDF}: ${err instanceof Error ? err.message : 'Unknown error. Please try again.'}`);
    } finally {
      setLoadingType("");
    }
  }, [filteredData, today, employeeInfo]);

  const getStatusBadge = useCallback((status: string) => {
    return getStatusBadgeUtil(status, STATUS_STYLES);
  }, []);

  // Effects
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
    if (error || errorLocal) {
      const timer = setTimeout(() => setErrorLocal(null), DELAYS.ERROR_DISMISS);
      return () => clearTimeout(timer);
    }
  }, [error, errorLocal]);

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
    isLoading: isLoading || loadingType !== "",
    loadingType: isLoading ? "data" : loadingType,
    error,
    successMessage,
    dtrData,
    employeeInfo,
    filteredData,
    paginationData,
    
    // Setters
    setCurrentPage,
    setError: setErrorLocal,
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
