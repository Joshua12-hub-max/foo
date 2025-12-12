/**
 * Employee My Memos Page
 * Refactored to use modular components and custom hook
 */

import { AlertTriangle } from 'lucide-react';
import {
  useEmployeeMemos,
  EmployeeMemoHeader,
  EmployeeMemoTable,
  EmployeeMemoViewModal
} from '../../components/Custom/EmployeeMemoComponents';

const EmployeeMemos = () => {
  const {
    // Data
    memos,
    loading,
    error,
    acknowledging,

    // Modal states
    isViewOpen,
    selectedMemo,

    // Actions
    loadMemos,
    openViewModal,
    closeViewModal,
    handleAcknowledge
  } = useEmployeeMemos();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-100 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      {/* Header */}
      <EmployeeMemoHeader onRefresh={loadMemos} isLoading={loading} />

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <EmployeeMemoTable
        memos={memos}
        loading={loading}
        onView={openViewModal}
      />

      {/* View Modal */}
      <EmployeeMemoViewModal
        isOpen={isViewOpen}
        onClose={closeViewModal}
        memo={selectedMemo}
        onAcknowledge={handleAcknowledge}
        acknowledging={acknowledging}
      />
    </div>
  );
};

export default EmployeeMemos;
