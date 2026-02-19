/**
 * EmployeeMemoHeader Component
 * Header section for Employee My Memos page
 */

import React, { memo } from 'react';
import { RefreshCw } from 'lucide-react';

interface EmployeeMemoHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  hideHeader?: boolean;
}

const EmployeeMemoHeader: React.FC<EmployeeMemoHeaderProps> = memo(({ onRefresh, isLoading, hideHeader = false }) => {
  if (hideHeader) return null;
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-gray-700">Memos</h1>
        <p className="text-sm text-gray-500">View memos and notices addressed to you</p>
      </div>
      <button
        onClick={onRefresh}
        className="p-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg shadow-sm transition-all"
        aria-label="Refresh memos"
      >
        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
});

EmployeeMemoHeader.displayName = 'EmployeeMemoHeader';

export default EmployeeMemoHeader;
