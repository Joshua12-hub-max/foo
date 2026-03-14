import React, { useState, useMemo } from "react";
import { X, CheckCircle, Download, AlertTriangle, Info } from "lucide-react";
import { leaveApi } from "@/api/leaveApi";
import { useToastStore } from '@/stores';
import { AdminLeaveRequest } from "../types";
import { SPECIAL_LEAVES_NO_DEDUCTION, CROSS_CHARGE_MAP, LEAVE_TO_CREDIT_MAP } from "@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/Modals/constants/modalConstants";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leaveActionSchema, LeaveActionSchema } from '@/schemas/leave';
import type { LeaveBalance, LeaveType } from '@/types/leave.types';

interface ApproveModalProps {
  isOpen: boolean;
  request: AdminLeaveRequest | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ApproveModal: React.FC<ApproveModalProps> = ({ 
  isOpen, 
  request, 
  onConfirm, 
  onCancel 
}) => {
  const showToast = useToastStore((state) => state.showToast);
  const showNotification = (message: string, type: 'success' | 'error') => showToast(message, type);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm<LeaveActionSchema>({
    resolver: zodResolver(leaveActionSchema),
    defaultValues: {
      remarks: ''
    }
  });

  // Fetch credits
  const { data: credits = [] } = useQuery({
    queryKey: ['leave-credits', request?.employeeId],
    queryFn: async () => {
      if (!request?.employeeId) return [];
      const res = await leaveApi.getEmployeeCredits(request.employeeId);
      return (res.data.credits || []) as LeaveBalance[];
    },
    enabled: isOpen && !!request?.employeeId,
    staleTime: 1000 * 60 * 5
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async (data: LeaveActionSchema) => {
      if (!request) return;
      await leaveApi.approveLeave(Number(request.id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leaves'] });
      reset();
      onConfirm();
    },
    onError: (error: unknown) => {
      console.error("Approval failed", error);
      showNotification("Failed to approve request", "error");
    }
  });

  // Calculate working days duration
  const duration = useMemo(() => {
    if (!request) return 0;
    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    let count = 0;
    const curDate = new Date(start);
    while (curDate <= end) {
      const day = curDate.getDay();
      if (day !== 0 && day !== 6) count++;
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  }, [request]);

  // Predict credit deduction
  const prediction = useMemo(() => {
    if (!request) return null;
    
    // Check special leave
    const isSpecialLeave = (SPECIAL_LEAVES_NO_DEDUCTION as readonly string[]).includes(request.leaveType);
    if (isSpecialLeave) {
      return { type: 'special', label: 'Special Leave (No Deduction)' };
    }

    if (!request.isWithPay) {
      return { type: 'lwop', label: 'Leave Without Pay' };
    }

    // Determine credit type
    const leaveType = request.leaveType as LeaveType;
    const primaryType = ((LEAVE_TO_CREDIT_MAP as any)[leaveType] || leaveType) as string;
    
    // Helper to get balance
    const getBalance = (type: string | null) => {
      if (!type) return 0;
      const credit = credits.find((c: LeaveBalance) => c.creditType === type);
      return credit ? parseFloat(String(credit.balance)) : 0;
    };

    const primaryBalance = getBalance(primaryType);
    let remaining = duration;
    let deductedPrimary = 0;
    let deductedFallback = 0;
    let fallbackType: string | null = null;
    let primaryAfter = primaryBalance;
    let fallbackAfter = 0;

    // Primary Deduction
    if (primaryBalance > 0) {
      deductedPrimary = Math.min(primaryBalance, remaining);
      remaining -= deductedPrimary;
      primaryAfter -= deductedPrimary;
    }

    // Cross-charging check
    if (remaining > 0) {
      const crossChargeType = (CROSS_CHARGE_MAP as any)[leaveType] as string; // cast as string to fix indexing
      if (crossChargeType) {
        fallbackType = crossChargeType;
        const fallbackBalance = getBalance(crossChargeType);
        fallbackAfter = fallbackBalance;
        
        if (fallbackBalance > 0) {
           deductedFallback = Math.min(fallbackBalance, remaining);
           remaining -= deductedFallback;
           fallbackAfter -= deductedFallback;
        }
      }
    }

    return {
      type: 'deduction',
      primaryType,
      primaryBefore: primaryBalance,
      primaryDeducted: deductedPrimary,
      primaryAfter,
      fallbackType,
      fallbackBefore: fallbackType ? getBalance(fallbackType) : 0,
      fallbackDeducted: deductedFallback,
      fallbackAfter,
      insufficient: remaining > 0
    };
  }, [request, credits, duration]);

  if (!isOpen || !request) return null;

  const onSubmit = (data: LeaveActionSchema) => {
    approveMutation.mutate(data);
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

  // Helper to get display values (handling potential prop naming diffs)
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
            <h2 className="text-xl font-bold text-gray-800">Approve Request</h2>
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
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Request Information</h3>
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
                {request.finalAttachmentPath && (
                  <div className="mt-2">
                    <a 
                      href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${request.finalAttachmentPath}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-3 py-2 rounded-lg border border-blue-100"
                    >
                      <Download size={14} /> View Signed Document
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Credit Analysis */}
            {prediction && (
              <div className={`p-4 rounded-xl border ${
                prediction.insufficient ? 'bg-red-50 border-red-200' :
                prediction.type === 'special' ? 'bg-blue-50 border-blue-200' :
                prediction.type === 'lwop' ? 'bg-amber-50 border-amber-200' :
                'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {prediction.insufficient ? <AlertTriangle size={18} className="text-red-600" /> : 
                    prediction.type === 'special' ? <Info size={18} className="text-blue-600" /> :
                    <CheckCircle size={18} className="text-emerald-600" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${
                      prediction.insufficient ? 'text-red-800' :
                      prediction.type === 'special' ? 'text-blue-800' :
                      prediction.type === 'lwop' ? 'text-amber-800' :
                      'text-emerald-800'
                    }`}>
                      {prediction.type === 'special' ? 'Special Leave (No Deduction)' :
                       prediction.type === 'lwop' ? 'Leave Without Pay' :
                       prediction.insufficient ? 'Insufficient Credits' :
                       'Credit Deduction Preview'}
                    </p>
                    
                    {prediction.type === 'deduction' && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="opacity-75">{prediction.primaryType}:</span>
                          <span>{prediction.primaryBefore} → {prediction.primaryAfter}</span>
                        </div>
                        {prediction.fallbackType && (
                          <div className="flex justify-between text-xs font-medium pt-1 border-t border-black/5">
                            <span className="opacity-75">{prediction.fallbackType} (Cross-charge):</span>
                            <span>{prediction.fallbackBefore} → {prediction.fallbackAfter}</span>
                          </div>
                        )}
                        {prediction.insufficient && (
                          <p className="mt-2 text-[11px] font-bold text-red-700 leading-tight">
                            Warning: Request exceeds available credits. Remaining days will be marked as unpaid.
                          </p>
                        )}
                      </div>
                    )}
                    {prediction.type === 'special' && <p className="mt-1 text-xs opacity-80">This leave type does not deduct from credits.</p>}
                    {prediction.type === 'lwop' && <p className="mt-1 text-xs opacity-80">Marked as 'Without Pay'. No deduction will occur.</p>}
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Approval Comments</label>
              <textarea
                {...register('remarks')}
                placeholder="Add any approval comments (optional)..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all resize-none bg-gray-50"
                rows={3}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0">
            <button
              type="button"
              onClick={onCancel}
              disabled={approveMutation.isPending}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={approveMutation.isPending}
              className="px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {approveMutation.isPending ? "Approving..." : "Approve Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApproveModal;
