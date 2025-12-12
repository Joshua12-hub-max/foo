import{ X } from 'lucide-react'

const ConfirmDeleteModal = ({ show, title, message, onConfirm, onCancel, isDeleting }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-[#F8F9FA] rounded-md w-full max-w-md border border-gray-200 overflow-hidden">
        <div className="bg-gray-200 px-4 py-4 shadow-md">
           <div className="flex items-center justify-between">
             <h2 className="text-lg font-bold text-gray-900">{title || 'Confirm Deletion'}</h2>
             <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              <X className="w-5 h-5 text-red-800" />
            </button>
           </div>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6">
            {message || 'Are you sure you want to delete this item? This action cannot be undone.'}
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-6 py-1 bg-gray-200 text-gray-700 rounded-md shadow-md hover:text-red-600 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;