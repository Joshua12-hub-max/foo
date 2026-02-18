/**
 * EmployeeMemoTable Component
 * Table display for Employee My Memos
 */

import React, { memo, useMemo, useCallback } from 'react';
import { RefreshCw, Eye, FileText } from 'lucide-react';
// @ts-ignore
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
    <tr className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getEmployeeStatusBadge(memo)}`}>
          {getEmployeeStatusText(memo)}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-800 font-bold whitespace-nowrap">{memo.memo_number}</td>
      <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{memo.memo_type}</td>
      <td className="px-6 py-4 text-sm text-gray-800 max-w-xs truncate">{memo.subject}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityBadge(memo.priority)}`}>
          {memo.priority}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{formatDate(memo.created_at)}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center justify-center">
          <button
            onClick={handleView}
            className="p-2 bg-gray-200 hover:bg-gray-800 hover:text-white text-gray-700 rounded-lg transition-all shadow-sm"
            title="View Memo Details"
          >
            <Eye size={16} />
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
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
      <div className="overflow-x-auto bg-gray-50 rounded-lg">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide transition-all whitespace-nowrap">Status</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide transition-all whitespace-nowrap">Memo Number</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide transition-all whitespace-nowrap">Type</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide transition-all whitespace-nowrap">Subject</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide transition-all whitespace-nowrap">Priority</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide transition-all whitespace-nowrap">Date Issued</th>
              <th className="px-6 py-4 text-center text-sm font-bold tracking-wide transition-all whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tableRows}
          </tbody>
        </table>
      </div>
    </div>
  );
});

EmployeeMemoTable.displayName = 'EmployeeMemoTable';

export default EmployeeMemoTable;
