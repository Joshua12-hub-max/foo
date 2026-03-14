import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader } from 'lucide-react';
import { plantillaApi, type Position } from '@/api/plantillaApi';
import { plantillaSchema, PlantillaSchema } from '@/schemas/plantilla';
import Combobox from '@/components/Custom/Combobox';

interface PlantillaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  departments: { id: number; name: string }[];
  position?: Position | null;
  onSubmit: (data: PlantillaSchema) => Promise<void>;
  isProcessing?: boolean;
}

const PlantillaFormModal: React.FC<PlantillaFormModalProps> = ({ 
  isOpen, 
  onClose, 
  mode, 
  departments, 
  position, 
  onSubmit, 
  isProcessing = false 
}) => {
  const form = useForm<PlantillaSchema>({
    resolver: zodResolver(plantillaSchema),
    defaultValues: {
      itemNumber: '',
      positionTitle: '',
      salaryGrade: 1,
      stepIncrement: 1,
      monthlySalary: 0,
      departmentId: 0, 
      department: '',
      isVacant: true,
      areaCode: '',
      areaType: 'M',
      areaLevel: 'S'
    }
  });

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = form;

  const salaryGrade = watch('salaryGrade');
  const stepIncrement = watch('stepIncrement');

  // Reset form when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && position) {
        reset({
          itemNumber: position.itemNumber,
          positionTitle: position.positionTitle,
          salaryGrade: Number(position.salaryGrade),
          stepIncrement: Number(position.stepIncrement),
          monthlySalary: Number(position.monthlySalary),
          departmentId: position.departmentId ? Number(position.departmentId) : 0,
          department: position.department || '',
          isVacant: Boolean(position.isVacant),
          areaCode: position.areaCode || '',
          areaType: position.areaType || 'M',
          areaLevel: position.areaLevel || 'S'
        });
      } else {
        // Strict reset for create mode
        reset({
           itemNumber: '',
           positionTitle: '',
           salaryGrade: 1,
           stepIncrement: 1,
           monthlySalary: 0,
           departmentId: 0,
           department: '',
           isVacant: true,
           areaCode: '',
           areaType: 'M',
           areaLevel: 'S'
        });
      }
    }
  }, [isOpen, mode, position, reset]);

  // Auto-fetch salary with cleanup to prevent memory leaks
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    if (isOpen && salaryGrade && stepIncrement) {
        const fetchSalary = async () => {
            try {
                // Assuming getSalarySchedule might support signal in future, or we just ignore result
                const res = await plantillaApi.getSalarySchedule(salaryGrade, stepIncrement);
                if (isMounted && res.data.success && res.data.monthlySalary) {
                    setValue('monthlySalary', Number(res.data.monthlySalary));
                }
            } catch (err) {
                if (isMounted) {
                    console.error("Failed to fetch suggested salary", err);
                }
            }
        };

        const timer = setTimeout(fetchSalary, 500);
        return () => {
            isMounted = false;
            clearTimeout(timer);
            controller.abort();
        };
    }
    return () => { isMounted = false; };
  }, [salaryGrade, stepIncrement, isOpen, setValue]);

  const onFormSubmit = async (data: PlantillaSchema) => {
    // Ensure numeric types are strictly numbers before sending
    const formattedData: PlantillaSchema = {
        ...data,
        salaryGrade: Number(data.salaryGrade),
        stepIncrement: Number(data.stepIncrement),
        monthlySalary: Number(data.monthlySalary),
        departmentId: Number(data.departmentId)
    };
    await onSubmit(formattedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 transition-all">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      <div className="bg-white rounded-xl w-full max-w-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 z-10 relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'create' ? 'Add New Position' : 'Edit Position'}
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
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col max-h-[80vh]">
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Item Number*</label>
                <input 
                  type="text"
                  {...register('itemNumber')}
                  className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${errors.itemNumber ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="e.g. ADOF3-1"
                />
                {errors.itemNumber && <p className="text-xs text-red-500 mt-1">{errors.itemNumber.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Salary Grade (1-33)*</label>
                <input 
                  type="number" min={1} max={33}
                  {...register('salaryGrade', { valueAsNumber: true })}
                  className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${errors.salaryGrade ? 'border-red-500' : 'border-gray-200'}`}
                />
                 {errors.salaryGrade && <p className="text-xs text-red-500 mt-1">{errors.salaryGrade.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Position Title*</label>
              <input 
                type="text" 
                {...register('positionTitle')}
                className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${errors.positionTitle ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="e.g. Administrative Officer III"
              />
              {errors.positionTitle && <p className="text-xs text-red-500 mt-1">{errors.positionTitle.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Step Increment</label>
                <input 
                  type="number" min={1} max={8}
                  {...register('stepIncrement', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Monthly Salary</label>
                <input 
                  type="number" step="0.01"
                  {...register('monthlySalary', { valueAsNumber: true })}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Department*</label>
              <Combobox
                options={departments.map(dept => ({ value: dept.id.toString(), label: dept.name }))}
                value={watch('departmentId').toString()}
                onChange={(val) => setValue('departmentId', Number(val))}
                placeholder="Select Department"
                className={errors.departmentId ? 'border-red-500' : ''}
              />
               {errors.departmentId && <p className="text-xs text-red-500 mt-1">{errors.departmentId.message}</p>}
             </div>

            <div className="pt-6 border-t border-gray-100">
               <div className="flex items-center gap-2 mb-4">
                 <div className="w-1.5 h-4 bg-gray-900 rounded-full" />
                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Area Classification</h3>
                 <span className="text-[10px] text-gray-400 font-medium">(CSC COMPLIANCE)</span>
               </div>
               <div className="grid grid-cols-12 gap-4">
                 <div className="col-span-3">
                   <label className="block text-xs font-bold text-gray-700 mb-1.5">Area Code</label>
                   <input 
                     type="text"
                     {...register('areaCode')}
                     className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
                     placeholder="e.g. REG-01"
                   />
                 </div>
                  <div className="col-span-5">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Area Type</label>
                    <Combobox
                      options={[
                        { value: 'R', label: 'Region' },
                        { value: 'P', label: 'Province' },
                        { value: 'D', label: 'District' },
                        { value: 'M', label: 'Municipality' },
                        { value: 'F', label: 'Foreign Post' },
                        { value: 'B', label: 'Bureau' },
                      ]}
                      value={watch('areaType') || ''}
                      onChange={(val) => setValue('areaType', val)}
                      placeholder="Select Type"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Level</label>
                    <Combobox
                      options={[
                        { value: 'K', label: 'Key' },
                        { value: 'T', label: 'Technical' },
                        { value: 'S', label: 'Support' },
                        { value: 'A', label: 'Administrative' },
                      ]}
                      value={watch('areaLevel') || ''}
                      onChange={(val) => setValue('areaLevel', val)}
                      placeholder="Select Level"
                    />
                  </div>
               </div>
             </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 mt-auto">
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
              {mode === 'create' ? 'Create Position' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlantillaFormModal;
