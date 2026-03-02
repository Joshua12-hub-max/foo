import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { attendanceApi } from "@/api/attendanceApi";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from '@tanstack/react-query';
import { formatFullName } from '@/utils/nameUtils';
import { 
  filterDTRData, 
  calculatePagination, 
  exportToCSV, 
  exportToPDF, 
  getStatusBadge as getStatusBadgeUtil,
  EmployeeDTRRecord,
  EmployeeDTRFilters,
  EmployeePaginationResult,
  EmployeeInfo
} from "../../Utils/employeeDTRUtils";
import { ITEMS_PER_PAGE, MESSAGES, DELAYS, EXPORT_HEADERS, STATUS_STYLES } from "../../Constants/employeeDTR.constant";

interface RawDTRRecord {
  id?: string | number;
  record_id?: string | number;
  date: string;
  time_in?: string;
  timeIn?: string;
  time_out?: string;
  timeOut?: string;
  hours_worked?: string | number;
  late_minutes?: number;
  undertime_minutes?: number;
  status?: string;
  remarks?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string | null;
  suffix?: string | null;
  employee_name?: string;
}

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
  const employeeInfo = useMemo<EmployeeInfo | null>(() => {
    if (!user) return null;
    
    // Format name: LastName, FirstName M. Suffix
    const fullName = formatFullName(user.lastName, user.firstName);

    return {
      id: user.employeeId as string | number,
      name: fullName,
      department: user.department || 'N/A'
    };
  }, [user]);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // React Query: Fetch Data
  const { data: dtrData = [], isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['employee-dtr-logs', user?.employeeId, filters.fromDate, filters.toDate],
    queryFn: async () => {
        if (!user?.employeeId) return [];
        
        // Fetch with filters and a high limit to get "permanent" historical data
        const response = await attendanceApi.getLogs({ 
          employeeId: String(user.employeeId),
          startDate: filters.fromDate || undefined,
          endDate: filters.toDate || undefined,
          limit: 1000 // Get up to 1000 records for the employee portal view
        });
        
        const data = response.data.data || [];
        
        // Map data
        return (data as unknown as RawDTRRecord[]).map((item): EmployeeDTRRecord => {
            const timeIn = item.time_in || item.timeIn;
            const timeOut = item.time_out || item.timeOut;
            
            // Normalize for Safari/cross-browser compatibility (YYYY-MM-DD HH:mm:ss -> YYYY-MM-DDTHH:mm:ss)
            const safeTimeIn = timeIn ? timeIn.replace(' ', 'T') : null;
            const safeTimeOut = timeOut ? timeOut.replace(' ', 'T') : null;
            
            let hoursWorked = item.hours_worked || '0';
            if (!item.hours_worked && safeTimeIn && safeTimeOut) {
              const start = new Date(safeTimeIn).getTime();
              const end = new Date(safeTimeOut).getTime();
              let duration = (end - start) / (1000 * 60 * 60);

              // Policy: Deduct 1 hour break for shifts > 5 hours
              if (duration > 5) {
                duration -= 1;
              }

              hoursWorked = Math.max(0, duration).toFixed(2);
            }
            return {
              id: (item.id || item.record_id || '') as string | number,
              date: item.date, // Assuming format YYYY-MM-DD
              timeIn: safeTimeIn ? new Date(safeTimeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
              timeOut: safeTimeOut ? new Date(safeTimeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
              hoursWorked: hoursWorked,
              lateMinutes: item.late_minutes || 0,
              undertimeMinutes: item.undertime_minutes || 0,
              status: item.status || 'Absent',
              remarks: item.remarks || '-',
              firstName: item.first_name,
              lastName: item.last_name,
              middleName: item.middle_name,
              suffix: item.suffix
            };
        });
    },
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

  const totals = useMemo(() => {
    const late = filteredData.reduce((sum, item) => sum + (item.lateMinutes || 0), 0);
    const ut = filteredData.reduce((sum, item) => sum + (item.undertimeMinutes || 0), 0);
    const hours = filteredData.reduce((sum, item) => sum + parseFloat(String(item.hoursWorked || 0)), 0);
    return {
      lateMinutes: late,
      undertimeMinutes: ut,
      hoursWorked: hours.toFixed(2)
    };
  }, [filteredData]);

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
    totals,
    
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
