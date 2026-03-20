import React, { memo, KeyboardEvent } from 'react';
// @ts-ignore
import { MEMO_TYPES, MEMO_PRIORITIES, MEMO_STATUSES } from '../Constants/memoConstants';
import Combobox from '@/components/Custom/Combobox';

interface Filters {
  search: string;
  memoType: string;
  status: string;
}

interface MemoFiltersProps {
  filters: Filters;
  onFilterChange: (key: string, value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

const MemoFilters: React.FC<MemoFiltersProps> = memo(({ filters, onFilterChange, onSearch, onClear }) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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

        <div className="md:col-span-1 relative z-[50]">
          <Combobox
            options={[
              { value: '', label: 'All Types' },
              ...MEMO_TYPES.map((t: { value: string; label: string }) => ({ value: t.value, label: t.label }))
            ]}
            value={filters.memoType}
            onChange={(val) => onFilterChange('memoType', val || '')}
            placeholder="All Types"
            buttonClassName="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all cursor-pointer font-bold h-[38px]"
          />
        </div>

        <div className="md:col-span-1 relative z-[50]">
          <Combobox
            options={[
              { value: '', label: 'All Status' },
              ...MEMO_STATUSES.map((s: { value: string; label: string }) => ({ value: s.value, label: s.label }))
            ]}
            value={filters.status}
            onChange={(val) => onFilterChange('status', val || '')}
            placeholder="All Status"
            buttonClassName="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all cursor-pointer font-bold h-[38px]"
          />
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
