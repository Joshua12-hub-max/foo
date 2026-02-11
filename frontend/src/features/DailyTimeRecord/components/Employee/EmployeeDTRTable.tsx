import { Search, SquarePen } from "lucide-react";
import { TABLE_HEADERS } from "../../Constants/employeeDTR.constant";
import { EmployeeDTRRecord, EmployeeDTRFilters } from "../../Utils/employeeDTRUtils";

interface EmployeeDTRTableProps {
  currentItems: EmployeeDTRRecord[];
  getStatusBadge: (status: string) => string;
  debouncedSearchQuery: string;
  filters: EmployeeDTRFilters;
  onRequestCorrection: (record: EmployeeDTRRecord) => void;
}

export const EmployeeDTRTable: React.FC<EmployeeDTRTableProps> = ({ 
  currentItems, 
  getStatusBadge,
  debouncedSearchQuery,
  filters,
  onRequestCorrection
}) => {
  const hasActiveFilters = debouncedSearchQuery || Object.values(filters).some(v => v);
  const headers = [...TABLE_HEADERS, "ACTIONS"];
  
  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
      <div className="overflow-x-auto bg-gray-50 rounded-lg">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentItems.length ? (
              currentItems.map((item) => (
                <tr key={`${item.id}-${item.date}`} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">{item.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.timeIn}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.timeOut}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.hoursWorked}</td>
                  <td className="px-6 py-4">
                    <span className={`${getStatusBadge(item.status)} px-3 py-1 text-sm font-medium inline-block`} style={{borderRadius: '20px'}}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    <button
                      onClick={() => onRequestCorrection(item)}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors group relative"
                      title="Request Correction"
                    >
                      <SquarePen className="w-4 h-4" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Request Correction
                      </span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <p className="text-lg font-medium">No records found</p>
                    <p className="text-sm mt-1">
                      {hasActiveFilters
                        ? "Try adjusting your filters or search terms" 
                        : "No data available"}
                    </p>
                  </div>
                 </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
