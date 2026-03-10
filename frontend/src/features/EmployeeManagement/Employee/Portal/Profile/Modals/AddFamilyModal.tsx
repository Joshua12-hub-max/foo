import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { X, Loader } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores';
import { employeeApi } from '@/api/employeeApi';
import { AddFamilyMemberSchema, AddFamilyMemberInput } from '@/schemas/employeeSchema';
import { FamilyMember, ApiError } from '@/types';

interface AddFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  onSuccess?: () => void;
  initialData?: FamilyMember | null;
  existingItems?: FamilyMember[];
}

const AddFamilyModal: React.FC<AddFamilyModalProps> = ({
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

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<AddFamilyMemberInput>({
    resolver: zodResolver(AddFamilyMemberSchema),
    defaultValues: {
      relationType: 'Child'
    }
  });

  React.useEffect(() => {
    if (isOpen && initialData) {
       setValue('relationType', initialData.relationType as any);
       setValue('lastName', initialData.lastName || '');
       setValue('firstName', initialData.firstName || '');
       setValue('middleName', initialData.middleName || '');
       setValue('nameExtension', initialData.nameExtension || '');
       setValue('occupation', initialData.occupation || '');
       setValue('employer', initialData.employer || '');
       setValue('businessAddress', initialData.businessAddress || '');
       setValue('telephoneNo', initialData.telephoneNo || '');
       setValue('dateOfBirth', initialData.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : '');
    } else if (isOpen && !initialData) {
       reset({ relationType: 'Child' });
    }
  }, [isOpen, initialData, setValue, reset]);

  const mutation = useMutation({
    mutationFn: async (data: AddFamilyMemberInput) => {
      let newItems: any[];
      
      if (isEditMode) {
        newItems = existingItems.map(item => 
          item.id === initialData?.id ? { ...item, ...data } : item
        );
      } else {
        newItems = [...existingItems, { ...data }];
      }

      // Backend expects the full list for this section
      await employeeApi.updatePdsSection(employeeId, 'family', newItems);
    },
    onSuccess: () => {
      showToast(isEditMode ? 'Family record updated' : 'Family record added', 'success');
      queryClient.invalidateQueries({ queryKey: ['employee', String(employeeId)] });
      reset();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      console.error('Failed to save family info', error);
      const err = error as ApiError;
      showToast(err.response?.data?.message || err.message || 'Failed to save family info', 'error');
    }
  });

  const onSubmit = (data: AddFamilyMemberInput) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{isEditMode ? 'Edit Family Member' : 'Add Family Member'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Relation Type <span className="text-red-400">*</span></label>
              <select 
                {...register('relationType')}
                className="w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900"
              >
                <option value="Spouse">Spouse</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Child">Child</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Last Name <span className="text-red-400">*</span></label>
              <input 
                {...register('lastName')}
                placeholder="Last Name"
                className={`w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900 ${errors.lastName ? 'border-red-500' : ''}`}
              />
              {errors.lastName && <p className="text-[10px] text-red-500 mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="text-xs font-semibold text-gray-700 mb-1 block">First Name <span className="text-red-400">*</span></label>
              <input 
                {...register('firstName')}
                placeholder="First Name"
                className={`w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900 ${errors.firstName ? 'border-red-500' : ''}`}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Middle Name</label>
              <input 
                {...register('middleName')}
                placeholder="Middle Name"
                className="w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Extension (JR/SR)</label>
              <input 
                {...register('nameExtension')}
                placeholder="e.g. Jr., III"
                className="w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Date of Birth</label>
              <input 
                type="date"
                {...register('dateOfBirth')}
                className="w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Occupation</label>
              <input 
                {...register('occupation')}
                placeholder="Occupation"
                className="w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Employer / Business</label>
              <input 
                {...register('employer')}
                className="w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Telephone No.</label>
              <input 
                {...register('telephoneNo')}
                className="w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Business Address</label>
            <input 
              {...register('businessAddress')}
              className="w-full px-3 py-2 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-gray-900"
            />
          </div>

          <div className="pt-4 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
               Cancel
             </button>
             <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
               {mutation.isPending ? <Loader className="animate-spin" size={16} /> : (isEditMode ? 'Update Member' : 'Add Member')}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFamilyModal;
