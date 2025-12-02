import React, { useState } from "react";
import { X, CheckCircle, Download } from "lucide-react";
import { leaveApi } from "../../../../api/leaveApi";

const ApproveModal = ({ isOpen, request, remarks, onRemarksChange, onConfirm, onCancel }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleApprove = async () => {
    setLoading(true);
    try {
      await leaveApi.approveLeave(request.id);
      onConfirm(); // Refresh parent
    } catch (error) {
      console.error("Approval failed", error);
      alert("Failed to approve request");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get display values (handling potential prop naming diffs)
  const getName = () => request.name || `${request.first_name} ${request.last_name}`;
  const getLeaveType = () => request.leaveType || request.leave_type;
  const getDept = () => request.department || "N/A"; // Backend might not join department yet, allow fallback
  const getFromDate = () => request.fromDate || request.start_date;
  const getToDate = () => request.toDate || request.end_date;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-slate-950 to-green-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">Approve Leave Request</h2>
              <p className="text-green-100 text-sm">Review and approve employee leave</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-green-100 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {request && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Request Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Employee Name</span>
                  <span className="text-sm font-medium text-gray-700">{getName()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Leave Type</span>
                  <span className="text-sm font-medium text-gray-700">{getLeaveType()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">From Date</span>
                  <span className="text-sm font-medium text-gray-700">{getFromDate()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">To Date</span>
                  <span className="text-sm font-medium text-gray-700">{getToDate()}</span>
                </div>
                {request.final_attachment_path && (
                     <div className="mt-2 pt-2 border-t">
                        <p className="mb-1 text-sm text-gray-600">Signed Form:</p>
                        <a href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${request.final_attachment_path}`} target="_blank" rel="noreferrer" className="text-green-600 hover:underline flex items-center gap-1 text-sm font-semibold">
                            <Download className="w-4 h-4" /> View Signed Document
                        </a>
                     </div>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200"></div>

          <div>
            <p className="text-sm text-gray-600 mb-4">
                Approving this request will mark the employee as "Leave" in their Daily Time Record for the selected dates.
            </p>
            {/* Remarks are optional and not currently used by backend approval logic, but kept for UI */}
            <label className="block text-sm font-semibold text-gray-800 mb-2">Approval Comments / Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => onRemarksChange && onRemarksChange(e.target.value)}
              placeholder="Add any approval comments (optional)"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent focus:outline-none resize-none transition-all"
              rows="3"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Approving..." : "Approve Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApproveModal;