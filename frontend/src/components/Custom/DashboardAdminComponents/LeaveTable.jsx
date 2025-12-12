import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Calendar, FileText, Loader2 } from 'lucide-react';
import { leaveApi } from '../../../api/leaveApi';

const ITEMS_PER_PAGE = 10;

export default function LeaveTable({ onClose }) {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch leave requests on mount - only approved ones
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await leaveApi.getAllLeaves();
        if (response.data && response.data.leaves) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Filter only approved leaves that are currently active (today is within leave period)
          const approvedLeaves = response.data.leaves
            .filter(leave => {
              if (leave.status !== 'Approved') return false;
              const startDate = new Date(leave.start_date);
              const endDate = new Date(leave.end_date);
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(23, 59, 59, 999);
              return today >= startDate && today <= endDate;
            })
            .map(leave => ({
              id: leave.id,
              employeeId: leave.employee_id,
              name: `${leave.first_name || ''} ${leave.last_name || ''}`.trim() || 'Unknown',
              department: leave.department || 'N/A',
              leaveType: leave.leave_type,
              startDate: new Date(leave.start_date).toLocaleDateString(),
              endDate: new Date(leave.end_date).toLocaleDateString(),
              startDateRaw: leave.start_date,
              endDateRaw: leave.end_date,
              withPay: leave.with_pay,
              reason: leave.reason
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

  // Filter by search only (status is already filtered to Approved)
  const filteredEmployees = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return leaveRequests;
    
    return leaveRequests.filter(leave =>
      leave.name.toLowerCase().includes(query) ||
      leave.employeeId?.toLowerCase().includes(query) ||
      leave.department.toLowerCase().includes(query) ||
      leave.leaveType?.toLowerCase().includes(query)
    );
  }, [searchQuery, leaveRequests]);

  // Pagination
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentEmployees = filteredEmployees.slice(startIndex, endIndex);
    
    return { totalPages, startIndex, endIndex, currentEmployees };
  }, [filteredEmployees, currentPage]);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }, []);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, paginationData.totalPages));
  }, [paginationData.totalPages]);

  const { totalPages, startIndex, endIndex, currentEmployees } = paginationData;

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
        <p className="text-gray-500">Loading employees on leave...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            Employees On Leave
          </h2>
          <p className="text-sm text-gray-600 mt-1">Currently approved leaves for today</p>
        </div>
        <button
          onClick={onClose}
          className="text-[#274b46] hover:text-[#34645c] text-2xl leading-none"
        >
          ✕
        </button>
      </div>

      <hr className="mb-4 border-[1px] border-[#274b46]" />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#274b46]" />
          <input
            type="text"
            placeholder="Search by name, ID, department..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 bg-[#F8F9FA] border border-gray-300 rounded-lg w-full text-sm focus:ring-2 focus:ring-[#274b46] focus:border-[#274b46] transition-all"
          />
        </div>
        
        {searchQuery && (
          <div className="text-sm text-gray-600">
            Found <span className="font-semibold text-gray-800">{filteredEmployees.length}</span> result{filteredEmployees.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Modern Table */}
      <div className="flex-1 overflow-hidden rounded-xl bg-white p-1">
        <div className="overflow-x-auto bg-gray-50 rounded-lg">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-200 shadow-md text-gray-700">
              <tr>
                {["Department", "Employee ID", "Name", "Leave Type", "Start Date", "End Date", "Duration"].map((header) => (
                  <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentEmployees.length ? (
                currentEmployees.map((employee) => {
                  const start = new Date(employee.startDateRaw);
                  const end = new Date(employee.endDateRaw);
                  const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                  return (
                    <tr key={employee.id} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-800">{employee.department}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{employee.employeeId}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{employee.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{employee.leaveType || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{employee.startDate}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{employee.endDate}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{duration} day{duration !== 1 ? 's' : ''}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Calendar className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-lg font-medium">No employees on leave today</p>
                      <p className="text-sm mt-1">
                        {searchQuery ? "Try adjusting your search terms" : "All employees are present"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredEmployees.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-800">
            Showing <span className="font-semibold text-gray-800">{startIndex + 1}–{Math.min(endIndex, filteredEmployees.length)}</span> of <span className="font-semibold text-gray-800">{filteredEmployees.length}</span> records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 border border-gray-200 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all text-sm font-medium text-gray-800"
            >
              Previous
            </button>
            <span className="text-sm px-4 py-2 bg-gray-50 text-gray-800 rounded-lg font-semibold">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-6 py-2 bg-gray-200 border border-gray-200 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all text-sm font-medium text-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}