import React, { useState } from "react";
import { X, XCircle } from "lucide-react";
import { leaveApi } from "../../../../api/leaveApi";

const RejectModal = ({ isOpen, request, remarks, onRemarksChange, onConfirm, onCancel }) => {
  const [loading, setLoading] = useState(false);
  
  if (!isOpen) return null;

  const handleReject = async () => {
    if (!remarks.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    setLoading(true);
    try {
      await leaveApi.rejectLeave(request.id, remarks);
      onConfirm(); // Refresh parent
    } catch (error) {
      console.error("Rejection failed", error);
      alert("Failed to reject request");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get display values
  const getName = () => request.name || `${request.first_name} ${request.last_name}`;
  const getLeaveType = () => request.leaveType || request.leave_type;
  const getDept = () => request.department || "N/A"; 
  const getFromDate = () => request.fromDate || request.start_date;
  const getToDate = () => request.toDate || request.end_date;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
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
                  <span className="text-sm font-medium text-gray-900">{getName()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Leave Type</span>
                  <span className="text-sm font-medium text-gray-900">{getLeaveType()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">From Date</span>
                  <span className="text-sm font-medium text-gray-900">{getFromDate()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">To Date</span>
                  <span className="text-sm font-medium text-gray-900">{getToDate()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200"></div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Rejection Reason / Remarks <span className="text-red-500">*</span></label>
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
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Rejecting..." : "Reject Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;