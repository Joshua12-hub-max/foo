import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useUIStore } from '@/stores';
import { fetchEvaluationSummary } from "@/api/performanceApi";
import { mapPerformanceData, filterPerformanceData, calculatePagination, getUniqueDepartments, getUniqueEmployees, getStatusBadge as getStatusBadgeUtil } from "@/components/Custom/Performance/Utils/adminPerformanceUtils";
import { ITEMS_PER_PAGE, MESSAGES, DELAYS, STATUS_STYLES } from "@/components/Custom/Performance/constants/adminPerformance.constant";
import { PerformanceTableItem } from "@/components/Custom/Performance/Utils/adminPerformanceUtils"; // Importing the item type

interface FiltersState {
  department: string;
  employee: string;
  status: string;
  [key: string]: string;
}

interface PaginationData {
  currentItems: PerformanceTableItem[];
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalRecords: number;
}

interface AdminPerformanceHookReturn {
  today: string;
  sidebarOpen: boolean;
  filters: FiltersState;
  searchQuery: string;
  debouncedSearchQuery: string;
  currentPage: number;
  isLoading: boolean;
  loadingType: string;
  error: string | null;
  successMessage: string | null;
  performanceData: PerformanceTableItem[];
  filteredData: PerformanceTableItem[];
  paginationData: PaginationData;
  uniqueDepartments: string[];
  uniqueEmployees: string[];
  stats: any;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string | null>>;
  handleFilterChange: (field: string, value: string) => void;
  handleApply: () => void;
  handleClear: () => void;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRefresh: () => Promise<void>;
  handlePrevPage: () => void;
  handleNextPage: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export const useAdminPerformance = (): AdminPerformanceHookReturn => {
  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  // State management
  const [filters, setFilters] = useState<FiltersState>({  department: "", employee: "", status: "" });

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingType, setLoadingType] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceTableItem[]>([]);
  const [stats, setStats] = useState<any>({});

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Derived data
  const uniqueDepartments = useMemo(() => getUniqueDepartments(performanceData), [performanceData]);
  const uniqueEmployees = useMemo(() => getUniqueEmployees(performanceData), [performanceData]);
  
  const filteredData = useMemo(
    () => filterPerformanceData(performanceData, filters, debouncedSearchQuery),
    [filters, debouncedSearchQuery, performanceData]
  );

  const paginationData = useMemo(
    () => {
      const pagination = calculatePagination(filteredData, currentPage, ITEMS_PER_PAGE);
      return { ...pagination, totalRecords: filteredData.length };
    },
    [filteredData, currentPage]
  );

  // API calls
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setLoadingType("data");
    setError(null);
    try {
      const res = await fetchEvaluationSummary();
      const payload = res as unknown as { success: boolean; message?: string; employees?: unknown[]; stats?: Record<string, unknown> };
      
      if (res.success || payload.success) {
          const empList = payload.employees || (res.data as Record<string, unknown>)?.employees || [];
          const mappedData = mapPerformanceData(empList as Parameters<typeof mapPerformanceData>[0]);
          setPerformanceData(mappedData);
          setStats(payload.stats || (res.data as Record<string, unknown>)?.stats || {});
      } else {
          setError(res.message || payload.message || MESSAGES.ERROR_LOAD);
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
  const handleFilterChange = useCallback((field: string, value: string) => {
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

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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


  const getStatusBadge = useCallback((status: string) => {
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
