import React, { memo } from 'react';
import { X, Loader } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteDepartment } from '@/api/departmentApi';
import axios from 'axios';
import { useToastStore } from '@/stores';

interface Department {
  id: number;
  name: string;
}

interface DepartmentDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  department?: Department;
  onSuccess?: () => void;
}

const DepartmentDeleteModal: React.FC<DepartmentDeleteModalProps> = memo(({ isOpen, onClose, department, onSuccess }) => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await deleteDepartment(id);
    },
    onSuccess: () => {
        showToast('Department deleted successfully', 'success');
        queryClient.invalidateQueries({ queryKey: ['departments'] });
        onClose();
        if (onSuccess) onSuccess();
    },
    onError: (error: unknown) => {
        console.error('Failed to delete department', error);
        const errorMessage = axios.isAxiosError(error) 
            ? error.response?.data?.message || error.message 
            : 'Failed to delete department';
        showToast(errorMessage, 'error');
    }
  });

  const handleDelete = () => {
    if (department) {
        deleteMutation.mutate(department.id);
    }
  };

  if (!isOpen || !department) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Confirm Delete</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <div className="bg-red-100 p-2 rounded-full h-fit">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-800 mb-1">Warning</h4>
                <p className="text-sm text-red-700">
                  Are you sure you want to delete <strong>{department.name}</strong>?
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 pl-1">This action cannot be undone and may affect assigned employees.</p>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleteMutation.isPending && <Loader className="animate-spin" size={16} />}
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Department'}
          </button>
        </div>
      </div>
    </div>
  );
});

DepartmentDeleteModal.displayName = 'DepartmentDeleteModal';

export default DepartmentDeleteModal;
