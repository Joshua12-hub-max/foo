import React from 'react';
import { Search, X } from 'lucide-react';

const AttendanceSearch = ({ searchQuery, onSearchChange, filteredDataLength, isLoading }) => {
  return (
    <div className="flex items-center mb-6">
      <div className="relative w-96">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, ID, or department..."
          value={searchQuery}
          onChange={onSearchChange}
          disabled={isLoading}
          className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md shadow-sm w-full text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all disabled:opacity-50"
        />
      </div>
      {searchQuery && (
        <div className="ml-4 text-sm text-gray-600">
          Found <span className="font-semibold text-gray-800">{filteredDataLength}</span> result{filteredDataLength !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default AttendanceSearch;
