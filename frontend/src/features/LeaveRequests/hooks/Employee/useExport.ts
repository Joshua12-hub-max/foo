import { useState, useCallback } from 'react';
import { exportToCSV, formatLeaveRequestsForCSV } from '../../components/Employee/utils/csvExport';
import { exportToPDF, formatLeaveRequestsForPDF } from '../../components/Employee/utils/pdfExport';
import { EmployeeLeaveRequest } from '../../types';

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExportCSV = useCallback(async (data: EmployeeLeaveRequest[]) => {
    if (!data || data.length === 0) {
      setExportError('No data available to export');
      return;
    }

    setIsExporting(true);
    setExportType('CSV');
    setExportError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const formattedData = formatLeaveRequestsForCSV(data);
      await exportToCSV(formattedData);
    } catch (err: unknown) {
      console.error('Export to CSV failed:', err);
      setExportError(err instanceof Error ? err.message : 'CSV export failed');
    } finally {
      setIsExporting(false);
      setExportType('');
    }
  }, []);

  const handleExportPDF = useCallback(async (data: EmployeeLeaveRequest[]) => {
    if (!data || data.length === 0) {
      setExportError('No data available to export');
      return;
    }

    setIsExporting(true);
    setExportType('PDF');
    setExportError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const formattedData = formatLeaveRequestsForPDF(data);
      exportToPDF(formattedData);
    } catch (err: unknown) {
      console.error('Export to PDF failed:', err);
      setExportError(err instanceof Error ? err.message : 'PDF export failed');
    } finally {
      setIsExporting(false);
      setExportType('');
    }
  }, []);

  return { isExporting, exportType, exportError, handleExportCSV, handleExportPDF};
};
