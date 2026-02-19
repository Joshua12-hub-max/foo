import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';
import { useLeavePolicy } from '@/hooks/useLeavePolicy';
import { addCreditSchema, AddCreditInput } from '@/schemas/creditsSchema';

// ... (interface remains same)

const AddCreditModal = ({ isOpen, onClose, onSubmit, employees, isLoadingEmployees, isSubmitting }: AddCreditModalProps) => {
  const { data: leaveTypes = [], isLoading: isLoadingPolicy } = useLeavePolicy();

  const {
    register,
// ... (rest of hook usage)
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
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-md w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Add Leave Credit</h2>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-600 hover:text-red-700" />
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
                {...register('employee_id')}
                className={`w-full border ${errors.employee_id ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-600/20 focus:border-gray-600 outline-none transition-all`}
              >
                <option value="">Select an employee...</option>
                {employees.map((emp, index) => (
                  <option key={`${emp.employee_id}-${index}`} value={emp.employee_id}>
                    {emp.first_name} {emp.last_name} ({emp.employee_id})
                  </option>
                ))}
              </select>
            )}
            {errors.employee_id && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.employee_id.message}</p>
            )}
          </div>

          {/* Credit Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Credit Type <span className="text-red-500"></span>
            </label>
            <select
              {...register('creditType')}
              disabled={isLoadingPolicy}
              className={`w-full border ${errors.creditType ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-600/20 focus:border-gray-600 outline-none transition-all`}
            >
              <option value="">
                {isLoadingPolicy ? "Loading leave types..." : "Select credit type..."}
              </option>
              {leaveTypes.map((type: string) => (
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
