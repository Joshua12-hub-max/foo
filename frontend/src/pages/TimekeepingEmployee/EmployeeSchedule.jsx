import { useState, useEffect, useCallback } from 'react';

// Import Utils
import { getTodayDate } from '@components/Custom/Timekeeping/ScheduleAdminComponents/Employee/utils/dateTimeUtils';

// Import Hooks
import { useScheduleData } from '@components/Custom/Timekeeping/ScheduleAdminComponents/Employee/hooks/useScheduleData';
import { useFilters } from '@components/Custom/Timekeeping/ScheduleAdminComponents/Employee/hooks/useFilters';
import { usePagination } from '@components/Custom/Timekeeping/ScheduleAdminComponents/Employee/hooks/usePagination';
import { useExport } from '@components/Custom/Timekeeping/ScheduleAdminComponents/Employee/hooks/useExport';

// Import Constants
import { PAGE_SIZE } from '@components/Custom/Timekeeping/ScheduleAdminComponents/Employee/constants/scheduleConstants';

// Import Components
import LoadingSpinner from '@components/Custom/Timekeeping/ScheduleAdminComponents/Employee/components/LoadingSpinner';
import ErrorAlert from '@components/Custom/Timekeeping/ScheduleAdminComponents/Employee/components/ErrorAlert';
import SuccessAlert from '@components/Custom/Timekeeping/ScheduleAdminComponents/Employee/components/SuccessAlert';
import Header from '@components/Custom/Timekeeping/ScheduleAdminComponents/Employee/components/Header';
import Filters from '@components/Custom/Timekeeping/ScheduleAdminComponents/Employee/components/Filters';
import ExportOptions from '@components/Custom/Timekeeping/ScheduleAdminComponents/Employee/components/ExportOptions';
import Table from '@components/Custom/Timekeeping/ScheduleAdminComponents/Employee/components/Table';
import Pagination from '@components/Custom/Timekeeping/ScheduleAdminComponents/Employee/components/Pagination';

// Constants
const AUTO_DISMISS_ERROR = 5000;
const AUTO_DISMISS_SUCCESS = 3000;

const EmployeeSchedule = () => {
  const today = getTodayDate();

  // State management
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Custom hooks
  const { data, isLoading: dataLoading, error, setError, handleRefresh } = useScheduleData();
  const { filters, searchQuery, filteredData, handleFilterChange, handleSearchChange, handleClear: clearFilters } = useFilters(data);
  const { currentPage, totalPages, paginatedData, handlePageChange, resetPage } = usePagination(filteredData, PAGE_SIZE);
  const { isLoading: exportLoading, loadingType, error: exportError, setError: setExportError, handleExportCSV, handleExportPDF } = useExport(filteredData, today);
  const isLoading = dataLoading || exportLoading;

  // Auto-dismiss error messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), AUTO_DISMISS_ERROR);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  useEffect(() => {
    if (exportError) {
      const timer = setTimeout(() => setExportError(null), AUTO_DISMISS_ERROR);
      return () => clearTimeout(timer);
    }
  }, [exportError, setExportError]);

  // Auto-dismiss success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), AUTO_DISMISS_SUCCESS);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handler for applying filters
  const handleApply = useCallback(() => {
    // Check if at least one filter is selected
    const hasFilters = filters.fromDateTime || filters.toDateTime;
    if (!hasFilters) {
      setError("Please select at least one filter before applying.");
      return;
    }
    resetPage();
    setSuccessMessage("Filters applied successfully!");
  }, [resetPage, filters, setError]);

  // Handler for clearing filters
  const handleClearFilters = useCallback(() => {
    clearFilters();
    resetPage();
    setSuccessMessage("Filters cleared successfully!");
  }, [clearFilters, resetPage]);

  // Handler for CSV export
  const handleCSVExport = useCallback(async () => {
    if (filteredData.length === 0) {
      setExportError("No data available to export.");
      return;
    }
    const success = await handleExportCSV();
    if (success) {
      setSuccessMessage("CSV exported successfully!");
    }
  }, [filteredData.length, handleExportCSV, setExportError]);

  // Handler for PDF export
  const handlePDFExport = useCallback(async () => {
    if (filteredData.length === 0) {
      setExportError("No data available to export.");
      return;
    }
    const success = await handleExportPDF();
    if (success) {
      setSuccessMessage("PDF print dialog opened!");
    }
  }, [filteredData.length, handleExportPDF, setExportError]);

  // Show loading spinner during export
  if (isLoading && loadingType) {
    return <LoadingSpinner loadingType={loadingType === 'data' ? 'data' : loadingType} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      
      {/* Header Section */}
      <Header today={today} isLoading={isLoading} onRefresh={handleRefresh} />

      <hr className="mb-6 border-[1px] border-gray-200" />

      {/* Alert Messages */}
      <ErrorAlert 
        error={error || exportError} 
        onDismiss={() => {
          setError(null);
          setExportError(null);
        }}
        action={
          error && (
            <button 
              onClick={handleRefresh}
              className="ml-4 underline text-sm hover:text-red-800"
            >
              Retry
            </button>
          )
        }
      />
      
      <SuccessAlert message={successMessage} onDismiss={() => setSuccessMessage(null)} />

      {/* Filters Section */}
      <Filters
        filters={filters}
        searchQuery={searchQuery}
        filteredDataCount={filteredData.length}
        isLoading={isLoading}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
        onApply={handleApply}
        onClear={handleClearFilters}
      />

      {/* Export Options */}
      <ExportOptions
        isLoading={isLoading}
        dataCount={filteredData.length}
        onExportCSV={handleCSVExport}
        onExportPDF={handlePDFExport}
      />

      {/* Table Section - View Only (Employees cannot edit/delete schedules) */}
      <Table 
        isLoading={dataLoading} 
        paginatedData={paginatedData}
      />

      {/* Pagination Section */}
      {!dataLoading && filteredData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredData.length}
          pageSize={PAGE_SIZE}
          isLoading={isLoading}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default EmployeeSchedule;