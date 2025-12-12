/**
 * EmployeeMemoHeader Component
 * Header section for Employee My Memos page
 */

import React, { memo } from 'react';
import { RefreshCw } from 'lucide-react';

const EmployeeMemoHeader = memo(({ onRefresh, isLoading }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-gray-700">My Memos</h1>
        <p className="text-sm text-gray-500">View memos and notices addressed to you</p>
      </div>
      <button
        onClick={onRefresh}
        className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
        aria-label="Refresh memos"
      >
        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
});

EmployeeMemoHeader.displayName = 'EmployeeMemoHeader';

export default EmployeeMemoHeader;
