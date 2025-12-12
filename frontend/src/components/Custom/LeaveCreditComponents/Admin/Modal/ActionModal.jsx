import { useState } from 'react';
import { X, UserCheck, UserX } from 'lucide-react';

export const ActionModal = ({ isOpen, onClose, request, action, onConfirm }) => {
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !request) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(request.id, remarks);
      setRemarks('');
      onClose();
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header - Clean gray style */}
        <div className="bg-gray-200 shadow-md px-6 py-3 flex justify-between items-center rounded-t-xl">
          <div className="flex items-center gap-2">
            {action === 'approve' ? (
              <UserCheck className="w-6 h-6 text-green-600" />
            ) : (
              <UserX className="w-6 h-6 text-red-600" />
            )}
            <h3 className="text-lg font-bold text-gray-800">
              {action === 'approve' ? 'Approve' : 'Reject'} Credit Request
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X className="w-5 h-5 text-red-800" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Request Info */}
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Employee:</span> {request.first_name} {request.last_name}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Type:</span> {request.credit_type}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Amount:</span> {request.requested_amount} days
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Reason:</span> {request.reason}
            </p>
          </div>

          {/* Remarks Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={action === 'approve' ? 'Optional remarks...' : 'Please provide rejection reason...'}
              rows={3}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 text-sm resize-none"
              required={action === 'reject'}
            />
          </div>

          {/* Action Buttons - Gray style */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded shadow-md hover:text-red-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || (action === 'reject' && !remarks.trim())}
              className={`flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded shadow-md hover:bg-gray-300 transition-colors disabled:opacity-50 ${
                action === 'approve' 
                  ? 'hover:text-green-800 hover:text-green-800' 
                  : 'hover:text-red-800 hover:text-red-800'
              }`}
            >
              {isSubmitting ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
