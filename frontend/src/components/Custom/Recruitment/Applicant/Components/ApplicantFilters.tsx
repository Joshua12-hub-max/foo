import React from 'react';
import { Search } from 'lucide-react';
import { SourceFilter } from '../Hooks/useApplicantFilters';
import Combobox from '@/components/Custom/Combobox';

interface ApplicantFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  sourceFilter: SourceFilter;
  setSourceFilter: (value: SourceFilter) => void;
}

const ApplicantFilters: React.FC<ApplicantFiltersProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  sourceFilter, 
  setSourceFilter 
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search applicants..." 
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="relative w-44 z-[50]">
        <Combobox
          options={[
            { value: 'All', label: 'All Sources' },
            { value: 'Web', label: 'Website' },
            { value: 'Email', label: 'Email' }
          ]}
          value={sourceFilter}
          onChange={(val) => setSourceFilter(val as SourceFilter)}
          placeholder="All Sources"
          buttonClassName="w-full bg-white border border-gray-200 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 cursor-pointer font-bold h-[42px]"
        />
      </div>
    </div>
  );
};

export default ApplicantFilters;
