/**
 * MemoDeleteModal Component
 * Delete confirmation modal for Admin Employee Memos
 */

import React, { memo } from 'react';

interface Memo {
  id: number;
  memoNumber: string;
}

interface MemoDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memo?: Memo;
  saving: boolean;
}

const MemoDeleteModal: React.FC<MemoDeleteModalProps> = memo(({ isOpen, onClose, onConfirm, memo, saving }) => {
  if (!isOpen || !memo) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Confirm Delete</h2>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-bold text-red-800 mb-1">Delete Memo?</h4>
            <p className="text-sm text-red-700">
              Are you sure you want to delete memo <strong>{memo.memoNumber}</strong>?
            </p>
          </div>
          <p className="text-sm text-gray-500 pl-1">This action cannot be undone.</p>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md disabled:opacity-50"
          >
            {saving ? 'Deleting...' : 'Delete Memo'}
          </button>
        </div>
      </div>
    </div>
  );
});

MemoDeleteModal.displayName = 'MemoDeleteModal';

export default MemoDeleteModal;
