import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PerformanceItem } from '../../types';

interface EditCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: PerformanceItem | null;
}

interface FormDataState {
  section: string;
  category: string;
  title: string;
  description: string;
  weight: string | number;
  max_score: string | number;
}

const EditCriteriaModal: React.FC<EditCriteriaModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<FormDataState>({
    section: 'Performance',
    category: 'Strategic Priorities',
    title: '',
    description: '',
    weight: '',
    max_score: 5
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        section: (initialData.section as string) || 'Performance',
        category: initialData.category || 'Strategic Priorities',
        title: initialData.title || initialData.criteria_title || '',
        description: initialData.description || initialData.criteria_description || '',
        weight: initialData.weight || '',
        max_score: initialData.max_score || 5
      });
    } else {
      setFormData({
        section: 'Performance',
        category: 'Strategic Priorities',
        title: '',
        description: '',
        weight: '',
        max_score: 5
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      onSubmit({
        ...formData,
        weight: parseFloat(formData.weight.toString()),
        max_score: parseInt(formData.max_score.toString())
      });
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
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Title (MFO / PAP) */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Title (MFO / PAP)
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Strategic Planning"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-gray-900"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Category
              </label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all appearance-none text-gray-900 cursor-pointer"
                >
                  <option value="Strategic Priorities">Strategic Priorities</option>
                  <option value="Core Functions">Core Functions</option>
                  <option value="Support Functions">Support Functions</option>
                  <option value="General">General</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                </div>
              </div>
            </div>
            
            {/* Success Indicators */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Success Indicators
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-gray-900"
                  />
                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 text-xs font-bold">
                    %
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Max Score
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.max_score}
                  onChange={(e) => setFormData({...formData, max_score: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-gray-900"
                />
              </div>
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
