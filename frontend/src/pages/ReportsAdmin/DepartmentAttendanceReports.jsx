import { useDepartmentReports } from '@components/Custom/EmployeeManagement/Admin/DepartmentReports/hooks/useDepartmentReports';
import { useDepartmentExport } from '@components/Custom/EmployeeManagement/Admin/DepartmentReports/hooks/useDepartmentExport';
import { DepartmentReportsHeader } from '@components/Custom/EmployeeManagement/Admin/DepartmentReports/DepartmentReportsHeader';
import { DepartmentReportsFilters } from '@components/Custom/EmployeeManagement/Admin/DepartmentReports/DepartmentReportsFilters';
import { DepartmentReportsExportButtons } from '@components/Custom/EmployeeManagement/Admin/DepartmentReports/DepartmentReportsExportButtons';
import { DepartmentReportsSummaryTable } from '@components/Custom/EmployeeManagement/Admin/DepartmentReports/DepartmentReportsSummaryTable';
import { DepartmentReportDetailModal } from '@components/Custom/EmployeeManagement/Admin/DepartmentReports/DepartmentReportDetailModal';
import { ReportNotification } from '@components/Custom/EmployeeManagement/Admin/DepartmentReports/ReportNotification';

const DepartmentAttendanceReports = () => {
  const reports = useDepartmentReports();
  
  const { 
    isExporting, 
    handleExportCSV, 
    handleExportPDF 
  } = useDepartmentExport({
    getExportData: reports.getExportData,
    filters: reports.filters,
    setError: reports.setError,
    setSuccessMessage: reports.setSuccessMessage
  });

  const isPageLoading = reports.isLoading || isExporting;

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${reports.sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      
      <DepartmentReportsHeader 
        today={reports.today}
        handleRefresh={reports.handleRefresh}
        isLoading={isPageLoading}
      />

      <ReportNotification 
        type="error" 
        message={reports.error} 
        onClose={() => reports.setError(null)} 
      />

      <ReportNotification 
        type="success" 
        message={reports.successMessage} 
        onClose={() => reports.setSuccessMessage(null)} 
      />

      <DepartmentReportsFilters
        filters={reports.filters}
        handleFilterChange={reports.handleFilterChange}
        handleApply={reports.handleApply}
        handleClear={reports.handleClear}
        isLoading={reports.isLoading}
        departments={reports.departments}
      />

      <DepartmentReportsExportButtons
        handleExportCSV={handleExportCSV}
        handleExportPDF={handleExportPDF}
        isLoading={isPageLoading}
        dataLength={reports.summaryData.length}
      />

      <DepartmentReportsSummaryTable
        data={reports.summaryData}
        isLoading={reports.isLoading}
        onDepartmentClick={reports.handleDepartmentSelect}
        meta={reports.meta}
      />

      <DepartmentReportDetailModal
        isOpen={!!reports.selectedDepartment}
        department={reports.selectedDepartment}
        data={reports.detailData}
        isLoading={reports.isLoadingDetails}
        filters={reports.detailFilters}
        meta={reports.detailMeta}
        onClose={reports.handleCloseDetail}
        onFilterChange={reports.handleDetailFilterChange}
        onPageChange={reports.handleDetailPageChange}
      />
    </div>
  );
};

export default DepartmentAttendanceReports;
