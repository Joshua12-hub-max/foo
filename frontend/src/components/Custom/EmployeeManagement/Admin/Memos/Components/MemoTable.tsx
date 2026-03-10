import React, { memo, useMemo, useCallback } from 'react';
import { RefreshCw, Eye, SquarePen, Trash2 } from 'lucide-react';
// @ts-ignore
import { formatDate, getStatusBadge, getPriorityBadge } from '../Shared/memoUtils';

interface Memo {
  id: number;
  memoNumber: string;
  memoType: string;
  employeeName: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
  employeeId: string | number;
  content?: string;
  effectiveDate?: string;
  acknowledgmentRequired?: boolean;
  acknowledgedAt?: string;
  authorName?: string;
}

interface MemoRowProps {
  memo: Memo;
  onView: (memo: Memo) => void;
  onEdit: (memo: Memo) => void;
  onDelete: (memo: Memo) => void;
}

// Memoized table row component
const MemoRow: React.FC<MemoRowProps> = memo(({ memo, onView, onEdit, onDelete }) => {
  const handleView = useCallback(() => onView(memo), [memo, onView]);
  const handleEdit = useCallback(() => onEdit(memo), [memo, onEdit]);
  const handleDelete = useCallback(() => onDelete(memo), [memo, onDelete]);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(memo.status)}`}>
          {memo.status}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-800 font-medium">{memo.memoNumber}</td>
      <td className="px-6 py-4 text-sm text-gray-600">{memo.memoType}</td>
      <td className="px-6 py-4 text-sm text-gray-800">{memo.employeeName}</td>
      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{memo.subject}</td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(memo.priority)}`}>
          {memo.priority}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(memo.createdAt)}</td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleView}
            className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            title="View"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={handleEdit}
            className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            title="Edit"
          >
            <SquarePen size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
});

MemoRow.displayName = 'MemoRow';

interface MemoTableProps {
  memos: Memo[];
  loading: boolean;
  onView: (memo: Memo) => void;
  onEdit: (memo: Memo) => void;
  onDelete: (memo: Memo) => void;
}

const MemoTable: React.FC<MemoTableProps> = memo(({ memos, loading, onView, onEdit, onDelete }) => {
  // Memoize the rows rendering
  const tableRows = useMemo(() => {
    return memos.map((memo) => (
      <MemoRow
        key={memo.id}
        memo={memo}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ));
  }, [memos, onView, onEdit, onDelete]);

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
          <p className="text-sm text-gray-400">Create a new memo to get started</p>
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
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Status</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Memo #</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Type</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Employee</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Subject</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Priority</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Date</th>
              <th className="px-6 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap">Actions</th>
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

MemoTable.displayName = 'MemoTable';

export default MemoTable;
