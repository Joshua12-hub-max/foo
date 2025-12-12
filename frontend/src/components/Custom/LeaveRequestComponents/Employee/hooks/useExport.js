import { useState, useCallback } from 'react';
import { exportToCSV } from '../utils/csvExport';
import { exportToPDF } from '../utils/pdfExport';

/**
 * Custom hook for handling CSV and PDF exports
 */
export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState('');
  const [exportError, setExportError] = useState(null);

  const handleExportCSV = useCallback(async (data) => {
    if (!data || data.length === 0) {
      setExportError('No data available to export');
      return;
    }

    setIsExporting(true);
    setExportType('CSV');
    setExportError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      exportToCSV(data);
    } catch (err) {
      console.error('Export to CSV failed:', err);
      setExportError(err.message || 'CSV export failed');
    } finally {
      setIsExporting(false);
      setExportType('');
    }
  }, []);

  const handleExportPDF = useCallback(async (data) => {
    if (!data || data.length === 0) {
      setExportError('No data available to export');
      return;
    }

    setIsExporting(true);
    setExportType('PDF');
    setExportError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      exportToPDF(data);
    } catch (err) {
      console.error('Export to PDF failed:', err);
      setExportError(err.message || 'PDF export failed');
    } finally {
      setIsExporting(false);
      setExportType('');
    }
  }, []);

  return { isExporting, exportType, exportError, handleExportCSV, handleExportPDF};
};
