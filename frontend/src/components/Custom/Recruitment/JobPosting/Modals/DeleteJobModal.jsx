import { X, Trash2 } from 'lucide-react';

const DeleteJobModal = ({ isOpen, onClose, selectedJob, handleDelete, saving }) => {
  if (!isOpen || !selectedJob) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Clean Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Delete Job</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Are you sure you want to delete <strong className="text-gray-900">"{selectedJob.title}"</strong>? This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete}
              className="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                <>
                    <Trash2 size={16} /> Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteJobModal;
