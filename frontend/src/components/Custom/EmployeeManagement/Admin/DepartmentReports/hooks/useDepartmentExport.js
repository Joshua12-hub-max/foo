import { useState, useCallback } from 'react';
import { exportToExcel, exportToPDF } from '@/components/Custom/EmployeeManagement/Admin/DepartmentReports/utils/departmentReportsExport';
import { EXPORT_FILENAMES, NOTIFICATION_DURATION } from '@/components/Custom/EmployeeManagement/Admin/DepartmentReports/constants/DepartmentReports.constants';

export const useDepartmentExport = ({ getExportData, filters, setError, setSuccessMessage }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async (exportType) => {
    setIsExporting(true);
    setError(null);
    
    try {
      const exportData = await getExportData();
      
      if (exportData.success) {
        const dateRange = `${filters.fromDate}_to_${filters.toDate}`;
        
        if (exportType === 'EXCEL') {
          exportToExcel(exportData, EXPORT_FILENAMES.EXCEL(dateRange));
          setSuccessMessage('Excel file downloaded successfully');
        } else if (exportType === 'PDF') {
          exportToPDF(exportData, EXPORT_FILENAMES.PDF(dateRange));
          setSuccessMessage('PDF downloaded successfully');
        }
        
        setTimeout(() => setSuccessMessage(null), NOTIFICATION_DURATION);
      }
    } catch (err) {
      console.error(`Failed to generate ${exportType} export:`, err);
      setError(`Failed to generate ${exportType} export`);
    } finally {
      setIsExporting(false);
    }
  }, [getExportData, filters.fromDate, filters.toDate, setError, setSuccessMessage]);

  const handleExportCSV = () => handleExport('EXCEL');
  const handleExportPDF = () => handleExport('PDF');

  return {
    isExporting,
    handleExportCSV,
    handleExportPDF
  };
};

export default useDepartmentExport;
