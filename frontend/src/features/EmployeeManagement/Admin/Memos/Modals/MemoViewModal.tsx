/**
 * MemoViewModal Component
 * View memo details modal for Admin
 */

import React, { memo } from 'react';
import { X } from 'lucide-react';
// @ts-ignore
import { formatDate, getStatusBadge, getPriorityBadge } from '../Shared/memoUtils';

interface Memo {
  id: number;
  memoNumber: string;
  memoType: string;
  employeeName: string;
  authorName?: string;
  subject: string;
  content: string;
  priority: string;
  status: string;
  createdAt: string;
  acknowledgedAt?: string;
}

interface MemoViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  memo?: Memo;
}

const MemoViewModal: React.FC<MemoViewModalProps> = memo(({ isOpen, onClose, memo }) => {
  if (!isOpen || !memo) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Memo Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadge(memo.status)}`}>
              {memo.status}
            </span>
            <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${getPriorityBadge(memo.priority)}`}>
              {memo.priority}
            </span>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Memo Number</label>
                <p className="text-sm font-bold text-gray-900">{memo.memoNumber}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Type</label>
                <p className="text-sm font-bold text-gray-900">{memo.memoType}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Employee</label>
                <p className="text-sm font-medium text-gray-900">{memo.employeeName}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Author</label>
                <p className="text-sm font-medium text-gray-900">{memo.authorName}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Subject</label>
                <p className="text-sm font-medium text-gray-900">{memo.subject}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Content</label>
            <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 whitespace-pre-wrap">
              {memo.content}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Created</label>
              <p className="text-xs text-gray-700 font-medium">{formatDate(memo.createdAt)}</p>
            </div>
            {memo.acknowledgedAt && (
              <div className="text-right">
                <label className="text-[10px] font-bold text-green-600 uppercase tracking-wider block">Acknowledged</label>
                <p className="text-xs text-green-700 font-bold">{formatDate(memo.acknowledgedAt)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
});

MemoViewModal.displayName = 'MemoViewModal';

export default MemoViewModal;
