import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';
import { useLeavePolicy } from '@/hooks/useLeavePolicy';
import { addCreditSchema, AddCreditInput } from '@/schemas/creditsSchema';
import Combobox from '@/components/Custom/Combobox';

interface EmployeeOption {
  employeeId: string;
  firstName?: string;
  lastName?: string;
}

interface AddCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddCreditInput) => Promise<void>;
  employees: EmployeeOption[];
  isLoadingEmployees: boolean;
  isSubmitting: boolean;
}

const AddCreditModal = ({ isOpen, onClose, onSubmit, employees, isLoadingEmployees, isSubmitting }: AddCreditModalProps) => {
  const { data: policy, isLoading: isLoadingPolicy } = useLeavePolicy();
  const creditTypes = policy ? Array.from(new Set(Object.values(policy.leaveToCreditMap))) : [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<AddCreditInput>({
    resolver: zodResolver(addCreditSchema),
    defaultValues: {
      balance: 0,
    }
  });

  const handleFormSubmit = async (data: AddCreditInput) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all duration-300" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 sticky top-0">
            <h2 className="text-xl font-bold text-gray-800">Add Leave Credit</h2>
            <button 
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Employee Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 ml-1">
                Employee <span className="text-red-500">*</span>
              </label>
              {isLoadingEmployees ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-medium">Loading employees...</span>
                </div>
              ) : (
                <Combobox
                  options={employees.map(emp => ({ 
                    value: emp.employeeId, 
                    label: `${emp.firstName} ${emp.lastName} (${emp.employeeId})` 
                  }))}
                  value={watch('employeeId') || ''}
                  onChange={(val) => setValue('employeeId', val, { shouldValidate: true })}
                  placeholder="Search and select employee..."
                  error={!!errors.employeeId}
                />
              )}
              {errors.employeeId && (
                <p className="mt-1 text-[11px] font-bold text-red-600 ml-1">{errors.employeeId.message}</p>
              )}
            </div>

            {/* Credit Type Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 ml-1">
                Credit Type <span className="text-red-500">*</span>
              </label>
              <Combobox
                options={creditTypes.map(type => ({ value: type, label: type }))}
                value={watch('creditType') || ''}
                onChange={(val) => setValue('creditType', val, { shouldValidate: true })}
                placeholder={isLoadingPolicy ? "Loading policy..." : "Select credit type..."}
                error={!!errors.creditType}
              />
              {errors.creditType && (
                <p className="mt-1 text-[11px] font-bold text-red-600 ml-1">{errors.creditType.message}</p>
              )}
            </div>

            {/* Balance Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 ml-1">
                Balance (Days) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                {...register('balance', { valueAsNumber: true })}
                className={`w-full border ${errors.balance ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all placeholder:text-gray-400 bg-gray-50`}
                placeholder="0.00"
              />
              {errors.balance && (
                <p className="mt-1 text-[11px] font-bold text-red-600 ml-1">{errors.balance.message}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                  Adding...
                </>
              ) : 'Add Credit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCreditModal;
