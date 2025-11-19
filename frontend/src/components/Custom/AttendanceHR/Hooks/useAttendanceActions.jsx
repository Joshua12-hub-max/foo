import { useCallback } from "react";
import { exportToCSV, generatePDFHTML, openPrintWindow } from '../Utils/AttendanceUtils';
import { LOADING_TYPES } from '../Constants/AttendanceConstant';

export const useAttendanceActions = ({
  filteredData,
  setFilters,
  setSearchQuery,
  setSuccessMessage,
  setError,
  setIsLoading,
  setLoadingType,
  today,
}) => {
  const handleApply = useCallback(() => {
    setSuccessMessage("Filters applied successfully!");
  }, [setSuccessMessage]);

  const handleClear = useCallback(() => {
    setFilters({ department: "", employee: "", fromDate: "", toDate: "" });
    setSearchQuery("");
    setSuccessMessage("Filters cleared successfully!");
  }, [setFilters, setSearchQuery, setSuccessMessage]);

  const handleExportCSV = useCallback(async () => {
    if (filteredData.length === 0) {
      setError("No data available to export.");
      return;
    }
    setIsLoading(true);
    setLoadingType(LOADING_TYPES.CSV);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const filename = `attendance_${today.replace(/\//g, '-')}.csv`;
      exportToCSV(filteredData, filename);
      setSuccessMessage("CSV exported successfully!");
    } catch (err) {
      setError(`CSV Export failed: ${err.message || 'Unknown error. Please try again.'}`);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [filteredData, today, setIsLoading, setLoadingType, setError, setSuccessMessage]);

  const handleExportPDF = useCallback(async () => {
    if (filteredData.length === 0) {
      setError("No data available to export.");
      return;
    }
    setIsLoading(true);
    setLoadingType(LOADING_TYPES.PDF);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const htmlContent = generatePDFHTML(filteredData, today);
      openPrintWindow(htmlContent);
      setSuccessMessage("PDF print dialog opened!");
    } catch (err) {
      setError(`PDF Export failed: ${err.message || 'Unknown error. Please try again.'}`);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [filteredData, today, setIsLoading, setLoadingType, setError, setSuccessMessage]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setLoadingType(LOADING_TYPES.DATA);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSuccessMessage("Data refreshed successfully!");
    } catch (err) {
      setError(`Refresh failed: ${err.message || 'Unknown error. Please try again.'}`);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [setIsLoading, setLoadingType, setError, setSuccessMessage]);

  return {
    handleApply,
    handleClear,
    handleExportCSV,
    handleExportPDF,
    handleRefresh,
  };
};