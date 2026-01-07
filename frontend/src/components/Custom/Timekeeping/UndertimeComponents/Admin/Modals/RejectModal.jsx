import {  UserX , X } from "lucide-react";
import { useState } from "react";

export const RejectModal = ({ isOpen, request, onReject, onClose }) => {
  const [reason, setReason] = useState("");

  if (!isOpen || !request) return null;

  const handleReject = () => {
    if (reason.trim()) {
      onReject(reason);
      setReason("");
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-red-50 p-2 rounded-lg">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Reject Request</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pt-2 space-y-4">
          <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-2">
            <p className="text-sm text-gray-600 flex justify-between">
              <span className="font-semibold text-gray-900">Employee:</span> 
              <span>{request.employeeName}</span>
            </p>
            <p className="text-sm text-gray-600 flex justify-between">
              <span className="font-semibold text-gray-900">Date:</span> 
              <span>{request.date}</span>
            </p>
            <p className="text-sm text-gray-600 flex justify-between">
              <span className="font-semibold text-gray-900">Time Out:</span> 
              <span>{request.timeOut}</span>
            </p>
            <div className="pt-2 mt-2 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900 block mb-1">Reason:</span> 
                {request.reason}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="rejectionReason" className="block text-sm font-semibold text-gray-700 mb-2">
              Rejection Reason *
            </label>
            <textarea
              id="rejectionReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm resize-none bg-white"
              rows={4}
              required
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={!reason.trim()}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};
