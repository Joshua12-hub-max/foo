import React from 'react';
import { ExternalLink, SquarePen, Trash2 } from 'lucide-react';
import TableSkeleton from '@components/Custom/Shared/TableSkeleton';
import { Job } from '@/types';

interface JobTableProps {
  loading: boolean;
  filteredJobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onView: (job: Job) => void;
}

const JobTable: React.FC<JobTableProps> = ({ 
  loading, 
  filteredJobs, 
  onEdit, 
  onDelete, 
  onView 
}) => {

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

  if (loading) return <TableSkeleton rows={8} cols={8} />;

  return (
    <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
            <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Job Title</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Department</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Type</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Salary Range</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Application Email</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Posted Date</th>
                <th className="px-6 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
            {filteredJobs.length > 0 ? filteredJobs.map(job => (
                <tr 
                    key={job.id} 
                    className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors cursor-pointer"
                    onClick={() => onView(job)}
                >
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(job.status)}`}>
                    {job.status}
                    </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap font-medium">{job.title}</td>
                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{job.department}</td>
                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{job.employment_type || 'Full-time'}</td>
                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{job.salary_range || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {job.application_email ? (
                    <a href={`mailto:${job.application_email}`} onClick={e => e.stopPropagation()} className="text-blue-600 hover:underline">{job.application_email}</a>
                    ) : (
                    <span className="text-gray-400">-</span>
                    )}
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {job.posted_at ? (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-green-600 font-medium">{formatDate(job.posted_at)}</span>
                    </div>
                    ) : (
                    <span className="text-gray-400 italic">Not posted</span>
                    )}
                </td>
                <td className="px-6 py-4 flex justify-center gap-3">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(job); }}
                        className="text-gray-500 hover:text-blue-600 transition"
                        title="Edit"
                    >
                    <SquarePen size={18} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(job); }}
                        className="text-gray-500 hover:text-red-600 transition"
                        title="Delete"
                    >
                    <Trash2 size={18} />
                    </button>
                </td>
                </tr>
            )) : (
                <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                    No job postings found matching your criteria.
                </td>
                </tr>
            )}
            </tbody>
        </table>
        </div>
    </div>
  );
};

export default JobTable;
