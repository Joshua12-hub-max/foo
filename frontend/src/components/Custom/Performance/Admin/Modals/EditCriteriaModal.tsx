import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { performanceCriteriaSchema, PerformanceCriteriaSchema } from '@/schemas/performanceSchema';
import { PerformanceItem } from '../../types';
import Combobox from '@/components/Custom/Combobox';

interface EditCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PerformanceCriteriaSchema) => void;
  initialData?: PerformanceItem | null;
}

const categoryOptions = [
  { value: 'Strategic Priorities', label: 'Strategic Priorities' },
  { value: 'Core Functions', label: 'Core Functions' },
  { value: 'Support Functions', label: 'Support Functions' },
  { value: 'General', label: 'General' },
];

const criteriaTypeOptions = [
  { value: 'core_function', label: 'Core Function' },
  { value: 'support_function', label: 'Support Function' },
  { value: 'core_competency', label: 'Core Competency' },
  { value: 'organizational_competency', label: 'Organizational Competency' },
];

const EditCriteriaModal: React.FC<EditCriteriaModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<PerformanceCriteriaSchema>({
    resolver: zodResolver(performanceCriteriaSchema),
    defaultValues: {
      section: 'Performance',
      category: 'Strategic Priorities',
      criteriaType: 'core_function',
      title: '',
      description: '',
      weight: 0,
      maxScore: 5,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        section: (initialData.section as any) || 'Performance',
        category: (initialData.category as any) || 'General',
        criteriaType: (initialData.criteriaType as any) || 'core_function',
        title: initialData.title || initialData.criteriaTitle || '',
        description: initialData.description || initialData.criteriaDescription || '',
        weight: Number(initialData.weight) || 0,
        maxScore: Number(initialData.maxScore) || 5,
        // Rating Matrix
        ratingDefinition5: initialData.ratingDefinition5 || '',
        ratingDefinition4: initialData.ratingDefinition4 || '',
        ratingDefinition3: initialData.ratingDefinition3 || '',
        ratingDefinition2: initialData.ratingDefinition2 || '',
        ratingDefinition1: initialData.ratingDefinition1 || '',
        evidenceRequirements: initialData.evidenceRequirements || '',
      });
    } else {
      reset({
        section: 'Performance',
        category: 'Strategic Priorities',
        criteriaType: 'core_function',
        title: '',
        description: '',
        weight: 0,
        maxScore: 5,
      });
    }
  }, [initialData, isOpen, reset]);

  const onFormSubmit = (data: PerformanceCriteriaSchema) => {
    try {
      onSubmit(data);
    } catch (error) {
      console.error('Error submitting criteria:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl w-full max-w-md border border-gray-100 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 shrink-0 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">
            {initialData ? 'Edit Criteria' : 'Add Criteria'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit((data) => onFormSubmit(data))} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Title (MFO / PAP) */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Title (MFO / PAP)
              </label>
              <input
                type="text"
                {...register('title')}
                placeholder="e.g. Strategic Planning"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-gray-900"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Category
              </label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={categoryOptions}
                    value={field.value || 'General'}
                    onChange={field.onChange}
                    placeholder="Select Category"
                    className="w-full"
                    buttonClassName="bg-white border-gray-200"
                  />
                )}
              />
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>

            {/* Criteria Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Criteria Type (DB Mapping)
              </label>
              <Controller
                name="criteriaType"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={criteriaTypeOptions}
                    value={field.value || 'core_function'}
                    onChange={field.onChange}
                    placeholder="Select Criteria Type"
                    className="w-full"
                    buttonClassName="bg-white border-gray-200"
                  />
                )}
              />
              {errors.criteriaType && <p className="text-red-500 text-xs mt-1">{errors.criteriaType.message}</p>}
            </div>
            
            {/* Success Indicators */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Success Indicators
              </label>
              <textarea
                rows={4}
                {...register('description')}
                placeholder="e.g. 100% of plans submitted on time..."
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all resize-none text-gray-900"
              />
            </div>
            
            {/* Weight & Max Score Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Weight (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    {...register('weight', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-gray-900"
                  />
                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 text-xs font-bold">
                    %
                  </div>
                </div>
                {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Max Score
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  {...register('maxScore', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-gray-900"
                />
                {errors.maxScore && <p className="text-red-500 text-xs mt-1">{errors.maxScore.message}</p>}
              </div>
            </div>

            {/* Evidence Requirements */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Evidence Requirements (Means of Verification)
              </label>
              <textarea
                rows={2}
                {...register('evidenceRequirements')}
                placeholder="e.g. Scanned logbook, Photo of event..."
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all resize-none text-gray-900"
              />
            </div>

            {/* Rating Matrix Definitions */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-900">Rating Matrix Definitions</h4>
                
                {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="grid grid-cols-[30px_1fr] gap-3 items-start">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-1.5 ${
                            rating === 5 ? 'bg-green-100 text-green-700' :
                            rating === 4 ? 'bg-blue-100 text-blue-700' :
                            rating === 3 ? 'bg-gray-100 text-gray-700' :
                            rating === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                            {rating}
                        </div>
                        <div>
                             <textarea
                                rows={2}
                                {...register(`ratingDefinition${rating}` as keyof PerformanceCriteriaSchema)}
                                placeholder={`Definition for Rating ${rating}...`}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 transition-all resize-none text-gray-900"
                              />
                        </div>
                    </div>
                ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors text-sm shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all text-sm shadow-lg shadow-gray-900/20"
            >
              {initialData ? 'Save Changes' : 'Add Criteria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCriteriaModal;
