import React, { memo, useMemo, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { formatDate, getEmployeeStatusBadge, getEmployeeStatusText, getPriorityBadge } from './Shared/memoUtils';

interface Memo {
  id: number;
  memo_number: string;
  memo_type: string;
  subject: string;
  content?: string;
  priority: string;
  status: string;
  created_at: string;
  acknowledged_at?: string;
  acknowledgment_required?: boolean;
}

interface MemoRowProps {
  memo: Memo;
  onView: (memo: Memo) => void;
}

// Memoized table row component
const MemoRow: React.FC<MemoRowProps> = memo(({ memo, onView }) => {
  const handleView = useCallback(() => onView(memo), [memo, onView]);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-5 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getEmployeeStatusBadge(memo)}`}>
          {getEmployeeStatusText(memo)}
        </span>
      </td>
      <td className="px-5 py-3 text-sm text-gray-800 font-bold whitespace-nowrap">{memo.memo_number}</td>
      <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{memo.memo_type}</td>
      <td className="px-5 py-3 text-sm text-gray-800 max-w-xs truncate">{memo.subject}</td>
      <td className="px-5 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityBadge(memo.priority)}`}>
          {memo.priority}
        </span>
      </td>
      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(memo.created_at)}</td>
      <td className="px-5 py-3 whitespace-nowrap">
        <div className="flex items-center justify-center">
          <button
            onClick={handleView}
            className="text-xs font-bold text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
          >
            View
          </button>
        </div>
      </td>
    </tr>
  );
});

MemoRow.displayName = 'MemoRow';

interface EmployeeMemoTableProps {
  memos: Memo[];
  loading: boolean;
  onView: (memo: Memo) => void;
}

const EmployeeMemoTable: React.FC<EmployeeMemoTableProps> = memo(({ memos, loading, onView }) => {
  // Memoize the rows rendering
  const tableRows = useMemo(() => {
    return memos.map((memo) => (
      <MemoRow key={memo.id} memo={memo} onView={onView} />
    ));
  }, [memos, onView]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (memos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden">
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <p className="text-gray-600 font-medium">No memos found</p>
          <p className="text-sm text-gray-400">You don't have any memos at the moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden rounded-xl border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
              <th className="px-5 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Memo #</th>
              <th className="px-5 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Type</th>
              <th className="px-5 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Subject</th>
              <th className="px-5 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Priority</th>
              <th className="px-5 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Date</th>
              <th className="px-5 py-3 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {tableRows}
          </tbody>
        </table>
      </div>
    </div>
  );
});

EmployeeMemoTable.displayName = 'EmployeeMemoTable';

export default EmployeeMemoTable;
