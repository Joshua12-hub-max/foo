import React from "react";
import { X, AlertCircle } from "lucide-react";
import { leaveApi } from "@/api/leaveApi";
import { useToastStore } from '@/stores';
import { AdminLeaveRequest } from "@/components/Custom/Timekeeping/LeaveRequestComponents/Admin/types";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { rejectionSchema, RejectionSchema } from '@/schemas/leave';

interface RejectModalProps {
  isOpen: boolean;
  request: AdminLeaveRequest | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const RejectModal: React.FC<RejectModalProps> = ({ 
  isOpen, 
  request, 
  onConfirm, 
  onCancel 
}) => {
  const showToast = useToastStore((state) => state.showToast);
  const showNotification = (message: string, type: 'success' | 'error') => showToast(message, type);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RejectionSchema>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: {
      reason: ''
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (data: RejectionSchema) => {
        if (!request) return;
        await leaveApi.rejectLeave(Number(request.id), { reason: data.reason });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-leaves'] });
        reset();
        onConfirm();
    },
    onError: (error: unknown) => {
        console.error("Rejection failed", error);
        showNotification("Failed to reject request", "error");
    }
  });

  if (!isOpen || !request) return null;

  const onSubmit = (data: RejectionSchema) => {
    rejectMutation.mutate(data);
  };

  // Helper function to format date to readable format
  const formatDate = (dateString: string | undefined): string => {
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
  const getName = () => request.name || `${request.firstName} ${request.lastName}`;
  const getLeaveType = () => request.leaveType;
  const getFromDate = () => formatDate(request.fromDate);
  const getToDate = () => formatDate(request.toDate);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300" onClick={onCancel}>
      <div 
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-md border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="bg-red-50 p-2 rounded-lg">
                 <X className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Reject Request</h2>
            </div>
            <button 
              type="button"
              onClick={onCancel} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Request Information</h3>
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
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Rejection Reason <span className="text-red-500">*</span></label>
              <textarea
                {...register('reason')}
                placeholder="Provide reason for rejection..."
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:ring-4 focus:outline-none resize-none transition-all placeholder:text-gray-400 ${errors.reason ? 'border-red-500 focus:ring-red-50 focus:border-red-500' : 'border-gray-200 focus:ring-red-50 focus:border-red-500'}`}
                aria-label="Description"
                rows={3}
              />
              {errors.reason && (
                <div className="flex items-center gap-1.5 mt-2 text-red-500 text-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <p>{errors.reason.message}</p>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={rejectMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm disabled:opacity-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rejectMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 text-sm"
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectModal;
