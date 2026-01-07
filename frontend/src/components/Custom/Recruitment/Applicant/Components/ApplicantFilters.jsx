import { Search } from 'lucide-react';

const ApplicantFilters = ({ searchTerm, setSearchTerm, sourceFilter, setSourceFilter }) => {
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
      <div className="relative w-40">
          <select 
            className="w-full appearance-none bg-gray-200 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 cursor-pointer"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="All">All Sources</option>
            <option value="Web">Website</option>
            <option value="Email">Email</option>
          </select>
      </div>
    </div>
  );
};

export default ApplicantFilters;
