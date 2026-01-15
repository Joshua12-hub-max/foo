import { Search, SquarePen, Trash2, Plus, Loader2 } from 'lucide-react';
import Pagination from '@/components/CustomUI/Pagination';

import { LeaveCredit } from '../../types';

interface CreditsTableProps {
  credits: LeaveCredit[];
  loading: boolean;
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
  onPageChange: (page: number) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAdd: () => void;
  onEdit: (credit: LeaveCredit) => void;
  onDelete: (credit: LeaveCredit) => void;
}

const CreditsTable = ({ 
  credits, 
  loading, 
  pagination,
  onPageChange,
  searchTerm,
  onSearchChange,
  onAdd, 
  onEdit, 
  onDelete 
}: CreditsTableProps) => {

  const { page, totalPages, totalItems, limit } = pagination;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-semibold text-gray-700">Employee Leave Balances</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search employee..." 
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all w-64"
            />
          </div>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Credit
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1 p-4">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Credit Type</th>
              <th className="px-6 py-4">Balance</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                    Loading credits...
                  </div>
                </td>
              </tr>
            ) : credits.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    No credit records found
                  </div>
                </td>
              </tr>
            ) : credits.map((credit, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {(credit.first_name || credit.last_name) 
                        ? `${credit.first_name || ''} ${credit.last_name || ''}`.trim()
                        : credit.employee_id || 'Unknown Employee'
                      }
                    </div>
                    <div className="text-xs text-gray-500">{credit.employee_id || 'N/A'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{credit.department || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                    credit.credit_type === 'Vacation Leave' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                    credit.credit_type === 'Sick Leave' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-gray-50 text-gray-700 border border-gray-100'
                  }`}>
                    {credit.credit_type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-semibold ${credit.balance > 0 ? 'text-teal-600' : 'text-red-500'}`}>
                    {credit.balance}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onEdit(credit)}
                      className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                      title="Edit Balance"
                    >
                      <SquarePen className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(credit)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Credit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={onPageChange}
            itemsPerPage={limit}
          />
        )}
      </div>
    </div>
  );
};

export default CreditsTable;
