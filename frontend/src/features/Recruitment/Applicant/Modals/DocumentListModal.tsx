import React, { useEffect, useState } from 'react';
import { X, FileText, BadgeCheck, ExternalLink, AlertCircle, ClipboardList, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Applicant } from '@/types/recruitment';
import { recruitmentApi } from '@/api/recruitmentApi';

interface DocumentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: Applicant | null;
}

interface DynamicDocument {
    id: number;
    documentName: string;
    documentType: string;
    filePath: string;
    downloadUrl: string;
    fileSizeKb?: string;
}

import { requestDownloadToken } from '@/Service/Auth';

const DocumentListModal: React.FC<DocumentListModalProps> = ({ isOpen, onClose, applicant }) => {
  const [dynamicDocs, setDynamicDocs] = useState<DynamicDocument[]>([]);
  const [loading, setLoading] = useState(false);
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

  useEffect(() => {
    if (isOpen && applicant?.id) {
        const fetchDocs = async () => {
            setLoading(true);
            try {
                const response = await recruitmentApi.getApplicantDocuments(applicant.id);
                if (response.data.success) {
                    setDynamicDocs(response.data.documents);
                }
            } catch (err) {
                console.error('Failed to fetch dynamic documents:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDocs();
    }
  }, [isOpen, applicant?.id]);

  if (!isOpen || !applicant) return null;

  // 100% PRECISION: Construct a unified document list combining dynamic and legacy records
  const legacyDocs = [
    {
      id: 'application_form',
      name: 'Application Form (PDF)',
      description: 'Official generated application document with details',
      icon: ClipboardList,
      path: `${apiUrl}/api/recruitment/applicants/${applicant.id}/pdf`,
      available: true
    },
    {
      id: 'resume',
      name: 'Resume / CV',
      description: 'Professional background and work experience',
      icon: FileText,
      path: applicant.resumePath ? `${apiUrl}/uploads/resumes/${applicant.resumePath}` : null,
      available: !!applicant.resumePath
    },
    {
      id: 'photo',
      name: '2x2 ID Picture',
      description: 'Official 2x2 photograph (Exact Size)',
      icon: ImageIcon,
      path: (applicant.photoPath || applicant.photo1x1Path) ? `${apiUrl}/api/recruitment/applicants/${applicant.id}/photo/2x2` : null,
      available: !!(applicant.photoPath || applicant.photo1x1Path)
    },
    {
      id: 'eligibility',
      name: 'Eligibility Certificate',
      description: 'Government eligibility or professional certification',
      icon: BadgeCheck,
      path: applicant.eligibilityPath ? `${apiUrl}/uploads/resumes/${applicant.eligibilityPath}` : null,
      available: !!applicant.eligibilityPath
    }
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Static Backdrop - No Blur */}
      <div 
        className="absolute inset-0 bg-gray-900/40 transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in duration-200">
        {/* Simple Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Applicant Documents</h2>
            <p className="text-xs text-gray-500 font-medium">{applicant.firstName} {applicant.lastName}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 className="animate-spin text-gray-400" size={32} />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Scanning Document Vault...</p>
              </div>
          ) : (
            <div className="space-y-3">
                {/* 1. Show Dynamic Documents from Table if they exist (Highest Accuracy) */}
                {dynamicDocs.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Verified Uploads</p>
                        {dynamicDocs.map((doc) => (
                            <div 
                                key={doc.id}
                                className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 bg-white cursor-pointer group hover:bg-blue-50/30 transition-all flex items-center justify-between shadow-sm"
                                onClick={() => handleOpenSecureUrl(doc.downloadUrl)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm">{doc.documentType}</h4>
                                        <p className="text-[10px] text-gray-500 font-medium truncate max-w-[180px]">{doc.documentName}</p>
                                    </div>
                                </div>
                                <div className="p-1.5 text-gray-400 group-hover:text-blue-600 transition-colors">
                                    <ExternalLink size={14} />
                                </div>
                            </div>
                        ))}
                        <div className="h-4"></div>
                    </div>
                )}

                {/* 2. Legacy / Generated Documents */}
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Generated & Core Files</p>
                {legacyDocs.map((doc) => (
                <div 
                    key={doc.id}
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    doc.available 
                        ? 'border-gray-200 hover:border-gray-300 bg-white cursor-pointer group hover:bg-gray-50' 
                        : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => doc.available && handleOpenSecureUrl(doc.path!)}
                >
                    <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${doc.available ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-300'}`}>
                        <doc.icon size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm">{doc.name}</h4>
                        <p className="text-[11px] text-gray-500 font-medium">{doc.description}</p>
                    </div>
                    </div>
                    
                    {doc.available && (
                    <div className="p-1.5 text-gray-400 group-hover:text-gray-900 transition-colors">
                        <ExternalLink size={14} />
                    </div>
                    )}
                </div>
                ))}
            </div>
          )}
          
          {!applicant.resumePath && !applicant.eligibilityPath && dynamicDocs.length === 0 && !loading && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
              <AlertCircle size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                Some optional documents were not provided by the applicant during the submission process.
              </p>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-white text-gray-700 text-sm font-bold hover:bg-gray-100 transition-all border border-gray-200 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentListModal;
