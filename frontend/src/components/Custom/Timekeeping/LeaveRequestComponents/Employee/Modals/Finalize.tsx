import React, { useState } from "react";
import { X, Upload, CheckCircle, Download } from "lucide-react";
import { leaveApi } from "@/api/leaveApi";
import { EmployeeLeaveRequest } from "@/features/LeaveRequests/types";

interface FinalizeModalProps {
  isOpen: boolean;
  request: EmployeeLeaveRequest | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const FinalizeModal: React.FC<FinalizeModalProps> = ({ isOpen, request, onConfirm, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFinalize = async () => {
    if (!request) return;
    
    setLoading(true);
    try {
      await leaveApi.finalizeLeave(request.id);
      onConfirm();
    } catch (err) {
      console.error(err);
      setError("Failed to finalize request");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all duration-300" onClick={onCancel}>
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 sticky top-0">
            <h2 className="text-xl font-bold text-gray-800">Finalize Request</h2>
            <button 
              onClick={onCancel} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-bold uppercase">
                <X size={14} />
                {error}
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl space-y-3">
              <p className="text-sm text-blue-900 leading-relaxed font-semibold">
                HR/Admin has processed your request. Finalizing will officially record this leave in your history and update your balances.
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Confirmation Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Employee</span>
                  <span className="font-bold text-gray-800">{request.firstName} {request.lastName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Leave Type</span>
                  <span className="font-bold text-gray-800">{request.leaveType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Period</span>
                  <span className="font-bold text-gray-800">{request.startDate} - {request.endDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleFinalize}
              disabled={loading}
              className="px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : (
                <>
                  <CheckCircle size={16} />
                  Finalize Request
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalizeModal;
