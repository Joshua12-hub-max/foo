import { Search } from "lucide-react";

export const AdminDTRSearchBar = ({ 
  searchQuery, 
  handleSearchChange, 
  filteredDataLength,
  isLoading 
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="relative w-80">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#274b46]" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by name, ID, or department..."
          disabled={isLoading}
          className="pl-10 pr-4 py-2 bg-[#F8F9FA] border border-gray-300 rounded-lg w-full text-sm"
          aria-label="Search employees"  
        />
      </div>
      {searchQuery && (
        <div className="text-sm text-gray-600">
          Found <span className="font-semibold text-gray-800">{filteredDataLength}</span> result{filteredDataLength !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
