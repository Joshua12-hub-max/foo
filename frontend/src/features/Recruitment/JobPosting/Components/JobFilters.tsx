import React from 'react';
import { Search } from 'lucide-react';
import { JobStatusFilter } from '@/types';
import Combobox from '@/components/Custom/Combobox';

const JOB_STATUSES: JobStatusFilter[] = ['Open', 'Closed', 'On Hold'];

interface JobFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: JobStatusFilter;
  setStatusFilter: (status: JobStatusFilter) => void;
}

const JobFilters: React.FC<JobFiltersProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter 
}) => {
  const statusOptions: { value: JobStatusFilter; label: string }[] = [
    { value: 'All', label: 'All Status' },
    ...JOB_STATUSES.map(status => ({ value: status, label: status }))
  ];

  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6 flex flex-wrap gap-4 items-center">
      <div className="flex-1 min-w-[200px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input 
          type="text" 
          placeholder="Search by title or department..." 
          className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Combobox 
        options={statusOptions}
        value={statusFilter}
        onChange={(val) => setStatusFilter(val as JobStatusFilter)}
        placeholder="Filter Status"
        className="w-40"
        buttonClassName="bg-white border-gray-200 shadow-sm px-3 py-2 text-sm"
      />
    </div>
  );
};


export default JobFilters;
