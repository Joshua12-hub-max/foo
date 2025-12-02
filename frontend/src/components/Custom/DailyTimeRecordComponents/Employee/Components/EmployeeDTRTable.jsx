import { Search } from "lucide-react";
import { TABLE_HEADERS } from "../Constants/employeeDTR.constant";

export const EmployeeDTRTable = ({ 
  currentItems, 
  getStatusBadge,
  debouncedSearchQuery,
  filters 
}) => {
  const hasActiveFilters = debouncedSearchQuery || Object.values(filters).some(v => v);
  
  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
      <div className="overflow-x-auto bg-gray-50 rounded-lg">
        <table className="w-full min-w-[800px]">
          <thead className="bg-[#274b46] text-[#F8F9FA]">
            <tr>
              {TABLE_HEADERS.map((header) => (
                <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentItems.length ? (
              currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-[#34645c] transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-800">{item.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.timeIn}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.timeOut}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.hoursWorked}</td>
                  <td className="px-6 py-4">
                    <span className={`${getStatusBadge(item.status)} px-3 py-1 text-sm font-medium inline-block`} style={{borderRadius: '20px'}}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.remarks}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={TABLE_HEADERS.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Search className="w-12 h-12 mb-3 opacity-50" />
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
