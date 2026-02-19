import React, { useState } from 'react';
import { AdminDTRHeader } from "@features/DailyTimeRecord/components/Admin/AdminDTRHeader";
import { AdminDTRNotification } from "@features/DailyTimeRecord/components/Admin/AdminDTRNotification";
import { AdminDTRFilters } from "@features/DailyTimeRecord/components/Admin/AdminDTRFilters";
import { AdminDTRExportButtons } from "@features/DailyTimeRecord/components/Admin/AdminDTRExportButtons";
import { AdminDTRTable } from "@features/DailyTimeRecord/components/Admin/AdminDTRTable";
import { AdminDTRPagination } from "@features/DailyTimeRecord/components/Admin/AdminDTRPagination";
import { AdminDTREditModal } from "@features/DailyTimeRecord/components/Admin/AdminDTREditModal";
import { ReviewCorrectionModal } from "@features/DailyTimeRecord/components/Admin/ReviewCorrectionModal";
import { useAdminDTR } from "@features/DailyTimeRecord/hooks/Admin/useAdminDTR";
import { dtrApi } from "@api/dtrApi";
import { DTRRecord } from "@features/DailyTimeRecord/Utils/adminDTRUtils";

const DailyTimeRecord = () => {
  const {
    sidebarOpen,
    filters,
    searchQuery,
    debouncedSearchQuery,
    currentPage,
    isLoading,
    error,
    successMessage,
    paginationData,
    uniqueDepartments,
    uniqueEmployees,
    editingRecord,
    
    // Setters
    setEditingRecord,
    setError,
    setSuccessMessage,
    
    // Handlers
    handleFilterChange,
    handleApply,
    handleClear,
    handleSearchChange,
    handleRefresh,
    handlePrevPage,
    handleNextPage,
    handleExportCSV,
    handleExportPDF,
    getStatusBadge,
    handleEdit,
    handleSaveEdit
  } = useAdminDTR();

  // --- Review Correction State ---
  const [reviewingRecord, setReviewingRecord] = useState<DTRRecord | null>(null);

  const handleReview = (item: DTRRecord) => {
    setReviewingRecord(item);
  };

  const handleApproveCorrection = async (id: number) => {
    try {
      await dtrApi.updateCorrectionStatus([id], 'Approved');
      setSuccessMessage('Correction request approved successfully.');
      handleRefresh();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to approve correction.';
      setError(errorMsg);
    }
  };

  const handleRejectCorrection = async (id: number, reason: string) => {
    try {
      await dtrApi.updateCorrectionStatus([id], 'Rejected', reason);
      setSuccessMessage('Correction request rejected.');
      handleRefresh();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reject correction.';
      setError(errorMsg);
    }
  };

  const currentItems = paginationData.currentItems;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-100 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      <AdminDTRHeader 
        today={today}
        handleRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {error && (
        <AdminDTRNotification 
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {successMessage && (
         <AdminDTRNotification 
         type="success"
         message={successMessage}
         onClose={() => setSuccessMessage(null)}
       />
      )}

      <AdminDTRFilters 
        uniqueDepartments={uniqueDepartments}
        uniqueEmployees={uniqueEmployees}
        isLoading={isLoading}
      />

      <AdminDTRExportButtons 
        handleExportCSV={handleExportCSV}
        handleExportPDF={handleExportPDF}
        isLoading={isLoading}
        filteredDataLength={currentItems.length}
      />

      <AdminDTRTable 
        currentItems={currentItems}
        getStatusBadge={getStatusBadge}
        debouncedSearchQuery={debouncedSearchQuery}
        filters={filters}
        onEdit={handleEdit}
        onReview={handleReview}
      />

      {paginationData && (
        <AdminDTRPagination 
          startIndex={paginationData.startIndex}
          endIndex={paginationData.endIndex}
          totalRecords={paginationData.totalRecords || 0}
          currentPage={currentPage}
          totalPages={paginationData.totalPages}
          handlePrevPage={handlePrevPage}
          handleNextPage={handleNextPage}
          isLoading={isLoading}
        />
      )}

      <AdminDTREditModal 
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleSaveEdit}
        record={editingRecord}
      />

      <ReviewCorrectionModal
        isOpen={!!reviewingRecord}
        onClose={() => setReviewingRecord(null)}
        record={reviewingRecord}
        onApprove={handleApproveCorrection}
        onReject={handleRejectCorrection}
      />
    </div>
  );
};

export default DailyTimeRecord;