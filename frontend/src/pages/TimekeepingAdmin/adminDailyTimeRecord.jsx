import { useAdminDTR } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Admin/Hooks/useAdminDTR";
import { AdminDTRHeader } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Admin/Components/AdminDTRHeader";
import { AdminDTRNotification } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Admin/Components/AdminDTRNotification";
import { AdminDTRFilters } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Admin/Components/AdminDTRFilters";
import { AdminDTRSearchBar } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Admin/Components/AdminDTRSearchBar";
import { AdminDTRExportButtons } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Admin/Components/AdminDTRExportButtons";
import { AdminDTRTable } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Admin/Components/AdminDTRTable";
import { AdminDTRPagination } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Admin/Components/AdminDTRPagination";
import { AdminDTRLoadingSpinner } from "@components/Custom/Timekeeping/DailyTimeRecordComponents/Admin/Components/AdminDTRLoadingSpinner";

const DailyTimeRecord = () => {
  const { today, sidebarOpen, filters, searchQuery, debouncedSearchQuery, currentPage, isLoading, loadingType, error, successMessage, filteredData, paginationData, uniqueDepartments, uniqueEmployees,
    setError, setSuccessMessage, handleFilterChange, handleApply, handleClear, handleSearchChange, handleRefresh, handlePrevPage, handleNextPage, handleExportCSV, 
    handleExportPDF, getStatusBadge } = useAdminDTR();

  const { totalPages, startIndex, endIndex, currentItems } = paginationData;

  if (isLoading && loadingType === "data") {
    return <AdminDTRLoadingSpinner loadingType={loadingType} />;
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-100 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      <AdminDTRHeader 
        today={today}
        handleRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Error Message */}
      {error && (
        <AdminDTRNotification 
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Success Message */}
      {successMessage && (
        <AdminDTRNotification 
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      <AdminDTRFilters 
        filters={filters}
        handleFilterChange={handleFilterChange}
        handleApply={handleApply}
        handleClear={handleClear}
        isLoading={isLoading}
        uniqueDepartments={uniqueDepartments}
        uniqueEmployees={uniqueEmployees}
      />

      <AdminDTRSearchBar 
        searchQuery={searchQuery}
        handleSearchChange={handleSearchChange}
        filteredDataLength={filteredData.length}
        isLoading={isLoading}
      />

      <AdminDTRExportButtons 
        handleExportCSV={handleExportCSV}
        handleExportPDF={handleExportPDF}
        isLoading={isLoading}
        filteredDataLength={filteredData.length}
      />

      <AdminDTRTable 
        currentItems={currentItems}
        getStatusBadge={getStatusBadge}
        debouncedSearchQuery={debouncedSearchQuery}
        filters={filters}
      />

      {!isLoading && filteredData.length > 0 && (
        <AdminDTRPagination 
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

export default DailyTimeRecord;