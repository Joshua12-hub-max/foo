import { memo } from 'react';
import { X } from 'lucide-react';
// @ts-ignore
import { formatDate, getEmployeeStatusBadge, getEmployeeStatusText, getPriorityBadge } from './Shared/memoUtils';

interface MemoData {
  id: number;
  memo_number: string;
  memo_type: string;
  subject: string;
  content: string;
  priority: string;
  status: string;
  created_at: string;
  acknowledged_at?: string;
  acknowledgment_required?: boolean;
  author_name?: string;
}

interface EmployeeMemoViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  memo?: MemoData;
  onAcknowledge: () => void;
  acknowledging: boolean;
}

const EmployeeMemoViewModal: React.FC<EmployeeMemoViewModalProps> = memo(({ isOpen, onClose, memo, onAcknowledge, acknowledging }) => {
  if (!isOpen || !memo) return null;

  const showAcknowledgeButton = memo.acknowledgment_required && !memo.acknowledged_at;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Memo Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getEmployeeStatusBadge(memo)}`}>
              {getEmployeeStatusText(memo)}
            </span>
            <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${getPriorityBadge(memo.priority)}`}>
              {memo.priority}
            </span>
          </div>

          {/* Container Card for Memo Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Memo #</label>
                <p className="text-sm font-bold text-gray-900">{memo.memo_number}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Type</label>
                <p className="text-sm font-bold text-gray-900">{memo.memo_type}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">From</label>
                <p className="text-sm font-medium text-gray-900">{memo.author_name || 'HR Admin'}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Date</label>
                <p className="text-sm font-medium text-gray-900">{formatDate(memo.created_at)}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Subject</label>
              <p className="text-sm font-bold text-gray-900">{memo.subject}</p>
            </div>
          </div>

          {/* Content Section - Outside Card */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Content</label>
            <div className="text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-200 whitespace-pre-wrap break-all shadow-sm">
              {memo.content}
            </div>
          </div>

          {memo.acknowledged_at && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
              <p className="text-sm font-bold text-green-700">
                ✓ Acknowledged on {formatDate(memo.acknowledged_at)}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          {showAcknowledgeButton ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
              >
                Close
              </button>
              <button
                onClick={onAcknowledge}
                disabled={acknowledging}
                className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-bold transition-all shadow-md disabled:opacity-50"
              >
                {acknowledging ? 'Acknowledging...' : 'Acknowledge Memo'}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
            >
              Close Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

EmployeeMemoViewModal.displayName = 'EmployeeMemoViewModal';

export default EmployeeMemoViewModal;
