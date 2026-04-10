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
  getStatusBadge as getStatusBadgeUtil,
  DTRRecord,
  DTRFilters,
  PaginationResult
} from "../../Utils/adminDTRUtils";
import { DTRApiResponse } from "@/types/attendance";
import { AttendanceRecord } from "@/types";
import { ITEMS_PER_PAGE, MESSAGES, DELAYS, STATUS_STYLES } from "../../Constants/adminDTR.constant";
import { formatEmployeeId } from "@/utils/formatters";

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
        const response = await dtrApi.getAllRecords({
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
            const timeIn = item.timeIn;
            const timeOut = item.timeOut;
            
            // Normalize for Safari/cross-browser compatibility (YYYY-MM-DD HH:mm:ss -> YYYY-MM-DDTHH:mm:ss)
            const safeTimeIn = timeIn ? timeIn.replace(' ', 'T') : null;
            const safeTimeOut = timeOut ? timeOut.replace(' ', 'T') : null;
            
            let hoursWorked = '0';
            if (safeTimeIn && safeTimeOut) {
              const start = new Date(safeTimeIn).getTime();
              const end = new Date(safeTimeOut).getTime();
              let duration = (end - start) / (1000 * 60 * 60);

              // Policy: Deduct 1 hour break for shifts > 5 hours
              if (duration > 5) {
                duration -= 1;
              }
              
              hoursWorked = Math.max(0, duration).toFixed(2);
            }
            
            let formattedDate = item.date;
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
              employeeId: formatEmployeeId(item.employeeId),
              name: item.employeeName || 'Unknown Employee',
              department: item.department || 'N/A',
              date: formattedDate || "N/A",
              rawDate: rawDate,
              timeIn: safeTimeIn ? new Date(safeTimeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
              timeOut: safeTimeOut ? new Date(safeTimeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
              hoursWorked: hoursWorked,
              lateMinutes: item.lateMinutes || 0,
              undertimeMinutes: item.undertimeMinutes || 0,
              status: item.status || 'Absent',
              duties: item.dutyType || 'Standard',
              shift: item.shift || 'No Schedule',
              dutyType: item.dutyType || 'Standard',
              remarks: '-',
              // Correction fields
              correctionId: item.correctionId ?? null,
              correctionStatus: item.correctionStatus ?? null,
              correctionReason: item.correctionReason ?? null,
              correctionTimeIn: item.correctionTimeIn ?? null,
              correctionTimeOut: item.correctionTimeOut ?? null,
            };
        });


        const resData = response.data as { totals?: { lateMinutes: number; undertimeMinutes: number; hoursWorked: string }, pagination?: { totalPages: number; total: number } };
        return {
            items: mappedLogs,
            pagination: resData.pagination
        };
    },
    staleTime: 5000,
  });

  const dtrData = data?.items || [];
  const serverPagination = data?.pagination;
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
    getStatusBadge,
    handleEdit,
    handleSaveEdit
  };
};
