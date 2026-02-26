import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { X, Loader } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores';
import { employeeApi } from '@/api/employeeApi';
import { AddCustomFieldSchema, AddCustomFieldInput } from '@/schemas/employeeSchema';
import { ApiError } from '@/types';

interface AddCustomFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  section: string;
  onSuccess?: () => void;
}

const AddCustomFieldModal: React.FC<AddCustomFieldModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  section,
  onSuccess
}) => {
  const showToast = useToastStore((state) => state.showToast);
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AddCustomFieldInput>({
    resolver: zodResolver(AddCustomFieldSchema),
    defaultValues: {
      section: section
    }
  });

  // Reset/Update section when modal opens or section changes
  React.useEffect(() => {
    if (isOpen) {
      reset({ section: section, field_name: '', field_value: '' });
    }
  }, [isOpen, section, reset]);

  const mutation = useMutation({
    mutationFn: async (data: AddCustomFieldInput) => {
      await employeeApi.addEmployeeCustomField(employeeId, data);
    },
    onSuccess: () => {
      showToast('Custom field added successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['employee', String(employeeId)] });
      reset();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      const err = error as ApiError;
      console.error('Failed to add custom field', err);
      showToast(err.response?.data?.message || err.message || 'Failed to add custom field', 'error');
    }
  });

  const onSubmit = (data: AddCustomFieldInput) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Add to {section}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <input type="hidden" {...register('section')} />

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Field Label <span className="text-red-400">*</span></label>
            <input 
              {...register('field_name')}
              className={`w-full px-3 py-2 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 ${errors.field_name ? 'border-red-500' : ''}`}
              placeholder="e.g. Nickname, Project Name, License No."
              autoFocus
            />
            {errors.field_name && <p className="text-[10px] text-red-500 mt-1">{errors.field_name.message}</p>}
          </div>

          <div>
             <label className="text-xs font-semibold text-gray-700 mb-1 block">Value</label>
            <textarea 
              {...register('field_value')}
              className="w-full px-3 py-2 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 resize-none"
              rows={3}
              placeholder="Enter the details..."
            />
          </div>

          <div className="pt-4 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
               Cancel
             </button>
             <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
               {mutation.isPending ? <Loader className="animate-spin" size={16} /> : 'Add Field'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomFieldModal;
