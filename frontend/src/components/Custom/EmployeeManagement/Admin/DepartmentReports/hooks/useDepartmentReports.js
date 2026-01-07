import { useState, useCallback, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  fetchDepartmentList,
  fetchDepartmentSummary, 
  fetchDepartmentDetails,
  fetchExportData
} from "@api";
import { DEFAULT_FILTERS, DETAIL_FILTERS_DEFAULT } from '@/components/Custom/EmployeeManagement/Admin/DepartmentReports/constants/DepartmentReports.constants';

export const useDepartmentReports = () => {
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;

  // Date helpers
  const today = useMemo(() => new Date().toLocaleDateString('en-US'), []);
  const getDefaultDateRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      fromDate: firstDay.toISOString().split('T')[0],
      toDate: now.toISOString().split('T')[0]
    };
  };

  // State
  const [departments, setDepartments] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [detailData, setDetailData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Filters
  const defaultDates = getDefaultDateRange();
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    fromDate: defaultDates.fromDate,
    toDate: defaultDates.toDate,
  });

  // Detail view state
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [detailFilters, setDetailFilters] = useState(DETAIL_FILTERS_DEFAULT);
  const [detailMeta, setDetailMeta] = useState({
    totalRecords: 0,
    currentPage: 1,
    totalPages: 1
  });

  // Meta info
  const [meta, setMeta] = useState({
    fromDate: '',
    toDate: '',
    workingDays: 0,
    totalDepartments: 0
  });

  // Fetch department list
  const loadDepartments = useCallback(async () => {
    try {
      const response = await fetchDepartmentList();
      if (response.success) {
        setDepartments(response.data);
      }
    } catch (err) {
      console.error('Failed to load department list:', err);
    }
  }, []);

  // Fetch summary data
  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchDepartmentSummary({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        department: filters.department
      });
      
      if (response.success) {
        setSummaryData(response.data);
        setMeta(response.meta);
      } else {
        setError('Failed to load summary data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance summary');
    } finally {
      setIsLoading(false);
    }
  }, [filters.fromDate, filters.toDate, filters.department]);

  // Fetch department details
  const loadDetails = useCallback(async (dept) => {
    if (!dept) return;
    
    setIsLoadingDetails(true);
    try {
      const response = await fetchDepartmentDetails(dept, {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        status: detailFilters.status,
        search: detailFilters.search,
        page: detailFilters.page,
        limit: detailFilters.limit
      });
      
      if (response.success) {
        setDetailData(response.data);
        setDetailMeta(response.meta);
      }
    } catch (err) {
      console.error('Failed to load details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  }, [filters.fromDate, filters.toDate, detailFilters]);

  // Load initial data
  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Load details when department is selected
  useEffect(() => {
    if (selectedDepartment) {
      loadDetails(selectedDepartment);
    }
  }, [selectedDepartment, loadDetails]);

  // Handlers
  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleApply = useCallback(() => {
    loadSummary();
  }, [loadSummary]);

  const handleClear = useCallback(() => {
    const defaultDates = getDefaultDateRange();
    setFilters({
      ...DEFAULT_FILTERS,
      fromDate: defaultDates.fromDate,
      toDate: defaultDates.toDate,
    });
  }, []);

  const handleRefresh = useCallback(() => {
    loadSummary();
    if (selectedDepartment) {
      loadDetails(selectedDepartment);
    }
  }, [loadSummary, loadDetails, selectedDepartment]);

  const handleDepartmentSelect = useCallback((dept) => {
    setSelectedDepartment(dept);
    setDetailFilters(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedDepartment(null);
    setDetailData([]);
  }, []);

  const handleDetailFilterChange = useCallback((field, value) => {
    setDetailFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  }, []);

  const handleDetailPageChange = useCallback((newPage) => {
    setDetailFilters(prev => ({ ...prev, page: newPage }));
  }, []);

  // Export handlers
  const getExportData = useCallback(async () => {
    try {
      const response = await fetchExportData({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        department: filters.department
      });
      return response;
    } catch (err) {
      setError('Failed to fetch export data');
      throw err;
    }
  }, [filters]);

  return {
    // State
    today,
    sidebarOpen,
    departments,
    summaryData,
    detailData,
    isLoading,
    isLoadingDetails,
    error,
    successMessage,
    filters,
    meta,
    selectedDepartment,
    detailFilters,
    detailMeta,
    
    // Setters
    setError,
    setSuccessMessage,
    
    // Handlers
    handleFilterChange,
    handleApply,
    handleClear,
    handleRefresh,
    handleDepartmentSelect,
    handleCloseDetail,
    handleDetailFilterChange,
    handleDetailPageChange,
    getExportData
  };
};

export default useDepartmentReports;
