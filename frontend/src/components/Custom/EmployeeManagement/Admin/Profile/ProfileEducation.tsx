import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Combobox from '@/components/Custom/Combobox';
import { AddEducationSchema, AddEducationInput } from '@/schemas/employeeSchema';
// @ts-ignore
import { addEmployeeEducation, deleteEmployeeEducation } from '@api/employeeApi';

interface Education {
  id: number;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  type: string;
}

interface Profile {
  id: number;
  education?: Education[];
}

interface ProfileEducationProps {
  profile: Profile;
  onUpdate: () => void;
}

const ProfileEducation: React.FC<ProfileEducationProps> = ({ profile, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<AddEducationInput>({
    resolver: zodResolver(AddEducationSchema),
    defaultValues: {
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      type: 'Education',
    },
  });

  const isCurrent = watch('isCurrent');

  const onFormSubmit = async (data: AddEducationInput) => {
    try {
      await addEmployeeEducation(profile.id, data);
      setIsAdding(false);
      reset();
      onUpdate();
    } catch (err) {
      // Error handled silently
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Remove this record?")) {
      try {
        await deleteEmployeeEducation(profile.id, id);
        onUpdate();
      } catch (err) {
        // Error handled silently
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider">Education & Certifications</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-black uppercase border border-gray-300 shadow-sm hover:bg-gray-300 transition-all"
        >
          <Plus size={14} />
          <span>Add Record</span>
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="bg-[#F8F9FA] p-4 rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Institution / Issuer</label>
              <input
                type="text"
                {...register('institution')}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none"
              />
              {errors.institution && <p className="text-red-500 text-xs mt-1">{errors.institution.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Degree / Certificate Name</label>
              <input
                type="text"
                {...register('degree')}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Field of Study</label>
              <input
                type="text"
                {...register('fieldOfStudy')}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Start Date</label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">End Date</label>
              <input
                type="date"
                {...register('endDate')}
                disabled={isCurrent}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none disabled:bg-gray-100"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isCurrent')}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-gray-500"
                />
                <span className="text-xs font-bold text-gray-700 uppercase">Currently studying here</span>
              </label>
              <div className="flex-grow relative z-[50]">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Type</label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={[
                        { value: 'Education', label: 'Education' },
                        { value: 'Certification', label: 'Certification' },
                        { value: 'Training', label: 'Training' }
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select Type"
                      buttonClassName="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none bg-white font-bold h-[34px]"
                    />
                  )}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => { setIsAdding(false); reset(); }}
              className="px-3 py-1.5 text-[10px] font-black uppercase text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-gray-900 text-white rounded text-[10px] font-black uppercase shadow-sm hover:bg-gray-800"
            >
              Save Record
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-gray-100">
        {profile.education && profile.education.length > 0 ? (
          profile.education.map((edu) => (
            <div 
              key={edu.id}
              className="py-4 flex justify-between items-start group hover:bg-[#F8F9FA] px-4 -mx-4 rounded-xl transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{edu.institution}</h3>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      edu.type === 'Certification' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {edu.type}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-600">{edu.degree}</p>
                  {edu.fieldOfStudy && (
                    <p className="text-[10px] text-gray-400 font-semibold">{edu.fieldOfStudy}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    <span>
                      {edu.startDate ? new Date(edu.startDate).getFullYear() : 'N/A'} - 
                      {edu.isCurrent ? 'Present' : (edu.endDate ? new Date(edu.endDate).getFullYear() : 'N/A')}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(edu.id)}
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
            No education records found
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileEducation;
