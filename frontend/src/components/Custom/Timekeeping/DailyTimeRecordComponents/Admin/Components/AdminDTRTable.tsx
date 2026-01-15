import React from "react";
import { Search, Edit } from "lucide-react";
import { TABLE_HEADERS } from "../Constants/adminDTR.constant";
import { DTRRecord, DTRFilters } from "../Utils/adminDTRUtils";

interface AdminDTRTableProps {
  currentItems: DTRRecord[];
  getStatusBadge: (status: string) => string;
  debouncedSearchQuery: string;
  filters: DTRFilters;
  onEdit: (item: DTRRecord) => void;
}

export const AdminDTRTable: React.FC<AdminDTRTableProps> = ({ 
  currentItems,  
  getStatusBadge, 
  debouncedSearchQuery, 
  filters,
  onEdit
}) => {
  const hasActiveFilters = debouncedSearchQuery || Object.values(filters).some(v => v);
  
  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
      <div className="overflow-x-auto bg-gray-50 rounded-lg">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              {TABLE_HEADERS.map((header) => (
                <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">
                  {header}
                </th>
              ))}
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentItems.length ? (
              currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                  <td className="px-6 py-4">
                    <span 
                      className={`${getStatusBadge(item.status)} px-3 py-1 text-sm font-medium inline-block`} 
                      style={{borderRadius: '20px'}}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.employeeId}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.timeIn}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.timeOut}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.hoursWorked}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.remarks}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Edit Record"
                    >
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={TABLE_HEADERS.length} className="px-6 py-12 text-center">
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
