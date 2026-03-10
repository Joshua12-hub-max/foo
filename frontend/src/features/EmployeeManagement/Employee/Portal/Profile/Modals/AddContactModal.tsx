import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { X, Loader } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores';
import { employeeApi } from '@/api/employeeApi';
import { AddContactSchema, AddContactInput } from '@/schemas/employeeSchema';
import { EmergencyContact, ContactData, ApiError } from '@/types';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  onSuccess?: () => void;
  initialData?: EmergencyContact | null;
}

const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  onSuccess,
  initialData
}) => {
  const showToast = useToastStore((state) => state.showToast);
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<AddContactInput>({
    resolver: zodResolver(AddContactSchema),
    defaultValues: {
      isPrimary: false
    }
  });

  React.useEffect(() => {
    if (isOpen && initialData) {
       setValue('name', initialData.name);
       setValue('relationship', initialData.relationship);
       setValue('phoneNumber', initialData.phoneNumber);
       setValue('email', initialData.email || '');
       setValue('address', initialData.address || '');
       setValue('isPrimary', !!initialData.isPrimary);
    } else if (isOpen && !initialData) {
       reset({ isPrimary: false });
    }
  }, [isOpen, initialData, setValue, reset]);

  const mutation = useMutation({
    mutationFn: async (data: AddContactInput) => {
      // Ensure data conforms to ContactData which expects strings/booleans
      const cleanData: ContactData = {
        name: data.name,
        relationship: data.relationship,
        phoneNumber: data.phoneNumber,
        email: data.email || null,
        address: data.address || null,
        isPrimary: !!data.isPrimary
      };

      if (isEditMode && initialData?.id) {
         await employeeApi.updateEmployeeContact(employeeId, initialData.id, cleanData);
      } else {
         await employeeApi.addEmployeeContact(employeeId, cleanData);
      }
    },
    onSuccess: () => {
      showToast(isEditMode ? 'Contact updated successfully' : 'Contact added successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['employee', String(employeeId)] });
      reset();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      console.error('Failed to save contact', error);
      const err = error as ApiError;
      showToast(err.response?.data?.message || err.message || 'Failed to save contact', 'error');
    }
  });

  const onSubmit = (data: AddContactInput) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{isEditMode ? 'Edit Emergency Contact' : 'Add Emergency Contact'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Name <span className="text-red-400">*</span></label>
            <input 
              {...register('name')}
              className={`w-full px-3 py-2 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 ${errors.name ? 'border-red-500' : ''}`}
              placeholder="e.g. Juan dela Cruz"
              autoFocus
            />
            {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Relationship <span className="text-red-400">*</span></label>
            <input 
              {...register('relationship')}
              className={`w-full px-3 py-2 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 ${errors.relationship ? 'border-red-500' : ''}`}
              placeholder="e.g. Spouse, Parent, Sibling"
            />
             {errors.relationship && <p className="text-[10px] text-red-500 mt-1">{errors.relationship.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Phone Number <span className="text-red-400">*</span></label>
            <input 
              type="tel"
              {...register('phoneNumber')}
              className={`w-full px-3 py-2 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 ${errors.phoneNumber ? 'border-red-500' : ''}`}
              placeholder="e.g. 09171234567"
            />
             {errors.phoneNumber && <p className="text-[10px] text-red-500 mt-1">{errors.phoneNumber.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Address</label>
            <textarea 
              {...register('address')}
              className="w-full px-3 py-2 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 resize-none"
              rows={2}
              placeholder="Optional address"
            />
          </div>
          
           <div className="flex items-center gap-2">
             <input type="checkbox" id="isPrimary" {...register('isPrimary')} className="rounded border-gray-300" />
             <label htmlFor="isPrimary" className="text-sm text-gray-700">Set as Primary Contact</label>
          </div>

          <div className="pt-4 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
               Cancel
             </button>
             <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
               {mutation.isPending ? <Loader className="animate-spin" size={16} /> : 'Add Contact'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContactModal;
