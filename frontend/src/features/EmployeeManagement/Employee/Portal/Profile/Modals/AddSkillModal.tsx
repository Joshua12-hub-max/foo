import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { X, Loader } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores';
import { employeeApi } from '@/api/employeeApi';
import { AddSkillSchema, AddSkillInput } from '@/schemas/employeeSchema';
import { Skill, ApiError, SkillData } from '@/types';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  onSuccess?: () => void;
  initialData?: Skill | null;
}

const SKILL_PROFICIENCY_OPTIONS = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Expert', label: 'Expert' }
];

const AddSkillModal: React.FC<AddSkillModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  onSuccess,
  initialData
}) => {
  const showToast = useToastStore((state) => state.showToast);
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<AddSkillInput>({
    resolver: zodResolver(AddSkillSchema),
    defaultValues: {
      category: 'Technical',
      proficiency_level: 'Intermediate'
    }
  });

  React.useEffect(() => {
    if (isOpen && initialData) {
       setValue('skill_name', initialData.skill_name);
       setValue('category', initialData.category || 'Technical');
       setValue('proficiency_level', (initialData.proficiency_level as AddSkillInput['proficiency_level']) || 'Intermediate'); 
       setValue('years_experience', initialData.years_experience || undefined);
    } else if (isOpen && !initialData) {
       reset({ category: 'Technical', proficiency_level: 'Intermediate' });
    }
  }, [isOpen, initialData, setValue, reset]);

  const mutation = useMutation({
    mutationFn: async (data: AddSkillInput) => {
      const cleanData: SkillData = {
        skill_name: data.skill_name,
        category: data.category || 'Technical',
        proficiency_level: data.proficiency_level,
      };

      if (isEditMode && initialData?.id) {
         await employeeApi.updateEmployeeSkill(employeeId, initialData.id, cleanData);
      } else {
         await employeeApi.addEmployeeSkill(employeeId, cleanData);
      }
    },
    onSuccess: () => {
      showToast(isEditMode ? 'Skill updated successfully' : 'Skill added successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['employee', String(employeeId)] });
      reset();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      console.error('Failed to save skill', error);
      const err = error as ApiError;
      showToast(err.response?.data?.message || err.message || 'Failed to save skill', 'error');
    }
  });

  const onSubmit = (data: AddSkillInput) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{isEditMode ? 'Edit Skill' : 'Add Skill'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Skill Name <span className="text-red-400">*</span></label>
            <input 
              {...register('skill_name')}
              className={`w-full px-3 py-2 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 ${errors.skill_name ? 'border-red-500' : ''}`}
              placeholder="e.g. React, Project Management"
              autoFocus
            />
            {errors.skill_name && <p className="text-[10px] text-red-500 mt-1">{errors.skill_name.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Proficiency Level</label>
            <select 
              {...register('proficiency_level')}
              className="w-full px-3 py-2 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900"
            >
              {SKILL_PROFICIENCY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Years of Experience</label>
            <input 
              type="number"
              step="0.1"
              {...register('years_experience')}
              className="w-full px-3 py-2 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900"
              placeholder="e.g. 2.5"
            />
          </div>

          <div className="pt-4 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
               Cancel
             </button>
             <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
               {mutation.isPending ? <Loader className="animate-spin" size={16} /> : 'Add Skill'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSkillModal;
