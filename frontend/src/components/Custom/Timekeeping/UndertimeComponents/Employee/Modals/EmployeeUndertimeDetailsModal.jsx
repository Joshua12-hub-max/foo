import React from 'react';
import { X, FileText, Paperclip, Download, Calendar, User, Briefcase, Clock } from 'lucide-react';
import { generateUndertimeRequestPDF } from '@utils/pdfGenerator';

export const EmployeeUndertimeDetailsModal = ({ isOpen, onClose, request, employeeInfo }) => {
  if (!isOpen || !request) return null;

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleDownloadPDF = () => {
    const requestData = {
      id: request.id,
      employeeName: employeeInfo?.name || request.employeeName || 'N/A',
      employee_id: employeeInfo?.id || request.employee_id || 'N/A',
      department: employeeInfo?.department || request.department || 'N/A',
      date: request.date,
      timeOut: request.timeOut,
      status: request.status,
      reason: request.reason,
      approved_by: request.reviewedBy,
      reviewed_at: request.reviewedAt,
      rejection_reason: request.rejectionReason
    };
    generateUndertimeRequestPDF(requestData);
  };

  const handleDownloadAttachment = () => {
    if (!request.attachment_path) return;
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const BASE_URL = API_URL.replace('/api', '');
    const attachmentUrl = `${BASE_URL}/uploads/${request.attachment_path}`;
    
    window.open(attachmentUrl, '_blank');
  };

  // Extract just the filename from path
  const getFileName = () => {
    if (!request.attachment_path) return 'No document attached';
    const fileName = request.attachment_path.split('/').pop();
    return fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Undertime Request Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Attachment Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Paperclip size={16} className="text-gray-600" />
              Supporting Document
            </h3>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 shrink-0 shadow-sm">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate" title={request.attachment_path?.split('/').pop()}>
                    {getFileName()}
                  </p>
                  <p className="text-xs text-red-500 font-medium">
                    {request.attachment_path ? 'PDF' : 'No file'}
                  </p>
                </div>
              </div>
              {request.attachment_path && (
                <button
                  onClick={handleDownloadAttachment}
                  className="w-full mt-4 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download size={16} />
                  Download
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeUndertimeDetailsModal;
