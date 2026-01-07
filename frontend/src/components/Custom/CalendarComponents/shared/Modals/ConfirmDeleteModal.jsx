import { Trash2 } from 'lucide-react'

const ConfirmDeleteModal = ({ show, title, message, onConfirm, onCancel, isDeleting }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl w-full max-w-sm border border-gray-100 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className="h-14 w-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 ring-4 ring-red-50/50">
            <Trash2 className="w-6 h-6" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title || 'Confirm Deletion'}</h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            {message || 'Are you sure you want to delete this item?\nThis action cannot be undone.'}
          </p>

          <div className="flex gap-3">
             <button
               onClick={onCancel}
               disabled={isDeleting}
               className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm text-sm"
             >
               Cancel
             </button>
             <button
               onClick={onConfirm}
               disabled={isDeleting}
               className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-lg shadow-red-900/20 transition-all text-sm"
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