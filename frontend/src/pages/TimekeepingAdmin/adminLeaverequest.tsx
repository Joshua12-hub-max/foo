import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUIStore } from '@/stores';
  
// Hooks
import { useAdminLeaveData } from '@features/LeaveRequests/hooks/Admin/useAdminLeaveData';
import { useAdminLeaveFilters } from '@features/LeaveRequests/hooks/Admin/useAdminLeaveFilters';
import { useExport } from '@features/LeaveRequests/hooks/Admin/useExport';
import { useCredits } from '@features/LeaveRequests/hooks/Admin/useCredits';

// Components
// Components - Direct imports for faster initial parse
import Header from '@features/LeaveRequests/components/Admin/Header';
import Filters from '@features/LeaveRequests/components/Admin/Filters';
import SearchBar from '@features/LeaveRequests/components/Admin/SearchBar';
import ExportOptions from '@features/LeaveRequests/components/Admin/ExportOptions';
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
const ConfirmDeleteModal = React.lazy(() => import('@components/Custom/CalendarComponents/shared/Modals').then(module => ({ default: module.ConfirmDeleteModal })));

// ... existing code ...

// Within render, wrap modals in Suspense
// ...
// This tool call only replaces the IMPORTS. I need another one for the JSX wrapping if I can't do it all at once comfortably or if the file is too big.
// Actually, let's just do imports first.

// API
import { fetchDepartments } from '@api/departmentApi';
import { fetchEmployees } from '@api/employeeApi';
import { AddCreditInput, CreditUpdateInput } from '@/schemas/creditsSchema';

const AdminLeaveRequest = () => {
  const today = useMemo(() => new Date().toLocaleDateString('en-US'), []);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const [activeTab, setActiveTab] = useState<'requests' | 'credits'>('requests');

  // Request Management State
  const [errorObj, setErrorObj] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Modal states
  const [approveModal, setApproveModal] = useState({ isOpen: false, request: null as any });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, request: null as any });
  const [processModal, setProcessModal] = useState({ isOpen: false, request: null as any });
  
  // Credits Modal States
  const [isAddCreditOpen, setIsAddCreditOpen] = useState(false);
  const [editCredit, setEditCredit] = useState<{isOpen: boolean, data: any}>({ isOpen: false, data: null });
  const [deleteCredit, setDeleteCredit] = useState<{isOpen: boolean, data: any}>({ isOpen: false, data: null });

  // Filter Data State
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<string[]>([]);

  // Fetch Filter Data
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [deptRes, empRes] = await Promise.all([
          fetchDepartments(),
          fetchEmployees()
        ]);
        
        if (deptRes.success && deptRes.departments) {
          setDepartmentOptions(deptRes.departments.map((d: any) => d.name).sort());
        }

        if (empRes.success && empRes.employees) {
          const names = empRes.employees.map((e: any) => `${e.first_name} ${e.last_name}`).sort();
          setEmployeeOptions(names);
        }
      } catch (err) {
        console.error("Failed to fetch filter options", err);
      }
    };
    fetchFilterData();
  }, []);

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

  const { isExporting, exportError, handleExportCSV, handleExportPDF } = useExport();

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
    if (errorObj || dataError || exportError) {
      const timer = setTimeout(() => setErrorObj(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorObj, dataError, exportError]);

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
      department: appliedFilters.department,
      employee: appliedFilters.employee,
      fromDate: appliedFilters.fromDate,
      toDate: appliedFilters.toDate
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
  const openApproveModal = useCallback((request: unknown) => {
    setApproveModal({ isOpen: true, request });
  }, []);

  const openRejectModal = useCallback((request: unknown) => {
    setRejectModal({ isOpen: true, request });
  }, []);

  const openProcessModal = useCallback((request: unknown) => {
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
      employeeId: data.employee_id,
      creditType: data.creditType,
      balance: data.balance
    });
  };

  const handleEditCreditSubmit = async (data: CreditUpdateInput) => {
    if (!editCredit.data) return;
    await updateCredit({
      employeeId: editCredit.data.employee_id,
      creditType: data.creditType,
      balance: data.balance
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCredit.data) return;
    await removeCredit({
      employeeId: deleteCredit.data.employee_id,
      creditType: deleteCredit.data.creditType
    });
    setDeleteCredit({ isOpen: false, data: null });
  };

  // Combined error
  const currentError = errorObj || dataError || exportError;

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      
      {/* Header */}
      <Header 
        onRefresh={handleRefresh}
        isLoading={loading || isExporting}
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

                  <ConfirmDeleteModal 
                    show={deleteCredit.isOpen}
                    title="Delete Leave Credit"
                    message={deleteCredit.data 
                        ? `Are you sure you want to delete ${deleteCredit.data.credit_type} for ${deleteCredit.data.first_name} ${deleteCredit.data.last_name}?\nThis action cannot be undone.`
                        : 'Are you sure you want to delete this credit?'
                    }
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteCredit({ isOpen: false, data: null })}
                    isDeleting={isDeleting}
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

              {/* Export Options */}
              <ExportOptions
                onExportCSV={() => handleExportCSV(leaves)} // Pass visible leaves for now or all if export implemented backend-side
                onExportPDF={() => handleExportPDF(leaves)}
              />

              {/* Table */}
              {loading && leaves.length === 0 && !isExporting ? (
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
