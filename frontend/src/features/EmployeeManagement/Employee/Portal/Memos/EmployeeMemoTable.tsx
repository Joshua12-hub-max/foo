import React, { memo, useMemo, useCallback } from 'react';
import { RefreshCw, Eye } from 'lucide-react';
import { formatDate, getEmployeeStatusBadge, getEmployeeStatusText, getPriorityBadge } from './Shared/memoUtils';

interface Memo {
  id: number;
  memoNumber: string;
  memoType: string;
  subject: string;
  content?: string;
  priority: string;
  status: string;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgmentRequired?: boolean;
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
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getEmployeeStatusBadge(memo)}`}>
          {getEmployeeStatusText(memo)}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-800 font-medium whitespace-nowrap">{memo.memoNumber}</td>
      <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{memo.memoType}</td>
      <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
        {memo.subject}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(memo.priority)}`}>
          {memo.priority}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{formatDate(memo.createdAt)}</td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleView}
            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
            title="View"
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
    <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 tracking-normal whitespace-nowrap">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 tracking-normal whitespace-nowrap">Memo #</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 tracking-normal whitespace-nowrap">Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 tracking-normal whitespace-nowrap">Subject</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 tracking-normal whitespace-nowrap">Priority</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 tracking-normal whitespace-nowrap">Date</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 tracking-normal whitespace-nowrap">Actions</th>
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
