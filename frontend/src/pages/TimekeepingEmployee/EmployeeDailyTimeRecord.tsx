import React from 'react';
import { useUIStore } from '@/stores';
import { useEmployeeDTR } from "@features/DailyTimeRecord/hooks/Employee/useEmployeeDTR";
import { EmployeeDTRHeader } from "@features/DailyTimeRecord/components/Employee/EmployeeDTRHeader";
import { EmployeeDTRNotification } from "@features/DailyTimeRecord/components/Employee/EmployeeDTRNotification";
import { EmployeeDTRFilters } from "@features/DailyTimeRecord/components/Employee/EmployeeDTRFilters";
import { EmployeeDTRSearchBar } from "@features/DailyTimeRecord/components/Employee/EmployeeDTRSearchBar";
import { EmployeeDTRExportButtons } from "@features/DailyTimeRecord/components/Employee/EmployeeDTRExportButtons";
import { EmployeeDTRTable } from "@features/DailyTimeRecord/components/Employee/EmployeeDTRTable";
import { EmployeeDTRPagination } from "@features/DailyTimeRecord/components/Employee/EmployeeDTRPagination";
import { EmployeeDTRLoadingSpinner } from "@features/DailyTimeRecord/components/Employee/EmployeeDTRLoadingSpinner";

const EmployeeDailyTimeRecord = () => {
  const { today, filters, searchQuery, debouncedSearchQuery, currentPage, isLoading, loadingType, error, successMessage, employeeInfo, filteredData, paginationData, 
    setError, setSuccessMessage, handleFilterChange, handleApply, handleClear, handleSearchChange, handleRefresh, handlePrevPage, handleNextPage, handleExportCSV, 
    handleExportPDF, getStatusBadge } = useEmployeeDTR();
  
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  const { totalPages, startIndex, endIndex, currentItems } = paginationData;

  if (isLoading && loadingType === "data") {
    return <EmployeeDTRLoadingSpinner loadingType={loadingType} />;
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      <EmployeeDTRHeader 
        today={today}
        handleRefresh={handleRefresh}
        isLoading={isLoading}
        employeeInfo={employeeInfo}
      />

      <hr className="mb-6 h-px bg-gray-200 border-0" />

      {/* Error Message */}
      {error && (
        <EmployeeDTRNotification 
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Success Message */}
      {successMessage && (
        <EmployeeDTRNotification 
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      <EmployeeDTRFilters 
        filters={filters}
        handleFilterChange={handleFilterChange}
        handleApply={handleApply}
        handleClear={handleClear}
        isLoading={isLoading}
      />

      <EmployeeDTRSearchBar 
        searchQuery={searchQuery}
        handleSearchChange={handleSearchChange}
        filteredDataLength={filteredData.length}
        isLoading={isLoading}
      />

      <EmployeeDTRExportButtons 
        handleExportCSV={handleExportCSV}
        handleExportPDF={handleExportPDF}
        isLoading={isLoading}
        filteredDataLength={filteredData.length}
      />

      <EmployeeDTRTable 
        currentItems={currentItems}
        getStatusBadge={getStatusBadge}
        debouncedSearchQuery={debouncedSearchQuery}
        filters={filters}
      />

      {!isLoading && filteredData.length > 0 && (
        <EmployeeDTRPagination 
          startIndex={startIndex}
          endIndex={endIndex}
          totalRecords={filteredData.length}
          currentPage={currentPage}
          totalPages={totalPages}
          handlePrevPage={handlePrevPage}
          handleNextPage={handleNextPage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default EmployeeDailyTimeRecord;