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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {action === 'approve' ? (
              <div className="bg-green-50 p-2 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
            ) : (
              <div className="bg-red-50 p-2 rounded-lg">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-900">
              {action === 'approve' ? 'Approve' : 'Reject'} Credit Request
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Request Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100 text-sm">
            <h4 className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-3">Request Details</h4>
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-500">Employee</span> 
              <span className="font-semibold text-gray-900">{request.first_name} {request.last_name}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-500">Type</span> 
              <span className="font-semibold text-gray-900">{request.credit_type}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-500">Amount</span> 
              <span className="font-semibold text-gray-900">{request.requested_amount} days</span>
            </div>
            
            <div className="pt-2">
               <span className="text-gray-500 block mb-1.5">Reason</span>
               <p className="text-gray-700 bg-white p-3 rounded-lg border border-gray-100 leading-relaxed font-medium">
                {request.reason}
               </p>
            </div>
          </div>

          {/* Remarks Input */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              {action === 'approve' ? 'Remarks (Optional)' : 'Rejection Reason'}
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={action === 'approve' ? 'Add optional remarks...' : 'Please provide a reason for rejection...'}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm resize-none bg-white placeholder:text-gray-400"
              required={action === 'reject'}
            />
          </div>
        </div>

        {/* Action Buttons - Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || (action === 'reject' && !remarks.trim())}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              action === 'approve' 
                ? 'bg-gray-900 hover:bg-gray-800 shadow-gray-900/20' 
                : 'bg-red-600 hover:bg-red-700 shadow-red-900/20'
            }`}
          >
            {isSubmitting ? 'Processing...' : action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
};
