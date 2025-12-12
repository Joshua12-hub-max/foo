import { Search } from 'lucide-react';

export const NotificationHistorySearchBar = ({ 
  searchQuery, 
  handleSearchChange, 
  filteredDataLength, 
  isLoading 
}) => {
  return (
    <div className="relative mb-4">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Search by name, ID, or department..."
        disabled={isLoading}
        className="w-full max-w-md pl-10 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
        aria-label="Search notifications"
      />
    </div>
  );
};
