import React, { useState, useMemo } from "react";
import { X, CheckCircle, Download, AlertTriangle, Info } from "lucide-react";
import { leaveApi } from "@/api/leaveApi";
import { useToastStore } from '@/stores';
import { AdminLeaveRequest } from "@/components/Custom/Timekeeping/LeaveRequestComponents/Admin/types";
import { SPECIAL_LEAVES_NO_DEDUCTION, CROSS_CHARGE_MAP, LEAVE_TO_CREDIT_MAP } from "@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/Modals/constants/modalConstants";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leaveActionSchema, LeaveActionSchema } from '@/schemas/leave';

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
    queryKey: ['leave-credits', request?.employee_id],
    queryFn: async () => {
      if (!request?.employee_id) return [];
      const res = await (leaveApi as any).getCredits(request.employee_id);
      return res.data.credits || [];
    },
    enabled: isOpen && !!request?.employee_id,
    staleTime: 1000 * 60 * 5
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async (data: LeaveActionSchema) => {
      if (!request) return;
      await (leaveApi as any).approveLeave(request.id, data.remarks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leaves'] });
      reset();
      onConfirm();
    },
    onError: (error: any) => {
      console.error("Approval failed", error);
      showNotification("Failed to approve request", "error");
    }
  });

  // Calculate working days duration
  const duration = useMemo(() => {
    if (!request) return 0;
    const start = new Date(request.start_date || request.fromDate);
    const end = new Date(request.end_date || request.toDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    let count = 0;
    let curDate = new Date(start);
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
    const isSpecialLeave = SPECIAL_LEAVES_NO_DEDUCTION.includes(request.leaveType as any || request.leave_type);
    if (isSpecialLeave) {
      return { type: 'special', label: 'Special Leave (No Deduction)' };
    }

    if (!request.with_pay) {
      return { type: 'lwop', label: 'Leave Without Pay' };
    }

    // Determine credit type
    const leaveType = request.leaveType || request.leave_type;
    const primaryType = LEAVE_TO_CREDIT_MAP[leaveType] || leaveType;
    
    // Helper to get balance
    const getBalance = (type: string | null) => {
      if (!type) return 0;
      const credit = credits.find((c: any) => c.credit_type === type);
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
      const crossChargeType = CROSS_CHARGE_MAP[leaveType] as string; // cast as string to fix indexing
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
  const getName = () => request.name || `${request.first_name} ${request.last_name}`;
  const getLeaveType = () => request.leaveType || request.leave_type;
  const getFromDate = () => formatDate(request.fromDate || request.start_date);
  const getToDate = () => formatDate(request.toDate || request.end_date);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="bg-green-50 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Approve Request</h2>
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
                        <a href={`${(import.meta as any).env.VITE_API_URL.replace('/api', '')}/uploads/${request.final_attachment_path}`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium border border-green-200">
                            <Download className="w-4 h-4" /> View Signed Document
                        </a>
                      </div>
                )}
              </div>
            </div>

            <div>
              {/* Credit Impact Analysis */}
              {prediction && (
                <div className={`flex items-start gap-2 p-3 rounded-lg border mb-4 ${
                    prediction.insufficient ? 'bg-red-50 border-red-200 text-red-800' :
                    prediction.type === 'special' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                    prediction.type === 'lwop' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                    'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <div className="mt-0.5 shrink-0">
                      {prediction.insufficient ? <AlertTriangle className="w-4 h-4"/> : 
                      prediction.type === 'special' ? <Info className="w-4 h-4"/> :
                      <CheckCircle className="w-4 h-4"/>}
                  </div>
                  <div className="flex-1 text-sm">
                      <p className="font-semibold mb-1">{
                        prediction.type === 'special' ? 'Special Leave (No Deduction)' :
                        prediction.type === 'lwop' ? 'Leave Without Pay (No Deduction)' :
                        prediction.insufficient ? 'Insufficient Credits Warning' :
                        'Credit Deduction Preview'
                      }</p>
                      
                      {prediction.type === 'deduction' && (
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                              <span>{prediction.primaryType}:</span>
                              <span>{prediction.primaryBefore} - {prediction.primaryDeducted} = <strong>{prediction.primaryAfter}</strong></span>
                          </div>
                          {prediction.fallbackType && (
                              <div className="flex justify-between border-t border-black/10 pt-1">
                                <span>{prediction.fallbackType} (Cross-charge):</span>
                                <span>{prediction.fallbackBefore} - {prediction.fallbackDeducted} = <strong>{prediction.fallbackAfter}</strong></span>
                              </div>
                          )}
                          {prediction.insufficient && (
                              <p className="mt-2 font-bold text-red-700">
                                Warning: Employee lacks sufficient credits for {duration} days.
                              </p>
                          )}
                        </div>
                      )}
                      {prediction.type === 'special' && (
                        <p className="text-xs opacity-90">This leave type does not deduct from leave credits.</p>
                      )}
                      {prediction.type === 'lwop' && (
                        <p className="text-xs opacity-90">This request is marked as 'Without Pay'. No credits will be deducted.</p>
                      )}
                  </div>
                </div>
              )}
              
              <label className="block text-sm font-semibold text-gray-900 mb-2">Approval Comments</label>
              <textarea
                {...register('remarks')}
                placeholder="Add any approval comments (optional)..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-green-50 focus:border-green-500 focus:outline-none resize-none transition-all placeholder:text-gray-400"
                rows={3}
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={approveMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm disabled:opacity-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={approveMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all shadow-lg shadow-green-900/20 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {approveMutation.isPending ? "Approving..." : (
                  <>
                      <CheckCircle className="w-4 h-4" />
                      Approve Request
                  </>
                )}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApproveModal;
