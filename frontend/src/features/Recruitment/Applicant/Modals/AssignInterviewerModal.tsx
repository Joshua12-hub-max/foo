 import React from 'react';
import { X } from 'lucide-react';
import { Applicant, Interviewer } from '@/types';

interface AssignInterviewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  interviewers: Interviewer[];
  selectedApplicant: Applicant | null;
  selectedInterviewer: string;
  setSelectedInterviewer: (value: string) => void;
}

const AssignInterviewerModal: React.FC<AssignInterviewerModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  interviewers, 
  selectedApplicant, 
  selectedInterviewer, 
  setSelectedInterviewer 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Clean Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Assign Interviewer</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            Authorize an employee to interview <strong className="text-gray-900">{selectedApplicant?.first_name} {selectedApplicant?.last_name}</strong>.
          </p>
          
          <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Interviewer</label>
              <select 
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-gray-50 text-sm"
                  value={selectedInterviewer}
                  onChange={(e) => setSelectedInterviewer(e.target.value)}
              >
                  <option value="">-- Select Employee --</option>
                  {interviewers.map(int => (
                      <option key={int.id} value={String(int.id)}>{int.first_name} {int.last_name} ({int.job_title})</option>
                  ))}
              </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={onClose} 
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button 
                  onClick={onConfirm}
                  disabled={!selectedInterviewer}
                  className="px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-md disabled:opacity-50 disabled:shadow-none"
              >
                  Confirm Assignment
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignInterviewerModal;
