import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';
import { addCreditSchema, AddCreditInput, CREDIT_TYPES } from '@/schemas/creditsSchema';
import { formatFullName } from '@/utils/nameUtils';

interface AddCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddCreditInput) => Promise<void>;
  employees: { id?: string | number; employeeId?: string | number; employeeId?: string | number; firstName?: string; firstName?: string; lastName?: string; lastName?: string; }[];
  isLoadingEmployees: boolean;
  isSubmitting: boolean;
}

const AddCreditModal = ({ isOpen, onClose, onSubmit, employees, isLoadingEmployees, isSubmitting }: AddCreditModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300" onClick={onClose}>
      <div 
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-md border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="bg-amber-50 p-2 rounded-lg">
                <Loader2 className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Add Leave Credit</h2>
            </div>
            <button 
              type="button"
              onClick={onClose} 
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Employee <span className="text-red-500"></span>
            </label>
            {isLoadingEmployees ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading employees...
              </div>
            ) : (
              <select
                {...register('employeeId')}
                className={`w-full border ${errors.employeeId ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-600/20 focus:border-gray-600 outline-none transition-all`}
              >
                <option value="">Select an employee...</option>
                {employees.map(emp => {
                  const empId = emp.employeeId || emp.employeeId || emp.id;
                  const firstName = emp.firstName || emp.firstName || '';
                  const lastName = emp.lastName || emp.lastName || '';
                  return (
                    <option key={empId} value={empId}>
                      {formatFullName(lastName, firstName)} ({empId})
                    </option>
                  );
                })}

              </select>
            )}
            {errors.employeeId && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.employeeId.message}</p>
            )}
          </div>

          {/* Credit Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Credit Type <span className="text-red-500"></span>
            </label>
            <select
              {...register('creditType')}
              className={`w-full border ${errors.creditType ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-600/20 focus:border-gray-600 outline-none transition-all`}
            >
              <option value="">Select credit type...</option>
              {CREDIT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.creditType && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.creditType.message}</p>
            )}
          </div>

          {/* Balance Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Balance (Days) <span className="text-red-500"></span>
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              {...register('balance', { valueAsNumber: true })}
              className={`w-full border ${errors.balance ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-600/20 focus:border-gray-600 outline-none transition-all placeholder:text-gray-400`}
              placeholder="0.00"
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
              {isSubmitting ? 'Adding...' : 'Add Credit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCreditModal;
