import { useOutletContext } from 'react-router-dom';
import { useEmployeeDTR } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Employee/Hooks/useEmployeeDTR";
import { EmployeeDTRHeader } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Employee/Components/EmployeeDTRHeader";
import { EmployeeDTRNotification } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Employee/Components/EmployeeDTRNotification";
import { EmployeeDTRFilters } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Employee/Components/EmployeeDTRFilters";
import { EmployeeDTRSearchBar } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Employee/Components/EmployeeDTRSearchBar";
import { EmployeeDTRExportButtons } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Employee/Components/EmployeeDTRExportButtons";
import { EmployeeDTRTable } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Employee/Components/EmployeeDTRTable";
import { EmployeeDTRPagination } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Employee/Components/EmployeeDTRPagination";
import { EmployeeDTRLoadingSpinner } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Employee/Components/EmployeeDTRLoadingSpinner";

const EmployeeDailyTimeRecord = () => {
  const { today, filters, searchQuery, debouncedSearchQuery, currentPage, isLoading, loadingType, error, successMessage, employeeInfo, filteredData, paginationData, 
    setError, setSuccessMessage, handleFilterChange, handleApply, handleClear, handleSearchChange, handleRefresh, handlePrevPage, handleNextPage, handleExportCSV, 
    handleExportPDF, getStatusBadge } = useEmployeeDTR();
  
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;

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