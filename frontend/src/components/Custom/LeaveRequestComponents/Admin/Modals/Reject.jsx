import { useState } from "react";
import { X } from "lucide-react";
import { leaveApi } from "../../../../../api/leaveApi";

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

  // Helper function to format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Helper to get display values
  const getName = () => request.name || `${request.first_name} ${request.last_name}`;
  const getLeaveType = () => request.leaveType || request.leave_type;
  const getDept = () => request.department || "N/A"; 
  const getFromDate = () => formatDate(request.fromDate || request.start_date);
  const getToDate = () => formatDate(request.toDate || request.end_date);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gray-200 shadow-md px-6 py-3 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Reject Leave Request</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
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
            <label className="block text-sm font-semibold text-gray-800 mb-2">Rejection description</label>
            <textarea
              value={remarks}
              onChange={(e) => onRemarksChange(e.target.value)}
              placeholder="Provide reason for rejection..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent focus:outline-none resize-none transition-all"
              aria-label="Description"
              rows="3"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-3 py-1.5 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 transition-colors disabled:opacity-50"
              aria-label="Cancel"
           >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 px-3 py-1.5 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md border-2 border-transparent hover:border-red-600 hover:text-red-600 transition-all disabled:opacity-50"
              aria-label="Reject"
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