import React, { useState } from 'react';
import { FileText, Eye, Edit, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UI_COLORS, STATUS_GREEN, STATUS_AMBER, SLATE_BLUE, STATUS_GRAY } from '../../../utils/colorPalette';

const ITEMS_PER_PAGE = 12;

const EvaluationTable = ({ employees, loading }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Finalized': 
      case 'Acknowledged':
        return { color: 'bg-green-100 text-green-800 border-green-200', label: status };
      case 'Submitted': 
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Submitted' };
      case 'Draft': 
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Draft' };
      case 'Overdue': 
        return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Overdue' };
      default: 
        return { color: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Not Started' };
    }
  };

  const handleAction = (employee) => {
     if (!employee.status || employee.status === 'Not Started') {
        navigate(`/admin-dashboard/performance/reviews/new?employeeId=${employee.id}`);
     } else {
        if (employee.review_id) {
            navigate(`/admin-dashboard/performance/reviews/${employee.review_id}`);
        } else {
            navigate(`/admin-dashboard/performance/reviews/new?employeeId=${employee.id}`);
        }
     }
  };

  // Pagination calculations
  const totalPages = Math.ceil(employees.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEmployees = employees.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto bg-gray-50 rounded-lg">
        <table className="w-full text-left min-w-[1200px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Employee</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Department</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Score</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Last Evaluation</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Status</th>
              <th className="px-6 py-4 text-right text-sm font-bold tracking-wide whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedEmployees.map((employee) => {
               const statusConfig = getStatusConfig(employee.status);
               return (
              <tr key={employee.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors group">
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                      {employee.avatar_url ? (
                          <img src={employee.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold border border-gray-300">
                              {employee.first_name?.[0]}{employee.last_name?.[0]}
                          </div>
                      )}
                      <div>
                          <div className="font-bold text-gray-800 text-sm">{employee.name}</div>
                          <div className="text-xs text-gray-500">{employee.job_title}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{employee.employee_id}</div>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                   {employee.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   {employee.score != null && employee.score !== '' ? (
                       <span className="font-bold text-gray-800">{parseFloat(employee.score).toFixed(2)} <span className="text-gray-500 font-normal text-sm">/ 5.0</span></span>
                   ) : (
                       <span className="text-gray-400 text-sm">-</span>
                   )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                   {employee.last_evaluation_date ? new Date(employee.last_evaluation_date).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleAction(employee)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900 transition-all shadow-sm"
                  >
                    {employee.status === 'Not Started' ? (
                        <>
                            <Edit size={14} />
                            <span>Evaluate</span>
                        </>
                    ) : (
                        <>
                            <Eye size={14} />
                            <span>View</span>
                        </>
                    )}
                  </button>
                </td>
              </tr>
            )})}
            {employees.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-16 text-center text-gray-500 bg-gray-50/50">
                  <div className="flex flex-col items-center justify-center">
                     <User size={48} className="text-gray-300 mb-3" />
                     <p>No employees found matching your filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - DTR Style */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 p-6 border-t border-gray-100 bg-white">
          <div className="text-sm text-gray-800">
            Showing <span className="font-semibold text-gray-800">{startIndex + 1}–{Math.min(endIndex, employees.length)}</span> of <span className="font-semibold text-gray-800">{employees.length}</span> records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 border border-gray-200 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all text-sm font-medium text-gray-800"
            >
              Previous
            </button>
            <span className="text-sm px-4 py-2 bg-gray-50 text-gray-800 rounded-lg font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-6 py-2 bg-gray-200 border border-gray-200 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all text-sm font-medium text-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationTable;

