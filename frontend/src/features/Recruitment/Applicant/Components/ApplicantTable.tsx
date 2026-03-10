import React from 'react';
import { User, UserPlus, Video, FileText, Mail, Globe, VideoIcon, Trash2, RotateCcw, BadgeCheck, Download } from 'lucide-react';
import LoadingOverlay from '@/components/Custom/Shared/LoadingOverlay';
import TableSkeleton from '@/components/Custom/Shared/TableSkeleton';
import type { Applicant } from '@/types/recruitment';

interface ApplicantTableProps {
  loading: boolean;
  isRefetching: boolean;
  filteredApplicants: Applicant[];
  onAssign: (applicant: Applicant) => void;
  onSchedule: (applicant: Applicant) => void;
  onJoinInterview?: (applicant: Applicant) => void;
  onReject: (applicant: Applicant) => void;
  onRestore: (applicant: Applicant) => void;
  onViewDetails: (applicant: Applicant) => void;
  onDelete: (applicant: Applicant) => void;
}

const ApplicantTable: React.FC<ApplicantTableProps> = ({ 
  loading, 
  isRefetching, 
  filteredApplicants, 
  onAssign, 
  onSchedule,
  onJoinInterview,
  onReject,
  onRestore,
  onViewDetails,
  onDelete
}) => {

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getSourceBadge = (source: string | undefined) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${source === 'email' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
      {source === 'email' ? <Mail size={12} /> : <Globe size={12} />} {source === 'email' ? 'Email' : 'Website'}
    </span>
  );

  const getStatusBadgeColor = (status: string | undefined): string => {
    switch (status) {
      case 'Applied': return 'bg-gray-100 text-gray-700';
      case 'Screening': return 'bg-yellow-100 text-yellow-700';
      case 'Initial Interview': return 'bg-blue-100 text-blue-700';
      case 'Final Interview': return 'bg-indigo-100 text-indigo-700';
      case 'Hired': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const hasScheduledInterview = (app: Applicant): boolean => {
    return !!(app.interviewLink && (app.stage === 'Initial Interview' || app.stage === 'Final Interview'));
  };

  if (loading) return <TableSkeleton rows={10} cols={5} />;

  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1 relative min-h-[400px]">
      <LoadingOverlay isVisible={isRefetching} message="Refreshing data..." />
      <div className="overflow-x-auto bg-gray-50 rounded-lg h-full">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Applicant</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Applied For</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Interviewer</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Documents</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Status</th>
              <th className="px-6 py-4 text-center text-sm font-bold tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredApplicants.map((app) => (
              <tr key={app.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-full text-gray-500 cursor-pointer hover:bg-green-50 hover:text-green-600 transition-colors" onClick={() => onViewDetails(app)}><User size={18} /></div>
                    <div className="cursor-pointer group" onClick={() => onViewDetails(app)}>
                      <div className="font-medium text-gray-900 group-hover:text-green-700 transition-colors">{app.firstName} {app.lastName}</div>
                      <div className="text-sm text-gray-500 group-hover:text-green-600/70 transition-colors">{app.email}</div>
                      <div className="mt-1">{getSourceBadge(app.source)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {app.jobId === null || app.jobId === undefined ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            General Application
                        </span>
                    ) : (
                        app.jobTitle
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(app.createdAt)}</div>
                </td>
                <td className="px-6 py-4">
                  {app.interviewerName ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                      <User size={12} /> {app.interviewerName}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                         {/* Resume Link */}
                         {app.resumePath ? (
                            <a 
                                href={`http://localhost:5000/uploads/resumes/${app.resumePath}`} 
                                target="_blank" rel="noopener noreferrer"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="View Resume"
                            >
                                <FileText size={16} />
                            </a>
                         ) : (
                            <div className="p-1.5 text-gray-300 cursor-not-allowed" title="No Resume Uploaded">
                                <FileText size={16} />
                            </div>
                         )}

                         {/* Eligibility Link */}
                         {app.eligibilityPath ? (
                            <a 
                                href={`http://localhost:5000/uploads/resumes/${app.eligibilityPath}`} 
                                target="_blank" rel="noopener noreferrer"
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                                title="View Eligibility Certificate"
                            >
                                <BadgeCheck size={16} />
                            </a>
                         ) : (
                            <div className="p-1.5 text-gray-300 cursor-not-allowed" title="No Eligibility Certificate">
                                <BadgeCheck size={16} />
                            </div>
                         )}

                         {/* PDF Application Download */}
                         <a 
                            href={`http://localhost:5000/api/recruitment/applicants/${app.id}/pdf`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Download Application (PDF)"
                         >
                            <Download size={16} />
                         </a>
                    </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(app.status)}`}>{app.status || app.stage}</span>
                </td>
                <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                         {/* Assign Interviewer Button */}
                        {!app.interviewerName && (
                            <button 
                                onClick={() => onAssign(app)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg tooltip"
                                title="Assign Interviewer"
                            >
                                <UserPlus size={16} />
                            </button>
                        )}

                         {/* Schedule Interview Button */}
                         {app.interviewerName && !['Hired', 'Rejected'].includes(app.stage) && (
                            <button 
                                onClick={() => onSchedule(app)}
                                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"
                                title="Schedule Interview"
                            >
                                <Video size={16} />
                            </button>
                        )}

                         {/* Join Interview Button - NEW */}
                         {hasScheduledInterview(app) && onJoinInterview && (
                            <button 
                                onClick={() => onJoinInterview(app)}
                                className="flex items-center gap-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors"
                                title="Join Interview"
                            >
                                <VideoIcon size={14} />
                                Join
                            </button>
                        )}

                         {/* Reject/Archive Button */}
                         {!['Hired', 'Rejected'].includes(app.stage) && (
                            <button 
                                onClick={() => onReject(app)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Reject/Archive Applicant"
                            >
                                <Trash2 size={16} />
                             </button>
                        )}

                         {/* Restore Button (only in Archive/Rejected) */}
                         {app.stage === 'Rejected' && (
                            <button 
                                onClick={() => onRestore(app)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Restore Applicant"
                            >
                                <RotateCcw size={16} />
                            </button>
                        )}

                         {/* Permanent Delete Button (only in Archive/Rejected) */}
                         {app.stage === 'Rejected' && (
                            <button 
                                onClick={() => onDelete(app)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg tooltip"
                                title="Permanently Delete Applicant"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplicantTable;
