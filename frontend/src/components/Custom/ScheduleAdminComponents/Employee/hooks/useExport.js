import { useState, useCallback } from "react";
import { exportToCSV } from "../utils/csvExport";
import { exportToPDF } from "../utils/pdfExport";

export const useExport = (filteredData, today) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [error, setError] = useState(null);

  const handleExportCSV = useCallback(async () => {
    if (filteredData.length === 0) {
      setError("No data available to export.");
      return false;
    }
    setIsLoading(true);
    setLoadingType("CSV");
    setError(null);
    try {
      exportToCSV(filteredData, today);
      return true;
    } catch (err) {
      setError(`CSV Export failed: ${err.message || 'Unknown error. Please try again.'}`);
      return false;
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [filteredData, today]);

  const handleExportPDF = useCallback(async () => {
    if (filteredData.length === 0) {
      setError("No data available to export.");
      return false;
    }
    setIsLoading(true);
    setLoadingType("PDF");
    setError(null);
    try {
      exportToPDF(filteredData, today);
      return true;
    } catch (err) {
      setError(`PDF Export failed: ${err.message || 'Unknown error. Please try again.'}`);
      return false;
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [filteredData, today]);

  return {
    isLoading,
    loadingType,
    error,
    setError,
    handleExportCSV,
    handleExportPDF,
  };
};
