/**
 * MemoHeader Component
 * Header section for Admin Employee Memos page
 */

import React, { memo } from 'react';
import { RefreshCw, Plus } from 'lucide-react';

const MemoHeader = memo(({ onRefresh, onCreateNew, isLoading, hideHeader = false }) => {
  if (hideHeader) return null;
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-gray-700">Employee Memos</h1>
        <p className="text-sm text-gray-500">Manage employee disciplinary memos and notices</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
          aria-label="Refresh memos"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          New Memo
        </button>
      </div>
    </div>
  );
});

MemoHeader.displayName = 'MemoHeader';

export default MemoHeader;
