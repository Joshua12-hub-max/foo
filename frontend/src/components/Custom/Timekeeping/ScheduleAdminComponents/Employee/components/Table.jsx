import { FileText, SquarePen, Trash2 } from "lucide-react";
import { SCHEDULE_TABLE_HEADERS } from "../constants/scheduleConstants";

// Format date to readable format
const formatDate = (dateString) => {
  if (!dateString || dateString === 'Recurring') return dateString;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
};

// Format time to readable format
const formatTime = (timeString) => {
  if (!timeString) return '';
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  } catch {
    return timeString;
  }
};

const Table = ({ isLoading, paginatedData, onEdit, onDelete }) => {
  const showActions = onEdit || onDelete;
  
  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-white p-1">
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      ) : (
        <div className="overflow-x-auto bg-gray-50 rounded-lg">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-200 shadow-md text-gray-700">
              <tr>
                {SCHEDULE_TABLE_HEADERS.map((header) => (
                  <th key={header.key} className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">
                    {header.label}
                  </th>
                ))}
                {showActions && (
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={SCHEDULE_TABLE_HEADERS.length + (showActions ? 1 : 0)} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <FileText className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-lg font-medium">No schedule found</p>
                      <p className="text-sm mt-1">No schedule assigned yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, i) => (
                  <tr key={i} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 whitespace-nowrap">{item.scheduleName || item.schedule_title}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{formatDate(item.startDate || item.start_date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{formatDate(item.endDate || item.end_date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{formatTime(item.startTime || item.start_time)}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{formatTime(item.endTime || item.end_time)}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap capitalize">{item.repeat || item.repeat_pattern}</td>
                    {showActions && (
                      <td className="px-6 py-4 flex gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit schedule"
                          >
                            <SquarePen className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete schedule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Table;

