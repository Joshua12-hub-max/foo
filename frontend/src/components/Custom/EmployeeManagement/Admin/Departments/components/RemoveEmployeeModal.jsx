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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Remove Employee</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} /> {/* Ensure X is imported if not already, or use simpler SVG */}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-4">
             <div className="flex gap-3">
               <div className="bg-amber-100 p-2 rounded-full h-fit">
                 <AlertTriangle className="text-amber-600" size={20} />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-amber-800 mb-1">Warning</h4>
                  <p className="text-sm text-amber-700">
                    Are you sure you want to remove <strong>{employee.first_name} {employee.last_name}</strong> from this department?
                  </p>
               </div>
             </div>
          </div>
          <p className="text-gray-500 text-sm pl-1">
             This will unassign them from the department but will not delete their account.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(employee.id)}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-all shadow-md disabled:opacity-50"
          >
            {isProcessing ? 'Removing...' : 'Confirm Removal'}
          </button>
        </div>
      </div>
    </div>
  );
});

RemoveEmployeeModal.displayName = 'RemoveEmployeeModal';

export default RemoveEmployeeModal;
