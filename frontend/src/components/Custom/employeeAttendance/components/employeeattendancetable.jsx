import { Search } from 'lucide-react';
import { TABLE_HEADERS } from '../Constants/employeeattendanceConstant';
import { getStatusBadge } from '../utils/employeeattendanceUtils';

const EmployeeAttendanceTable = ({currentItems, debouncedSearchQuery, filters}) => {
    const hasActiveFilters = debouncedSearchQuery || Object.values(filters).some(v => v);
    return (
     <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
        <div className="overflow-x-auto bg-[#F8F9FA] rounded-lg">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-[#274b46] text-[#F8F9FA]">
              <tr>
                {["Department", "Employee ID", "Employee Name", "Date","Present", "Absent", "Late", "On Leave", "Leave With Pay", "Leave Without Pay", "Work From Home", "Undertime", "Overtime", "Time In", "Time Out", "Lunch In", "Lunch Out", "Break In", "Break Out", "Half Day", "Total Hours", "Total Work", "Status","Notes"].map((header) => (
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
                    <td className="px-6 py-4 text-sm text-gray-800">{item.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.present}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.absent}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.late}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.onLeave}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.leaveWithPay}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.leaveWithoutPay}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.workFromHome}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.undertime}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.overtime}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.timeIn}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.timeOut}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.lunchIn}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.lunchOut}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.breakIn}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.breakOut}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.halfDay}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.totalHours}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.totalWork}</td>
                    <td className="px-6 py-4">
                        <span className={`${getStatusBadge(item.status)} px-3 py-1 text-sm font-medium inline-block`} style={{borderRadius: '20px'}}>
                          {item.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.notes}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Search className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-lg font-medium">No records found</p>
                      <p className="text-sm mt-1">
                        {debouncedSearchQuery || Object.values(filters).some(v => v) 
                          ? "Try adjusting your filters or search terms" 
                          : "No attendance data available"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
}

export default EmployeeAttendanceTable;