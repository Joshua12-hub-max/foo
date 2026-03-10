import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { X, Loader } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores';
import { employeeApi } from '@/api/employeeApi';
import { AddOtherInfoSchema, AddOtherInfoInput } from '@/schemas/employeeSchema';
import { PdsOtherInfo, ApiError } from '@/types';

interface AddOtherInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  onSuccess?: () => void;
  initialData?: PdsOtherInfo | null;
  existingItems?: PdsOtherInfo[];
}

const AddOtherInfoModal: React.FC<AddOtherInfoModalProps> = ({
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

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<AddOtherInfoInput>({
    resolver: zodResolver(AddOtherInfoSchema),
    defaultValues: {
      type: 'Skill'
    }
  });

  React.useEffect(() => {
    if (isOpen && initialData) {
       setValue('type', initialData.type as any);
       setValue('description', initialData.description || '');
    } else if (isOpen && !initialData) {
       reset({ type: 'Skill' });
    }
  }, [isOpen, initialData, setValue, reset]);

  const mutation = useMutation({
    mutationFn: async (data: AddOtherInfoInput) => {
      let newItems: any[];
      if (isEditMode) {
        newItems = existingItems.map(item => 
          item.id === initialData?.id ? { ...item, ...data } : item
        );
      } else {
        newItems = [...existingItems, { ...data }];
      }
      await employeeApi.updatePdsSection(employeeId, 'other_info', newItems);
    },
    onSuccess: () => {
      showToast(isEditMode ? 'Information updated' : 'Information added', 'success');
      queryClient.invalidateQueries({ queryKey: ['employee', String(employeeId)] });
      reset();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      console.error('Failed to save info', error);
      const err = error as ApiError;
      showToast(err.response?.data?.message || err.message || 'Failed to save info', 'error');
    }
  });

  const onSubmit = (data: AddOtherInfoInput) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{isEditMode ? 'Edit Other Info' : 'Add Other Info'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Type <span className="text-red-400">*</span></label>
            <select 
              {...register('type')}
              className="w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900"
            >
              <option value="Skill">Special Skill / Hobby</option>
              <option value="Recognition">Non-Academic Distinction / Recognition</option>
              <option value="Membership">Membership in Association / Organization</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Description <span className="text-red-400">*</span></label>
            <textarea 
               {...register('description')} 
               rows={3}
               className={`w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900 ${errors.description ? 'border-red-500' : ''}`}
               placeholder="Enter details here..."
            />
            {errors.description && <p className="text-[10px] text-red-500 mt-1">{errors.description.message}</p>}
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

export default AddOtherInfoModal;
