import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { X, Loader } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores';
import { employeeApi } from '@/api/employeeApi';
import { AddExperienceSchema, AddExperienceInput } from '@/schemas/employeeSchema';
import { WorkplaceExperience, ApiError } from '@/types';

interface AddExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  onSuccess?: () => void;
  initialData?: WorkplaceExperience | null;
  existingItems?: WorkplaceExperience[];
}

const AddExperienceModal: React.FC<AddExperienceModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  onSuccess,
  initialData,
  existingItems = []
}) => {
  const showToast = useToastStore((state) => state.showToast);
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<AddExperienceInput>({
    resolver: zodResolver(AddExperienceSchema),
  });

  React.useEffect(() => {
    if (isOpen && initialData) {
       setValue('dateFrom', initialData.dateFrom ? new Date(initialData.dateFrom).toISOString().split('T')[0] : '');
       setValue('dateTo', initialData.dateTo ? new Date(initialData.dateTo).toISOString().split('T')[0] : '');
       setValue('positionTitle', initialData.positionTitle || '');
       setValue('companyName', initialData.companyName || '');
       setValue('monthlySalary', initialData.monthlySalary || '');
       setValue('salaryGrade', initialData.salaryGrade || '');
       setValue('appointmentStatus', initialData.appointmentStatus || '');
       setValue('isGovernment', !!initialData.isGovernment);
    } else if (isOpen && !initialData) {
       reset({ isGovernment: false });
    }
  }, [isOpen, initialData, setValue, reset]);

  const mutation = useMutation({
    mutationFn: async (data: AddExperienceInput) => {
      let newItems: any[];
      const cleanItem = {
          ...data,
          isGovernment: data.isGovernment ? 1 : 0
      };

      if (isEditMode) {
        newItems = existingItems.map(item => 
          item.id === initialData?.id ? { ...item, ...cleanItem } : item
        );
      } else {
        newItems = [...existingItems, { ...cleanItem }];
      }

      await employeeApi.updatePdsSection(employeeId, 'work_experience', newItems);
    },
    onSuccess: () => {
      showToast(isEditMode ? 'Work experience updated' : 'Work experience added', 'success');
      queryClient.invalidateQueries({ queryKey: ['employee', String(employeeId)] });
      reset();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      console.error('Failed to save experience', error);
      const err = error as ApiError;
      showToast(err.response?.data?.message || err.message || 'Failed to save experience', 'error');
    }
  });

  const onSubmit = (data: AddExperienceInput) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{isEditMode ? 'Edit Work Experience' : 'Add Work Experience'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Date From <span className="text-red-400">*</span></label>
              <input type="date" {...register('dateFrom')} className={`w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900 ${errors.dateFrom ? 'border-red-500' : ''}`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Date To</label>
              <input type="date" {...register('dateTo')} className="w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Position Title <span className="text-red-400">*</span></label>
            <input {...register('positionTitle')} placeholder="e.g. Senior Developer" className={`w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900 ${errors.positionTitle ? 'border-red-500' : ''}`} />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Company / Agency <span className="text-red-400">*</span></label>
            <input {...register('companyName')} placeholder="Company Name" className={`w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900 ${errors.companyName ? 'border-red-500' : ''}`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Monthly Salary</label>
              <input {...register('monthlySalary')} placeholder="0.00" className="w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Salary Grade / Step</label>
              <input {...register('salaryGrade')} placeholder="e.g. 11-1" className="w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Status of Appointment</label>
              <input {...register('appointmentStatus')} placeholder="e.g. Permanent" className="w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900" />
            </div>
          </div>

          <div className="flex items-center gap-2">
             <input type="checkbox" id="isGovernment" {...register('isGovernment')} className="rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
             <label htmlFor="isGovernment" className="text-sm font-medium text-gray-700">Government Service</label>
          </div>

          <div className="pt-4 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
               Cancel
             </button>
             <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
               {mutation.isPending ? <Loader className="animate-spin" size={16} /> : (isEditMode ? 'Update Experience' : 'Add Experience')}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExperienceModal;
