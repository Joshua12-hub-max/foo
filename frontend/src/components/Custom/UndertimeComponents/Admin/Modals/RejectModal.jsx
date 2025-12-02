import { XCircle, X } from "lucide-react";
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-xl font-bold text-gray-800">Reject Request</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-semibold">Employee:</span> {request.employeeName}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-semibold">Date:</span> {request.date}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-semibold">Time Out:</span> {request.timeOut}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Reason:</span> {request.reason}
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="rejectionReason" className="block text-sm font-semibold text-gray-700 mb-2">
            Rejection Reason *
          </label>
          <textarea
            id="rejectionReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for rejection..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            rows={4}
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={!reason.trim()}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};
