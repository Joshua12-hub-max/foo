import React from 'react';
import { Search, ArrowRight } from "lucide-react";
import { TABLE_HEADERS } from "@/features/Performance/constants/adminPerformance.constant";
import { useNavigate } from 'react-router-dom';
import { PerformanceTableItem } from '@/features/Performance/Utils/adminPerformanceUtils';

interface FiltersState {
  department: string;
  employee: string;
  status: string;
  [key: string]: any;
}

interface PerformanceTableProps {
  currentItems: PerformanceTableItem[];
  getStatusBadge: (status: string) => React.ReactNode;
  debouncedSearchQuery: string;
  filters: FiltersState;
  isLoading: boolean;
}

export const PerformanceTable: React.FC<PerformanceTableProps> = ({ 
  currentItems, 
  getStatusBadge, 
  debouncedSearchQuery, 
  filters, 
  isLoading 
}) => {
  const navigate = useNavigate();
  const hasActiveFilters = debouncedSearchQuery || Object.values(filters).some(v => v && v !== 'All Status');

  const handleView = (item: PerformanceTableItem) => {
    if (item.reviewId) {
        navigate(`/admin-dashboard/performance/reviews/${item.reviewId}`);
    } else {
        // Use systemId (integer PK) for new creation to match backend expectation
        navigate(`/admin-dashboard/performance/reviews/new?employeeId=${item.systemId}`);
    }
  };
  
  // Master Design: Minimalist Monochrome Badge Logic
  const getBadgeStyle = (status?: string) => {
      const s = status?.toLowerCase() || '';
      if (s.includes('completed') || s.includes('finalized') || s.includes('acknowledged')) return 'bg-white text-gray-800 border border-gray-300';
      if (s.includes('pending') || s.includes('process')) return 'bg-black text-white border border-black';
      if (s.includes('draft')) return 'bg-gray-50 text-gray-400 border border-gray-100';
      return 'bg-gray-50 text-gray-500 border border-gray-200';
  }

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm font-medium">Loading performance records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1 mt-6">
      <div className="overflow-x-auto bg-gray-50 rounded-lg">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              {TABLE_HEADERS.map((header: string) => (
                <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">
                  {header}
                </th>
              ))}
              <th className="px-6 py-4 text-right text-sm font-bold tracking-wide whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentItems.length ? (
              currentItems.map((item) => (
                <tr 
                    key={`${item.id}-${item.reviewId || 'new'}`} 
                    className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors cursor-pointer group"
                    onClick={() => handleView(item)}
                >
                  <td className="px-6 py-4">
                    <span className={`${getBadgeStyle(item.status)} px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded inline-block`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-900">{item.employee_id || item.id}</td>
                  <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium">{item.department}</td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium">{item.jobTitle}</td>
                  <td className="px-6 py-4 text-xs text-gray-400 font-medium">{item.lastEvaluation}</td>
                  <td className="px-6 py-4">
                      {item.score ? <span className="text-lg font-black text-gray-900">{item.score}</span> : <span className="text-gray-300 text-xs italic">Pending</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-100 text-gray-300 group-hover:border-gray-300 group-hover:text-gray-900 transition-all">
                        <ArrowRight size={16} />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={TABLE_HEADERS.length + 1} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <p className="text-sm font-bold text-gray-600">No records found</p>
                    <p className="text-xs mt-1 text-gray-400">
                      {hasActiveFilters
                        ? "Try adjusting your filters" 
                        : "No performance data available"}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
