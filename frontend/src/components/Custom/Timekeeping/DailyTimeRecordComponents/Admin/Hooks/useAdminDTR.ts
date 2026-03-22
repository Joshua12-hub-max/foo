
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useUIStore } from '@/stores';
import { attendanceApi } from "@api/attendanceApi";
import { dtrApi } from "@api/dtrApi";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  filterDTRData, 
  calculatePagination, 
  getUniqueDepartments, 
  getUniqueEmployees, 
  exportToCSV, 
  exportToPDF, 
  getStatusBadge as getStatusBadgeUtil,
  DTRRecord,
  DTRFilters,
  PaginationResult,
  AdminDTRApiResponse,
  DTRRecordUpdate
} from "../Utils/adminDTRUtils";
import { ITEMS_PER_PAGE, MESSAGES, DELAYS, EXPORT_HEADERS, STATUS_STYLES } from "../Constants/adminDTR.constant";

export const useAdminDTR = () => {
  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const queryClient = useQueryClient();

  // State management
  const [filters, setFilters] = useState<DTRFilters>({  
    department: "", 
    employee: "", 
    fromDate: "", 
    toDate: "", 
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingType, setLoadingType] = useState<string>(""); // Used for export loading
  const [errorLocal, setErrorLocal] = useState<string | null>(null); // For non-query errors (exports)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<DTRRecord | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // React Query: Fetch Data
  const { data: dtrData = [], isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['admin-dtr-logs'],
    queryFn: async () => {
        const response = await attendanceApi.getLogs({});
        const data = response.data.data || [];
        
        return (data as AdminDTRApiResponse[]).map((item: AdminDTRApiResponse): DTRRecord => {
            let hoursWorked = '0';
            if (item.timeIn && item.timeOut) {
              const start = new Date(String(item.timeIn)).getTime();
              const end = new Date(String(item.timeOut)).getTime();
              hoursWorked = ((end - start) / (1000 * 60 * 60)).toFixed(2);
            }
            
            let formattedDate = String(item.date ?? '');
            if (item.date) {
              const dateObj = new Date(String(item.date));
              formattedDate = dateObj.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              });
            }
            
            return {
              id: item.id ?? item.recordId ?? '',
              employeeId: item.employeeId ?? '',
              name: item.employeeName ? String(item.employeeName) : `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim(),
              department: item.department ? String(item.department) : 'N/A',
              date: formattedDate,
              timeIn: item.timeIn ? new Date(String(item.timeIn)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
              timeOut: item.timeOut ? new Date(String(item.timeOut)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
              hoursWorked: hoursWorked,
              status: item.status ? String(item.status) : 'Absent',
              remarks: '-'
            };
        });
    },
    initialData: [],
  });

  const error = queryError ? (queryError as Error).message : errorLocal;

  // React Query: Mutation
  const updateRecordMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number, data: DTRRecordUpdate }) => {
        await dtrApi.updateRecord(String(id), data);
    },
    onSuccess: () => {
        setSuccessMessage("Record updated successfully");
        queryClient.invalidateQueries({ queryKey: ['admin-dtr-logs'] });
        setEditingRecord(null);
    },
    onError: (err: unknown) => {
        console.error("Failed to update record", err);
        setErrorLocal("Failed to update record");
    }
  });

  // Derived data
  const uniqueDepartments = useMemo(() => getUniqueDepartments(dtrData), [dtrData]);
  const uniqueEmployees = useMemo(() => getUniqueEmployees(dtrData), [dtrData]);
  
  const filteredData = useMemo(
    () => filterDTRData(dtrData, filters, debouncedSearchQuery),
    [filters, debouncedSearchQuery, dtrData]
  );

  const paginationData: PaginationResult = useMemo(
    () => calculatePagination(filteredData, currentPage, ITEMS_PER_PAGE),
    [filteredData, currentPage]
  );

  // Event handlers
  const handleFilterChange = useCallback((field: keyof DTRFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApply = useCallback(() => {
    setSuccessMessage(MESSAGES.FILTERS_APPLIED);
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ department: "", employee: "", fromDate: "", toDate: "" });
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
      const filename = `dtr_${today.replace(/\//g, '-')}.csv`;
      await exportToCSV(filteredData, EXPORT_HEADERS, filename);
      setSuccessMessage(MESSAGES.CSV_EXPORTED);
    } catch (err: unknown) {
      console.error('Export to CSV failed:', err);
      setErrorLocal(`${MESSAGES.ERROR_EXPORT_CSV}: ${err instanceof Error ? err.message : 'Unknown error. Please try again.'}`);
    } finally {
      setLoadingType("");
    }
  }, [filteredData, today]);

  const handleExportPDF = useCallback(async () => {
    if (filteredData.length === 0) {
      setErrorLocal(MESSAGES.ERROR_NO_DATA);
      return;
    }
    setLoadingType("PDF");
    setErrorLocal(null);
    try {
      await new Promise(resolve => setTimeout(resolve, DELAYS.EXPORT_DELAY));
      await exportToPDF(filteredData, EXPORT_HEADERS, today, DELAYS.PDF_PRINT_DELAY);
      setSuccessMessage(MESSAGES.PDF_EXPORTED);
    } catch (err: unknown) {
      console.error('Export to PDF failed:', err);
      setErrorLocal(`${MESSAGES.ERROR_EXPORT_PDF}: ${err instanceof Error ? err.message : 'Unknown error. Please try again.'}`);
    } finally {
      setLoadingType("");
    }
  }, [filteredData, today]);

  const getStatusBadge = useCallback((status: string) => {
    return getStatusBadgeUtil(status, STATUS_STYLES);
  }, []);

  const handleEdit = useCallback((record: DTRRecord) => {
    setEditingRecord(record);
  }, []);

  const handleSaveEdit = useCallback(async (id: string | number, data: DTRRecordUpdate) => {
     updateRecordMutation.mutate({ id, data });
  }, [updateRecordMutation]);

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
    sidebarOpen,
    filters,
    searchQuery,
    debouncedSearchQuery,
    currentPage,
    isLoading: isLoading || loadingType !== "",
    loadingType: isLoading ? "data" : loadingType,
    error,
    successMessage,
    dtrData,
    filteredData,
    paginationData,
    uniqueDepartments,
    uniqueEmployees,
    editingRecord,
    
    // Setters
    setError: setErrorLocal,
    setSuccessMessage,
    setEditingRecord,
    
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
    getStatusBadge,
    handleEdit,
    handleSaveEdit
  };
};
