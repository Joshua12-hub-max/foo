import React from "react";
import { Edit, FileText } from "lucide-react";
import { TABLE_COLUMNS, TableColumn } from "../../Constants/adminDTR.constant";
import { DTRRecord, DTRFilters } from "../../Utils/adminDTRUtils";
import { formatDuration } from "@/utils/formatters";

interface AdminDTRTableProps {
  currentItems: DTRRecord[];
  getStatusBadge: (status: string) => string;
  debouncedSearchQuery: string;
  filters: DTRFilters;
  onEdit: (item: DTRRecord) => void;
  onReview?: (item: DTRRecord) => void;
}

// Helper to get alignment class
const getAlignClass = (align: TableColumn['align']): string => {
  switch (align) {
    case 'center': return 'text-center';
    case 'right': return 'text-right';
    default: return 'text-left';
  }
};

// Type-safe cell renderer
const renderCell = (
  item: DTRRecord, 
  column: TableColumn, 
  getStatusBadge: (status: string) => string
): React.ReactNode => {
  const value = item[column.key];
  
  // Special rendering for status column
  if (column.key === 'status') {
    return (
      <span 
        className={`${getStatusBadge(String(value))} px-2 py-1 text-xs font-xs inline-block rounded-full`}
      >
        {String(value)}
      </span>
    );
  }
  
  // Special rendering for name column to include department
  if (column.key === 'name') {
    const employeeName = item.name || 'Unknown Employee';
    const departmentName = item.department || 'No Department';
    
    return (
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${employeeName === 'Unknown Employee' ? 'text-gray-400 italic' : 'text-gray-900'}`}>
          {employeeName}
        </span>
        <span className="text-xs text-gray-500">{departmentName}</span>
      </div>
    );
  }

  // Special rendering for lates/undertime
  if (column.key === 'lateMinutes' || column.key === 'undertimeMinutes') {
    return formatDuration(Number(value || 0));
  }

  // Special rendering for duties
  if (column.key === 'duties') {
    const rawValue = String(value);
    // Don't render the badge if it's N/A, undefined, or empty
    if (!rawValue || rawValue === 'undefined' || rawValue === 'null' || rawValue === 'N/A' || rawValue === 'No Schedule') {
       return <span className="text-gray-400 text-xs">-</span>;
    }

    const isIrregular = rawValue.toLowerCase().includes('irregular');
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isIrregular ? 'bg-purple-100 text-purple-800' : 'bg-blue-50 text-blue-700'}`}>
        {rawValue}
      </span>
    );
  }
  
  const cellValue = item[column.key];
  return String(cellValue ?? '-');
};

export const AdminDTRTable: React.FC<AdminDTRTableProps> = ({ 
  currentItems,  
  getStatusBadge, 
  debouncedSearchQuery, 
  filters,
  onEdit,
  onReview,
}) => {
  const hasActiveFilters = debouncedSearchQuery || Object.values(filters).some(v => v);
  
  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
      <div className="overflow-x-auto bg-gray-50 rounded-lg">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              {TABLE_COLUMNS.map((column) => (
                <th 
                  key={column.key} 
                  className={`px-6 py-4 ${getAlignClass(column.align)} text-sm font-bold tracking-wide whitespace-nowrap`}
                >
                  {column.header}
                </th>
              ))}
              <th className="px-6 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentItems.length > 0 ? (
              <>
                {currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                    {TABLE_COLUMNS.map((column) => (
                      <td 
                        key={column.key} 
                        className={`px-6 py-4 text-sm text-gray-800 whitespace-nowrap ${getAlignClass(column.align)}`}
                      >
                        {renderCell(item, column, getStatusBadge)}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-sm text-gray-800 text-center whitespace-nowrap">
                      <div className="flex justify-center space-x-2">
                        {item.correctionStatus === 'Pending' && (
                          <button
                            onClick={() => onReview && onReview(item)}
                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                            title="Review Correction Request"
                          >
                            <FileText size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(item)}
                          className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                          title="Edit Record"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            ) : (
              <tr>
                <td colSpan={TABLE_COLUMNS.length + 1} className="px-6 py-12 text-center">
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
