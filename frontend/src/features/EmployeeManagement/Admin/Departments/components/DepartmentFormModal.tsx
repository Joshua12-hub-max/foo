import React, { useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { departmentSchema, DepartmentSchema } from '@/schemas/department';

interface DepartmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DepartmentSchema) => Promise<void>;
  initialData?: Partial<DepartmentSchema>;
}

const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<DepartmentSchema>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
      description: '',
      headOfDepartment: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
        reset({
            name: initialData?.name || '',
            description: initialData?.description || '',
            headOfDepartment: initialData?.headOfDepartment || ''
        });
    }
  }, [initialData, isOpen, reset]);

  const onFormSubmit: SubmitHandler<DepartmentSchema> = async (data) => {
    await onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">
              {initialData ? 'Edit Department' : 'Add Department'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit(onFormSubmit)}>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm focus:ring-2 focus:ring-gray-100 focus:border-gray-300 outline-none transition-all ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="e.g. Human Resources"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  {...register('description')}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-100 focus:border-gray-300 outline-none resize-none h-20 transition-all"
                  placeholder="Brief description..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Head of Department</label>
                <input
                  type="text"
                  {...register('headOfDepartment')}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-100 focus:border-gray-300 outline-none transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gray-900 rounded-lg text-sm font-bold text-white hover:bg-gray-800 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                    <>
                        <Loader className="animate-spin" size={16} /> Saving...
                    </>
                ) : 'Save Department'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DepartmentFormModal;
