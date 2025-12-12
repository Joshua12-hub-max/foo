/**
 * Admin Employee Memos Page
 * Refactored to use modular components and custom hook
 */

import { AlertTriangle } from 'lucide-react';
import {
  useMemoManagement,
  MemoHeader,
  MemoFilters,
  MemoTable,
  MemoFormModal,
  MemoViewModal,
  MemoDeleteModal
} from '../../components/Custom/EmployeeMemoComponents';

const EmployeeMemos = () => {
  const {
    // Data
    memos,
    employees,
    loading,
    error,
    saving,

    // Filters
    filters,
    handleFilterChange,
    handleSearch,
    handleClearFilters,

    // Modal states
    isFormOpen,
    isViewOpen,
    isDeleteOpen,
    selectedMemo,

    // Form
    formData,
    handleFormChange,

    // Actions
    loadData,
    openCreateForm,
    openEditForm,
    openViewModal,
    openDeleteModal,
    closeFormModal,
    closeViewModal,
    closeDeleteModal,
    handleSubmit,
    handleDelete
  } = useMemoManagement();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-100 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      {/* Header */}
      <MemoHeader
        onRefresh={loadData}
        onCreateNew={openCreateForm}
        isLoading={loading}
      />

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
        selectedMemo={selectedMemo}
        saving={saving}
      />

      {/* View Modal */}
      <MemoViewModal
        isOpen={isViewOpen}
        onClose={closeViewModal}
        memo={selectedMemo}
      />

      {/* Delete Modal */}
      <MemoDeleteModal
        isOpen={isDeleteOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        memo={selectedMemo}
        saving={saving}
      />
    </div>
  );
};

export default EmployeeMemos;
