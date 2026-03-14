import { useState, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';

interface Employee {
  id: string | number;
  name: string;
  department?: string;
  status?: string;
  timeIn?: string;
  timeOut?: string;
}

interface PresentTableProps {
  onClose: () => void;
  employees?: Employee[];
}

const ITEMS_PER_PAGE = 10;

export default function PresentTable({ onClose, employees = [] }: PresentTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return employees;
    return employees.filter(emp =>
      emp.name?.toLowerCase().includes(query) ||
      String(emp.id)?.toLowerCase().includes(query) ||
      emp.department?.toLowerCase().includes(query)
    );
  }, [searchQuery, employees]);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentEmployees = filteredEmployees.slice(startIndex, endIndex);
    return { totalPages, startIndex, endIndex, currentEmployees };
  }, [filteredEmployees, currentPage]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }, []);

  const { totalPages, startIndex, endIndex, currentEmployees } = paginationData;

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-bold text-gray-800">Present Employees</h2>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
          <X size={18} />
        </button>
      </div>

      {/* Compact Search */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg w-full text-sm focus:ring-1 focus:ring-gray-400 outline-none"
          />
        </div>
        {searchQuery && (
          <span className="text-xs text-gray-500">{filteredEmployees.length} found</span>
        )}
      </div>

      {/* Styled Table matching the new design */}
      <div className="flex-1 overflow-auto rounded-lg border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              <th className="px-4 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Status</th>
              <th className="px-4 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">ID</th>
              <th className="px-4 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Name</th>
              <th className="px-4 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Department</th>
              <th className="px-4 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Time In</th>
              <th className="px-4 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Time Out</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentEmployees.length ? (
              currentEmployees.map(employee => (
                <tr key={employee.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors group bg-white">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">{employee.id}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">{employee.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 font-medium whitespace-nowrap">{employee.department}</td>
                  <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">{employee.timeIn}</td>
                  <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">{employee.timeOut || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm font-medium">
                  {searchQuery ? 'No matching records' : 'No data available'}
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
