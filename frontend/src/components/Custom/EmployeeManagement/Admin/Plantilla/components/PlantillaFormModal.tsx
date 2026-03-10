import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { X, Loader } from 'lucide-react';
// @ts-ignore
import { plantillaApi } from '@api/plantillaApi';
import { plantillaSchema, PlantillaSchema } from '@/schemas/plantilla';

interface PlantillaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  departments: string[];
  initialData?: Partial<PlantillaSchema>;
  onSubmit: (data: PlantillaSchema) => Promise<void>;
  isProcessing?: boolean;
}

const PlantillaFormModal: React.FC<PlantillaFormModalProps> = ({ 
  isOpen, 
  onClose, 
  mode, 
  departments, 
  initialData, 
  onSubmit, 
  isProcessing = false 
}) => {
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<PlantillaSchema>({
    resolver: zodResolver(plantillaSchema),
    defaultValues: {
      itemNumber: '',
      positionTitle: '',
      salaryGrade: 0,
      stepIncrement: 1,
      monthlySalary: 0,
      department: '',
      isVacant: true
    }
  });

  const salaryGrade = watch('salaryGrade');
  const stepIncrement = watch('stepIncrement');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        reset({
          itemNumber: initialData.itemNumber,
          positionTitle: initialData.positionTitle,
          salaryGrade: Number(initialData.salaryGrade),
          stepIncrement: Number(initialData.stepIncrement),
          monthlySalary: Number(initialData.monthlySalary),
          department: initialData.department,
          isVacant: initialData.isVacant
        });
      } else {
        reset({
           itemNumber: '',
           positionTitle: '',
           salaryGrade: 0,
           stepIncrement: 1,
           monthlySalary: 0,
           department: '',
           isVacant: true
        }); // Clear for create
      }
    }
  }, [isOpen, mode, initialData, reset]);

  // Auto-fetch salary
  useEffect(() => {
    if (isOpen && salaryGrade && stepIncrement) {
        const fetchSalary = async () => {
            try {
                const res = await plantillaApi.getSalarySchedule(salaryGrade, stepIncrement);
                if (res.data.success && res.data.monthlySalary) {
                    setValue('monthlySalary', res.data.monthlySalary);
                }
            } catch (err) {
                console.error("Failed to fetch suggested salary", err);
            }
        };
        // Debounce slightly or just call
        const timer = setTimeout(fetchSalary, 500);
        return () => clearTimeout(timer);
    }
  }, [salaryGrade, stepIncrement, isOpen, setValue]);

  const onFormSubmit: SubmitHandler<PlantillaSchema> = async (data) => {
    await onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'create' ? 'Add New Position' : 'Edit Position'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col max-h-[80vh]">
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Item Number*</label>
                <input 
                  type="text"
                  {...register('itemNumber')}
                  className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all ${errors.itemNumber ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="e.g. ADOF3-1"
                />
                {errors.itemNumber && <p className="text-xs text-red-500 mt-1">{errors.itemNumber.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Salary Grade (1-33)*</label>
                <input 
                  type="number" min={1} max={33}
                  {...register('salaryGrade')}
                  className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all ${errors.salaryGrade ? 'border-red-500' : 'border-gray-200'}`}
                />
                 {errors.salaryGrade && <p className="text-xs text-red-500 mt-1">{errors.salaryGrade.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Position Title*</label>
              <input 
                type="text" 
                {...register('positionTitle')}
                className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all ${errors.positionTitle ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="e.g. Administrative Officer III"
              />
              {errors.positionTitle && <p className="text-xs text-red-500 mt-1">{errors.positionTitle.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Step Increment</label>
                <input 
                  type="number" min={1} max={8}
                  {...register('stepIncrement')}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Monthly Salary</label>
                <input 
                  type="number" step="0.01"
                  {...register('monthlySalary')}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Department*</label>
              <select 
                {...register('department')}
                className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all ${errors.department ? 'border-red-500' : 'border-gray-200'}`}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
               {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 mt-auto">
            <button 
              type="button" 
              onClick={onClose}
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
              {mode === 'create' ? 'Create Position' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlantillaFormModal;
