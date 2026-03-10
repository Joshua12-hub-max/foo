import React from 'react';
import { X, MapPin, DollarSign, Calendar, Clock, SquarePen } from 'lucide-react';
import { Job } from '@/types';
import { JobVacancyAnnouncement } from '../Components';

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJob: Job | null;
  onEdit: (job: Job) => void;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedJob, 
  onEdit 
}) => {

  const [showAnnouncement, setShowAnnouncement] = React.useState(false);

  if (!isOpen || !selectedJob) return null;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-700';
      case 'Closed': return 'bg-red-100 text-red-700';
      case 'On Hold': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const ModalContent = () => {
    if (showAnnouncement) {
      return (
        <React.Suspense fallback={<div className="p-10 text-center">Loading preview...</div>}>
           <JobVacancyAnnouncement job={selectedJob} onClose={() => setShowAnnouncement(false)} />
        </React.Suspense>
      );
    }
    
    return (
      <>
        {/* Clean Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <h2 className="text-lg font-bold text-gray-800">Job Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Title & Status */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{selectedJob.title}</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">{selectedJob.department}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(selectedJob.status)}`}>
              {selectedJob.status}
            </span>
          </div>

          {/* Job Info Grid */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2.5 text-gray-700">
                <MapPin size={16} className="text-gray-400" />
                <span>{selectedJob.location || 'Main Office'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-700">
                <Clock size={16} className="text-gray-400" />
                <span>{selectedJob.employmentType || 'Full-time'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-700">
                <DollarSign size={16} className="text-gray-400" />
                <span>{selectedJob.salaryRange || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-700">
                <Calendar size={16} className="text-gray-400" />
                <span>{formatDate(selectedJob.createdAt || selectedJob.postedAt)}</span>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div>
            <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wide">Job Description</h4>
            <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                {selectedJob.jobDescription}
            </div>
          </div>

          {/* Requirements */}
          {selectedJob.requirements && (
            <div>
              <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wide">Requirements</h4>
               <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                {Array.isArray(selectedJob.requirements) ? selectedJob.requirements.join('\n') : selectedJob.requirements}
              </div>
            </div>
          )}

           {/* Added Fields Summary */}
           {(selectedJob.education || selectedJob.experience || selectedJob.training || selectedJob.eligibility) && (
              <div>
                  <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wide">Qualifications</h4>
                  <div className="text-sm text-gray-600 bg-gray-50/50 p-4 rounded-lg border border-gray-100 grid grid-cols-2 gap-2">
                      {selectedJob.education && <p><span className="font-semibold">Education:</span> {selectedJob.education}</p>}
                      {selectedJob.experience && <p><span className="font-semibold">Experience:</span> {selectedJob.experience}</p>}
                      {selectedJob.training && <p><span className="font-semibold">Training:</span> {selectedJob.training}</p>}
                      {selectedJob.eligibility && <p><span className="font-semibold">Eligibility:</span> {selectedJob.eligibility}</p>}
                  </div>
              </div>
           )}

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 z-10">
            <button 
                onClick={() => setShowAnnouncement(true)}
                className="w-full px-4 py-2 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all shadow-sm flex items-center justify-center gap-2"
            >
                View Announcement Form
            </button>
            <div className="flex gap-3">
                <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm flex-1"
                >
                Close
                </button>
                <button 
                onClick={() => {
                    onClose();
                    onEdit(selectedJob);
                }}
                className="px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2 flex-1"
                >
                <SquarePen size={16} /> Edit Job
                </button>
            </div>
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 transition-opacity" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 ${showAnnouncement ? 'max-w-6xl h-[95vh]' : 'max-w-md max-h-[90vh]'}`}>
         <ModalContent />
      </div>
    </div>
  );
};


export default JobDetailsModal;
