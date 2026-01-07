import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ToastNotification, useNotification } from '@/components/Custom/EmployeeManagement/Admin';

const EditAssessmentModal = ({ isOpen, onClose, onSubmit, initialData, title }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const { notification, showNotification } = useNotification();

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || ''
      });
    } else {
      setFormData({
        title: '',
        description: ''
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotification('Title is required', 'error');
      return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <ToastNotification notification={notification} />
      <div 
        className="bg-white rounded-xl w-full max-w-md border border-gray-100 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 shrink-0 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">
            {title || (initialData ? 'Edit Assessment' : 'Add Assessment')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Assessment Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. STRENGTHS, AREAS FOR IMPROVEMENT"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Description / Placeholder
              </label>
              <textarea
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter placeholder text shown to the user..."
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all resize-none text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
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
              {initialData ? 'Save Changes' : 'Add Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAssessmentModal;
