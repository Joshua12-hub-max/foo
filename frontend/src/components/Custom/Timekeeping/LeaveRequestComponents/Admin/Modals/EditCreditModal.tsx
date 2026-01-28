import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';
import { creditUpdateSchema, CreditUpdateInput } from '@/schemas/creditsSchema';

interface EditCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreditUpdateInput) => Promise<void>;
  credit: any;
  isSubmitting: boolean;
}

const EditCreditModal = ({ isOpen, onClose, onSubmit, credit, isSubmitting }: EditCreditModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreditUpdateInput>({
    resolver: zodResolver(creditUpdateSchema),
  });

  useEffect(() => {
    if (credit) {
      reset({
        creditType: credit.credit_type,
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
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Edit Leave Credit</h2>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-100 mb-2">
            <p className="text-xs text-teal-700 font-medium uppercase tracking-wider mb-1">Employee</p>
            <p className="text-sm text-gray-800 font-semibold">
              {credit.first_name} {credit.last_name} ({credit.employee_id})
            </p>
          </div>

          {/* Credit Type (Disabled in edit) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Credit Type
            </label>
            <input
              type="text"
              {...register('creditType')}
              disabled
              className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed outline-none"
            />
          </div>

          {/* Balance Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Balance (Days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              {...register('balance', { valueAsNumber: true })}
              className={`w-full border ${errors.balance ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-gray-400`}
              placeholder="0.00"
              autoFocus
            />
            {errors.balance && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.balance.message}</p>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCreditModal;
