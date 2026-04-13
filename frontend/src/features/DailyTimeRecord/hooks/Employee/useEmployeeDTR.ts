import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { attendanceApi } from "@/api/attendanceApi";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from '@tanstack/react-query';
import { formatFullName } from '@/utils/nameUtils';
import { formatEmployeeId } from "@/utils/formatters";
import { useDTRStore } from "@/stores/dtrStore";
import { 
  filterDTRData, 
  calculatePagination, 
  getStatusBadge as getStatusBadgeUtil,
  EmployeeDTRRecord,
  EmployeePaginationResult,
  EmployeeInfo
} from "../../Utils/employeeDTRUtils";
import { ITEMS_PER_PAGE, MESSAGES, DELAYS, STATUS_STYLES } from "../../Constants/employeeDTR.constant";

interface RawDTRRecord {
  id?: string | number;
  date: string;
  timeIn?: string | null;
  timeOut?: string | null;
  hoursWorked?: string | number | null;
  lateMinutes?: number | null;
  undertimeMinutes?: number | null;
  status?: string | null;
  remarks?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  suffix?: string | null;
  employeeName?: string | null;
  duties?: string | null;
  shift?: string | null;
}

export const useEmployeeDTR = () => {
  const { user } = useAuth();
  const { filters, setFilters, resetFilters, search, setSearch } = useDTRStore();
  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingType, setLoadingType] = useState<string>(""); 
  const [errorLocal, setErrorLocal] = useState<string | null>(null); 
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Employee info for exports
  const employeeInfo = useMemo<EmployeeInfo | null>(() => {
    if (!user) return null;
    
    const fullName = formatFullName(user.lastName, user.firstName);

    return {
      id: formatEmployeeId(user.employeeId),
      name: fullName,
      department: user.department || 'N/A'
    };
  }, [user]);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // React Query: Fetch Data
  const { data: dtrData = [], isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['employee-dtr-logs', user?.employeeId, filters.startDate, filters.endDate],
    queryFn: async () => {
        if (!user?.employeeId) return [];
        
        const response = await attendanceApi.getLogs({ 
          employeeId: String(user.employeeId),
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          limit: 1000
        });
        
        const data = (response.data.data || []) as RawDTRRecord[];
        
        // Map data
        return data.map((item): EmployeeDTRRecord => {
            const timeIn = item.timeIn;
            const timeOut = item.timeOut;
            
            // Normalize for Safari/cross-browser compatibility
            const safeTimeIn = timeIn ? timeIn.replace(' ', 'T') : null;
            const safeTimeOut = timeOut ? timeOut.replace(' ', 'T') : null;
            
            let hoursWorked = String(item.hoursWorked || '0');
            if (!item.hoursWorked && safeTimeIn && safeTimeOut) {
              const start = new Date(safeTimeIn).getTime();
              const end = new Date(safeTimeOut).getTime();
              let duration = (end - start) / (1000 * 60 * 60);

              if (duration > 5) {
                duration -= 1;
              }

              hoursWorked = Math.max(0, duration).toFixed(2);
            }
            return {
              id: (item.id || '') as string | number,
              date: item.date, 
              timeIn: safeTimeIn ? new Date(safeTimeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
              timeOut: safeTimeOut ? new Date(safeTimeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
              hoursWorked: hoursWorked,
              lateMinutes: item.lateMinutes || 0,
              undertimeMinutes: item.undertimeMinutes || 0,
              status: item.status || 'Absent',
              remarks: item.remarks || '-',
              firstName: item.firstName || '',
              lastName: item.lastName || '',
              middleName: item.middleName || null,
              suffix: item.suffix || null,
              duties: item.duties || '-',
              shift: item.shift || '-'
            };
        });
    },
    enabled: !!user?.employeeId,
  });


  const error = queryError ? (queryError as Error).message : errorLocal;

  // Derived data
  const filteredData = useMemo(
    () => {
        // Map store filters to EmployeeDTRFilters shape for the utility function
        const legacyFilters = {
            fromDate: filters.startDate || "",
            toDate: filters.endDate || ""
        };
        return filterDTRData(dtrData, legacyFilters, debouncedSearchQuery);
    },
    [filters, debouncedSearchQuery, dtrData]
  );

  const paginationData: EmployeePaginationResult = useMemo(
    () => calculatePagination(filteredData, currentPage, ITEMS_PER_PAGE),
    [filteredData, currentPage]
  );


  // Event handlers
  const handleFilterChange = useCallback((field: string, value: string) => {
    // Standardize field mapping
    const mappedField = field === "fromDate" ? "startDate" : (field === "toDate" ? "endDate" : field);
    setFilters({ [mappedField]: value });
  }, [setFilters]);

  const handleApply = useCallback(() => {
    // Check if at least one filter is selected
    const hasFilters = filters.startDate || filters.endDate;
    if (!hasFilters) {
      setErrorLocal("Please select at least one filter before applying.");
      return;
    }
    setSuccessMessage(MESSAGES.FILTERS_APPLIED);
  }, [filters]);

  const handleClear = useCallback(() => {
    resetFilters();
    setSuccessMessage(MESSAGES.FILTERS_CLEARED);
  }, [resetFilters]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, [setSearch]);

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

  const getStatusBadge = useCallback((status: string) => {
    return getStatusBadgeUtil(status, STATUS_STYLES);
  }, []);

  // Effects
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(search);
    }, DELAYS.SEARCH_DEBOUNCE);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

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
    searchQuery: search,
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
    getStatusBadge
  };
};

