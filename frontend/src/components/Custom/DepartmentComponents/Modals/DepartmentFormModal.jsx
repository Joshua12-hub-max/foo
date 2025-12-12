import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DepartmentFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    head_of_department: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        head_of_department: initialData.head_of_department || ''
      });
    } else {
      setFormData({ name: '', description: '', head_of_department: '' });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(formData);
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gray-200 px-4 py-3 flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-800">
              {initialData ? 'Edit Department' : 'Add Department'}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-300 rounded transition-colors text-gray-600">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Department Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-300 outline-none"
                placeholder="e.g. Human Resources"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-300 outline-none resize-none h-16"
                placeholder="Brief description..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Head of Department</label>
              <input
                type="text"
                value={formData.head_of_department}
                onChange={(e) => setFormData({...formData, head_of_department: e.target.value})}
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-300 outline-none"
                placeholder="e.g. John Doe"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 py-2 bg-gray-200 rounded text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 bg-gray-200 rounded text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DepartmentFormModal;
