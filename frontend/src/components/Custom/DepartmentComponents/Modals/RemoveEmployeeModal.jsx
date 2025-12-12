/**
 * RemoveEmployeeModal Component
 * Confirmation modal for removing employee from department
 */

import React, { memo } from 'react';
import { AlertTriangle } from 'lucide-react';

const RemoveEmployeeModal = memo(({ 
  isOpen, 
  onClose, 
  onConfirm, 
  employee, 
  isProcessing 
}) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Remove Employee</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to remove <strong>{employee.first_name} {employee.last_name}</strong> from this department? This will unassign them from the department but will not delete their account.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(employee.id)}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isProcessing ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
});

RemoveEmployeeModal.displayName = 'RemoveEmployeeModal';

export default RemoveEmployeeModal;
