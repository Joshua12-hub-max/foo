import { FileText } from "lucide-react";
import { SCHEDULE_TABLE_HEADERS } from "../constants/scheduleConstants";

const Table = ({ isLoading, paginatedData }) => (
  <div className="flex-1 overflow-hidden rounded-xl bg-white p-1">
    {isLoading ? (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    ) : (
      <div className="overflow-x-auto bg-gray-50 rounded-lg">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-[#274b46] text-[#F8F9FA]">
            <tr>
              {SCHEDULE_TABLE_HEADERS.map((header) => (
                <th key={header.key} className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={SCHEDULE_TABLE_HEADERS.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <FileText className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-lg font-medium">No records found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or search</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, i) => (
                <tr key={i} className="hover:bg-[#34645c] transition-colors">
                  <td className="px-6 py-4">
                    <span className="bg-transparent px-3 py-1 text-sm font-medium inline-block" style={{borderRadius: '20px'}}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{item.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{item.employeeId}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{item.employeeName}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{item.scheduleName}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{item.scheduleTask}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{`${item.startDate} ${item.startTime}`}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{`${item.endDate} ${item.endTime}`}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{item.repeat}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default Table;
