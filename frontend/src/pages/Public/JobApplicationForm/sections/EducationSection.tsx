import React, { useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { JobApplicationSchema } from '@/schemas/recruitment';

interface EducationSectionProps {
  register: UseFormRegister<JobApplicationSchema>;
  errors: FieldErrors<JobApplicationSchema>;
  setValue: UseFormSetValue<JobApplicationSchema>;
  watch: UseFormWatch<JobApplicationSchema>;
}

type EducationLevel = 'Elementary' | 'Secondary' | 'Vocational' | 'College' | 'Graduate';

const EducationSection: React.FC<EducationSectionProps> = ({ register, errors, setValue, watch }) => {
  const [activeTab, setActiveTab] = useState<EducationLevel>('Elementary');

  const educationLevels: EducationLevel[] = ['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate'];

  const renderEducationFields = (level: EducationLevel) => {
    const prefix = `education.${level}` as const;

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
            School Name
          </label>
          <input
            {...register(`${prefix}.school` as any)}
            className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
            placeholder="Enter school name"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
            Course/Degree
          </label>
          <input
            {...register(`${prefix}.course` as any)}
            className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
            placeholder={level === 'Elementary' || level === 'Secondary' ? 'Optional' : 'Enter course/degree'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
              From (Year)
            </label>
            <input
              type="number"
              {...register(`${prefix}.from` as any)}
              className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
              placeholder="e.g. 2015"
              min="1950"
              max={new Date().getFullYear()}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
              To (Year)
            </label>
            <input
              type="number"
              {...register(`${prefix}.to` as any)}
              className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
              placeholder="e.g. 2019"
              min="1950"
              max={new Date().getFullYear() + 10}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
              Units Earned (if not graduated)
            </label>
            <input
              {...register(`${prefix}.units` as any)}
              className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
              placeholder="e.g. 120 units"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
              Year Graduated
            </label>
            <input
              type="number"
              {...register(`${prefix}.yearGrad` as any)}
              className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
              placeholder="e.g. 2019"
              min="1950"
              max={new Date().getFullYear() + 10}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
            Honors/Awards Received
          </label>
          <input
            {...register(`${prefix}.honors` as any)}
            className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
            placeholder="e.g. Cum Laude, With Honors"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-widest flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
          Educational Background
        </h3>
        <p className="text-xs text-slate-500 font-semibold mb-6">
          Provide your educational history (at least one level required for Standard duty jobs)
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {educationLevels.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setActiveTab(level)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all whitespace-nowrap ${
                activeTab === level
                  ? 'bg-slate-500 text-white border-b-2 border-slate-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {renderEducationFields(activeTab)}
      </div>

      {errors.education && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-700 font-semibold">
            {errors.education.message as string}
          </p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-700 font-semibold">
          Note: For Standard duty jobs, at least one educational level must have a school name filled in.
        </p>
      </div>
    </div>
  );
};

export default EducationSection;
