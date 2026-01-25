import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores';
import { employeeApi } from '@/api/employeeApi';
import { AddEducationSchema, AddEducationInput } from '@/schemas/employeeSchema';

interface AddEducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  onSuccess?: () => void;
}

const AddEducationModal: React.FC<AddEducationModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  onSuccess
}) => {
  const showToast = useToastStore((state) => state.showToast);
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<AddEducationInput>({
    resolver: zodResolver(AddEducationSchema) as any,
    defaultValues: {
      is_current: false,
      type: 'Education'
    }
  });

  const isCurrent = watch('is_current');

  const mutation = useMutation({
    mutationFn: async (data: AddEducationInput) => {
      await employeeApi.addEmployeeEducation(employeeId, data);
    },
    onSuccess: () => {
      showToast('Education added successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['employee', String(employeeId)] });
      reset();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: any) => {
      console.error('Failed to add education', error);
      showToast(error.message || 'Failed to add education', 'error');
    }
  });

  const onSubmit = (data: AddEducationInput) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Add Education</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Level / Type</label>
            <input 
              {...register('type')}
              className="w-full px-3 py-2 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900"
              placeholder="e.g. College, Masters, High School"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">School / Institution <span className="text-red-400">*</span></label>
            <input 
              {...register('institution')}
              className={`w-full px-3 py-2 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 ${errors.institution ? 'border-red-500' : ''}`}
              placeholder="e.g. University of the Philippines"
              autoFocus
            />
            {errors.institution && <p className="text-[10px] text-red-500 mt-1">{errors.institution.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Degree / Course</label>
                <input 
                  {...register('degree')}
                  className="w-full px-3 py-2 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900"
                  placeholder="e.g. BS Computer Science"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Major / Field</label>
                <input 
                  {...register('field_of_study')}
                  className="w-full px-3 py-2 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900"
                  placeholder="e.g. Software Engineering"
                />
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Start Date</label>
                <input 
                  type="date"
                  {...register('start_date')}
                  className="w-full px-3 py-2 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">End Date</label>
                <input 
                  type="date"
                  {...register('end_date')}
                  disabled={isCurrent}
                  className="w-full px-3 py-2 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 disabled:opacity-50"
                />
              </div>
          </div>

          <div className="flex items-center gap-2">
             <input type="checkbox" id="is_current" {...register('is_current')} className="rounded border-gray-300" />
             <label htmlFor="is_current" className="text-sm text-gray-700">Currently studying here</label>
          </div>

          <div className="pt-4 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
               Cancel
             </button>
             <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
               {mutation.isPending ? <Loader className="animate-spin" size={16} /> : 'Add Education'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEducationModal;
