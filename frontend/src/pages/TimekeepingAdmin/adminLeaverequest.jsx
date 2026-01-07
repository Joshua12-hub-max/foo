import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';

// Hooks
import { useAdminLeaveData, useAdminLeaveFilters, usePagination, useExport } from '@components/Custom/Timekeeping/LeaveRequestComponents/Admin/hooks';

// Components
import { Header,Filters,SearchBar,ExportOptions,Table,Pagination,LoadingSpinner,ErrorAlert,SuccessAlert} from '@components/Custom/Timekeeping/LeaveRequestComponents/Admin/components';

// Modals
import ApproveModal from '@components/Custom/Timekeeping/LeaveRequestComponents/Admin/Modals/Approve';
import RejectModal from '@components/Custom/Timekeeping/LeaveRequestComponents/Admin/Modals/Reject';
import ProcessModal from '@components/Custom/Timekeeping/LeaveRequestComponents/Admin/Modals/Process';

const AdminLeaveRequest = () => {
  const today = useMemo(() => new Date().toLocaleDateString('en-US'), []);
  
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;

  // State
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Modal states
  const [approveModal, setApproveModal] = useState({ isOpen: false, request: null, remarks: '' });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, request: null, remarks: '' });
  const [processModal, setProcessModal] = useState({ isOpen: false, request: null });

  // Custom hooks
  const { leaves, loading, error: dataError, refreshLeaves } = useAdminLeaveData();
  const {filters, appliedFilters, searchQuery,filteredData,departments,uniqueEmployees,handleFilterChange,handleApplyFilters,handleSearchChange,handleClear} = useAdminLeaveFilters(leaves);
  const {currentPage,totalPages,startIndex,endIndex,currentItems,handlePrevPage,handleNextPage,resetPage} = usePagination(filteredData);
  const {isExporting,exportError,handleExportCSV,handleExportPDF} = useExport();

  // Auto-dismiss messages
  useEffect(() => {
    if (error || dataError || exportError) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dataError, exportError]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Reset page when applied filters change
  useEffect(() => {
    resetPage();
  }, [appliedFilters, searchQuery, resetPage]);

  const handleRefresh = useCallback(async () => {
    await refreshLeaves();
    setSuccessMessage('Data refreshed!');
  }, [refreshLeaves]);

  // Modal handlers
  const openApproveModal = useCallback((request) => {
    setApproveModal({ isOpen: true, request, remarks: '' });
  }, []);

  const openRejectModal = useCallback((request) => {
    setRejectModal({ isOpen: true, request, remarks: '' });
  }, []);

  const openProcessModal = useCallback((request) => {
    setProcessModal({ isOpen: true, request });
  }, []);

  const closeApproveModal = useCallback(() => {
    setApproveModal({ isOpen: false, request: null, remarks: '' });
  }, []);

  const closeRejectModal = useCallback(() => {
    setRejectModal({ isOpen: false, request: null, remarks: '' });
  }, []);

  const closeProcessModal = useCallback(() => {
    setProcessModal({ isOpen: false, request: null });
  }, []);

  const handleActionSuccess = useCallback(() => {
    closeApproveModal();
    closeRejectModal();
    closeProcessModal();
    refreshLeaves();
    setSuccessMessage('Action completed successfully!');
  }, [closeApproveModal, closeRejectModal, closeProcessModal, refreshLeaves]);

  // Combined error
  const currentError = error || dataError || exportError;

  // Loading state
  if (loading && leaves.length === 0 && !isExporting) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      {/* Header */}
      <Header 
        onRefresh={handleRefresh}
        isLoading={loading || isExporting}
        today={today}
      />

      <hr className="mb-6 h-px bg-gray-200 border-0" />

      {/* Alerts */}
      <ErrorAlert message={currentError} />
      <SuccessAlert message={successMessage} />

      {/* Filters */}
      <Filters
        filters={filters}
        departments={departments}
        uniqueEmployees={uniqueEmployees}
        onFilterChange={handleFilterChange}
        onApply={handleApplyFilters}
        onClear={handleClear}
      />

      {/* Search */}
      <SearchBar
        searchQuery={searchQuery}
        onChange={handleSearchChange}
      />

      {/* Export Options */}
      <ExportOptions
        onExportCSV={() => handleExportCSV(filteredData)}
        onExportPDF={() => handleExportPDF(filteredData)}
      />

      {/* Table */}
      <Table
        data={currentItems}
        onOpenApprove={openApproveModal}
        onOpenReject={openRejectModal}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={filteredData.length}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
      />

      {/* Modals */}
      <ApproveModal
        isOpen={approveModal.isOpen}
        request={approveModal.request}
        remarks={approveModal.remarks}
        onRemarksChange={(remarks) => setApproveModal(prev => ({ ...prev, remarks }))}
        onConfirm={handleActionSuccess}
        onCancel={closeApproveModal}
      />

      <RejectModal
        isOpen={rejectModal.isOpen}
        request={rejectModal.request}
        remarks={rejectModal.remarks}
        onRemarksChange={(remarks) => setRejectModal(prev => ({ ...prev, remarks }))}
        onConfirm={handleActionSuccess}
        onCancel={closeRejectModal}
      />

      <ProcessModal
        isOpen={processModal.isOpen}
        request={processModal.request}
        onConfirm={handleActionSuccess}
        onCancel={closeProcessModal}
      />
    </div>
  );
};

export default AdminLeaveRequest;
