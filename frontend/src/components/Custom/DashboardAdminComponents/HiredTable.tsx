import { useState, useMemo, useCallback } from 'react';
import { Search, X, UserCheck } from 'lucide-react';

interface HiredApplicant {
  id: string | number;
  name: string;
  department?: string;
  position?: string;
  jobTitle?: string;
  dateHired?: string;
  dateHired?: string;
  [key: string]: unknown;
}

interface HiredTableProps {
  onClose: () => void;
  employees?: HiredApplicant[];
}

const ITEMS_PER_PAGE = 10;

export default function HiredTable({ onClose, employees = [] }: HiredTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return employees;
    return employees.filter(emp =>
      emp.name?.toLowerCase().includes(query) ||
      String(emp.id)?.toLowerCase().includes(query) ||
      emp.department?.toLowerCase().includes(query) ||
      emp.position?.toLowerCase().includes(query)
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

  const formatDate = (date: string | undefined) => {
    if (!date || date === '-') return '-';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return date;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Title removed to avoid duplication with Dashboard header */}
      <div className="flex justify-end items-center mb-3">
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
            placeholder="Search by name, department..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg w-full text-sm focus:ring-1 focus:ring-gray-400 outline-none"
          />
        </div>
        {searchQuery && (
          <span className="text-xs text-gray-500">{filteredEmployees.length} found</span>
        )}
      </div>

      {/* Styled Table matching PlantillaTable */}
      <div className="flex-1 overflow-auto rounded-lg border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">ID</th>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Department</th>
              <th className="px-4 py-3 text-left font-semibold">Position</th>
              <th className="px-4 py-3 text-left font-semibold">Date Hired</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentEmployees.length ? (
              currentEmployees.map(employee => (
                <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600 font-medium">{employee.id}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{employee.name}</td>
                  <td className="px-4 py-3 text-gray-600">{employee.department || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{employee.position || employee.jobTitle || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{formatDate(employee.dateHired || employee.dateHired)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  {searchQuery ? 'No matching records' : 'No hired applicants yet'}
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
