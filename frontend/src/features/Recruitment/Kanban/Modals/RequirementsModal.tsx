import React, { memo } from 'react';
import { User, Mail, ClipboardList, X, Building } from 'lucide-react';
import { KanbanApplicant } from '../Hooks/useKanbanData';

interface RequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: KanbanApplicant | null;
}

const RequirementsModal: React.FC<RequirementsModalProps> = memo(({ isOpen, onClose, applicant }) => {
  if (!isOpen || !applicant) return null;

  const requirements = applicant.jobRequirements || 'No requirements specified for this position.';
  const requirementsList = requirements.split('\n').filter(r => r.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/40 transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl w-full max-w-md shadow-xl my-8 border border-gray-100 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Clean Header */}
        <div className="flex justify-between items-start px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">Job Requirements</h2>
            <p className="text-sm text-gray-500 mt-1">
              {applicant.jobTitle || 'Position Not Specified'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 -mr-2 -mt-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Applicant Info Section */}
          <div className="flex items-center gap-4 p-4 mb-6 bg-gray-50 rounded-xl border border-gray-100">
            <div className="bg-white p-2.5 rounded-full shadow-sm border border-gray-100 md:ml-0 ml-1">
              <User size={20} className="text-gray-600" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">
                {applicant.firstName} {applicant.lastName}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-500 mt-0.5">
                <span className="flex items-center gap-1.5 truncate">
                  <Mail size={12} className="flex-shrink-0" /> {applicant.email}
                </span>
                {applicant.jobDepartment && (
                  <span className="hidden sm:inline text-gray-300">•</span>
                )}
                {applicant.jobDepartment && (
                  <span className="flex items-center gap-1.5 truncate">
                    <Building size={12} className="flex-shrink-0" /> {applicant.jobDepartment}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Requirements List */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList size={18} className="text-gray-500" />
              Requirements Checklist
            </h3>
            
            {requirementsList.length > 0 ? (
              <ul className="space-y-3 pl-1">
                {requirementsList.map((req, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-3 text-sm text-gray-700 group"
                  >
                    <div className="flex-shrink-0 mt-0.5 text-gray-300 group-hover:text-blue-500 transition-colors">
                      <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-transparent" />
                      </div>
                    </div>
                    <span className="leading-relaxed pt-0.5">{req.replace(/^[-•*]\s*/, '')}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-start gap-3 p-2 pl-1">
                 <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                 <p className="text-gray-500 text-sm italic pt-0.5">
                  {requirements}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

RequirementsModal.displayName = 'RequirementsModal';

export default RequirementsModal;
