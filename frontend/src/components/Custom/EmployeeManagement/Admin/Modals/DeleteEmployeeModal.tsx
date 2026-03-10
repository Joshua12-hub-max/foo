import React from 'react';
import { X, Loader } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '@/api/employeeApi';
import { useToastStore } from '@/stores';

interface Employee {
  id: number | string;
  firstName?: string;
  lastName?: string;
}

interface DeleteEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSuccess?: () => void; 
}

const DeleteEmployeeModal: React.FC<DeleteEmployeeModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSuccess
}) => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      await employeeApi.deleteEmployee(id);
    },
    onSuccess: () => {
      showToast('Employee deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      // Also invalidate stats or other related queries if necessary
      onClose();
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Failed to delete employee:', error);
      showToast(error.message || 'Failed to delete employee', 'error');
    }
  });

  const handleDelete = () => {
    if (employee) {
      deleteMutation.mutate(employee.id);
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Clean Header */}
        <div className="flex justify-between items-center px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Delete Employee</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
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
                <h4 className="text-sm font-bold text-red-800 mb-1">Confirm Deletion</h4>
                <p className="text-sm text-red-700">
                  Are you sure you want to delete <strong>{employee.firstName} {employee.lastName}</strong>?
                </p>
              </div>
            </div>
          </div>
          <p className="text-gray-500 text-sm pl-1">This action cannot be undone and will remove all associated records.</p>
        </div>
        
        {/* Footer Actions */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button 
            onClick={onClose} 
            className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleDelete} 
            disabled={deleteMutation.isPending} 
            className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {deleteMutation.isPending && <Loader className="animate-spin" size={16} />}
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Employee'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteEmployeeModal;
