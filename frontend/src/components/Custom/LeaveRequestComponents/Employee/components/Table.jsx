import { Search } from 'lucide-react';
import { LEAVE_TABLE_HEADERS, STATUS_STYLES } from '../constants/leaveConstants';
import { calculateDuration } from '../utils/dateTimeUtils';

export const Table = ({ data, searchQuery, filters, onFinalize }) => {
  const getStatusBadge = (status) => {
    return STATUS_STYLES[status] || 'bg-gray-100 text-gray-800';
  };

  const hasActiveFilters = searchQuery || Object.values(filters).some(v => v);

  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
      <div className="overflow-x-auto bg-[#F8F9FA] rounded-lg">
        <table className="w-full min-w-[1400px]">
          <thead className="bg-[#274b46] text-[#F8F9FA]">
            <tr>
              {LEAVE_TABLE_HEADERS.map((header) => (
                <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length ? (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-[#34645c] transition-colors">
                  <td className="px-6 py-4">
                    <span 
                      className={`${getStatusBadge(item.status)} px-3 py-1 text-sm font-medium inline-block`} 
                      style={{borderRadius: '20px'}}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.leaveType}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.fromDate}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.toDate}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {calculateDuration(item.fromDate, item.toDate)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {item.status === 'Processing' ? (
                      <button 
                        onClick={() => onFinalize(item)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition-colors"
                      >
                        Finalize
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs italic">No action</span>
                    )}
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
                        ? 'Try adjusting your filters or search terms' 
                        : 'No leave requests available'}
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

export default Table;
