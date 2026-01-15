import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resultCount: number;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  searchQuery, 
  onChange, 
  resultCount,
  isLoading 
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="relative w-80">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={onChange}
          placeholder="Search by ID, department, leave type, or status..."
          disabled={isLoading}
          className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
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
