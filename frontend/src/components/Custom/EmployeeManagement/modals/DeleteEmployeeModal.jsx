import { X } from 'lucide-react';

/**
 * Delete Employee Modal Component
 * Confirmation dialog for employee deletion with warning message
 */
const DeleteEmployeeModal = ({
  isOpen,
  onClose,
  employee,
  onConfirm,
  isProcessing
}) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-sm shadow-xl mt-16 border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Delete Employee</h2>
          <button onClick={onClose} className="text-red-500 hover:text-red-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-sm">
            Are you sure you want to delete <strong>{employee.first_name} {employee.last_name}</strong>?
          </p>
          <p className="text-gray-400 text-xs mt-2">This action cannot be undone.</p>
        </div>
        
        {/* Footer Buttons */}
        <div className="flex gap-3 px-6 pb-6">
          <button 
            onClick={onClose} 
            className="flex-1 px-4 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isProcessing} 
            className="flex-1 px-4 py-2.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteEmployeeModal;
