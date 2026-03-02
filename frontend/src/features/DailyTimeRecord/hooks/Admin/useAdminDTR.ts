import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useUIStore } from '@/stores';
import { attendanceApi } from "@api/attendanceApi";
import { dtrApi } from "@api/dtrApi";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDepartments } from "@api/departmentApi";
import { fetchEmployees } from "@api/employeeApi";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { useDTRStore } from "@/stores/dtrStore";
import { DTRFilterValues, DTRQueryValues, UpdateDTRValues } from "@/schemas/dtrSchema";

import { 
  exportToCSV, 
  exportToPDF, 
  getStatusBadge as getStatusBadgeUtil,
  DTRRecord,
  DTRFilters,
  PaginationResult
} from "../../Utils/adminDTRUtils";
import { DTRApiResponse } from "@/types/attendance";
import { AttendanceRecord } from "@/types";
import { ITEMS_PER_PAGE, MESSAGES, DELAYS, EXPORT_HEADERS, STATUS_STYLES } from "../../Constants/adminDTR.constant";

export const useAdminDTR = () => {
  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const queryClient = useQueryClient();
  const { 
    filters: storeFilters, 
    search: storeSearch, 
    pagination: storePagination,
    setFilters: setStoreFilters,
    setSearch: setStoreSearch,
    setPage: setStorePage,
    resetFilters
  } = useDTRStore();

  // Local UI state for search input (not yet debounced)
  const [searchQuery, setSearchQuery] = useState(storeSearch);
  const [loadingType, setLoadingType] = useState<string>(""); 
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<DTRRecord | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // React Query: Fetch Data
  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['admin-dtr-logs', storeFilters, storeSearch, storePagination.page],
    queryFn: async () => {
        const response = await attendanceApi.getLogs({
            page: storePagination.page,
            limit: storePagination.limit,
            department: storeFilters.department,
            employeeId: storeFilters.employeeId,
            startDate: storeFilters.startDate,
            endDate: storeFilters.endDate,
            search: storeSearch
        });
        
        const logs = response.data.data || [];
        const mappedLogs = logs.map((item: DTRApiResponse): DTRRecord => {
            const timeIn = item.time_in;
            const timeOut = item.time_out;
            
            // Normalize for Safari/cross-browser compatibility (YYYY-MM-DD HH:mm:ss -> YYYY-MM-DDTHH:mm:ss)
            const safeTimeIn = timeIn ? timeIn.replace(' ', 'T') : null;
            const safeTimeOut = timeOut ? timeOut.replace(' ', 'T') : null;
            
            let hoursWorked = '0';
            if (safeTimeIn && safeTimeOut) {
              const start = new Date(safeTimeIn).getTime();
              const end = new Date(safeTimeOut).getTime();
              let duration = (end - start) / (1000 * 60 * 60);

              // Policy: Deduct 1 hour break for shifts > 5 hours
              // This aligns with the "dedicated working hours" policy (e.g., 8-5 shift = 9h span - 1h break = 8h)
              if (duration > 5) {
                duration -= 1;
              }
              
              // Ensure we don't display negative values in edge cases
              hoursWorked = Math.max(0, duration).toFixed(2);
            }
            
            let formattedDate = item.date;
            // Store raw ISO date for filtering (item.date is now ISO YYYY-MM-DD from backend)
            const rawDate = item.date;

            if (item.date) {
              const dateObj = new Date(item.date);
              formattedDate = dateObj.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              });
            }
            
            return {
              id: item.id || 0, 
              employeeId: String(item.employee_id || "N/A"),
              name: item.employee_name || 'Unknown Employee',
              department: item.department || 'N/A',
              date: formattedDate || "N/A",
              rawDate: rawDate, // Use for filtering
              timeIn: safeTimeIn ? new Date(safeTimeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
              timeOut: safeTimeOut ? new Date(safeTimeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
              hoursWorked: hoursWorked,
              lateMinutes: item.late_minutes || 0,
              undertimeMinutes: item.undertime_minutes || 0,
              status: item.status || 'Absent',
              duties: item.duties || 'No Schedule',
              remarks: '-',
              // Correction fields
              correctionId: item.correction_id ?? null,
              correctionStatus: item.correction_status ?? null,
              correctionReason: item.correction_reason ?? null,
              correctionTimeIn: item.correction_time_in ?? null,
              correctionTimeOut: item.correction_time_out ?? null,
            };
        });

        const resData = response.data as { totals?: { lateMinutes: number; undertimeMinutes: number; hoursWorked: string }, pagination?: { totalPages: number; total: number } };
        return {
            items: mappedLogs,
            totals: resData.totals,
            pagination: resData.pagination
        };
    },
    staleTime: 5000,
  });

  const dtrData = data?.items || [];
  const serverPagination = data?.pagination;
  const totals = data?.totals || { lateMinutes: 0, undertimeMinutes: 0, hoursWorked: '0.00' };
  const error = queryError ? (queryError as Error).message : errorLocal;

  // React Query: Mutation
  const updateRecordMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number, data: UpdateDTRValues }) => {
        await dtrApi.updateRecord(String(id), data);
    },
    onSuccess: () => {
        setSuccessMessage("Record updated successfully");
        // Invalidate all variants of admin-dtr-logs to ensure filtered views are updated
        queryClient.invalidateQueries({ queryKey: ['admin-dtr-logs'] });
        queryClient.invalidateQueries({ queryKey: ['attendanceLogs'] });
        
        // Force refetch of current view
        refetch();
        
        setEditingRecord(null);
    },
    onError: (err: Error) => {
        console.error("Failed to update record", err);
        setErrorLocal("Failed to update record");
    }
  });

  // Fetch Filter Options
  const { data: filterOptions } = useFilterOptions();
  const uniqueDepartments = filterOptions.departments;
  const uniqueEmployees = filterOptions.employees;

  const paginationData: PaginationResult = useMemo(() => {
    return {
      totalPages: serverPagination?.totalPages || 0,
      startIndex: ((storePagination.page - 1) * storePagination.limit) + 1,
      endIndex: Math.min(storePagination.page * storePagination.limit, serverPagination?.total || 0),
      currentItems: dtrData,
      totalRecords: serverPagination?.total || 0
    };
  }, [dtrData, serverPagination, storePagination]);

  // Event handlers
  const handleFilterChange = useCallback((field: string, value: string) => {
    setStoreFilters({ [field]: value });
  }, [setStoreFilters]);

  const handleApply = useCallback(() => {
    setSuccessMessage(MESSAGES.FILTERS_APPLIED);
  }, []);

  const handleClear = useCallback(() => {
    resetFilters();
    setSearchQuery("");
    setSuccessMessage(MESSAGES.FILTERS_CLEARED);
  }, [resetFilters]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleRefresh = useCallback(async () => {
    await refetch();
    setSuccessMessage(MESSAGES.DATA_REFRESHED);
  }, [refetch]);

  const handlePrevPage = useCallback(() => {
    setStorePage(Math.max(storePagination.page - 1, 1));
  }, [storePagination.page, setStorePage]);

  const handleNextPage = useCallback(() => {
    setStorePage(Math.min(storePagination.page + 1, serverPagination?.totalPages || 1));
  }, [storePagination.page, serverPagination?.totalPages, setStorePage]);

  const fetchAllDTRData = async (): Promise<DTRRecord[]> => {
    let appliedStartDate = storeFilters.startDate;
    let appliedEndDate = storeFilters.endDate;

    if (!appliedStartDate || !appliedEndDate) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = now.getDate();
      
      if (day <= 15) {
        appliedStartDate = new Date(year, month, 1).toISOString().split('T')[0];
        appliedEndDate = new Date(year, month, 15).toISOString().split('T')[0];
      } else {
        appliedStartDate = new Date(year, month, 16).toISOString().split('T')[0];
        appliedEndDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      }
    }

    const response = await attendanceApi.getLogs({
        page: 1,
        limit: 100000,
        department: storeFilters.department,
        employeeId: storeFilters.employeeId,
        startDate: appliedStartDate,
        endDate: appliedEndDate,
        search: storeSearch
    });
    
    const logs = response.data.data || [];
    return logs.map((item: DTRApiResponse): DTRRecord => {
        const timeIn = item.time_in;
        const timeOut = item.time_out;
        
        // Normalize for Safari/cross-browser compatibility
        const safeTimeIn = timeIn ? timeIn.replace(' ', 'T') : null;
        const safeTimeOut = timeOut ? timeOut.replace(' ', 'T') : null;
        
        let hoursWorked = '0';
        if (safeTimeIn && safeTimeOut) {
          const start = new Date(safeTimeIn).getTime();
          const end = new Date(safeTimeOut).getTime();
          let duration = (end - start) / (1000 * 60 * 60);
          
          // Policy: Deduct 1 hour break for shifts > 5 hours
          if (duration > 5) duration -= 1;
          
          hoursWorked = Math.max(0, duration).toFixed(2);
        }
        
        let formattedDate = item.date;
        const rawDate = item.date;
        if (item.date) {
          const dateObj = new Date(item.date);
          formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        
        return {
          id: item.id || 0, 
          employeeId: String(item.employee_id || "N/A"),
          name: item.employee_name || 'Unknown Employee',
          department: item.department || 'N/A',
          date: formattedDate || "N/A",
          rawDate: rawDate,
          timeIn: safeTimeIn ? new Date(safeTimeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
          timeOut: safeTimeOut ? new Date(safeTimeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
          hoursWorked: hoursWorked,
          lateMinutes: item.late_minutes || 0,
          undertimeMinutes: item.undertime_minutes || 0,
          status: item.status || 'Absent',
          duties: item.duties || 'No Schedule',
          remarks: '-',
          correctionId: item.correction_id ?? null,
          correctionStatus: item.correction_status ?? null,
          correctionReason: item.correction_reason ?? null,
          correctionTimeIn: item.correction_time_in ?? null,
          correctionTimeOut: item.correction_time_out ?? null,
        };
    });
  };

  // Export handlers
  const handleExportCSV = useCallback(async () => {
    setLoadingType("CSV");
    setErrorLocal(null);
    try {
      const exportData = await fetchAllDTRData();
      if (exportData.length === 0) {
        setErrorLocal(MESSAGES.ERROR_NO_DATA);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, DELAYS.EXPORT_DELAY));
      const filename = `dtr_${today.replace(/\//g, '-')}.csv`;
      await exportToCSV(exportData, EXPORT_HEADERS, filename);
      setSuccessMessage(MESSAGES.CSV_EXPORTED);
    } catch (err) {
      const error = err as Error;
      console.error('Export to CSV failed:', error);
      setErrorLocal(`${MESSAGES.ERROR_EXPORT_CSV}: ${error.message || 'Unknown error.'}`);
    } finally {
      setLoadingType("");
    }
  }, [storeFilters, storeSearch, today]);

  const handleExportPDF = useCallback(async () => {
    setLoadingType("PDF");
    setErrorLocal(null);
    try {
      const exportData = await fetchAllDTRData();
      if (exportData.length === 0) {
        setErrorLocal(MESSAGES.ERROR_NO_DATA);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, DELAYS.EXPORT_DELAY));
      await exportToPDF(exportData, EXPORT_HEADERS, today, DELAYS.PDF_PRINT_DELAY);
      setSuccessMessage(MESSAGES.PDF_EXPORTED);
    } catch (err) {
      const error = err as Error;
      console.error('Export to PDF failed:', error);
      setErrorLocal(`${MESSAGES.ERROR_EXPORT_PDF}: ${error.message || 'Unknown error.'}`);
    } finally {
      setLoadingType("");
    }
  }, [storeFilters, storeSearch, today]);

  const getStatusBadge = useCallback((status: string) => {
    return getStatusBadgeUtil(status, STATUS_STYLES);
  }, []);

  const handleEdit = useCallback((record: DTRRecord) => {
    setEditingRecord(record);
  }, []);

  const handleSaveEdit = useCallback(async (id: string | number, data: UpdateDTRValues) => {
     await updateRecordMutation.mutateAsync({ id, data });
  }, [updateRecordMutation]);

  // Search Debounce Effect
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setStoreSearch(searchQuery);
    }, DELAYS.SEARCH_DEBOUNCE);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery, setStoreSearch]);

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

  return {
    today,
    sidebarOpen,
    filters: storeFilters,
    searchQuery,
    debouncedSearchQuery: storeSearch,
    currentPage: storePagination.page,
    isLoading: isLoading || loadingType !== "",
    error,
    successMessage,
    dtrData,
    filteredData: dtrData,
    paginationData,
    totals,
    uniqueDepartments,
    uniqueEmployees,
    editingRecord,
    setError: setErrorLocal,
    setSuccessMessage,
    setEditingRecord,
    handleFilterChange,
    handleApply,
    handleClear,
    handleSearchChange,
    handleRefresh,
    handlePrevPage,
    handleNextPage,
    handleExportCSV,
    handleExportPDF,
    getStatusBadge,
    handleEdit,
    handleSaveEdit
  };
};
