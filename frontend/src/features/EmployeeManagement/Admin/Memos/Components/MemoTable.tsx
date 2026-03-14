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
  department?: string;
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
    <tr className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors group bg-white">
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider ${getStatusBadge(memo.status)}`}>
          {memo.status}
        </span>
      </td>
      <td className="px-6 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">{memo.memoNumber}</td>
      <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{memo.memoType}</td>
      <td className="px-6 py-4 text-sm text-gray-800">
        <div>
          <div className="text-sm font-semibold text-gray-800 whitespace-nowrap">{memo.employeeName}</div>
          <div className="text-xs text-gray-500 truncate max-w-[200px]" title={memo.department}>{memo.department || 'N/A'}</div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 min-w-[300px] max-w-[400px]">
        <div className="truncate" title={memo.subject}>
          {memo.subject}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider ${getPriorityBadge(memo.priority)}`}>
          {memo.priority}
        </span>
      </td>
      <td className="px-6 py-4 text-xs font-mono text-gray-400 whitespace-nowrap">{formatDate(memo.createdAt)}</td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-center gap-2 transition-opacity">
          <button
            onClick={handleView}
            className="p-2 border border-gray-100 bg-white hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors shadow-sm"
            title="View"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={handleEdit}
            className="p-2 border border-gray-100 bg-white hover:bg-amber-50 text-gray-400 hover:text-amber-600 rounded-lg transition-colors shadow-sm"
            title="Edit"
          >
            <SquarePen size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 border border-gray-100 bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors shadow-sm"
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
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onView: (memo: Memo) => void;
  onEdit: (memo: Memo) => void;
  onDelete: (memo: Memo) => void;
}

const MemoTable: React.FC<MemoTableProps> = memo(({ memos, loading, page = 1, totalPages = 1, onPageChange, onView, onEdit, onDelete }) => {
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
    <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden border border-gray-100">
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
          <tbody className="divide-y divide-slate-100">
            {tableRows}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Footer */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-600">
            Page <span className="font-medium text-gray-900">{page}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                page <= 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                page >= totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

MemoTable.displayName = 'MemoTable';

export default MemoTable;
