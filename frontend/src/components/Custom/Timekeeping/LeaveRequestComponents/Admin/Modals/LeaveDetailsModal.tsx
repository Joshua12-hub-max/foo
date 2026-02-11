import React from 'react';
import { X, FileText, Paperclip, Download } from 'lucide-react';
import { AdminLeaveRequest } from '@/components/Custom/Timekeeping/LeaveRequestComponents/Admin/types';

interface LeaveDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveRequest: AdminLeaveRequest | null;
  onApprove?: () => void; // Added based on Table.tsx usage
  onReject?: () => void;  // Added based on Table.tsx usage
}

const LeaveDetailsModal: React.FC<LeaveDetailsModalProps> = ({ isOpen, onClose, leaveRequest }) => {
  const [hasDownloaded, setHasDownloaded] = React.useState(false);

  // Reset state when modal opens/closes or request changes
  React.useEffect(() => {
    if (isOpen) {
      setHasDownloaded(false);
    }
  }, [isOpen, leaveRequest]);

  if (!isOpen || !leaveRequest) return null;

  const handleDownloadAttachment = () => {
    if (!leaveRequest.attachment_path) return;
    
    const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
    const BASE_URL = API_URL.replace('/api', '');
    const attachmentUrl = `${BASE_URL}/uploads/${leaveRequest.attachment_path}`;
    
    window.open(attachmentUrl, '_blank');
    setHasDownloaded(true);
  };

  const canAction = leaveRequest.status === 'Pending';

  // Get filename from attachment path
  const getFileName = () => {
    if (!leaveRequest.attachment_path) return 'No document attached';
    const fileName = leaveRequest.attachment_path.split('/').pop() || '';
    return fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName;
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300" onClick={onClose}>
      <div 
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-md border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Leave Request Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Supporting Document Section Only */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Paperclip size={16} className="text-gray-600" />
            Supporting Document
          </h3>
          
          {/* Document Card */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-400 shadow-sm">
                <FileText size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate" title={leaveRequest.attachment_path?.split('/').pop()}>
                  {getFileName()}
                </p>
                <p className="text-xs text-red-500 font-medium">
                  {leaveRequest.attachment_path ? 'PDF' : 'No file'}
                </p>
              </div>
            </div>
            
            {/* Centered Download Button */}
            {leaveRequest.attachment_path && (
              <button
                onClick={handleDownloadAttachment}
                className="w-full py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Download size={16} />
                Download
              </button>
            )}
          </div>

          {!hasDownloaded && leaveRequest.attachment_path && canAction && (
            <p className="text-xs text-orange-600 mt-3 italic">
              * Please download and review the document before approving or rejecting
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="bg-white border border-gray-200 px-6 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveDetailsModal;
