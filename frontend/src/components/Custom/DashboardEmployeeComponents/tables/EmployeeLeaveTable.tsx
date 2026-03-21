import React, { useState, useEffect } from 'react';
import { leaveApi } from '../../../../api/leaveApi';
import { LeaveBalance } from '@/types/leave.types';

interface EmployeeLeaveTableProps {
  onClose: () => void;
}

const EmployeeLeaveTable: React.FC<EmployeeLeaveTableProps> = ({ onClose }) => {
  const [credits, setCredits] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await leaveApi.getMyCredits();
        setCredits(res.data?.credits || []);
      } catch (err) {
        console.error("Failed to fetch leave credits:", err);
        setError("Failed to load leave credits.");
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, []);

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Leave Balance Details</h3>
        <button 
          onClick={onClose} 
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Close
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      ) : error ? (
        <div className="flex-1 flex justify-center items-center text-red-500">
          {error}
        </div>
      ) : credits.length === 0 ? (
        <div className="flex-1 flex justify-center items-center text-gray-500">
          No leave credits found.
        </div>
      ) : (
        <div className="overflow-auto flex-1">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead className="bg-gray-200 text-gray-700 sticky top-0">
              <tr>
                <th className="py-2 px-4 text-left">Leave Type</th>
                <th className="py-2 px-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {credits.map((credit, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-2 px-4 capitalize">{credit.creditType}</td>
                  <td className="py-2 px-4 text-right font-medium">{credit.balance}</td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold">
                <td className="py-2 px-4">Total</td>
                <td className="py-2 px-4 text-right">
                    {credits.reduce((sum, c) => sum + (parseFloat(String(c.balance)) || 0), 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeLeaveTable;
