import React, { useState, useRef } from 'react';
import { FileText, Download, Trash2, Plus, Loader2, FileCode, FileType, User as LucideUser, Briefcase, Shield, Eye, UploadCloud, RotateCcw, Link } from 'lucide-react';
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
  const [isSyncing, setIsSyncing] = useState(false);

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

  const handleSyncFromRecruitment = async () => {
    if (!window.confirm('This will fetch all documents from your job application and link them here. Existing duplicates will be cleared. Continue?')) return;
    
    setIsSyncing(true);
    const toastId = toast.loading('Synchronizing documentation...');
    try {
      const res = await employeeApi.syncEmployeeDocumentsFromRecruitment(employeeId);
      if (res.success) {
        toast.success(res.message || 'Synchronization successful', { id: toastId });
        onDocumentChange();
      } else {
        toast.error(res.message || 'No documents found to synchronize', { id: toastId });
      }
    } catch (err) {
      console.error('Sync error:', err);
      toast.error('Synchronization protocol failed', { id: toastId });
    } finally {
      setIsSyncing(false);
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
  
  // 100% DATA VISIBILITY: Identify documents that don't fit into the primary slots
  const primaryTypes = docSlots.map(s => s.type);
  const otherDocs = documents.filter(d => !primaryTypes.includes(d.documentType));

  return (
    <div className="space-y-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 w-full">
        {docSlots.map((slot) => {
          const doc = findDoc(slot.type);
          const isUploading = uploadingType === slot.type;
          const isDeleting = deletingId === doc?.id;

          return (
            <div key={slot.type} className="flex flex-col space-y-1 group">
              <label className="text-[10px] font-black text-slate-400 tracking-widest flex items-center gap-1 px-1 uppercase">
                 {slot.label} 
                 <span className="text-red-500">*</span>
              </label>
              
              <div className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 min-h-[60px] ${
                doc 
                ? 'bg-white border-[var(--zed-border-light)] shadow-sm' 
                : 'bg-slate-50/50 border-dashed border-slate-300 hover:border-[var(--zed-primary)] hover:bg-blue-50/30'
              }`}>
                
                {/* Icon/Preview */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center ${
                  doc ? 'bg-blue-50 text-[var(--zed-primary)]' : 'bg-slate-100 text-slate-400'
                }`}>
                  {isUploading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : doc ? (
                    doc.mimeType?.includes('image') ? (
                       <img 
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${doc.filePath}`} 
                          alt={slot.label}
                          className="w-full h-full object-cover rounded-md"
                        />
                    ) : (
                       <FileText size={20} />
                    )
                  ) : (
                    <UploadCloud size={18} />
                  )}
                </div>

                {/* Filename / Info */}
                <div className="flex-grow min-w-0">
                  {doc ? (
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-700 truncate pr-2 uppercase tracking-tight">
                        {doc.fileName || 'Untitled Document'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        {new Date((doc as any).createdAt || doc.uploadedAt || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-300 italic uppercase">
                      {isUploading ? 'Syncing...' : 'Not Linked'}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {doc ? (
                    <>
                      <button 
                        onClick={() => handleOpenSecureUrl(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${doc.filePath}`)}
                        className="p-2 text-slate-400 hover:text-[var(--zed-primary)] hover:bg-slate-50 rounded-md transition-all cursor-pointer"
                        title="View Document"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={isDeleting}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                        title="Remove"
                      >
                        {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
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
                      <div className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-md hover:bg-black transition-all tracking-widest uppercase shadow-md">
                        Upload
                      </div>
                    </label>
                  )}
                </div>

                {/* Overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-lg flex items-center justify-center z-10">
                     <Loader2 size={16} className="animate-spin text-blue-600" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Documents Section */}
      {otherDocs.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h4 className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
            <Plus size={12} /> Additional Attachments
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg border border-slate-200">
                <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                  <FileCode size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-700 truncate uppercase">{doc.fileName}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{doc.documentType}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenSecureUrl(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${doc.filePath}`)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 transition-all"
                  >
                    <Eye size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 100% DATA SYNC OVERRIDE */}
      <div className="mt-10 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
            <RotateCcw size={24} className={isSyncing ? 'animate-spin' : ''} />
          </div>
          <div>
            <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Missing Application Documents?</h4>
            <p className="text-xs text-blue-700/70 font-medium">Force a deep synchronization between your job application and your current profile.</p>
          </div>
        </div>
        <button
          onClick={handleSyncFromRecruitment}
          disabled={isSyncing}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center gap-3"
        >
          {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Link size={14} />}
          Synchronize Protocol
        </button>
      </div>
    </div>
  );
};

export default DocumentGallery;
