import { useAdminUndertime } from "../../components/Custom/UndertimeComponents/Admin/Hooks/useAdminUndertime";
import { AdminUndertimeHeader } from "../../components/Custom/UndertimeComponents/Admin/Components/AdminUndertimeHeader";
import { AdminUndertimeNotification } from "../../components/Custom/UndertimeComponents/Admin/Components/AdminUndertimeNotification";
import { AdminUndertimeFilters } from "../../components/Custom/UndertimeComponents/Admin/Components/AdminUndertimeFilters";
import { AdminUndertimeSearchBar } from "../../components/Custom/UndertimeComponents/Admin/Components/AdminUndertimeSearchBar";
import { AdminUndertimeExportButtons } from "../../components/Custom/UndertimeComponents/Admin/Components/AdminUndertimeExportButtons";
import { AdminUndertimeTable } from "../../components/Custom/UndertimeComponents/Admin/Components/AdminUndertimeTable";
import { AdminUndertimePagination } from "../../components/Custom/UndertimeComponents/Admin/Components/AdminUndertimePagination";
import { AdminUndertimeLoadingSpinner } from "../../components/Custom/UndertimeComponents/Admin/Components/AdminUndertimeLoadingSpinner";
import { ApproveModal } from "../../components/Custom/UndertimeComponents/Admin/Modals/ApproveModal";
import { RejectModal } from "../../components/Custom/UndertimeComponents/Admin/Modals/RejectModal";

const UndertimeRequests = () => {
  const { today, sidebarOpen, filters, searchQuery, debouncedSearchQuery, currentPage, isLoading, loadingType, error, successMessage, filteredData, paginationData, uniqueDepartments, uniqueEmployees,
    selectedRequest, isApproveModalOpen, isRejectModalOpen, setError, setSuccessMessage, handleFilterChange, handleApply, handleClear, handleSearchChange, handleRefresh, handlePrevPage, 
    handleNextPage, handleExportCSV, handleExportPDF, handleOpenApproveModal, handleOpenRejectModal, handleCloseApproveModal, handleCloseRejectModal, handleApproveRequest, handleRejectRequest, 
    getStatusBadge } = useAdminUndertime();

  const { totalPages, startIndex, endIndex, currentItems } = paginationData;

  if (isLoading && loadingType === "data") {
    return <AdminUndertimeLoadingSpinner loadingType={loadingType} />;
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-100 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      <AdminUndertimeHeader 
        today={today}
        handleRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Error Message */}
      {error && (
        <AdminUndertimeNotification 
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Success Message */}
      {successMessage && (
        <AdminUndertimeNotification 
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      <AdminUndertimeFilters 
        filters={filters}
        handleFilterChange={handleFilterChange}
        handleApply={handleApply}
        handleClear={handleClear}
        isLoading={isLoading}
        uniqueDepartments={uniqueDepartments}
        uniqueEmployees={uniqueEmployees}
      />

      <AdminUndertimeSearchBar 
        searchQuery={searchQuery}
        handleSearchChange={handleSearchChange}
        filteredDataLength={filteredData.length}
        isLoading={isLoading}
      />

      <AdminUndertimeExportButtons 
        handleExportCSV={handleExportCSV}
        handleExportPDF={handleExportPDF}
        isLoading={isLoading}
        filteredDataLength={filteredData.length}
      />

      <AdminUndertimeTable 
        currentItems={currentItems}
        getStatusBadge={getStatusBadge}
        debouncedSearchQuery={debouncedSearchQuery}
        filters={filters}
        handleOpenApproveModal={handleOpenApproveModal}
        handleOpenRejectModal={handleOpenRejectModal}
      />

      {!isLoading && filteredData.length > 0 && (
        <AdminUndertimePagination 
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

      {/* Modals */}
      <ApproveModal 
        isOpen={isApproveModalOpen}
        request={selectedRequest}
        onApprove={handleApproveRequest}
        onClose={handleCloseApproveModal}
      />

      <RejectModal 
        isOpen={isRejectModalOpen}
        request={selectedRequest}
        onReject={handleRejectRequest}
        onClose={handleCloseRejectModal}
      />
    </div>
  );
};

export default UndertimeRequests;