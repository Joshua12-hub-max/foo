import { X, FileText, Paperclip, Download } from 'lucide-react';

export const UndertimeDetailsModal = ({ isOpen, onClose, request }) => {
  if (!isOpen || !request) return null;

  const handleDownloadAttachment = () => {
    if (!request.attachment_path) return;
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const BASE_URL = API_URL.replace('/api', '');
    const attachmentUrl = `${BASE_URL}/uploads/${request.attachment_path}`;
    
    window.open(attachmentUrl, '_blank');
  };

  // Get filename from attachment path
  const getFileName = () => {
    if (!request.attachment_path) return 'No document attached';
    const fileName = request.attachment_path.split('/').pop();
    return fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 ">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-200 shadow-md px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Undertime Request Details</h2>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
          >
            <X size={20} className="text-red-800" />
          </button>
        </div>

        {/* Body - Supporting Document Section Only */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Paperclip size={16} className="text-gray-600" />
            Supporting Document
          </h3>
          
          {/* Document Card */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-400">
                <FileText size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate" title={request.attachment_path?.split('/').pop()}>
                  {getFileName()}
                </p>
                <p className="text-xs text-red-500 font-medium">
                  {request.attachment_path ? 'PDF' : 'No file'}
                </p>
              </div>
            </div>
            
            {/* Centered Download Button */}
            {request.attachment_path && (
              <button
                onClick={handleDownloadAttachment}
                className="w-full py-2 text-sm font-medium text-gray-700 bg-[#F8F9F9A] border border-gray-300 rounded-lg shadow-md flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download
              </button>
            )}
          </div>
        </div>

        {/* Footer - Only Close button */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-sm font-medium text-gray-600 rounded-lg shadow-md hover:text-red-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UndertimeDetailsModal;
