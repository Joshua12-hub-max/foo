import { useState, useCallback } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useDepartmentReports } from '../../components/Custom/DepartmentReportsComponents/hooks/useDepartmentReports';
import { DepartmentReportsHeader } from '../../components/Custom/DepartmentReportsComponents/DepartmentReportsHeader';
import { DepartmentReportsFilters } from '../../components/Custom/DepartmentReportsComponents/DepartmentReportsFilters';
import { DepartmentReportsExportButtons } from '../../components/Custom/DepartmentReportsComponents/DepartmentReportsExportButtons';
import { DepartmentReportsSummaryTable } from '../../components/Custom/DepartmentReportsComponents/DepartmentReportsSummaryTable';
import { DepartmentReportDetailModal } from '../../components/Custom/DepartmentReportsComponents/DepartmentReportDetailModal';
import { exportToExcel, exportToPDF } from '../../components/Custom/DepartmentReportsComponents/utils/departmentReportsExport';

/**
 * Department Attendance Reports Page
 * Centralized attendance records grouped by department for export to accountants
 */
const DepartmentAttendanceReports = () => {
  const {
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
    setError,
    setSuccessMessage,
    handleFilterChange,
    handleApply,
    handleClear,
    handleRefresh,
    handleDepartmentSelect,
    handleCloseDetail,
    handleDetailFilterChange,
    handleDetailPageChange,
    getExportData
  } = useDepartmentReports();

  const [isExporting, setIsExporting] = useState(false);

  // Export to Excel
  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    try {
      const exportData = await getExportData();
      if (exportData.success) {
        const dateRange = `${filters.fromDate}_to_${filters.toDate}`;
        exportToExcel(exportData, `department_attendance_${dateRange}`);
        setSuccessMessage('Excel file downloaded successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('Failed to generate Excel export');
    } finally {
      setIsExporting(false);
    }
  }, [getExportData, filters, setError, setSuccessMessage]);

  // Export to PDF
  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    try {
      const exportData = await getExportData();
      if (exportData.success) {
        const dateRange = `${filters.fromDate}_to_${filters.toDate}`;
        exportToPDF(exportData, `department_attendance_${dateRange}`);
        setSuccessMessage('PDF downloaded successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('Failed to generate PDF export');
    } finally {
      setIsExporting(false);
    }
  }, [getExportData, filters, setError, setSuccessMessage]);

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-100 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      
      {/* Header */}
      <DepartmentReportsHeader 
        today={today}
        handleRefresh={handleRefresh}
        isLoading={isLoading || isExporting}
      />

      {/* Error Notification */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-xl">&times;</button>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700 text-xl">&times;</button>
        </div>
      )}

      {/* Filters */}
      <DepartmentReportsFilters
        filters={filters}
        handleFilterChange={handleFilterChange}
        handleApply={handleApply}
        handleClear={handleClear}
        isLoading={isLoading}
        departments={departments}
      />

      {/* Export Buttons */}
      <DepartmentReportsExportButtons
        handleExportCSV={handleExportCSV}
        handleExportPDF={handleExportPDF}
        isLoading={isLoading || isExporting}
        dataLength={summaryData.length}
      />

      {/* Summary Table */}
      <DepartmentReportsSummaryTable
        data={summaryData}
        isLoading={isLoading}
        onDepartmentClick={handleDepartmentSelect}
        meta={meta}
      />

      {/* Detail Modal */}
      <DepartmentReportDetailModal
        isOpen={!!selectedDepartment}
        department={selectedDepartment}
        data={detailData}
        isLoading={isLoadingDetails}
        filters={detailFilters}
        meta={detailMeta}
        onClose={handleCloseDetail}
        onFilterChange={handleDetailFilterChange}
        onPageChange={handleDetailPageChange}
      />
    </div>
  );
};

export default DepartmentAttendanceReports;
