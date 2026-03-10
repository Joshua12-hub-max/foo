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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all" onClick={onCancel}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Finalize Leave Request</h2>
          <button 
            onClick={onCancel} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">
                    <X className="w-4 h-4" />
                    {error}
                </div>
            )}
            
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm space-y-3">
                <p className="text-blue-900 leading-relaxed font-medium">The HR/Admin has processed your request. Please click the button below to finalize your request.</p>
            </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button 
                onClick={onCancel} 
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm text-sm"
            >
                Cancel
            </button>
            <button 
                onClick={handleFinalize} 
                disabled={loading} 
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg shadow-gray-900/20 text-sm"
            >
                {loading ? 'Processing...' : 'Finalize Request'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default FinalizeModal;
