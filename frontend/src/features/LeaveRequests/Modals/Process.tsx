import React, { useState } from "react";
import { X, Upload, Download, CheckCircle } from "lucide-react";
import { leaveApi } from "@/api/leaveApi";
import { AdminLeaveRequest } from "../types";
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ProcessModalProps {
  isOpen: boolean;
  request: AdminLeaveRequest | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const AdminLeaveRequestProcess: React.FC<ProcessModalProps> = ({ isOpen, request, onConfirm, onCancel }) => {
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const processMutation = useMutation({
    mutationFn: async () => {
      if (!request) return;
      await leaveApi.processLeave(Number(request.id), new FormData());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leaves'] });
      setError("");
      onConfirm();
    },
    onError: (err: unknown) => {
        console.error(err);
        setError("Failed to process request");
    }
  });

  const handleProcess = () => {
    if (!request) return;
    processMutation.mutate();
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all duration-300" onClick={onCancel}>
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 sticky top-0">
            <h2 className="text-xl font-bold text-gray-800">Process Request</h2>
            <button 
              type="button"
              onClick={onCancel} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-bold">
                <X size={14} />
                {error}
              </div>
            )}
            
            {/* Request Info Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-gray-500 tracking-wider ml-1">Request Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Employee</span>
                  <span className="text-sm font-bold text-gray-800">{request?.firstName} {request?.lastName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Leave Type</span>
                  <span className="text-sm font-bold text-gray-800">
                    {request?.leaveType}
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-200 text-[10px] text-gray-600 font-bold">
                      {request?.isWithPay ? 'With Pay' : 'Without Pay'}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Duration</span>
                  <span className="text-sm font-bold text-gray-800">{request?.startDate} - {request?.endDate}</span>
                </div>
                {request?.reason && (
                  <div className="mt-3 pt-3 border-t border-gray-200/50">
                    <p className="text-xs font-bold text-gray-500 tracking-wider mb-2">Employee Reason</p>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200/50 leading-relaxed shadow-sm italic">
                      "{request?.reason}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
              <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                Processing this request will notify the employee. Please ensure all documentation has been reviewed.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0">
            <button
              onClick={onCancel}
              disabled={processMutation.isPending}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleProcess}
              disabled={processMutation.isPending}
              className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processMutation.isPending ? 'Processing...' : (
                <>
                  <CheckCircle size={16} />
                  Confirm Processing
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaveRequestProcess;
