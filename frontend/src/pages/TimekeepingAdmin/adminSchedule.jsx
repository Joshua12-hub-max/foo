import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';

// Import Utils
import { getTodayDate } from '../../components/Custom/ScheduleAdminComponents/utils/dateTimeUtils';

// Import Hooks
import { useScheduleData } from '../../components/Custom/ScheduleAdminComponents/hooks/useScheduleData';
import { useFilters } from '../../components/Custom/ScheduleAdminComponents/hooks/useFilters';
import { usePagination } from '../../components/Custom/ScheduleAdminComponents/hooks/usePagination';
import { useExport } from '../../components/Custom/ScheduleAdminComponents/hooks/useExport';

// Import Constants
import { PAGE_SIZE } from '../../components/Custom/ScheduleAdminComponents/constants/scheduleConstants';

// Import Components
import LoadingSpinner from '../../components/Custom/ScheduleAdminComponents/components/LoadingSpinner';
import ErrorAlert from '../../components/Custom/ScheduleAdminComponents/components/ErrorAlert';
import SuccessAlert from '../../components/Custom/ScheduleAdminComponents/components/SuccessAlert';
import Header from '../../components/Custom/ScheduleAdminComponents/components/Header';
import Filters from '../../components/Custom/ScheduleAdminComponents/components/Filters';
import ExportOptions from '../../components/Custom/ScheduleAdminComponents/components/ExportOptions';
import Table from '../../components/Custom/ScheduleAdminComponents/components/Table';
import Pagination from '../../components/Custom/ScheduleAdminComponents/components/Pagination';

const Schedule = () => {
  // Read `sidebarOpen` from the parent Outlet context (HDashboard passes it).
  // Fallback to true so the component still works when rendered outside the Outlet.
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;
  const today = getTodayDate();

  // State management
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Custom hooks mula sa useStateloading() "object destructuring"
  const { data, isLoading: dataLoading, error, setError, handleRefresh } = useScheduleData();
  const { filters, searchQuery, uniqueDepartments, uniqueEmployees, filteredData, handleFilterChange, handleSearchChange, handleClear: clearFilters, } = useFilters(data);
  
  const { currentPage, totalPages, paginatedData, handlePageChange, resetPage } = usePagination(filteredData, PAGE_SIZE);

  const { isLoading: exportLoading, loadingType, error: exportError, setError: setExportError, handleExportCSV, handleExportPDF, } = useExport(filteredData, today);

  const isLoading = dataLoading || exportLoading;

  // Auto-dismiss messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  useEffect(() => {
    if (exportError) {
      const timer = setTimeout(() => setExportError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [exportError, setExportError]);

  //nagha Handle ng apply filters
  const handleApply = useCallback(() => {
    resetPage();
    setSuccessMessage("Filters applied successfully!");
  }, [resetPage]);

  // nagha Handle ng clear filters
  const handleClearFilters = useCallback(() => {
    clearFilters();
    resetPage();
    setSuccessMessage("Filters cleared successfully!");
  }, [clearFilters, resetPage]);

  // nagha Handle ng export CSV
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

  // nagha Handle ng  export PDF
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
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      
      {/* Header Section */}
      <Header today={today} isLoading={isLoading} onRefresh={handleRefresh} />

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Alert Messages */}
      <ErrorAlert error={error || exportError} onDismiss={() => {
        setError(null);
        setExportError(null);
      }} />
      
      <SuccessAlert message={successMessage} onDismiss={() => setSuccessMessage(null)} />

      {/* Filters Section */}
      <Filters
        filters={filters}
        searchQuery={searchQuery}
        uniqueDepartments={uniqueDepartments}
        uniqueEmployees={uniqueEmployees}
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

      {/* Table Section */}
      <Table isLoading={dataLoading} paginatedData={paginatedData} />

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

export default Schedule;