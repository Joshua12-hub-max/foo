import React, { useState, useMemo } from 'react';
import { StatusBadge } from './StatusBadge';
import Pagination from '@/components/CustomUI/Pagination';

import { BiometricsLog } from '@/types';

// Use strict type from API
type MonitorLog = BiometricsLog;

const ITEMS_PER_PAGE = 10;

interface MonitorTableProps {
  logs: MonitorLog[];
  loading: boolean;
}

const MonitorTable: React.FC<MonitorTableProps> = ({ logs, loading }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when logs change significantly
  const totalPages = useMemo(() => Math.max(1, Math.ceil(logs.length / ITEMS_PER_PAGE)), [logs.length]);
  
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return logs.slice(start, start + ITEMS_PER_PAGE);
  }, [logs, currentPage]);

  // Clamp current page if data shrinks
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage) {
    setCurrentPage(safePage);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-800">Incoming Scans</h3>
        <span className="text-xs text-gray-500 font-medium">{logs.length} total records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-200 shadow-md text-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Status</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Employee ID</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Employee Name</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Date/Time</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Duties</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Department</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Source</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500 text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    <span>Loading live feed...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500 text-sm">
                  No scans recorded today.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => {
                  const isOut = log.type === 'OUT';
                  return (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <StatusBadge status={log.status || 'Pending'} />
                  </td>
                  <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 font-mono font-bold leading-tight uppercase tracking-tighter">{log.employeeId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs border border-gray-200 group-hover:bg-white transition-colors">
                        {log.name ? log.name.charAt(0) : '?'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-bold text-sm leading-tight">{log.name || 'Unknown'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                    {log.scanTime ? new Date(log.scanTime).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-blue-600 uppercase tracking-tighter">{log.duties || 'No Schedule'}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {log.department || '-'}
                  </td>
                   <td className="px-6 py-4">
                    <span className="text-gray-500 text-xs font-bold uppercase">{log.source}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-black px-2 py-1 rounded-lg ${
                      isOut
                      ? 'bg-orange-50 text-orange-600' 
                      : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {isOut ? 'OUT' : 'IN'}
                    </span>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && logs.length > ITEMS_PER_PAGE && (
        <div className="px-4 py-3 border-t border-gray-100">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={logs.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      )}
    </div>
  );
};

export default MonitorTable;
