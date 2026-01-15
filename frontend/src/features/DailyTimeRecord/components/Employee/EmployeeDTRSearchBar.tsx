import React from "react";
import { Search } from "lucide-react";

interface EmployeeDTRSearchBarProps {
  searchQuery: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filteredDataLength: number;
  isLoading: boolean;
}

export const EmployeeDTRSearchBar: React.FC<EmployeeDTRSearchBarProps> = ({ 
  searchQuery, 
  handleSearchChange, 
  filteredDataLength, 
  isLoading 
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="relative w-80">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by date, status, or remarks..."
          disabled={isLoading}
          className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md shadow-sm w-full text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all disabled:opacity-50"
          aria-label="Search DTR records"  
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
