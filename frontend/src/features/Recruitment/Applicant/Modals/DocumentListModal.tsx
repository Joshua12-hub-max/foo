import React from 'react';
import { X, FileText, BadgeCheck, ExternalLink, AlertCircle, ClipboardList, Image as ImageIcon } from 'lucide-react';
import { Applicant } from '@/types/recruitment';

interface DocumentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: Applicant | null;
}

const DocumentListModal: React.FC<DocumentListModalProps> = ({ isOpen, onClose, applicant }) => {
  if (!isOpen || !applicant) return null;

  const documents = [
    {
      id: 'application_form',
      name: 'Application Form (PDF)',
      description: 'Official generated application document with details',
      icon: ClipboardList,
      path: `http://localhost:5000/api/recruitment/applicants/${applicant.id}/pdf`,
      available: true
    },
    {
      id: 'resume',
      name: 'Resume / CV',
      description: 'Professional background and work experience',
      icon: FileText,
      path: applicant.resumePath ? `http://localhost:5000/uploads/resumes/${applicant.resumePath}` : null,
      available: !!applicant.resumePath
    },
    {
      id: 'photo',
      name: '2x2 ID Picture',
      description: 'Official 2x2 photograph (Exact Size)',
      icon: ImageIcon,
      path: applicant.photoPath ? `http://localhost:5000/api/recruitment/applicants/${applicant.id}/photo/2x2` : null,
      available: !!applicant.photoPath
    },
    {
      id: 'eligibility',
      name: 'Eligibility Certificate',
      description: 'Government eligibility or professional certification',
      icon: BadgeCheck,
      path: applicant.eligibilityPath ? `http://localhost:5000/uploads/resumes/${applicant.eligibilityPath}` : null,
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
          <div className="space-y-3">
            {documents.map((doc) => (
              <div 
                key={doc.id}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  doc.available 
                    ? 'border-gray-200 hover:border-gray-300 bg-white cursor-pointer group hover:bg-gray-50' 
                    : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                }`}
                onClick={() => doc.available && window.open(doc.path!, '_blank')}
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
          
          {!applicant.resumePath && !applicant.eligibilityPath && (
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

