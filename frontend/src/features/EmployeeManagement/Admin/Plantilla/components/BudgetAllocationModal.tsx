import React, { useEffect, memo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Save, AlertCircle } from 'lucide-react';
import Combobox from '@/components/Custom/Combobox';
import { budgetAllocationSchema, type BudgetAllocationFormData } from '@/schemas/compliance';
import type { BudgetAllocation } from '@/api/complianceApi';

interface BudgetAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BudgetAllocationFormData) => Promise<void>;
  initialData?: BudgetAllocation | null;
  departments: string[];
  year: number;
}

const BudgetAllocationModal: React.FC<BudgetAllocationModalProps> = memo(({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  departments,
  year 
}) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BudgetAllocationFormData>({
    resolver: zodResolver(budgetAllocationSchema),
    defaultValues: {
      year: year,
      department: '',
      totalBudget: 0,
      notes: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          year: initialData.year,
          department: initialData.department,
          totalBudget: initialData.totalBudget || 0,
          notes: initialData.notes || ''
        });
      } else {
        reset({
          year: year,
          department: '',
          totalBudget: 0,
          notes: ''
        });
      }
    }
  }, [isOpen, initialData, reset, year]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? 'Edit Allocation' : 'New Allocation'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Year Display (Read-only if editing) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Fiscal Year
            </label>
            <input
              type="number"
              {...register('year', { valueAsNumber: true })}
              disabled={!!initialData}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60"
            />
            {errors.year && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.year.message}
              </p>
            )}
          </div>

          {/* Department Selection */}
          <div className="relative z-[60]">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Department
            </label>
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={departments.map((dept) => ({ value: dept, label: dept }))}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={!!initialData}
                  placeholder="Select Department"
                  buttonClassName="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60 h-[46px]"
                />
              )}
            />
            {errors.department && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.department.message}
              </p>
            )}
          </div>

          {/* Total Budget */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Allocated Budget (₱)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('totalBudget', { valueAsNumber: true })}
              placeholder="0.00"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
            {errors.totalBudget && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.totalBudget.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Remarks / Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Optional notes about this allocation..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

BudgetAllocationModal.displayName = 'BudgetAllocationModal';

export default BudgetAllocationModal;
