import React from "react";
import { X, AlertCircle } from "lucide-react";
import { leaveApi } from "@/api/leaveApi";
import { useToastStore } from '@/stores';
import { AdminLeaveRequest } from "../types";
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
  const getName = () => `${request.firstName} ${request.lastName}`;
  const getLeaveType = () => request.leaveType;
  const getFromDate = () => formatDate(request.startDate);
  const getToDate = () => formatDate(request.endDate);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all duration-300" onClick={onCancel}>
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 sticky top-0">
            <h2 className="text-xl font-bold text-gray-800">Reject Request</h2>
            <button 
              type="button"
              onClick={onCancel} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Request Info Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-gray-500 tracking-wider ml-1">Request Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Employee</span>
                  <span className="text-sm font-bold text-gray-800">{getName()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Leave Type</span>
                  <span className="text-sm font-bold text-gray-800">{getLeaveType()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Duration</span>
                  <span className="text-sm font-bold text-gray-800">{getFromDate()} - {getToDate()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 tracking-wider ml-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('reason')}
                placeholder="Provide reason for rejection..."
                className={`w-full border ${errors.reason ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all resize-none bg-gray-50`}
                rows={3}
              />
              {errors.reason && (
                <div className="flex items-center gap-1.5 mt-2 text-red-600 text-[11px] font-bold ml-1">
                    <AlertCircle size={12} />
                    <p>{errors.reason.message}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0">
            <button
              type="button"
              onClick={onCancel}
              disabled={rejectMutation.isPending}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rejectMutation.isPending}
              className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
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
