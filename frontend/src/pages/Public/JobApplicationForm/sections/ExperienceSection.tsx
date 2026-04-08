import React from 'react';
import { UseFormRegister, FieldErrors, Control, useFieldArray } from 'react-hook-form';
import type { JobApplicationSchema } from '@/schemas/recruitment';

interface ExperienceSectionProps {
  register: UseFormRegister<JobApplicationSchema>;
  errors: FieldErrors<JobApplicationSchema>;
  control: Control<JobApplicationSchema>;
}

const ExperienceSection: React.FC<ExperienceSectionProps> = ({ register, errors, control }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'workExperiences',
  });

  const addExperience = () => {
    append({
      dateFrom: '',
      dateTo: '',
      positionTitle: '',
      companyName: '',
      monthlySalary: '',
      salaryGrade: '',
      appointmentStatus: '',
      isGovernment: false,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-widest flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          Work Experience
        </h3>
        <p className="text-xs text-slate-500 font-semibold mb-6">
          List your work experience (at least one required for Standard duty jobs)
        </p>
      </div>

      {fields.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-yellow-700 font-semibold">
            No work experience added yet. Click "Add Experience" to get started.
          </p>
        </div>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Experience #{index + 1}
            </h4>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-all"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                Date From <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register(`workExperiences.${index}.dateFrom`)}
                className={`w-full border ${errors.workExperiences?.[index]?.dateFrom ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-400'} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900`}
              />
              {errors.workExperiences?.[index]?.dateFrom && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {errors.workExperiences[index]?.dateFrom?.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                Date To (Leave blank if current)
              </label>
              <input
                type="date"
                {...register(`workExperiences.${index}.dateTo`)}
                className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                Position Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register(`workExperiences.${index}.positionTitle`)}
                className={`w-full border ${errors.workExperiences?.[index]?.positionTitle ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-400'} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
                placeholder="e.g. Software Engineer"
              />
              {errors.workExperiences?.[index]?.positionTitle && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {errors.workExperiences[index]?.positionTitle?.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register(`workExperiences.${index}.companyName`)}
                className={`w-full border ${errors.workExperiences?.[index]?.companyName ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-400'} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
                placeholder="e.g. ABC Corporation"
              />
              {errors.workExperiences?.[index]?.companyName && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {errors.workExperiences[index]?.companyName?.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                Monthly Salary
              </label>
              <input
                {...register(`workExperiences.${index}.monthlySalary`)}
                className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
                placeholder="e.g. 25000"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                Salary Grade
              </label>
              <input
                {...register(`workExperiences.${index}.salaryGrade`)}
                className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
                placeholder="e.g. SG-15"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                Appointment Status
              </label>
              <input
                {...register(`workExperiences.${index}.appointmentStatus`)}
                className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
                placeholder="e.g. Permanent"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register(`workExperiences.${index}.isGovernment`)}
                className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
              />
              <span className="text-xs font-semibold text-slate-700">Government Service</span>
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addExperience}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm font-bold text-gray-600 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all"
      >
        + Add Experience
      </button>

      {errors.workExperiences && typeof errors.workExperiences.message === 'string' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-700 font-semibold">
            {errors.workExperiences.message}
          </p>
        </div>
      )}
    </div>
  );
};

export default ExperienceSection;
