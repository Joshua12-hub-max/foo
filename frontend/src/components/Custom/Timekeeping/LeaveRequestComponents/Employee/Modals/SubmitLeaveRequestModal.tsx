import React, { useMemo } from 'react';
import { leaveApi } from "@/api/leaveApi";
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitLeaveRequestSchema, SubmitLeaveRequestSchema } from '@/schemas/leave';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LEAVE_TYPES, SPECIAL_LEAVES_NO_DEDUCTION, CROSS_CHARGE_MAP, LEAVE_TO_CREDIT_MAP } from '@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/Modals/constants/modalConstants';
import ModalHeader from '@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/Modals/components/ModalHeader';
import FormInput from '@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/Modals/components/FormInput';
import DateInput from '@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/Modals/components/DateInput';
import FileUpload from '@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/Modals/components/FileUpload';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Credit {
  credit_type: string;
  balance: string | number;
}

interface SubmitLeaveRequestModalProps {
  isOpen: boolean;
  onSubmit: (data?: any) => void;
  onClose: () => void;
  credits?: Credit[];
}

export const SubmitLeaveRequestModal: React.FC<SubmitLeaveRequestModalProps> = ({ 
  isOpen, 
  onSubmit, 
  onClose, 
  credits = [] 
}) => {
  const { user, department: userDepartment } = useAuth();
  const queryClient = useQueryClient();

  const { register, control, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<SubmitLeaveRequestSchema>({
    resolver: zodResolver(submitLeaveRequestSchema) as any,
    defaultValues: {
      leaveType: '',
      isPaid: true,
      startDate: '',
      endDate: '',
      description: '',
      attachment: null
    }
  });

  const watchAllFields = watch();
  const { leaveType, isPaid, startDate, endDate } = watchAllFields;

  // Calculate duration (excluding weekends)
  const duration = useMemo(() => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return 0;
    }

    let count = 0;
    let curDate = new Date(start);
    
    while (curDate <= end) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sun(0) and Sat(6)
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    
    return count;
  }, [startDate, endDate]);

  // Get credit info including cross-charging details
  const creditInfo = useMemo(() => {
    if (!leaveType) return null;

    // Check if special leave (no deduction)
    const isSpecialLeave = SPECIAL_LEAVES_NO_DEDUCTION.includes(leaveType as any);
    
    // Identify primary credit type
    const primaryCreditType = LEAVE_TO_CREDIT_MAP[leaveType] || leaveType;
    
    // Helper to get balance
    const getBalance = (type: string | null) => {
      if (!type) return 0;
      // Exact match
      let credit = credits.find(c => c.credit_type === type);
      // Partial match fallback
      if (!credit) {
        credit = credits.find(c => 
          c.credit_type.toLowerCase().includes(type.toLowerCase().replace(' leave', '')) ||
          type.toLowerCase().includes(c.credit_type.toLowerCase())
        );
      }
      return credit ? parseFloat(String(credit.balance)) : 0;
    };

    const primaryBalance = getBalance(primaryCreditType);
    let totalAvailable = primaryBalance;
    let fallbackType: string | null = null;
    let fallbackBalance = 0;

    // Check for cross-charging (e.g., SL can use VL)
    const crossChargeType = CROSS_CHARGE_MAP[leaveType];
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

      const formData = new FormData();
      formData.append('employeeId', (user as any)?.employee_id || (user as any)?.employeeId || (user as any)?.id);
      formData.append('leaveType', data.leaveType);
      formData.append('startDate', data.startDate);
      formData.append('endDate', data.endDate);
      formData.append('reason', data.description);
      formData.append('withPay', String(data.isPaid));
      formData.append('duration', String(duration)); // Send duration for backend to deduct

      if (data.attachment) {
        formData.append('attachment', data.attachment);
      }

      await (leaveApi as any).applyLeave(formData);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['employee-leaves'] });
        reset();
        onSubmit();
        onClose();
    },
    onError: (error: any) => {
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
            {(errors.root || submitMutation.error) && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errors.root?.message || (submitMutation.error as any)?.message || 'Submission failed'}</span>
              </div>
            )}

            {/* Credit Info Banner */}
            {leaveType && creditInfo && (
              <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${
                creditInfo.isSpecialLeave
                  ? 'bg-blue-50 border border-blue-200 text-blue-700'
                  : hasSufficientCredits 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border border-amber-200 text-amber-700'
              }`}>
                {creditInfo.isSpecialLeave ? (
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : hasSufficientCredits ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                
                <div className="flex-1">
                  {creditInfo.isSpecialLeave ? (
                     <span><strong>Special Leave:</strong> This leave type does not deduct from your pending leave credits.</span>
                  ) : (
                     <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                           <span><strong>{creditInfo.primaryType} Credits:</strong> {creditInfo.primaryBalance} days</span>
                        </div>
                        {creditInfo.fallbackType && (
                           <div className="text-xs opacity-90 border-t border-black/10 pt-1 mt-1">
                              <span>+ {creditInfo.fallbackType}: {creditInfo.fallbackBalance} days</span>
                              <span className="font-bold block mt-0.5">Total Available: {creditInfo.totalAvailable} days</span>
                              {creditInfo.totalAvailable >= duration && duration > 0 && creditInfo.primaryBalance < duration && (
                                <span className="block text-[10px] italic mt-0.5">(This will use cross-charged credits)</span>
                              )}
                           </div>
                        )}
                        {!creditInfo.fallbackType && isPaid && duration > 0 && hasSufficientCredits && (
                           <span className="text-xs block">
                             Remaining after request: <strong>{remainingCredits} days</strong>
                           </span>
                        )}
                     </div>
                  )}
                </div>
              </div>
            )}

            {/* Warning for insufficient credits */}
            {isPaid && !hasSufficientCredits && duration > 0 && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Insufficient Credits</p>
                  <p className="text-xs mt-0.5">
                    You need {duration} days but only have {availableCredit || 0} days available.
                    Consider requesting unpaid leave or reducing the duration.
                  </p>
                </div>
              </div>
            )}

            {/* Employee Name & Department (Read-only) - Grid Layout */}
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Employee Name" required>
                <input
                  type="text"
                  value={(user as any)?.name || 'Loading...'}
                  readOnly
                  placeholder="Your name"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-medium cursor-not-allowed focus:outline-none"
                />
              </FormInput>

              <FormInput label="Department" required>
                <input
                  type="text"
                  value={userDepartment || (user as any)?.department || 'Loading...'}
                  readOnly
                  placeholder="Your department"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-medium cursor-not-allowed focus:outline-none"
                />
              </FormInput>
            </div>

            {/* Leave Type & Paid Leave - Grid Layout */}
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Leave Type" error={errors.leaveType?.message} required>
                <select
                  {...register('leaveType')}
                  className={`w-full px-3 py-2 text-sm border ${
                    errors.leaveType ? 'border-red-500' : 'border-gray-200'
                  } rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all bg-white`}
                >
                  <option value="">Select leave type...</option>
                  {(LEAVE_TYPES as unknown as string[]).map((type: string) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </FormInput>

              {/* Paid Leave Toggle - Compact */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Paid Leave</label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg h-[42px]">
                  <span className={`text-xs ${!isPaid ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                    No
                  </span>
                  <label className="relative inline-block w-10 h-5 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('isPaid')}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </label>
                  <span className={`text-xs ${isPaid ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                    Yes
                  </span>
                </div>
              </div>
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

            {/* Duration Display - Compact */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Duration:</span> {duration} {duration === 1 ? 'day' : 'days'}
                {isPaid && availableCredit !== null && (
                  <span className="ml-2">
                    • <span className="font-semibold">Available Credits:</span> {availableCredit} days
                  </span>
                )}
              </p>
            </div>

            {/* Description - Compact */}
            <FormInput label="Reason for Leave" error={errors.description?.message} required>
              <textarea
                {...register('description')}
                placeholder="Please provide a detailed reason..."
                className={`w-full px-3 py-2 text-sm border ${
                  errors.description ? 'border-red-500' : 'border-gray-200'
                } rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all resize-none`}
                rows={3}
              />
              <p className="text-gray-400 text-xs mt-1 text-right">
                {watchAllFields.description?.length || 0} characters
              </p>
            </FormInput>

            {/* File Upload */}
            <Controller
              name="attachment"
              control={control}
              render={({ field: { onChange, value } }) => (
                <FileUpload
                  file={value}
                  onFileChange={(file: File) => onChange(file)}
                  onRemove={() => onChange(null)}
                  error={errors.attachment?.message as string}
                />
              )}
            />
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitMutation.isPending}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="leave-request-form"
            disabled={submitMutation.isPending || (isPaid && !hasSufficientCredits && duration > 0)}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitLeaveRequestModal;
