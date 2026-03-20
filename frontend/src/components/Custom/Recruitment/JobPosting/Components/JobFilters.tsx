import React from 'react';
import { Search } from 'lucide-react';
import Combobox from '@/components/Custom/Combobox';
import { JobStatusFilter } from '@/types';

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
      <div className="relative z-[50]">
        <Combobox
          options={[
            { value: 'All', label: 'All Status' },
            ...JOB_STATUSES.map(status => ({ value: status, label: status }))
          ]}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as JobStatusFilter)}
          placeholder="All Status"
          buttonClassName="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all font-bold h-[38px] min-w-[120px]"
        />
      </div>
    </div>
  );
};


export default JobFilters;
