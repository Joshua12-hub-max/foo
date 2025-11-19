import React from "react";
import { X, XCircle } from "lucide-react";

const RejectModal = ({ isOpen, request, remarks, onRemarksChange, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-red-700 to-red-600 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">Reject Leave Request</h2>
              <p className="text-red-100 text-sm">Provide reason for rejection</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-red-100 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {request && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Request Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Employee Name</span>
                  <span className="text-sm font-medium text-gray-900">{request.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Employee ID</span>
                  <span className="text-sm font-medium text-gray-900">{request.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Leave Type</span>
                  <span className="text-sm font-medium text-gray-900">{request.leaveType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Department</span>
                  <span className="text-sm font-medium text-gray-900">{request.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">From Date</span>
                  <span className="text-sm font-medium text-gray-900">{request.fromDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">To Date</span>
                  <span className="text-sm font-medium text-gray-900">{request.toDate}</span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200"></div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Rejection Reason / Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => onRemarksChange(e.target.value)}
              placeholder="Provide reason for rejection..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none resize-none transition-all"
              rows="3"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Reject Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;