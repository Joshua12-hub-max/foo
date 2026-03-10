import React, { useState } from "react";
import { X, Upload, Download, CheckCircle } from "lucide-react";
import { leaveApi } from "@/api/leaveApi";
import { AdminLeaveRequest } from "@/components/Custom/Timekeeping/LeaveRequestComponents/Admin/types";
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
      await leaveApi.processLeave(Number(request.id));
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300" onClick={onCancel}>
      <div 
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-md border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-50 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Process Request</h2>
            </div>
            <button 
              type="button"
              onClick={onCancel} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            {/* Details */}
            <div className="bg-gray-50 p-4 rounded-xl text-sm space-y-3 border border-gray-100">
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-gray-500 font-medium">Employee:</span>
                  <span className="text-gray-900 font-semibold">{request?.firstName} {request?.lastName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-gray-500 font-medium">Type:</span>
                  <span className="text-gray-900 font-semibold">{request?.leaveType} ({request?.isWithPay ? 'With Pay' : 'Without Pay'})</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-gray-500 font-medium">Dates:</span>
                  <span className="text-gray-900 font-semibold">{request?.fromDate} to {request?.toDate}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 font-medium">Reason:</span>
                  <span className="text-gray-900 font-medium bg-white/50 p-2 rounded-lg border border-gray-100">{request?.reason}</span>
                </div>
            </div>

            <div className="flex gap-3 pt-4 shrink-0">
                <button onClick={onCancel} disabled={processMutation.isPending} className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm disabled:opacity-50 text-sm">Cancel</button>
                <button onClick={handleProcess} disabled={processMutation.isPending} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                    {processMutation.isPending ? 'Processing...' : (
                      <>
                        <CheckCircle className="w-4 h-4" />
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
