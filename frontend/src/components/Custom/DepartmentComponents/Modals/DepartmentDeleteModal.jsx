/**
 * DepartmentDeleteModal Component
 * Delete confirmation modal for Departments - matches timekeeping design
 */

import { memo } from 'react';
import { X } from 'lucide-react';

const DepartmentDeleteModal = memo(({ isOpen, onClose, onConfirm, department, isDeleting }) => {
  if (!isOpen || !department) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">Confirm Delete</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-300 rounded transition-colors text-gray-600 hover:text-red-800"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{department.name}</strong>?
          </p>
          <p className="text-sm text-gray-400 mt-1">This action cannot be undone.</p>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
});

DepartmentDeleteModal.displayName = 'DepartmentDeleteModal';

export default DepartmentDeleteModal;
