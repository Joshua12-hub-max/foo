import { memo } from 'react';
import { CheckCircle } from 'lucide-react';
import { MEMO_TYPES, MEMO_PRIORITIES, MEMO_STATUSES } from '../Constants/memoConstants';

const MemoFilters = memo(({ filters, onFilterChange, onSearch, onClear }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        {/* Search Input */}
        <div className="md:col-span-1">
          <input
            type="text"
            placeholder="Search"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none"
            aria-label="Search memos"
          />
        </div>

        {/* Type Filter */}
        <div className="md:col-span-1">
          <select
            value={filters.memo_type}
            onChange={(e) => onFilterChange('memo_type', e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none cursor-pointer"
            aria-label="Filter by type"
          >
            <option value="">All Types</option>
            {MEMO_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="md:col-span-1">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none cursor-pointer"
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            {MEMO_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 md:col-span-2">
          <button
            onClick={onSearch}
            className="flex-1 flex items-center justify-center gap-2 bg-[#F8F9FA] text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-[#F8F9FA] transition-all active:scale-95 border border-gray-200"
            aria-label="Apply filters"
          >
            Apply Filter
          </button>
          <button
            onClick={onClear}
            className="flex-1 bg-[#F8F9FA] text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-[#F8F9FA] transition-all active:scale-95 border border-gray-200"
            aria-label="Clear filters"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
});

MemoFilters.displayName = 'MemoFilters';

export default MemoFilters;
