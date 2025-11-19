import { useState, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const getStatusStyle = (status) => {
  switch (status) {
    case 'Approved':
      return 'bg-green-100 text-green-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-red-100 text-red-800';
  }
};

export default function LeaveTable({ onClose, employees = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [successMessage] = useState(null);
  const [error, setError] = useState(null);

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return employees;
    
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(query) ||
      emp.id.toLowerCase().includes(query) ||
      emp.department.toLowerCase().includes(query) ||
      emp.leaveType?.toLowerCase().includes(query) ||
      emp.status.toLowerCase().includes(query)
    );
  }, [searchQuery, employees]);

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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">On-Leave Employees</h2>
          <p className="text-sm text-gray-800 mt-1">Employees currently on leave</p>
        </div>
        <button
          onClick={onClose}
          className="text-[#274b46] hover:text-[#34645c] text-2xl leading-none"
        >
          ✕
        </button>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Search */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#274b46]" />
          <input
            type="text"
            placeholder="Search by name, ID, or department..."
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
          <table className="w-full min-w-[1200px]">
            <thead className="bg-[#274b46] text-white">
              <tr>
                {["Status", "Department", "Employee ID", "Name", "Leave Type", "Start Date", "End Date", "Duration"].map((header) => (
                  <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentEmployees.length ? (
                currentEmployees.map((employee) => {
                  const start = new Date(employee.startDate);
                  const end = new Date(employee.endDate);
                  const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                  return (
                    <tr key={employee.id} className="hover:bg-[#34645c] transition-colors">
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-sm font-medium inline-block ${getStatusStyle(employee.status)}`} style={{borderRadius: '20px'}}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">{employee.department}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{employee.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{employee.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{employee.leaveType || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{employee.startDate}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{employee.endDate}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{duration} days</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Search className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-lg font-medium">No records found</p>
                      <p className="text-sm mt-1">
                        {searchQuery ? "Try adjusting your search terms" : "No data available"}
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
              className="px-4 py-2 bg-[#F8F9FA] border border-[#274b46] rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all text-sm font-medium text-gray-800"
            >
              Previous
            </button>
            <span className="text-sm px-4 py-2 bg-gray-50 text-gray-800 rounded-lg font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-4 py-2 bg-[#F8F9FA] border border-[#274b46] rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all text-sm font-medium text-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}