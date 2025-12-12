/**
 * MemoDeleteModal Component
 * Delete confirmation modal for Admin Employee Memos
 */

import React, { memo } from 'react';

const MemoDeleteModal = memo(({ isOpen, onClose, onConfirm, memo, saving }) => {
  if (!isOpen || !memo) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">Confirm Delete</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-600">
            Are you sure you want to delete memo <strong>{memo.memo_number}</strong>?
          </p>
          <p className="text-sm text-gray-400 mt-1">This action cannot be undone.</p>
        </div>
        <div className="px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
});

MemoDeleteModal.displayName = 'MemoDeleteModal';

export default MemoDeleteModal;
