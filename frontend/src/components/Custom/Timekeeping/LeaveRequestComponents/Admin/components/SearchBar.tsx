import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, onChange }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="relative w-80">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={onChange}
          placeholder="Search..."
          className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
        />
      </div>
    </div>
  );
};

export default SearchBar;
