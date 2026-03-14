import { Search, SquarePen } from "lucide-react";
import { TABLE_HEADERS } from "../../Constants/employeeDTR.constant";
import { EmployeeDTRRecord, EmployeeDTRFilters, EmployeeInfo } from "../../Utils/employeeDTRUtils";
interface EmployeeDTRTableProps {
  currentItems: EmployeeDTRRecord[];
  getStatusBadge: (status: string) => string;
  debouncedSearchQuery: string;
  filters: EmployeeDTRFilters;
  onRequestCorrection: (record: EmployeeDTRRecord) => void;
  employeeInfo: EmployeeInfo | null;
  totals?: {
    lateMinutes: number;
    undertimeMinutes: number;
    hoursWorked: string;
  };
}

export const EmployeeDTRTable: React.FC<EmployeeDTRTableProps> = ({ 
  currentItems, 
  getStatusBadge,
  debouncedSearchQuery,
  filters,
  onRequestCorrection,
  employeeInfo,
  totals
}) => {
  const hasActiveFilters = debouncedSearchQuery || Object.values(filters).some(v => v);
  const headers = [...TABLE_HEADERS, "Actions"];
  
  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
      <div className="overflow-x-auto bg-gray-50 rounded-lg">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentItems.length ? (
              <>
                {currentItems.map((item) => (
                  <tr key={`${item.id}-${item.date}`} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`${getStatusBadge(item.status)} px-3 py-1 text-sm font-medium inline-block`} style={{borderRadius: '20px'}}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-medium whitespace-nowrap">{employeeInfo?.id || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{employeeInfo?.department || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-medium whitespace-nowrap">{item.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{item.timeIn}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{item.timeOut}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 text-center font-medium">{item.lateMinutes || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 text-center font-medium">{item.undertimeMinutes || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{item.hoursWorked}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                      <button
                        onClick={() => onRequestCorrection(item)}
                        className="p-2 hover:bg-gray-100 text-gray-400 rounded-lg transition-colors group relative"
                        title="Request Correction"
                      >
                        <SquarePen className="w-4 h-4" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Request Correction
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Summary Row */}
                {totals && (
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <td colSpan={6} className="px-6 py-4 text-right text-gray-700 text-sm">
                      Totals:
                    </td>
                    <td className="px-6 py-4 text-center text-red-700 text-sm">{totals.lateMinutes}m</td>
                    <td className="px-6 py-4 text-center text-orange-700 text-sm">{totals.undertimeMinutes}m</td>
                    <td className="px-6 py-4 text-center text-gray-900 text-sm">{totals.hoursWorked}h</td>
                    <td className="bg-gray-100 text-sm"></td>
                  </tr>
                )}
              </>
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
