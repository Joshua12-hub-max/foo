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
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${
        source === 'email' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'
    }`}>
      {source === 'email' ? <Mail size={10} /> : <Globe size={10} />} {source === 'email' ? 'Email' : 'Website'}
    </span>
  );

  const getStatusBadgeColor = (status: string | undefined): string => {
    switch (status) {
      case 'Hired': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-100 italic';
      case 'Screening': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Initial Interview': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Final Interview': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const hasScheduledInterview = (app: Applicant): boolean => {
    return !!(app.interviewLink && (app.stage === 'Initial Interview' || app.stage === 'Final Interview'));
  };

  if (loading) return <TableSkeleton rows={10} cols={5} />;

  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[400px]">
      <LoadingOverlay isVisible={isRefetching} message="Refreshing data..." />
      <div className="overflow-x-auto h-full">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            {isArchiveHired ? (
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Applicant Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Position</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Department</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Duty Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Schedule</th>
              </tr>
            ) : (
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Applicant</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Applied For</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Interviewer</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Documents</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredApplicants.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                {isArchiveHired ? (
                  <>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-2 rounded-full text-slate-400 group-hover:text-blue-600 transition-colors"><User size={18} /></div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{app.firstName} {app.lastName}</div>
                          <div className="text-xs text-slate-500">{app.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700 font-medium">{app.jobTitle || 'General Application'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{app.jobDepartment || 'HR'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${ app.jobDutyType === 'Irregular' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {app.jobDutyType || 'Standard'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 w-fit">
                            {app.jobEmploymentType || 'Permanent'}
                        </span>
                        {app.isConfirmed && (
                            <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase tracking-tight">
                                <CheckCircle size={12} /> Confirmed
                            </div>
                        )}
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-2 rounded-full text-slate-400 group-hover:text-blue-600 transition-colors"><User size={18} /></div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{app.firstName} {app.lastName}</div>
                          <div className="text-xs text-slate-500 mb-1">{app.email}</div>
                          {getSourceBadge(app.source)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-800">
                        {app.jobId === null || app.jobId === undefined ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-tighter">
                                General
                            </span>
                        ) : (
                            app.jobTitle
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">{formatDate(app.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {app.interviewerName ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                          <User size={12} /> {app.interviewerName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                        <button 
                            onClick={() => onViewDocuments(app)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-lg transition-all shadow-sm active:scale-95"
                            title="View All Documents"
                        >
                            <Eye size={14} />
                            <span className="text-[11px] font-bold uppercase tracking-tight">Docs</span>
                        </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeColor(app.status || app.stage)}`}>
                        {app.status || app.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                            {app.stage === 'Hired' && onConfirm && (
                                <button 
                                    onClick={() => onConfirm(app)}
                                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-all active:scale-90"
                                    title="Confirm for Duty"
                                >
                                    <CheckCircle size={18} />
                                </button>
                            )}

                            <button 
                                onClick={() => onViewDetails(app)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-90"
                                title="View Profile"
                            >
                                <ExternalLink size={18} />
                            </button>

                            {!app.interviewerName && (
                                <button 
                                    onClick={() => onAssign(app)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-90"
                                    title="Assign Interviewer"
                                >
                                    <UserPlus size={18} />
                                </button>
                            )}

                            {app.interviewerName && !['Hired', 'Rejected'].includes(app.stage) && (
                                <button 
                                    onClick={() => onSchedule(app)}
                                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all active:scale-90"
                                    title="Schedule Interview"
                                >
                                    <CalendarPlus size={18} />
                                </button>
                            )}

                            {hasScheduledInterview(app) && onJoinInterview && (
                                <button 
                                    onClick={() => onJoinInterview(app)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white hover:bg-black rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm active:scale-95"
                                    title="Join Interview"
                                >
                                    <VideoIcon size={14} /> Join
                                </button>
                            )}

                            {!['Hired', 'Rejected'].includes(app.stage) && (
                                <button 
                                    onClick={() => onReject(app)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-90"
                                    title="Archive"
                                >
                                    <Archive size={18} />
                                </button>
                            )}

                            {app.stage === 'Rejected' && (
                                <button 
                                    onClick={() => onRestore(app)}
                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all active:scale-90"
                                    title="Restore"
                                >
                                    <RotateCcw size={18} />
                                </button>
                            )}

                            {app.stage === 'Rejected' && (
                                <button 
                                    onClick={() => onDelete(app)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-90"
                                    title="Delete"
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
