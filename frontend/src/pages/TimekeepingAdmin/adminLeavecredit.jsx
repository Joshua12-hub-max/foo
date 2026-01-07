import { useAdminLeaveCredit } from '@components/Custom/Timekeeping/LeaveCreditComponents/Admin/Hooks/useAdminLeaveCredit';
import { AdminLeaveCreditHeader } from '@components/Custom/Timekeeping/LeaveCreditComponents/Admin/Components/AdminLeaveCreditHeader';
import { AdminLeaveCreditTabs } from '@components/Custom/Timekeeping/LeaveCreditComponents/Admin/Components/AdminLeaveCreditTabs';
import { AdminLeaveCreditNotification } from '@components/Custom/Timekeeping/LeaveCreditComponents/Admin/Components/AdminLeaveCreditNotification';
import { AdminLeaveCreditSearchBar } from '@components/Custom/Timekeeping/LeaveCreditComponents/Admin/Components/AdminLeaveCreditSearchBar';
import { AdminLeaveCreditTable } from '@components/Custom/Timekeeping/LeaveCreditComponents/Admin/Components/AdminLeaveCreditTable';
import { AdminLeaveCreditPagination } from '@components/Custom/Timekeeping/LeaveCreditComponents/Admin/Components/AdminLeaveCreditPagination';
import { AdminLeaveCreditLoadingSpinner } from '@components/Custom/Timekeeping/LeaveCreditComponents/Admin/Components/AdminLeaveCreditLoadingSpinner';
import AddCreditModal from '@components/Custom/Timekeeping/LeaveCreditComponents/Admin/Modal/AddCreditModal';
import { ActionModal } from '@components/Custom/Timekeeping/LeaveCreditComponents/Admin/Modal/ActionModal';

const LeaveCredit = () => {
  const { today, activeTab, setActiveTab, rawCredits, employees, searchTerm, setSearchTerm, isLoading, loadingType, error, successMessage, isModalOpen, actionModal,
    creditForm, filteredData, paginationData, pendingCount, handleRefresh, handlePrevPage, handleNextPage, handleExportCSV, handleModalChange, handleSaveCredit,
    handleApprove, handleReject, formatDate, openModal, closeModal, openActionModal, closeActionModal } = useAdminLeaveCredit();

  const { startIndex, endIndex, currentItems, total, totalPages } = paginationData;

  if (isLoading && loadingType === "data") {
    return <AdminLeaveCreditLoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      <AdminLeaveCreditHeader 
        today={today} 
        onRefresh={handleRefresh} 
        isLoading={isLoading} 
      />

      <AdminLeaveCreditTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        pendingCount={pendingCount} 
      />

      <AdminLeaveCreditNotification 
        error={error} 
        successMessage={successMessage} 
      />

      <AdminLeaveCreditSearchBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeTab={activeTab}
        onOpenModal={openModal}
      />

      <AdminLeaveCreditTable 
        activeTab={activeTab}
        currentItems={currentItems}
        formatDate={formatDate}
        onOpenApproveModal={(req) => openActionModal(req, 'approve')}
        onOpenRejectModal={(req) => openActionModal(req, 'reject')}
      />

      <AdminLeaveCreditPagination 
        startIndex={startIndex}
        endIndex={endIndex}
        total={total}
        currentPage={paginationData.totalPages > 0 ? Math.ceil((startIndex + 1) / 10) : 1}
        totalPages={totalPages}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
      />

      <AddCreditModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        onSave={handleSaveCredit} 
        formData={creditForm} 
        onChange={handleModalChange} 
        employees={employees} 
        existingCredits={rawCredits}
      />
      
      <ActionModal 
        isOpen={actionModal.isOpen} 
        onClose={closeActionModal} 
        request={actionModal.request} 
        action={actionModal.action} 
        onConfirm={actionModal.action === 'approve' ? handleApprove : handleReject}
      />
    </div>
  );
};

export default LeaveCredit;
