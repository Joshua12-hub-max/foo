import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import EditDailyTimeRecordsModal from "../../components/Custom/EmployeeDtrcorrections/components/Modals/edit";
import ViewDailyTimeRecordsModal from "../../components/Custom/EmployeeDtrcorrections/components/Modals/view";
import DTRCorrectionRequestModal from "../../components/Custom/EmployeeDtrcorrections/components/Modals/DTRCorrectionRequestModal";
import { useEmployeeDTRCorrection } from "../../components/Custom/EmployeeDtrcorrections/hooks/useEmployeeDTRCorrection";
import { EmployeeDTRHeader } from "../../components/Custom/EmployeeDtrcorrections/components/EmployeeDTRHeader";
import { EmployeeDTRNotification } from "../../components/Custom/EmployeeDtrcorrections/components/EmployeeDTRNotification";
import { EmployeeDTRFilters } from "../../components/Custom/EmployeeDtrcorrections/components/EmployeeDTRFilters";
import { EmployeeDTRSearchBar } from "../../components/Custom/EmployeeDtrcorrections/components/EmployeeDTRSearchBar";
import { EmployeeDTRExportButtons } from "../../components/Custom/EmployeeDtrcorrections/components/EmployeeDTRExportButtons";
import { EmployeeDTRTable } from "../../components/Custom/EmployeeDtrcorrections/components/EmployeeDTRTable";
import { EmployeeDTRPagination } from "../../components/Custom/EmployeeDtrcorrections/components/EmployeeDTRPagination";
import { EmployeeDTRLoadingSpinner } from "../../components/Custom/EmployeeDtrcorrections/components/EmployeeDTRLoadingSpinner";

const EmployeeDtrcorrections = () => {
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Use custom hook for all state and logic
  const {
    today,
    filters,
    searchQuery,
    debouncedSearchQuery,
    currentPage,
    isLoading,
    loadingType,
    error,
    successMessage,
    isModalOpen,
    isViewModalOpen,
    selectedCorrection,
    filteredData,
    paginationData,
    setError,
    setSuccessMessage,
    handleFilterChange,
    handleApply,
    handleClear,
    handleSearchChange,
    handleEditClick,
    handleViewClick,
    handleModalClose,
    handleViewModalClose,
    handleUpdateCorrection,
    handleRefresh,
    handlePrevPage,
    handleNextPage,
    handleExportCSV,
    handleExportPDF
  } = useEmployeeDTRCorrection();

  const { totalPages, startIndex, endIndex, currentItems } = paginationData;

  const handleRequestSuccess = () => {
    setSuccessMessage("Correction request submitted successfully!");
    setIsRequestModalOpen(false);
    handleRefresh();
  };

  // Show loading spinner when initially loading data
  if (isLoading && loadingType === 'data') {
    return <EmployeeDTRLoadingSpinner />;
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-100 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      {/* Header */}
      <EmployeeDTRHeader 
        today={today}
        handleRefresh={handleRefresh}
        isLoading={isLoading}
        onNewRequest={() => setIsRequestModalOpen(true)}
      />

      {/* Error Notification */}
      {error && (
        <EmployeeDTRNotification 
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Success Notification */}
      {successMessage && (
        <EmployeeDTRNotification 
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* Advanced Filters */}
      <EmployeeDTRFilters 
        filters={filters}
        handleFilterChange={handleFilterChange}
        handleApply={handleApply}
        handleClear={handleClear}
        isLoading={isLoading}
      />

      {/* Search Bar */}
      <EmployeeDTRSearchBar 
        searchQuery={searchQuery}
        handleSearchChange={handleSearchChange}
        filteredDataLength={filteredData.length}
        isLoading={isLoading}
      />

      {/* Export Options */}
      <EmployeeDTRExportButtons 
        handleExportCSV={handleExportCSV}
        handleExportPDF={handleExportPDF}
        isLoading={isLoading}
        filteredDataLength={filteredData.length}
      />

      {/* Table */}
      <EmployeeDTRTable 
        currentItems={currentItems}
        handleViewClick={handleViewClick}
        handleEditClick={handleEditClick}
        debouncedSearchQuery={debouncedSearchQuery}
        filters={filters}
      />

      {/* Pagination */}
      {!isLoading && (
        <EmployeeDTRPagination 
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          totalRecords={filteredData.length}
          handlePrevPage={handlePrevPage}
          handleNextPage={handleNextPage}
          isLoading={isLoading}
        />
      )}

      {/* Edit Modal */}
      <EditDailyTimeRecordsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        correctionData={selectedCorrection}
        onUpdate={handleUpdateCorrection}
      />

      {/* View Modal */}
      <ViewDailyTimeRecordsModal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        correctionData={selectedCorrection}
      />

      {/* Request Modal */}
      <DTRCorrectionRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={handleRequestSuccess}
      />
    </div>
  );
};

export default EmployeeDtrcorrections;