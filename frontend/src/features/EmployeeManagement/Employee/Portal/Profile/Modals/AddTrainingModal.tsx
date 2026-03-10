import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { X, Loader } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores';
import { employeeApi } from '@/api/employeeApi';
import { AddTrainingSchema, AddTrainingInput } from '@/schemas/employeeSchema';
import { LearningDevelopment, ApiError } from '@/types';

interface AddTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  onSuccess?: () => void;
  initialData?: LearningDevelopment | null;
  existingItems?: LearningDevelopment[];
}

const AddTrainingModal: React.FC<AddTrainingModalProps> = ({
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

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<AddTrainingInput>({
    resolver: zodResolver(AddTrainingSchema),
  });

  React.useEffect(() => {
    if (isOpen && initialData) {
       setValue('title', initialData.title || '');
       setValue('dateFrom', initialData.dateFrom ? new Date(initialData.dateFrom).toISOString().split('T')[0] : '');
       setValue('dateTo', initialData.dateTo ? new Date(initialData.dateTo).toISOString().split('T')[0] : '');
       setValue('hoursNumber', initialData.hoursNumber || null);
       setValue('typeOfLd', initialData.typeOfLd || '');
       setValue('conductedBy', initialData.conductedBy || '');
    } else if (isOpen && !initialData) {
       reset();
    }
  }, [isOpen, initialData, setValue, reset]);

  const mutation = useMutation({
    mutationFn: async (data: AddTrainingInput) => {
      let newItems: any[];
      if (isEditMode) {
        newItems = existingItems.map(item => 
          item.id === initialData?.id ? { ...item, ...data } : item
        );
      } else {
        newItems = [...existingItems, { ...data }];
      }
      await employeeApi.updatePdsSection(employeeId, 'learning_development', newItems);
    },
    onSuccess: () => {
      showToast(isEditMode ? 'Training record updated' : 'Training record added', 'success');
      queryClient.invalidateQueries({ queryKey: ['employee', String(employeeId)] });
      reset();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      console.error('Failed to save training info', error);
      const err = error as ApiError;
      showToast(err.response?.data?.message || err.message || 'Failed to save training info', 'error');
    }
  });

  const onSubmit = (data: AddTrainingInput) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{isEditMode ? 'Edit Training / L&D' : 'Add Training / L&D'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Title of Seminar / Conference / Training <span className="text-red-400">*</span></label>
            <input {...register('title')} className={`w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900 ${errors.title ? 'border-red-500' : ''}`} />
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Number of Hours</label>
              <input type="number" {...register('hoursNumber')} className="w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Type of LD (Managerial/Technical/etc)</label>
              <input {...register('typeOfLd')} className="w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Conducted / Sponsored By</label>
            <input {...register('conductedBy')} className="w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900" />
          </div>

          <div className="pt-4 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
               Cancel
             </button>
             <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
               {mutation.isPending ? <Loader className="animate-spin" size={16} /> : (isEditMode ? 'Update' : 'Add')}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTrainingModal;
