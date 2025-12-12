import React from 'react';
import { X, FileText, Paperclip, Download, Calendar, User, Briefcase, Clock } from 'lucide-react';
import { generateUndertimeRequestPDF } from '../../../../../utils/pdfGenerator';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-200 shadow-md px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Undertime Request Details</h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Attachment Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Paperclip size={14} className="text-[#274b46]" />
              Supporting Document
            </h3>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 shrink-0">
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
                  className="w-full mt-3 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={14} />
                  Download
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeUndertimeDetailsModal;
