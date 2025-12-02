import { useState } from "react";
import { useOutletContext } from 'react-router-dom';

//Modals
import { ViewModal } from "../../components/Custom/DTRCorrectionHR/components/Modals/View";
import { EditModal } from "../../components/Custom/DTRCorrectionHR/components/Modals/Edit";

//Components
import { LoadingSpinner } from "../../components/Custom/DTRCorrectionHR/components/DTRCorrectionLoadingSpinner";
import DTRHeader from "../../components/Custom/DTRCorrectionHR/components/DTRCorrectionHeader";
import { Notification } from "../../components/Custom/DTRCorrectionHR/components/DTRCorrectionNotification";
import { AdvancedFilters } from "../../components/Custom/DTRCorrectionHR/components/DTRCorrectionFilter";
import { SearchBar } from "../../components/Custom/DTRCorrectionHR/components/DTRCorrectionSearchBar";
import { DTRTable } from "../../components/Custom/DTRCorrectionHR/components/DTRCorrectionTable";
import { Pagination } from "../../components/Custom/DTRCorrectionHR/components/DTRCorrectionPagination";
// Temporary comment to force re-compilation

//Hooks
import { useDTRCorrection } from "../../components/Custom/DTRCorrectionHR/Hooks/useDTRCorrection";

export default function DTRCorrection() {
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;
  
  const [viewRecord, setViewRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);

  const {today, activeTab, searchQuery, currentPage, isLoading, error, successMessage, actionLoading, filters, uniqueDepartments,
         uniqueEmployees, filteredData, paginationData, setCurrentPage, setError, setSuccessMessage, handleRefresh, handleSearchChange, handleFilterChange, handleTabChange,  
         handleApplyFilters, handleClearFilters,  handleSaveEdit, handleApprove, handleReject
        } = useDTRCorrection();

  const { totalPages, startIndex, endIndex, currentItems } = paginationData;

  const handleEditSave = async (updatedRecord) => {
    const success = await handleSaveEdit(updatedRecord);
    if (success) {
      setEditRecord(null);
    }
  };
   
 
  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
       <DTRHeader
        today={today}
        handleRefresh={handleRefresh}
        isLoading={isLoading}
      />

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Notifications */}
      {error && (
        <Notification 
          type="error" 
          message={error} 
          onClose={() => setError(null)} 
        />
      )}

      {successMessage && (
        <Notification 
          type="success" 
          message={successMessage} 
          onClose={() => setSuccessMessage(null)} 
        />
      )}
    
      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filters}
        uniqueDepartments={uniqueDepartments}
        uniqueEmployees={uniqueEmployees}
        onFilterChange={handleFilterChange}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        isLoading={isLoading}
      />

      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        filteredCount={filteredData.length}
        isLoading={isLoading}
      />

      {/* Table */}
      <div className="flex-1 scrollbar-bg-[F8F9FA] overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <DTRTable
            currentItems={currentItems}
            activeTab={activeTab}
            actionLoading={actionLoading}
            onView={setViewRecord}
            onEdit={setEditRecord}
            onApprove={handleApprove}
            onReject={handleReject}
            searchQuery={searchQuery}
            filters={filters}
          />
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filteredData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          totalRecords={filteredData.length}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modals */}
      <ViewModal
        isOpen={viewRecord !== null}
        onClose={() => setViewRecord(null)}
        record={viewRecord}
        handleApprove={handleApprove}
        handleReject={handleReject}
      />
      <EditModal
        isOpen={editRecord !== null}
        onClose={() => setEditRecord(null)}
        record={editRecord}
        onSave={handleEditSave}
      />
    </div>
  );
}