import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';
import { creditUpdateSchema, CreditUpdateInput } from '@/schemas/creditsSchema';
import { useLeavePolicy } from '@/hooks/useLeavePolicy';
import Combobox from '@/components/Custom/Combobox';

interface EditCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreditUpdateInput) => Promise<void>;
  credit: { creditType: string; balance: number; firstName: string; lastName: string; employeeId: string };
  isSubmitting: boolean;
}

const EditCreditModal = ({ isOpen, onClose, onSubmit, credit, isSubmitting }: EditCreditModalProps) => {
  const { data: policy } = useLeavePolicy();
  const creditTypes = policy ? Array.from(new Set(Object.values(policy.leaveToCreditMap))) : [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CreditUpdateInput>({
    resolver: zodResolver(creditUpdateSchema),
  });

  useEffect(() => {
    if (credit) {
      reset({
        creditType: credit.creditType,
        balance: credit.balance,
      });
    }
  }, [credit, reset]);

  const handleFormSubmit = async (data: CreditUpdateInput) => {
    try {
      await onSubmit(data);
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
            <h2 className="text-xl font-bold text-gray-800">Edit Leave Credit</h2>
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
            {/* Employee Info Card */}
            <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100/50">
              <p className="text-[10px] text-teal-700 font-bold mb-1 px-1">Selected Employee</p>
              <p className="text-sm text-gray-800 font-bold px-1">
                {credit.firstName} {credit.lastName} ({credit.employeeId})
              </p>
            </div>

            {/* Credit Type (Disabled in edit) */}
            <div className="space-y-1.5 grayscale opacity-60">
              <label className="block text-xs font-bold text-gray-500 ml-1">
                Credit Type
              </label>
              <Combobox
                options={creditTypes.map(type => ({ value: type, label: type }))}
                value={watch('creditType') || ''}
                onChange={(val) => setValue('creditType', val, { shouldValidate: true })}
                placeholder="Select credit type..."
                error={!!errors.creditType}
                className="pointer-events-none"
              />
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
                autoFocus
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
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCreditModal;
