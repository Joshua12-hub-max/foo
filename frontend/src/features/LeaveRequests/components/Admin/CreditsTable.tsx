import React, { useState, useEffect } from 'react';
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
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        onSearchChange(localSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, searchTerm, onSearchChange]);

  // Sync local state if prop changes independently
  useEffect(() => {
    if (searchTerm !== localSearch) {
       setLocalSearch(searchTerm);
    }
  }, [searchTerm]); // Only sync when prop really changes

  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1 h-full flex flex-col">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl">
        <h3 className="font-bold text-gray-800 text-lg">Employee Leave Balances</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search employee..." 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 outline-none transition-all w-64"
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
      
      <div className="overflow-x-auto bg-[#F8F9FA] rounded-lg">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Employee ID</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Employee</th>
              <th className="px-6 py-4 text-center text-sm font-bold tracking-wide">Credit Type</th>
              <th className="px-6 py-4 text-center text-sm font-bold tracking-wide">Balance</th>
              <th className="px-6 py-4 text-center text-sm font-bold tracking-wide">Usage</th>
              <th className="px-6 py-4 text-center text-sm font-bold tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                    Loading credits...
                  </div>
                </td>
              </tr>
            ) : credits.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    No credit records found
                  </div>
                </td>
              </tr>
            ) : credits.map((credit, idx) => (
              <tr key={idx} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                  {credit.employeeId || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      {(credit.firstName || credit.lastName) 
                        ? `${credit.firstName || ''} ${credit.lastName || ''}`.trim()
                        : 'Unknown Employee'
                      }
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{credit.department || 'No Department'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                  {credit.creditType}
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                  {credit.balance}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col gap-1 items-center">
                    {(credit.daysUsedWithPay > 0 || credit.daysUsedWithoutPay > 0) ? (
                      <>
                        {credit.daysUsedWithPay > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-50 text-gray-600 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            {credit.daysUsedWithPay}d Paid
                          </span>
                        )}
                        {credit.daysUsedWithoutPay > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-50 text-gray-600 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            {credit.daysUsedWithoutPay}d Unpaid
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => onEdit(credit)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                      title="Edit Balance"
                    >
                      <SquarePen className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(credit)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
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
