import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUIStore } from '@/stores';
  
// Hooks
import { 
  useAdminLeaveData, 
  useAdminLeaveFilters, 
  useExport,
  useCredits 
} from '@features/LeaveRequests/hooks/Admin';

// Components
// Components - Direct imports for faster initial parse
import Header from '@features/LeaveRequests/components/Admin/Header';
import Filters from '@features/LeaveRequests/components/Admin/Filters';
import SearchBar from '@features/LeaveRequests/components/Admin/SearchBar';
import Table from '@features/LeaveRequests/components/Admin/Table';
import LoadingSpinner from '@features/LeaveRequests/components/Admin/LoadingSpinner';
import ErrorAlert from '@features/LeaveRequests/components/Admin/ErrorAlert';
import SuccessAlert from '@features/LeaveRequests/components/Admin/SuccessAlert';
const CreditsTable = React.lazy(() => import('@features/LeaveRequests/components/Admin/CreditsTable'));
import Pagination from '@/components/CustomUI/Pagination';

// Modals
const ApproveModal = React.lazy(() => import('@features/LeaveRequests/Modals/Approve'));
const RejectModal = React.lazy(() => import('@features/LeaveRequests/Modals/Reject'));
const ProcessModal = React.lazy(() => import('@features/LeaveRequests/Modals/Process'));
const AddCreditModal = React.lazy(() => import('@features/LeaveRequests/Modals/AddCreditModal'));
const EditCreditModal = React.lazy(() => import('@features/LeaveRequests/Modals/EditCreditModal'));
// ConfirmDeleteModal is a named export, so handle differently or change export
// Assuming ConfirmDeleteModal is default export in its file or handled via module
const DeleteCreditModal = React.lazy(() => import('@features/LeaveRequests/Modals/DeleteCreditModal'));

// API YAN BOI OK!
import { useFilterOptions } from '@/hooks/useFilterOptions';
import { AddCreditInput, CreditUpdateInput } from '@/schemas/creditsSchema';
import type { LeaveCredit, AdminLeaveRequest } from '@features/LeaveRequests/types';

const AdminLeaveRequest = () => {
  const today = useMemo(() => new Date().toLocaleDateString('en-US'), []);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const [activeTab, setActiveTab] = useState<'requests' | 'credits'>('requests');

  // Request Management State
  const [errorObj, setErrorObj] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Modal states
  const [approveModal, setApproveModal] = useState<{ isOpen: boolean; request: AdminLeaveRequest | null }>({ isOpen: false, request: null });
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; request: AdminLeaveRequest | null }>({ isOpen: false, request: null });
  const [processModal, setProcessModal] = useState<{ isOpen: boolean; request: AdminLeaveRequest | null }>({ isOpen: false, request: null });
  
  // Credits Modal States
  const [isAddCreditOpen, setIsAddCreditOpen] = useState(false);
  const [editCredit, setEditCredit] = useState<{isOpen: boolean, data: LeaveCredit | null}>({ isOpen: false, data: null });
  const [deleteCredit, setDeleteCredit] = useState<{isOpen: boolean, data: LeaveCredit | null}>({ isOpen: false, data: null });

  // Fetch Filter Options using Centralized Hook
  const { data: filterOptions, isLoading: loadingFilters } = useFilterOptions();
  const departmentOptions = filterOptions.departments;
  const employeeOptions = filterOptions.employees.map(e => e.name);


  // Custom hooks
  // Note: useAdminLeaveData now manages state internally (page, limit, filters)
  const { 
    leaves, 
    loading, 
    error: dataError, 
    refreshLeaves, 
    pagination, 
    setPage, 
    updateFilters 
  } = useAdminLeaveData();

  // We still use useAdminLeaveFilters to manage the "Draft" state of the filter form
  const {
    filters: draftFilters,
    appliedFilters,
    searchQuery,
    debouncedSearchQuery,
    handleFilterChange,
    handleApplyFilters,
    handleSearchChange,
    handleClear
  } = useAdminLeaveFilters();

  // Credits Hook
  const { 
    credits, 
    pagination: creditsPagination,
    setPage: setCreditsPage,
    search: creditsSearch,
    setSearch: setCreditsSearch,
    isLoading: loadingCredits, 
    employees: allEmployees, 
    isLoadingEmployees, 
    updateCredit, 
    isUpdating, 
    deleteCredit: removeCredit, 
    isDeleting 
  } = useCredits();

  // Auto-dismiss messages
  useEffect(() => {
    if (errorObj || dataError) {
      const timer = setTimeout(() => setErrorObj(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorObj, dataError]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Sync Search with Server
  useEffect(() => {
    updateFilters({ search: debouncedSearchQuery });
  }, [debouncedSearchQuery]);

  // Sync Applied Filters with Server
  useEffect(() => {
    // When "Apply" is clicked in filters, we update the server filters
    updateFilters({
      department: String(appliedFilters.department || ''),
      employee: String(appliedFilters.employee || ''), 
      fromDate: String(appliedFilters.fromDate || ''),
      toDate: String(appliedFilters.toDate || '')
    });
  }, [appliedFilters]);

  // Sync Clear Action
  // We need to detect when filters are cleared. 
  // simplified: just rely on the effect above IF appliedFilters updates to empty strings on clear.
  // Checking useAdminLeaveFilters: handleClear sets pending and applied to empty strings. So the effect above covers it.

  const handleRefresh = useCallback(async () => {
    await refreshLeaves();
    setSuccessMessage('Data refreshed!');
  }, [refreshLeaves]);

  // Modal handlers
  const openApproveModal = useCallback((request: AdminLeaveRequest) => {
    setApproveModal({ isOpen: true, request });
  }, []);

  const openRejectModal = useCallback((request: AdminLeaveRequest) => {
    setRejectModal({ isOpen: true, request });
  }, []);

  const openProcessModal = useCallback((request: AdminLeaveRequest) => {
    setProcessModal({ isOpen: true, request });
  }, []);

  const closeApproveModal = useCallback(() => {
    setApproveModal({ isOpen: false, request: null });
  }, []);

  const closeRejectModal = useCallback(() => {
    setRejectModal({ isOpen: false, request: null });
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

  // Credits handlers
  const handleAddCreditSubmit = async (data: AddCreditInput) => {
    await updateCredit({
      employeeId: data.employeeId,
      creditType: data.creditType,
      balance: data.balance
    });
  };

  const handleEditCreditSubmit = async (data: CreditUpdateInput) => {
    if (!editCredit.data) return;
    await updateCredit({
      employeeId: editCredit.data.employeeId,
      creditType: data.creditType,
      balance: data.balance
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCredit.data) return;
    await removeCredit({
      employeeId: String(deleteCredit.data.employeeId),
      creditType: deleteCredit.data.creditType // Corrected to creditType
    });
    setDeleteCredit({ isOpen: false, data: null });
  };

  // Combined error
  const currentError = errorObj || dataError;

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      
      {/* Header */}
      <Header 
        onRefresh={handleRefresh}
        isLoading={loading}
        today={today}
      />

      <hr className="mb-6 h-px bg-gray-200 border-0" />

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'requests' 
              ? 'bg-white text-gray-700 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Leave Requests
        </button>
        <button
          onClick={() => setActiveTab('credits')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'credits' 
              ? 'bg-white text-gray-700 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Credits Management
        </button>
      </div>

      {/* Content */}
      {activeTab === 'credits' ? (
          <div className="flex flex-col h-full space-y-4">
              <React.Suspense fallback={<LoadingSpinner />}>
                <CreditsTable 
                  credits={credits}
                  loading={loadingCredits}
                  pagination={creditsPagination}
                  onPageChange={setCreditsPage}
                  searchTerm={creditsSearch}
                  onSearchChange={setCreditsSearch}
                  onAdd={() => setIsAddCreditOpen(true)}
                  onEdit={(credit) => setEditCredit({ isOpen: true, data: credit })}
                  onDelete={(credit) => setDeleteCredit({ isOpen: true, data: credit })}
                />
              </React.Suspense>

              <React.Suspense fallback={null}>
                  <AddCreditModal 
                    isOpen={isAddCreditOpen}
                    onClose={() => setIsAddCreditOpen(false)}
                    onSubmit={handleAddCreditSubmit}
                    employees={allEmployees}
                    isLoadingEmployees={isLoadingEmployees}
                    isSubmitting={isUpdating}
                  />

                  {editCredit.data && (
                    <EditCreditModal 
                      isOpen={editCredit.isOpen}
                      onClose={() => setEditCredit({ isOpen: false, data: null })}
                      onSubmit={handleEditCreditSubmit}
                      credit={editCredit.data}
                      isSubmitting={isUpdating}
                    />
                  )}

                  <DeleteCreditModal 
                    isOpen={deleteCredit.isOpen}
                    onClose={() => setDeleteCredit({ isOpen: false, data: null })}
                    onConfirm={handleDeleteConfirm}
                    isDeleting={isDeleting}
                    credit={deleteCredit.data}
                  />
              </React.Suspense>
          </div>
      ) : (
          <div className="flex flex-col h-full space-y-4">
              {/* Alerts */}
              <ErrorAlert message={currentError} />
              <SuccessAlert message={successMessage} />

              {/* Filters */}
              <Filters
                filters={draftFilters}
                departments={departmentOptions}
                uniqueEmployees={employeeOptions}
                onFilterChange={handleFilterChange}
                onApply={handleApplyFilters}
                onClear={handleClear}
              />
              {/* Search */}
              <SearchBar
                searchQuery={searchQuery}
                onChange={handleSearchChange}
              />

              {/* Table */}
              {loading && leaves.length === 0 ? (
                 <LoadingSpinner />
              ) : (
                 <Table
                    data={leaves}
                    onOpenApprove={openApproveModal}
                    onOpenReject={openRejectModal}
                    onOpenProcess={openProcessModal}
                 />
              )}

              {/* Server-Side Pagination */}
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                onPageChange={setPage}
                itemsPerPage={pagination.limit}
              />

              {/* Modals - Lazy Loaded */}
              <React.Suspense fallback={null}>
                {approveModal.request && (
                    <ApproveModal
                    isOpen={approveModal.isOpen}
                    request={approveModal.request}
                    onConfirm={handleActionSuccess}
                    onCancel={closeApproveModal}
                    />
                )}

                {rejectModal.request && (
                    <RejectModal
                    isOpen={rejectModal.isOpen}
                    request={rejectModal.request}
                    onConfirm={handleActionSuccess}
                    onCancel={closeRejectModal}
                    />
                )}

                {processModal.request && (
                    <ProcessModal
                    isOpen={processModal.isOpen}
                    request={processModal.request}
                    onConfirm={handleActionSuccess}
                    onCancel={closeProcessModal}
                    />
                )}
              </React.Suspense>
          </div>
      )}
    </div>
  );
};

export default AdminLeaveRequest;
