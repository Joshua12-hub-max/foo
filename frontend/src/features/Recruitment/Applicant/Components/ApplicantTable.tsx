import React from 'react';
import { User, UserPlus, Video, Mail, Globe, VideoIcon, Trash2, RotateCcw, Eye, ExternalLink, CalendarPlus, Archive, CheckCircle } from 'lucide-react';
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
  onViewDocuments: (applicant: Applicant) => void;
  onDelete: (applicant: Applicant) => void;
  onViewDetails: (applicant: Applicant) => void;
  onConfirm?: (applicant: Applicant) => void;
  isArchiveHired?: boolean;
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
  onViewDocuments,
  onDelete,
  onViewDetails,
  onConfirm,
  isArchiveHired = false
}) => {

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getSourceBadge = (source: string | undefined) => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider border border-gray-200">
      {source === 'email' ? <Mail size={10} /> : <Globe size={10} />} {source || 'Unknown'}
    </span>
  );

  const getStatusBadgeColor = (status: string | undefined): string => {
    switch (status) {
      case 'Hired': return 'bg-gray-900 text-white border-gray-900';
      case 'Rejected': return 'bg-gray-100 text-gray-400 border-gray-200 italic';
      default: return 'bg-white text-gray-700 border-gray-200 shadow-sm';
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
            {isArchiveHired ? (
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Applicant Name</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Position</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Department</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Duty Type</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Schedule</th>
              </tr>
            ) : (
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Applicant</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Applied For</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Interviewer</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Documents</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap">Actions</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredApplicants.map((app) => (
              <tr key={app.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                {isArchiveHired ? (
                  <>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-full text-gray-500"><User size={18} /></div>
                        <div>
                          <div className="font-medium text-gray-900">{app.firstName} {app.lastName}</div>
                          <div className="text-sm text-gray-500">{app.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{app.jobTitle || 'General Application'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">{app.jobDepartment || 'HR'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                        app.jobDutyType === 'Irregular' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {app.jobDutyType || 'Standard'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-gray-100 text-gray-700 border border-gray-200 w-fit">
                            {app.jobEmploymentType || 'Permanent'}
                        </span>
                        {app.isConfirmed && (
                            <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase">
                                <CheckCircle size={10} /> Confirmed for Duty
                            </div>
                        )}
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-full text-gray-500"><User size={18} /></div>
                        <div>
                          <div className="font-medium text-gray-900">{app.firstName} {app.lastName}</div>
                          <div className="text-sm text-gray-500">{app.email}</div>
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
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
                          <User size={12} /> {app.interviewerName}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => onViewDocuments(app)}
                                className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-all shadow-sm"
                                title="View All Documents"
                            >
                                <Eye size={14} />
                                <span className="text-[11px] font-bold">Documents</span>
                            </button>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusBadgeColor(app.status)}`}>{app.status || app.stage}</span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex justify-center gap-3">
                            {/* Confirm for Duty Button (Only for Hired) */}
                            {app.stage === 'Hired' && onConfirm && (
                                <button 
                                    onClick={() => onConfirm(app)}
                                    className="flex items-center gap-1 px-3 py-1 bg-emerald-600 border border-emerald-600 text-white hover:bg-emerald-700 rounded-md transition-all shadow-sm"
                                    title="Confirm for Registration & Duty"
                                >
                                    <CheckCircle size={14} />
                                    <span className="text-[11px] font-bold">Confirm for Duty</span>
                                </button>
                            )}

                            <button 
                                onClick={() => onViewDetails(app)}
                                className="text-gray-500 hover:text-gray-900 transition-colors"
                                title="View Full Profile"
                            >
                                <ExternalLink size={18} />
                            </button>

                            {!app.interviewerName && (
                                <button 
                                    onClick={() => onAssign(app)}
                                    className="text-gray-500 hover:text-gray-900 transition-colors"
                                    title="Assign Interviewer"
                                >
                                    <UserPlus size={18} />
                                </button>
                            )}

                            {app.interviewerName && !['Hired', 'Rejected'].includes(app.stage) && (
                                <button 
                                    onClick={() => onSchedule(app)}
                                    className="text-slate-500 hover:text-slate-900 transition-colors"
                                    title="Schedule Interview"
                                >
                                    <CalendarPlus size={18} />
                                </button>
                            )}

                            {hasScheduledInterview(app) && onJoinInterview && (
                                <button 
                                    onClick={() => onJoinInterview(app)}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-gray-900 border border-gray-900 hover:bg-gray-800 text-white rounded text-[10px] font-bold transition-colors shadow-sm"
                                    title="Join Interview"
                                >
                                    <VideoIcon size={12} />
                                    Join
                                </button>
                            )}

                            {!['Hired', 'Rejected'].includes(app.stage) && (
                                <button 
                                    onClick={() => onReject(app)}
                                    className="text-gray-500 hover:text-gray-800 transition-colors"
                                    title="Reject/Archive Applicant"
                                >
                                    <Archive size={18} />
                                </button>
                            )}

                            {app.stage === 'Rejected' && (
                                <button 
                                    onClick={() => onRestore(app)}
                                    className="text-gray-500 hover:text-gray-900 transition-colors"
                                    title="Restore Applicant"
                                >
                                    <RotateCcw size={18} />
                                </button>
                            )}

                            {app.stage === 'Rejected' && (
                                <button 
                                    onClick={() => onDelete(app)}
                                    className="text-gray-500 hover:text-gray-800 transition-colors"
                                    title="Permanently Delete Applicant"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplicantTable;
