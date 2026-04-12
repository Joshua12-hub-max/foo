import React, { forwardRef, useImperativeHandle } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { AlertTriangle, Plus, RefreshCw } from 'lucide-react';
import { useMemoManagement, MemoFilters, MemoTable, MemoFormModal, MemoViewModal, MemoDeleteModal } from '@features/EmployeeManagement/Admin/Memos';

interface OutletContext {
  sidebarOpen?: boolean;
  searchQuery?: string;
}

interface AdminMemoPageProps {
  hideHeader?: boolean;
}

export interface AdminMemoPageRef {
  openAddModal: () => void;
}

const AdminMemoPage = forwardRef<AdminMemoPageRef, AdminMemoPageProps>(({ hideHeader = false }, ref) => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const { searchQuery } = useOutletContext<OutletContext>();

  const {
    memos, employees, loading, error, saving,
    filters, page, totalPages, handleFilterChange, handleSearch, handleClearFilters, handlePageChange,
    isFormOpen, isViewOpen, isDeleteOpen, selectedMemo,
    formData, handleFormChange,
    loadData, openCreateForm, openEditForm, openViewModal, openDeleteModal,
    closeFormModal, closeViewModal, closeDeleteModal,
    handleSubmit, handleDelete
  } = useMemoManagement();

  // Expose openAddModal to parent via ref
  useImperativeHandle(ref, () => ({
    openAddModal: openCreateForm
  }));

  // Sync global search query to memo filters if present
  React.useEffect(() => {
    if (searchQuery !== undefined) {
      handleFilterChange('search', searchQuery);
    }
  }, [searchQuery, handleFilterChange]);

  return (
    <div className="w-full">
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Employee Memo</h2>
            <p className="text-sm text-gray-500">Manage disciplinary and official communications</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-gray-200 shadow-sm transition-all text-sm font-semibold"
              onClick={() => loadData()}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button 
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-bold"
              onClick={openCreateForm}
            >
              <Plus size={18} />
              <span>New Memo</span>
            </button>
          </div>
        </div>
      )}

      <div className={hideHeader ? "" : "bg-white rounded-2xl shadow-sm border border-gray-100 p-6"}>
        {/* Filters */}
        <MemoFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onClear={handleClearFilters}
        />

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Table */}
        <MemoTable
          memos={memos}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onView={openViewModal}
          onEdit={openEditForm}
          onDelete={openDeleteModal}
        />

        {/* Create/Edit Modal */}
        <MemoFormModal
          isOpen={isFormOpen}
          onClose={closeFormModal}
          onSubmit={handleSubmit}
          formData={formData}
          onFormChange={handleFormChange}
          employees={employees}
          selectedMemo={selectedMemo ?? undefined}
          saving={saving}
        />

        {/* View Modal */}
        <MemoViewModal
          isOpen={isViewOpen}
          onClose={closeViewModal}
          memo={selectedMemo ?? undefined}
        />

        {/* Delete Modal */}
        <MemoDeleteModal
          isOpen={isDeleteOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDelete}
          memo={selectedMemo ?? undefined}
          saving={saving}
        />
      </div>
    </div>
  );
});

AdminMemoPage.displayName = 'AdminMemoPage';

export default AdminMemoPage;
