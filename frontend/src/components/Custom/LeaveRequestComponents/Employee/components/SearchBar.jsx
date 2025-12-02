import { Search } from 'lucide-react';

export const SearchBar = ({ 
  searchQuery, 
  onChange, 
  resultCount,
  isLoading 
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="relative w-80">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#274b46]" />
        <input
          type="text"
          value={searchQuery}
          onChange={onChange}
          placeholder="Search by ID, department, leave type, or status..."
          disabled={isLoading}
          className="pl-10 pr-4 py-2 bg-[#F8F9FA] border-[2px] border-[#274b46] rounded-lg w-full text-sm"
          aria-label="Search leave requests"
        />
      </div>
      {searchQuery && (
        <div className="text-sm text-gray-600">
          Found <span className="font-semibold text-gray-800">{resultCount}</span> result{resultCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
