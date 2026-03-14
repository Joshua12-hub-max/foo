import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader, Save } from 'lucide-react';
import Combobox from '@/components/Custom/Combobox';

// --- Schema ---
const budgetSchema = z.object({
  year: z.number().min(2020).max(2050),
  department: z.string().min(1, "Department is required"),
  totalBudget: z.number().min(1, "Total budget must be greater than 0"),
  notes: z.string().optional()
});

type BudgetSchema = z.infer<typeof budgetSchema>;

// --- Props ---
interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  departments: { id: number; name: string }[];
  initialData?: BudgetSchema & { id?: number };
  onSubmit: (data: BudgetSchema) => Promise<void>;
  isProcessing?: boolean;
}

const BudgetFormModal: React.FC<BudgetFormModalProps> = ({ 
  isOpen, 
  onClose, 
  mode, 
  departments, 
  initialData, 
  onSubmit, 
  isProcessing = false 
}) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<BudgetSchema>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      department: '',
      totalBudget: 0,
      notes: ''
    }
  });

  // Reset/Populate form
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        reset({
          year: Number(initialData.year),
          department: initialData.department,
          totalBudget: Number(initialData.totalBudget),
          notes: initialData.notes || ''
        });
      } else {
        reset({
           year: new Date().getFullYear(),
           department: '',
           totalBudget: 0,
           notes: ''
        });
      }
    }
  }, [isOpen, mode, initialData, reset]);

  const onFormSubmit: SubmitHandler<BudgetSchema> = async (data) => {
    await onSubmit({
        ...data,
        year: Number(data.year),
        totalBudget: Number(data.totalBudget)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 transition-all">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 z-10 relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {mode === 'create' ? <Save size={18} className="text-blue-600"/> : <Save size={18} className="text-amber-600"/>}
            {mode === 'create' ? 'Set New Budget' : 'Edit Allocation'}
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col">
          <div className="p-6 space-y-4">
            
            {/* Year & Department */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Fiscal Year</label>
                <input 
                  type="number"
                  {...register('year', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none text-gray-600 cursor-not-allowed"
                  readOnly // Lock year for now to current or selected
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Department</label>
                <Combobox
                  options={departments.map(dept => ({ value: dept.name, label: dept.name }))}
                  value={watch('department') || ''}
                  onChange={(val) => setValue('department', val)}
                  disabled={mode === 'edit'}
                  placeholder="Select Dept"
                  className={errors.department ? 'border-red-500' : ''}
                />
                {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
              </div>
            </div>

            {/* Total Budget */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Total Approved Budget (₱)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 text-sm">₱</span>
                <input 
                  type="number" 
                  step="0.01"
                  {...register('totalBudget', { valueAsNumber: true })}
                  className={`w-full pl-7 pr-3 py-2 bg-gray-50 border rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${errors.totalBudget ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="0.00"
                />
              </div>
              {errors.totalBudget && <p className="text-xs text-red-500 mt-1">{errors.totalBudget.message}</p>}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Notes / Remarks (Optional)</label>
              <textarea 
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                placeholder="e.g. Approved per Ordinance No. 123"
              />
            </div>

          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isProcessing && <Loader className="animate-spin" size={16} />}
              {mode === 'create' ? 'Set Budget' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetFormModal;
