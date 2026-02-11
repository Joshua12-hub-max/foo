import React, { memo } from 'react';
import { RefreshCw, Plus } from 'lucide-react';

interface MemoHeaderProps {
  onRefresh: () => void;
  onCreateNew: () => void;
  isLoading: boolean;
  hideHeader?: boolean;
}

const MemoHeader: React.FC<MemoHeaderProps> = memo(({ onRefresh, onCreateNew, isLoading, hideHeader = false }) => {
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
          className="p-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg shadow-sm transition-all"
          aria-label="Refresh memos"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={onCreateNew}
          className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-bold"
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
