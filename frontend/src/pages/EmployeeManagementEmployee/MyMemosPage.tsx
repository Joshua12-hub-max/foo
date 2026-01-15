import React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  useEmployeeMemos,
  EmployeeMemoHeader,
  EmployeeMemoTable,
  EmployeeMemoViewModal
} from '@features/EmployeeManagement/Employee/Portal/Memos';

interface MyMemosPageProps {
  hideHeader?: boolean;
}

const MyMemosPage: React.FC<MyMemosPageProps> = ({ hideHeader = false }) => {
  const {
    memos, loading, error, acknowledging,
    isViewOpen, selectedMemo,
    loadMemos, openViewModal, closeViewModal, handleAcknowledge
  } = useEmployeeMemos();

  return (
    <div className="w-full">
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">My Memos</h2>
            <p className="text-sm text-gray-500 font-medium">View and acknowledge official communications</p>
          </div>
          <button 
            onClick={loadMemos}
            className="bg-white hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-xl flex items-center gap-2 border border-gray-200 shadow-sm transition-all text-sm font-bold"
          >
            <div className={`animate-spin-slow ${loading ? 'opacity-100' : 'opacity-0'}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c5.19 0 9.2 4.24 9.2 4.24"/><path d="M21 3v4.24H16.76"/></svg>
            </div>
            Refresh
          </button>
        </div>
      )}

      <EmployeeMemoHeader onRefresh={loadMemos} isLoading={loading} hideHeader={true} />

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2 border border-red-100">
          <AlertTriangle size={18} />
          <span className="text-xs font-bold uppercase tracking-wide">{error}</span>
        </div>
      )}

      <EmployeeMemoTable
        memos={memos}
        loading={loading}
        onView={openViewModal}
      />

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

export default MyMemosPage;
