import React, { useState, useRef } from 'react';
import { FileText, Download, Trash2, Plus, Loader2, FileCode, FileType, User as LucideUser, Briefcase, Shield, Eye, UploadCloud } from 'lucide-react';
import { EmployeeDocument } from '../types';
import { employeeApi } from '@/api/employeeApi';
import { toast } from 'react-hot-toast';

import { requestDownloadToken } from '@/Service/Auth';

interface DocumentGalleryProps {
  employeeId: number;
  documents: EmployeeDocument[];
  onDocumentChange: () => void;
}

const DocumentGallery: React.FC<DocumentGalleryProps> = ({ employeeId, documents, onDocumentChange }) => {
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Securely open URLs using a short-lived token
  const handleOpenSecureUrl = async (url: string | null) => {
      if (!url) return;
      try {
          const token = await requestDownloadToken();
          const separator = url.includes('?') ? '&' : '?';
          const secureUrl = token ? `${url}${separator}token=${token}` : url;
          window.open(secureUrl, '_blank');
      } catch (err) {
          window.open(url, '_blank');
      }
  };

  const docSlots = [
    { type: 'Personal Data Sheet (PDS)', label: 'Personal Data Sheet (PDS)', required: 'REQUIRED PDF', accept: '.pdf', icon: <FileText size={14} /> },
    { type: '2x2 ID Photo', label: '2x2 ID Photo', required: 'REQUIRED JPG/PNG', accept: 'image/png, image/jpeg', icon: <LucideUser size={14} /> },
    { type: 'Resume', label: 'Resume / CV', required: 'REQUIRED PDF/DOCX', accept: '.pdf,.doc,.docx', icon: <Briefcase size={14} /> },
    { type: 'Eligibility Certificate', label: 'Eligibility Cert.', required: 'REQUIRED PDF', accept: '.pdf', icon: <Shield size={14} /> },
  ];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingType(type);
    try {
      const res = await employeeApi.uploadEmployeeDocument(employeeId, file, type);
      if (res.success) {
        toast.success(`${type} uploaded successfully`);
        onDocumentChange();
      } else {
        toast.error(res.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload document');
    } finally {
      setUploadingType(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (docId: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    setDeletingId(docId);
    try {
      const res = await employeeApi.deleteEmployeeDocument(employeeId, docId);
      if (res.success) {
        toast.success('Document deleted');
        onDocumentChange();
      } else {
        toast.error(res.message || 'Delete failed');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const findDoc = (type: string) => documents.find(d => d.documentType === type);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {docSlots.map((slot) => {
        const doc = findDoc(slot.type);
        const isUploading = uploadingType === slot.type;
        const isDeleting = deletingId === doc?.id;

        return (
          <div key={slot.type} className="flex flex-col space-y-1 group">
            <label className="text-[10px] font-bold text-slate-400 tracking-widest flex items-center gap-1 px-1">
               {slot.label} 
               <span className="text-red-500">*</span>
            </label>
            
            <div className={`relative flex items-center gap-3 p-2 rounded-lg border transition-all duration-200 min-h-[50px] ${
              doc 
              ? 'bg-slate-50 border-slate-200' 
              : 'bg-white border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'
            }`}>
              
              {/* Icon/Preview */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${
                doc ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
              }`}>
                {isUploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : doc ? (
                  doc.mimeType?.includes('image') ? (
                     <img 
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${doc.filePath}`} 
                        alt={slot.label}
                        className="w-full h-full object-cover rounded-md"
                      />
                  ) : (
                     <FileText size={16} />
                  )
                ) : (
                  <UploadCloud size={16} />
                )}
              </div>

              {/* Filename / Info */}
              <div className="flex-grow min-w-0">
                {doc ? (
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 truncate pr-2">
                      {doc.fileName}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">
                      {new Date(doc.uploadedAt || '').toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-slate-300 italic">
                    {isUploading ? 'Uploading...' : 'Empty'}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {doc ? (
                  <>
                    <button 
                      onClick={() => handleOpenSecureUrl(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${doc.filePath}`)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-md transition-all cursor-pointer"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={isDeleting}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-md transition-all"
                    >
                      {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </>
                ) : (
                  <label className="cursor-pointer">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept={slot.accept}
                      onChange={(e) => handleUpload(e, slot.type)}
                      disabled={!!uploadingType}
                    />
                    <div className="px-2 py-1 bg-slate-800 text-white text-[9px] font-black rounded-md hover:bg-slate-700 transition-all tracking-tighter">
                      Upload
                    </div>
                  </label>
                )}
              </div>

              {/* Overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-lg flex items-center justify-center z-10">
                   <Loader2 size={14} className="animate-spin text-blue-600" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DocumentGallery;
