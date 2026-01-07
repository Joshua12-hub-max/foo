import { User, UserPlus, Video, FileText, Mail, Globe } from 'lucide-react';
import LoadingOverlay from '@components/Custom/Shared/LoadingOverlay';
import TableSkeleton from '@components/Custom/Shared/TableSkeleton';

const ApplicantTable = ({ 
  loading, 
  isRefetching, 
  filteredApplicants, 
  onAssign, 
  onSchedule 
}) => {

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getSourceBadge = (source) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${source === 'email' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
      {source === 'email' ? <Mail size={12} /> : <Globe size={12} />} {source === 'email' ? 'Email' : 'Website'}
    </span>
  );

  const getStatusBadgeColor = (status) => {
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
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Status</th>
              <th className="px-6 py-4 text-center text-sm font-bold tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredApplicants.map((app) => (
              <tr key={app.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-full text-gray-500"><User size={18} /></div>
                    <div>
                      <div className="font-medium text-gray-900">{app.first_name} {app.last_name}</div>
                      <div className="text-sm text-gray-500">{app.email}</div>
                      <div className="mt-1">{getSourceBadge(app.source)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{app.job_title || 'General Application'}</div>
                  <div className="text-xs text-gray-500">{formatDate(app.created_at)}</div>
                </td>
                <td className="px-6 py-4">
                  {app.interviewer_name ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                      <User size={12} /> {app.interviewer_name}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(app.status)}`}>{app.status}</span>
                </td>
                <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                         {/* Assign Interviewer Button */}
                        {!app.interviewer_name && (
                            <button 
                                onClick={() => onAssign(app)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg tooltip"
                                title="Assign Interviewer"
                            >
                                <UserPlus size={16} />
                            </button>
                        )}

                         {/* Schedule Interview Button */}
                         {app.interviewer_name && !['Hired', 'Rejected'].includes(app.stage) && (
                            <button 
                                onClick={() => onSchedule(app)}
                                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"
                                title="Schedule Interview"
                            >
                                <Video size={16} />
                            </button>
                        )}

                         {/* Resume Link */}
                         {app.resume_path && (
                            <a 
                                href={`http://localhost:5000/uploads/resumes/${app.resume_path}`} 
                                target="_blank" rel="noopener noreferrer"
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                                title="View Resume"
                            >
                                <FileText size={16} />
                            </a>
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
