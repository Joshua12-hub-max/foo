import { useState, useMemo, useEffect } from 'react';
import { Search, X, Loader2, Calendar } from 'lucide-react';
import { leaveApi } from '../../../api/leaveApi';

interface LeaveRequest {
  id: number;
  employeeId: string;
  name: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  startDateRaw: string;
  endDateRaw: string;
  status: string;
}

interface LeaveTableProps {
  onClose: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function LeaveTable({ onClose }: LeaveTableProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await leaveApi.getAllLeaves();
        // Rely on axios toCamelCase interceptor for property naming
        const data = response.data as unknown as { success: boolean; applications?: any[]; leaves?: any[] };
        const leavesData = data.applications || data.leaves || [];
        
        if (leavesData.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const approvedLeaves: LeaveRequest[] = leavesData
            .filter((leave: any) => {
              if (leave.status !== 'Approved') return false;
              const startDate = new Date(leave.startDate || leave.startDate);
              const endDate = new Date(leave.endDate || leave.endDate);
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(23, 59, 59, 999);
              return today >= startDate && today <= endDate;
            })
            .map((leave: any) => ({
              id: leave.id,
              employeeId: leave.employeeId || leave.employeeId,
              name: `${leave.firstName || leave.firstName || ''} ${leave.lastName || leave.lastName || ''}`.trim() || 'Unknown',
              department: leave.department || 'N/A',
              leaveType: leave.leaveType || leave.leaveType,
              startDate: new Date(leave.startDate || leave.startDate).toLocaleDateString(),
              endDate: new Date(leave.endDate || leave.endDate).toLocaleDateString(),
              startDateRaw: leave.startDate || leave.startDate,
              endDateRaw: leave.endDate || leave.endDate,
              status: leave.status
            }));
          setLeaveRequests(approvedLeaves);
        }
      } catch (err) {
        console.error('Failed to fetch leave requests:', err);
        setError('Failed to load leave requests');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaveRequests();
  }, []);

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return leaveRequests;
    return leaveRequests.filter(leave =>
      leave.name?.toLowerCase().includes(query) ||
      leave.employeeId?.toLowerCase().includes(query) ||
      leave.department?.toLowerCase().includes(query)
    );
  }, [searchQuery, leaveRequests]);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentEmployees = filteredEmployees.slice(startIndex, endIndex);
    return { totalPages, startIndex, endIndex, currentEmployees };
  }, [filteredEmployees, currentPage]);

  const { totalPages, startIndex, endIndex, currentEmployees } = paginationData;

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-gray-500 animate-spin mb-2" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-bold text-gray-800">Employees On Leave</h2>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
          <X size={18} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm mb-3">{error}</div>
      )}

      {/* Compact Search */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg w-full text-sm focus:ring-1 focus:ring-gray-400 outline-none"
          />
        </div>
        {searchQuery && (
          <span className="text-xs text-gray-500">{filteredEmployees.length} found</span>
        )}
      </div>

      {/* Styled Table matching PlantillaTable */}
      {/* Styled Table matching the new design */}
      <div className="flex-1 overflow-auto rounded-lg border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              <th className="px-4 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">ID</th>
              <th className="px-4 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Name</th>
              <th className="px-4 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Department</th>
              <th className="px-4 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Type</th>
              <th className="px-4 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Period</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentEmployees.length ? (
              currentEmployees.map(emp => {
                const start = new Date(emp.startDateRaw);
                const end = new Date(emp.endDateRaw);
                const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                return (
                  <tr key={emp.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors group bg-white">
                    <td className="px-4 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">{emp.employeeId}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">{emp.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 font-medium whitespace-nowrap">{emp.department}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                        {emp.leaveType}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {emp.startDate} - {emp.endDate} <span className="text-xs text-gray-400 font-bold ml-1">({duration}d)</span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm font-medium">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  {searchQuery ? 'No matching records' : 'No employees on leave today'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Compact Pagination */}
      {filteredEmployees.length > ITEMS_PER_PAGE && (
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {startIndex + 1}–{Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs bg-gray-100 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-2 py-1 text-xs">{currentPage}/{totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs bg-gray-100 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
