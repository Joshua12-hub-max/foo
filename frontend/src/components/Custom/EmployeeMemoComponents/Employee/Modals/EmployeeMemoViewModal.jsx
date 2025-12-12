import { memo } from 'react';
import { X } from 'lucide-react';
import { formatDate, getEmployeeStatusBadge, getEmployeeStatusText, getPriorityBadge } from '../../Shared/memoUtils';

const EmployeeMemoViewModal = memo(({ isOpen, onClose, memo, onAcknowledge, acknowledging }) => {
  if (!isOpen || !memo) return null;

  const showAcknowledgeButton = memo.acknowledgment_required && !memo.acknowledged_at;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">Memo Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-300 rounded transition-colors text-gray-600 hover:text-red-800"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEmployeeStatusBadge(memo)}`}>
              {getEmployeeStatusText(memo)}
            </span>
            <span className={`px-3 py-1 rounded text-sm font-medium ${getPriorityBadge(memo.priority)}`}>
              {memo.priority}
            </span>
          </div>

          {/* Container Card for Memo Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-100">
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
                <label className="text-xs text-gray-500 uppercase">From</label>
                <p className="text-sm font-medium text-gray-800">{memo.author_name || 'HR Admin'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Date</label>
                <p className="text-sm font-medium text-gray-800">{formatDate(memo.created_at)}</p>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Subject</label>
              <p className="text-sm font-medium text-gray-800">{memo.subject}</p>
            </div>
          </div>

          {/* Content Section - Outside Card */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Content</label>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap break-all border border-gray-100">
              {memo.content}
            </p>
          </div>

          {memo.acknowledged_at && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-700">
                ✓ Acknowledged on {formatDate(memo.acknowledged_at)}
              </p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 flex gap-3">
          {showAcknowledgeButton ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-red-800 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={onAcknowledge}
                disabled={acknowledging}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-green-800 rounded-lg text-sm font-medium transition-colors"
              >
                {acknowledging ? 'Acknowledging...' : 'Acknowledge'}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-red-800 rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

EmployeeMemoViewModal.displayName = 'EmployeeMemoViewModal';

export default EmployeeMemoViewModal;
