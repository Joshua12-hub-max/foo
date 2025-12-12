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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border-2 border-gray-200">
        <div className="bg-gray-200 shadow-md px-6 py-3 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-2">
            < UserX  className="w-6 h-6 text-red-600" />
            <h3 className="text-xl font-bold text-gray-800">Reject Request</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X size={20} className="text-red-800" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-lg shadow-md">
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

          <div>
            <label htmlFor="rejectionReason" className="block text-sm font-semibold text-gray-700 mb-2">
              Rejection Reason *
            </label>
            <textarea
              id="rejectionReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200"
              rows={4}
              required
            />
          </div>

          <div className="flex">
            <button
              onClick={handleReject}
              disabled={!reason.trim()}
              className="w-full px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg shadow-md hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
