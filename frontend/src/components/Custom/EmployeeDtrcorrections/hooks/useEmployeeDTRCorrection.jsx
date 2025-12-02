import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { dtrCorrectionApi } from "../../../../api/dtrCorrectionApi";
import { 
  mapCorrectionData, 
  getEmployeeInfo, 
  filterCorrectionData, 
  calculatePagination,
  exportToCSV,
  exportToPDF
} from "../utils/employeeDtrCorrectionUtils";
import { ITEMS_PER_PAGE, MESSAGES, DELAYS, EXPORT_HEADERS } from "../constants/employeeDtrCorrection.constant";

export const useEmployeeDTRCorrection = () => {
  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);

  // State management
  const [filters, setFilters] = useState({
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState(null);
  const [correctionsData, setCorrectionsData] = useState([]);

  const searchTimeoutRef = useRef(null);

  // Derived data
  const employeeInfo = useMemo(() => getEmployeeInfo(correctionsData), [correctionsData]);

  const filteredData = useMemo(
    () => filterCorrectionData(correctionsData, filters, debouncedSearchQuery),
    [filters, debouncedSearchQuery, correctionsData]
  );

  const paginationData = useMemo(
    () => calculatePagination(filteredData, currentPage, ITEMS_PER_PAGE),
    [filteredData, currentPage]
  );

  // API calls
  const fetchCorrections = useCallback(async () => {
    setIsLoading(true);
    setLoadingType("data");
    setError(null);
    try {
      const response = await dtrCorrectionApi.getMyCorrections();
      const data = response.data.corrections || [];
      const mappedData = mapCorrectionData(data);
      setCorrectionsData(mappedData);
    } catch (err) {
      console.error("Error fetching corrections:", err);
      setError(MESSAGES.ERROR_LOAD);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, []);

  const handleUpdateCorrection = useCallback(async (updatedData) => {
    setIsLoading(true);
    try {
      const apiData = {
        date_time: updatedData.date,
        in_time: updatedData.timeIn,
        out_time: updatedData.timeOut,
        corrected_time: updatedData.correctedTime,
        reason: updatedData.reason
      };
      
      await dtrCorrectionApi.updateCorrection(updatedData.id, apiData);
      await fetchCorrections();
      setSuccessMessage(MESSAGES.CORRECTION_UPDATED);
      return true;
    } catch (err) {
      console.error("Error updating correction:", err);
      setError(MESSAGES.ERROR_UPDATE);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchCorrections]);

  // Event handlers
  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApply = useCallback(() => {
    console.log("Filters applied:", JSON.stringify(filters, null, 2));
    setSuccessMessage(MESSAGES.FILTERS_APPLIED);
  }, [filters]);

  const handleClear = useCallback(() => {
    setFilters({ status: "", fromDate: "", toDate: "" });
    setSearchQuery("");
    setSuccessMessage(MESSAGES.FILTERS_CLEARED);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleEditClick = useCallback((correction) => {
    setSelectedCorrection(correction);
    setIsModalOpen(true);
  }, []);

  const handleViewClick = useCallback((correction) => {
    setSelectedCorrection(correction);
    setIsViewModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedCorrection(null);
  }, []);

  const handleViewModalClose = useCallback(() => {
    setIsViewModalOpen(false);
    setSelectedCorrection(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchCorrections();
    setSuccessMessage(MESSAGES.DATA_REFRESHED);
  }, [fetchCorrections]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, paginationData.totalPages));
  }, [paginationData.totalPages]);

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
      const filename = `my_dtr_corrections_${today.replace(/\//g, '-')}.csv`;
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
      await exportToPDF(filteredData, EXPORT_HEADERS, employeeInfo, today, DELAYS.PDF_PRINT_DELAY);
      setSuccessMessage(MESSAGES.PDF_EXPORTED);
    } catch (err) {
      console.error('Export to PDF failed:', err);
      setError(`${MESSAGES.ERROR_EXPORT_PDF}: ${err.message || 'Unknown error. Please try again.'}`);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [filteredData, today, employeeInfo]);

  // Effects
  useEffect(() => {
    fetchCorrections();
  }, [fetchCorrections]);

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
    filters,
    searchQuery,
    debouncedSearchQuery,
    currentPage,
    isLoading,
    loadingType,
    error,
    successMessage,
    isModalOpen,
    isViewModalOpen,
    selectedCorrection,
    correctionsData,
    employeeInfo,
    filteredData,
    paginationData,
    
    // Setters
    setCurrentPage,
    setError,
    setSuccessMessage,
    
    // Handlers
    handleFilterChange,
    handleApply,
    handleClear,
    handleSearchChange,
    handleEditClick,
    handleViewClick,
    handleModalClose,
    handleViewModalClose,
    handleUpdateCorrection,
    handleRefresh,
    handlePrevPage,
    handleNextPage,
    handleExportCSV,
    handleExportPDF
  };
};
