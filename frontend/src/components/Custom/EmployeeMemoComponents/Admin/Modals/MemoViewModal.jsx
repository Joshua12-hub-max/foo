/**
 * MemoViewModal Component
 * View memo details modal for Admin
 */

import React, { memo } from 'react';
import { X } from 'lucide-react';
import { formatDate, getStatusBadge, getPriorityBadge } from '../../Shared/memoUtils';

const MemoViewModal = memo(({ isOpen, onClose, memo }) => {
  if (!isOpen || !memo) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">Memo Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-300 rounded transition-colors text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(memo.status)}`}>
              {memo.status}
            </span>
            <span className={`px-3 py-1 rounded text-sm font-medium ${getPriorityBadge(memo.priority)}`}>
              {memo.priority}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">Memo Number</label>
              <p className="text-sm font-medium text-gray-800">{memo.memo_number}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Type</label>
              <p className="text-sm font-medium text-gray-800">{memo.memo_type}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Employee</label>
              <p className="text-sm font-medium text-gray-800">{memo.employee_name}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Author</label>
              <p className="text-sm font-medium text-gray-800">{memo.author_name}</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Subject</label>
            <p className="text-sm font-medium text-gray-800">{memo.subject}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Content</label>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
              {memo.content}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">Created</label>
              <p className="text-sm text-gray-800">{formatDate(memo.created_at)}</p>
            </div>
            {memo.acknowledged_at && (
              <div>
                <label className="text-xs text-gray-500 uppercase">Acknowledged</label>
                <p className="text-sm text-gray-800">{formatDate(memo.acknowledged_at)}</p>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

MemoViewModal.displayName = 'MemoViewModal';

export default MemoViewModal;
