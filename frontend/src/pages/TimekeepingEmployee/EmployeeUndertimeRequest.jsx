import { useEmployeeUndertime } from "@components/Custom/Timekeeping/UndertimeComponents/Employee/Hooks/useEmployeeUndertime";
import { EmployeeUndertimeHeader } from "@components/Custom/Timekeeping/UndertimeComponents/Employee/Components/EmployeeUndertimeHeader";
import { EmployeeUndertimeNotification } from "@components/Custom/Timekeeping/UndertimeComponents/Employee/Components/EmployeeUndertimeNotification";
import { EmployeeUndertimeFilters } from "@components/Custom/Timekeeping/UndertimeComponents/Employee/Components/EmployeeUndertimeFilters";
import { EmployeeUndertimeTable } from "@components/Custom/Timekeeping/UndertimeComponents/Employee/Components/EmployeeUndertimeTable";
import { EmployeeUndertimePagination } from "@components/Custom/Timekeeping/UndertimeComponents/Employee/Components/EmployeeUndertimePagination";
import { EmployeeUndertimeLoadingSpinner } from "@components/Custom/Timekeeping/UndertimeComponents/Employee/Components/EmployeeUndertimeLoadingSpinner";
import { SubmitUndertimeModal } from "@components/Custom/Timekeeping/UndertimeComponents/Employee/Modals/SubmitUndertimeModal";

const EmployeeUndertimeRequest = () => {
  const { today, filters, searchQuery, debouncedSearchQuery, currentPage, isLoading, loadingType, error, successMessage, filteredData, paginationData, isSubmitModalOpen, employeeInfo,
    setError, setSuccessMessage, handleFilterChange, handleApply, handleClear, handleSearchChange, handleRefresh, handlePrevPage, handleNextPage, handleExportCSV, handleExportPDF, 
    handleSubmitRequest, handleCancelRequest, handleOpenSubmitModal, handleCloseSubmitModal, getStatusBadge } = useEmployeeUndertime();

  const { totalPages, startIndex, endIndex, currentItems } = paginationData;

  if (isLoading && loadingType === "data") {
    return <EmployeeUndertimeLoadingSpinner loadingType={loadingType} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-100 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      <EmployeeUndertimeHeader 
        today={today}
        handleRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Error Message */}
      {error && (
        <EmployeeUndertimeNotification 
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Success Message */}
      {successMessage && (
        <EmployeeUndertimeNotification 
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      <EmployeeUndertimeFilters 
        filters={filters}
        handleFilterChange={handleFilterChange}
        handleApply={handleApply}
        handleClear={handleClear}
        onNewRequest={handleOpenSubmitModal}
        isLoading={isLoading}
      />

      <EmployeeUndertimeTable 
        currentItems={currentItems}
        getStatusBadge={getStatusBadge}
        debouncedSearchQuery={debouncedSearchQuery}
        filters={filters}
        handleCancelRequest={handleCancelRequest}
        isLoading={isLoading}
        handleExportCSV={handleExportCSV}
        handleExportPDF={handleExportPDF}
        filteredDataLength={filteredData.length}
        searchQuery={searchQuery}
        handleSearchChange={handleSearchChange}
        employeeInfo={employeeInfo}
      />

      {!isLoading && filteredData.length > 0 && (
        <EmployeeUndertimePagination 
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

      {/* Submit Modal */}
      <SubmitUndertimeModal 
        isOpen={isSubmitModalOpen}
        onSubmit={handleSubmitRequest}
        onClose={handleCloseSubmitModal}
      />
    </div>
  );
};

export default EmployeeUndertimeRequest;
