import React, { useMemo } from 'react';
import { leaveApi } from "@/api/leaveApi";
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { submitLeaveRequestSchema, SubmitLeaveRequestSchema } from '@/schemas/leave';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import ModalHeader from '@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/Modals/components/ModalHeader';
import FormInput from '@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/Modals/components/FormInput';
import DateInput from '@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/Modals/components/DateInput';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { useLeavePolicy } from '@/hooks/useLeavePolicy';
import Combobox from '@/components/Custom/Combobox';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types';

// ... (interfaces remain same)

import { LeaveBalance, LeaveType, ApplyLeavePayload, SPECIAL_LEAVES_NO_DEDUCTION } from '@/types/leave.types';

interface SubmitLeaveRequestModalProps {
  isOpen: boolean;
  onSubmit: () => void;
  onClose: () => void;
  credits?: LeaveBalance[];
}

export const SubmitLeaveRequestModal: React.FC<SubmitLeaveRequestModalProps> = ({ 
  isOpen, 
  onSubmit, 
  onClose, 
  credits = [] 
}) => {
  const { data: policy, isLoading: isLoadingPolicy } = useLeavePolicy();
  const currentYear = new Date().getFullYear();
  const { data: holidaysData } = useQuery({
    queryKey: ['holidays', currentYear],
    queryFn: () => leaveApi.getHolidays(currentYear),
    enabled: isOpen
  });

  const holidayDates = useMemo(() => {
    return new Set(holidaysData?.data?.holidays?.map(h => h.date.split('T')[0]) || []);
  }, [holidaysData]);

  const leaveTypes = policy?.types || [];
  const { user, department: userDepartment } = useAuth();
  const queryClient = useQueryClient();

  const { 
    register, 
    handleSubmit, 
    watch, 
    reset,
    setValue,
    formState: { errors } 
  } = useForm<SubmitLeaveRequestSchema>({
    resolver: zodResolver(submitLeaveRequestSchema),
    defaultValues: {
      leaveType: 'Vacation Leave',
      isPaid: true,
      startDate: '',
      endDate: '',
      description: '',
    }
  });

  const watchAllFields = watch();
  const { leaveType, isPaid, startDate, endDate } = watchAllFields;

  // Helper to calculate working days (frontend version)
  const calculateWorkingDays = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const dayOfWeek = cur.getDay();
      const dateStr = cur.toISOString().split('T')[0];
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateStr)) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  // Calculate duration (excluding weekends and holidays)
  const duration = useMemo(() => calculateWorkingDays(startDate, endDate), [startDate, endDate, holidayDates]);

  // Advance filing check
  const advanceFilingStatus = useMemo(() => {
    if (!startDate || !leaveType || !policy || !policy.advanceFilingDays) return { isOk: true };
    
    const advanceFiling = policy.advanceFilingDays;
    if (!advanceFiling.appliesTo.includes(leaveType)) return { isOk: true };

    const todayStr = new Date().toISOString().split('T')[0];
    // Backend uses calculateWorkingDays(todayStr, startDate)
    const workingDaysAdvance = calculateWorkingDays(todayStr, startDate);
    
    if (workingDaysAdvance <= advanceFiling.days) {
      return { 
        isOk: false, 
        message: `${leaveType} must be filed at least ${advanceFiling.days} working days in advance.`,
        required: advanceFiling.days,
        current: workingDaysAdvance
      };
    }

    return { isOk: true };
  }, [startDate, leaveType, policy, holidayDates]);

  // Get credit info including cross-charging details
  const creditInfo = useMemo(() => {
    if (!leaveType || !policy) return null;

    // Check if special leave (no deduction)
    const isSpecialLeave = policy.specialLeavesNoDeduction.includes(leaveType) || SPECIAL_LEAVES_NO_DEDUCTION.includes(leaveType);
    
    // Identify primary credit type
    const primaryCreditType = policy.leaveToCreditMap[leaveType] || leaveType;
    
    // Helper to get balance
    const getBalance = (type: string | null) => {
      if (!type) return 0;
      // Exact match
      let credit = credits.find(c => c.creditType === type);
      // Partial match fallback
      if (!credit) {
        credit = credits.find(c => 
          c?.creditType?.toLowerCase()?.includes(type.toLowerCase().replace(' leave', '')) ||
          type.toLowerCase().includes(c?.creditType?.toLowerCase() || '')
        );
      }
      return credit ? parseFloat(String(credit.balance)) : 0;
    };

    const primaryBalance = getBalance(primaryCreditType);
    let totalAvailable = primaryBalance;
    let fallbackType: string | null = null;
    let fallbackBalance = 0;

    // Check for cross-charging (e.g., SL can use VL)
    const crossChargeType = policy.crossChargeMap[leaveType];
    if (crossChargeType) {
      fallbackType = crossChargeType;
      fallbackBalance = getBalance(crossChargeType);
      totalAvailable += fallbackBalance;
    }

    return {
      isSpecialLeave,
      primaryType: primaryCreditType,
      primaryBalance,
      fallbackType,
      fallbackBalance,
      totalAvailable
    };
  }, [leaveType, credits]);

  const availableCredit = creditInfo ? creditInfo.totalAvailable : 0;

  // Check if sufficient credits
  const hasSufficientCredits = useMemo(() => {
    if (!creditInfo) return true; 
    if (creditInfo.isSpecialLeave) return true; // No deduction
    if (!isPaid) return true; // Unpaid leave doesn't use credits
    return creditInfo.totalAvailable >= duration;
  }, [creditInfo, duration, isPaid]);

  // Calculate remaining credits after this request
  const remainingCredits = useMemo(() => {
    if (!creditInfo || !isPaid || creditInfo.isSpecialLeave) return null;
    return Math.max(0, creditInfo.totalAvailable - duration);
  }, [creditInfo, duration, isPaid]);

  const submitMutation = useMutation({
    mutationFn: async (data: SubmitLeaveRequestSchema) => {
      // Manual check for sufficiency before API call just in case
      if (data.isPaid && !hasSufficientCredits) {
          throw new Error(`Insufficient leave credits. You have ${availableCredit || 0} days but need ${duration} days.`);
      }

      const payload: ApplyLeavePayload = {
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.description || '',
        isWithPay: data.isPaid,
      };

      await leaveApi.applyLeave(payload);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['employee-leaves'] });
        reset();
        onSubmit();
        onClose();
    },
    onError: (error: unknown) => {
        console.error('Error applying for leave:', error);
        // Errors handled by mutation state, shown below
    }
  });

  const onFormSubmit = (data: SubmitLeaveRequestSchema) => {
    submitMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    submitMutation.reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all" onClick={handleClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <ModalHeader onClose={handleClose} />

        <div className="overflow-y-auto p-6 space-y-4">
          <form onSubmit={handleSubmit(onFormSubmit)} id="leave-request-form" className="space-y-4">
            {/* Error Alert */}
            {(errors.root || submitMutation.error) ? (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <span>{String(errors.root?.message || (submitMutation.error instanceof Error ? submitMutation.error.message : submitMutation.error) || 'Submission failed')}</span>
              </div>
            ) : null}

            {/* Leave Credit Outlook (Static vs Dynamic) */}
            {leaveType && creditInfo && !creditInfo.isSpecialLeave && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-teal-50 p-1.5 rounded-lg">
                    <Info className="w-4 h-4 text-teal-600" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-700">Leave Credit Outlook</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Current Balance (Static)</span>
                    <span className="font-semibold text-gray-900">{creditInfo.totalAvailable.toFixed(1)} days</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Request Duration</span>
                    <span className="font-semibold text-amber-600">-{duration.toFixed(1)} days</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-sm">
                    <span className="text-gray-700 font-medium">Remaining (Dynamic)</span>
                    <span className={`font-bold ${remainingCredits && remainingCredits >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                      {remainingCredits?.toFixed(1) || '0.0'} days
                    </span>
                  </div>
                </div>

                {!hasSufficientCredits && isPaid && (
                  <div className="mt-2 flex items-start gap-2 bg-red-50 p-2 rounded-lg border border-red-100">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 mt-0.5" />
                    <p className="text-[10px] text-red-700 leading-tight">
                      Insufficient credits. {(duration - creditInfo.totalAvailable).toFixed(1)} days will be marked as Leave Without Pay (LWOP).
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Advance Filing Warning */}
            {!advanceFilingStatus.isOk && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block">{advanceFilingStatus.message}</span>
                  <p className="text-xs mt-1 opacity-90">
                    Current advance filing: <strong>{advanceFilingStatus.current} working days</strong>. 
                    Minimum required: <strong>{advanceFilingStatus.required} working days</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Employee Name & Department (Read-only) - Grid Layout */}
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Employee Name" required>
                <input
                  type="text"
                  value={user?.name || 'Loading...'}
                  readOnly
                  placeholder="Your name"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-medium cursor-not-allowed focus:outline-none"
                />
              </FormInput>

              <FormInput label="Department" required>
                <input
                  type="text"
                  value={userDepartment || user?.department || 'Loading...'}
                  readOnly
                  placeholder="Your department"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-medium cursor-not-allowed focus:outline-none"
                />
              </FormInput>
            </div>

            {/* Leave Type - Full Width */}
            <div className="grid grid-cols-1">
              <FormInput label="Leave Type" error={errors.leaveType?.message} required>
                <Combobox
                  options={leaveTypes.map(type => ({ value: type, label: type }))}
                  value={watch('leaveType')}
                  onChange={(val) => setValue('leaveType', val as LeaveType, { shouldValidate: true })}
                  placeholder={isLoadingPolicy ? "Loading leave types..." : "Select leave type..."}
                  error={!!errors.leaveType}
                />
              </FormInput>
            </div>

            {/* Start & End Date - Grid Layout */}
            <div className="grid grid-cols-2 gap-4">
              <DateInput
                label="Start Date"
                {...register('startDate')}
                error={errors.startDate?.message}
                required
              />

              <DateInput
                label="End Date"
                {...register('endDate')}
                error={errors.endDate?.message}
                required
              />
            </div>

            {/* Description - Compact */}
            <FormInput label="Reason for Leave" error={errors.description?.message} required>
              <textarea
                {...register('description')}
                placeholder="Please provide a detailed reason..."
                className={`w-full px-4 py-2.5 text-sm border ${
                  errors.description ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'
                } rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all resize-none bg-gray-50`}
                rows={3}
              />
              <p className="text-gray-400 text-xs mt-1 text-right">
                {watchAllFields.description?.length || 0} characters
              </p>
            </FormInput>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3 z-10 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitMutation.isPending}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="leave-request-form"
            disabled={submitMutation.isPending || !advanceFilingStatus.isOk}
            title={!advanceFilingStatus.isOk ? advanceFilingStatus.message : ""}
            className="px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitLeaveRequestModal;
