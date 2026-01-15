import React from 'react';
import { StatusBadge } from './StatusBadge';

export interface MonitorLog {
  id: string | number;
  updated_at?: string;
  created_at?: string;
  timestamp?: string;
  name?: string;
  employee_id?: string | number;
  employee_name?: string;
  department?: string;
  time_in?: string;
  time_out?: string;
  status?: string;
  type?: string;
}

interface MonitorTableProps {
  logs: MonitorLog[];
  loading: boolean;
}

const MonitorTable: React.FC<MonitorTableProps> = ({ logs, loading }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-800">Incoming Scans</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-200 shadow-md text-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Time</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Employee</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Department</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Action</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-500 text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    <span>Loading live feed...</span>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-500 text-sm">
                  No scans recorded today.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-gray-900 font-medium">
                        {new Date(log.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(log.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs border border-gray-200 group-hover:bg-white transition-colors">
                        {log.name ? log.name.charAt(0) : '?'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-bold text-sm leading-tight">{log.name || 'Unknown'}</span>
                        <span className="text-[10px] text-gray-500 font-mono font-bold leading-tight uppercase tracking-tighter">{log.employee_id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {log.department || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-black px-2 py-1 rounded-lg ${
                      log.time_out && new Date(log.updated_at).getTime() === new Date(log.time_out).getTime() 
                      ? 'bg-orange-50 text-orange-600' 
                      : 'bg-blue-50 text-blue-600'
                    }`}>
                      {log.time_out && new Date(log.updated_at).getTime() === new Date(log.time_out).getTime() ? 'OUT' : 'IN'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={log.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonitorTable;
