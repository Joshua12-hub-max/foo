import { Search, Eye, SquarePen } from "lucide-react";
import { TABLE_HEADERS } from "../constants/employeeDtrCorrection.constant";

const getStatusBadge = (status) => {
  const neutral = "bg-transparent";
  return neutral;
};

export const EmployeeDTRTable = ({ 
  currentItems, 
  handleViewClick, 
  handleEditClick,
  debouncedSearchQuery,
  filters 
}) => {
  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
      <div className="overflow-x-auto bg-gray-50 rounded-lg">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
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
                  <td className="px-6 py-4 text-sm text-gray-800">
                    <div className="text-sm font-medium">
                      <div>{item.timeIn}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    <div className="text-sm font-medium">
                      <div>{item.timeOut}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    <div className="text-sm font-medium">
                      <div>{item.correctedTime}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 max-w-xs truncate">{item.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`${getStatusBadge(item.status)} px-3 py-1 text-sm font-medium inline-block`} style={{borderRadius: '20px'}}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {item.status !== "Pending" && (
                        <button
                          onClick={() => handleViewClick(item)}
                          className="text-[#274b46] hover:text-[#F8F9FA]600 hover:text-blue-800 transition-colors"
                          title="View details"
                          aria-label="View correction details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      )}
                      {item.status === "Pending" && (
                        <button
                          onClick={() => handleEditClick(item)}
                          className="text-[#274b46] hover:text-[#F8F9FA] transition-colors"
                          title="Edit correction"
                          aria-label="Edit correction"
                        >
                          <SquarePen className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Search className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-lg font-medium">No correction requests found</p>
                    <p className="text-sm mt-1">
                      {debouncedSearchQuery || Object.values(filters).some(v => v) 
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
    </div>
  );
};
