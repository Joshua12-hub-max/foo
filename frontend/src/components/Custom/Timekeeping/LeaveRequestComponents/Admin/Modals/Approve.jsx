import { useState } from "react";
import { X, CheckCircle, Download } from "lucide-react";
import { leaveApi } from "@api";
import { ToastNotification, useNotification } from '@/components/Custom/EmployeeManagement/Admin';

const ApproveModal = ({ isOpen, request, remarks, onRemarksChange, onConfirm, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const { notification, showNotification } = useNotification();

  if (!isOpen) return null;

  const handleApprove = async () => {
    setLoading(true);
    try {
      await leaveApi.approveLeave(request.id);
      onConfirm();
    } catch (error) {
      console.error("Approval failed", error);
      showNotification("Failed to approve request", "error");
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

  // Helper to get display values (handling potential prop naming diffs)
  const getName = () => request.name || `${request.first_name} ${request.last_name}`;
  const getLeaveType = () => request.leaveType || request.leave_type;
  const getDept = () => request.department || "N/A";
  const getFromDate = () => formatDate(request.fromDate || request.start_date);
  const getToDate = () => formatDate(request.toDate || request.end_date);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <ToastNotification notification={notification} />
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="bg-green-50 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Approve Request</h2>
          </div>
          <button 
            onClick={onCancel} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {request && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Request Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                  <span className="text-sm text-gray-500">Employee Name</span>
                  <span className="text-sm font-semibold text-gray-900">{getName()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                  <span className="text-sm text-gray-500">Leave Type</span>
                  <span className="text-sm font-semibold text-gray-900">{getLeaveType()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                  <span className="text-sm text-gray-500">From Date</span>
                  <span className="text-sm font-semibold text-gray-900">{getFromDate()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                  <span className="text-sm text-gray-500">To Date</span>
                  <span className="text-sm font-semibold text-gray-900">{getToDate()}</span>
                </div>
                {request.final_attachment_path && (
                     <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="mb-2 text-xs font-medium text-gray-500">Signed Form</p>
                        <a href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${request.final_attachment_path}`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium border border-green-200">
                            <Download className="w-4 h-4" /> View Signed Document
                        </a>
                     </div>
                )}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 mb-4">
                <div className="mt-0.5 shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-xs leading-relaxed">
                    Approving this request will mark the employee as "Leave" in their Daily Time Record for the selected dates.
                </p>
            </div>
            
            <label className="block text-sm font-semibold text-gray-900 mb-2">Approval Comments</label>
            <textarea
              value={remarks}
              onChange={(e) => onRemarksChange && onRemarksChange(e.target.value)}
              placeholder="Add any approval comments (optional)..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-green-50 focus:border-green-500 focus:outline-none resize-none transition-all placeholder:text-gray-400"
              rows="3"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm disabled:opacity-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all shadow-lg shadow-green-900/20 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {loading ? "Approving..." : (
                <>
                    <CheckCircle className="w-4 h-4" />
                    Approve Request
                </>
              )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveModal;