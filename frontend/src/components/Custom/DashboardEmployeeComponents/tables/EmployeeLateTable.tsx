import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../../../../api/attendanceApi';
import { useAuth } from '../../../../hooks/useAuth';
import { format } from 'date-fns';

interface EmployeeLateTableProps {
  onClose: () => void;
}

const EmployeeLateTable: React.FC<EmployeeLateTableProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLateRecords = async () => {
      if (!user?.id) return;
      try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const res = await attendanceApi.getLogs({ 
          employeeId: String(user.id),
          startDate: format(firstDay, 'yyyy-MM-dd'),
          endDate: format(lastDay, 'yyyy-MM-dd'),
          limit: 100
        });

        const lateLogs = (res.data?.data || []).filter((l: any) => l.status === 'Late');
        setRecords(lateLogs);
      } catch (err) {
        console.error("Failed to fetch late records:", err);
        setError("Failed to load records.");
      } finally {
        setLoading(false);
      }
    };

    fetchLateRecords();
  }, [user?.id]);

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Late Arrivals (Current Month)</h3>
        <button 
          onClick={onClose} 
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
        >
          Close
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="flex-1 flex justify-center items-center text-red-500 font-medium">
          {error}
        </div>
      ) : records.length === 0 ? (
        <div className="flex-1 flex justify-center items-center text-gray-500 font-medium">
          No late records found for this month.
        </div>
      ) : (
        <div className="overflow-auto flex-1">
          <table className="min-w-full bg-white border border-gray-100 rounded-xl overflow-hidden">
            <thead className="bg-gray-50 text-gray-600 sticky top-0">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider">Time In</th>
                <th className="py-3 px-4 text-right text-xs font-bold uppercase tracking-wider">Late (Mins)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-700 font-medium">{record.date}</td>
                  <td className="py-3 px-4 text-sm text-orange-600 font-semibold">
                    {record.timeIn ? new Date(record.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-red-600 font-bold text-right">
                    {record.lateMinutes || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeLateTable;
