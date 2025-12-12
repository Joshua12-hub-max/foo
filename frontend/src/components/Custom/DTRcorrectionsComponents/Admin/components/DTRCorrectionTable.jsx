import { Search, SquarePen, Eye } from "lucide-react";
import { TABLE_HEADERS, STATUS } from "../Constants/dtrCorrection.constant";

export const DTRTable = ({currentItems, actionLoading, onView, onEdit, searchQuery, filters}) => {
  const hasActiveFilters = searchQuery || Object.values(filters).some(v => v);

  return (
    <div className="overflow-x-auto bg-gray-50 rounded-lg scrollbar-bg-white">
      <table className="w-full min-w-[1200px]">
        <thead className="bg-gray-200 shadow-md text-gray-700">
          <tr>
            {TABLE_HEADERS.map((header) => (
              <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {currentItems.length > 0 ? (
            currentItems.map((item) => (
             <tr key={item.id} className={`hover:bg-[#34645c] transition-colors ${actionLoading === item.id ? 'opacity-50' : ''}`}>
                {/* Department */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {item.department}
                </td>

                {/* Employee Name */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {item.employeeName}
                </td>

                {/* Employee ID */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {item.employeeid}
                </td>

                {/* Date */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {item.date}
                </td>

                {/* Time In */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {item.timeIn}
                </td>

                {/* Time Out */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {item.timeOut}
                </td>

                {/* Corrected Time */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {item.correctedTime}
                </td>

                {/* Reason */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {item.reason}
                </td>
                
                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      item.status === STATUS.APPROVED
                        ? "bg-green-100 text-green-700"
                      : item.status === STATUS.PENDING
                        ? "bg-yellow-100 text-yellow-700"
                      : item.status === STATUS.REJECTED
                        ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-sm whitespace-nowrap space-x-3">
                  <button onClick={() => onView(item)} disabled={actionLoading === item.id}>
                    <Eye className="w-4 h-4 inline" />
                  </button>

                  <button onClick={() => onEdit(item)} disabled={actionLoading === item.id}>
                    <SquarePen className="w-4 h-4 inline" />
                  </button>
                </td>

              </tr>

            ))
          ) : (
            <tr>
              <td colSpan="9" className="px-6 py-12 text-center">
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <Search className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-lg font-medium">No records found</p>
                  <p className="text-sm mt-1">
                    {hasActiveFilters
                      ? "Try adjusting your filters or search terms" 
                      : "No correction requests available"}
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};