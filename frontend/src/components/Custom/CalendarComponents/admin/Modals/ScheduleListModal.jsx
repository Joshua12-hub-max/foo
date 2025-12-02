import { useState, useEffect } from 'react';
import { X, Edit, Trash2, Search } from 'lucide-react';
import { scheduleApi } from '../../../../../api/scheduleApi';
import { getEmployees } from '../../../../../api/employeeApi';

/**
 * Schedule List Modal
 * Full schedule management interface for viewing, filtering, editing, and deleting schedules
 */
const ScheduleListModal = ({ show, onClose, onEdit, onDelete, onRefresh }) => {
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('all');

  useEffect(() => {
    if (show) {
      fetchData();
    }
  }, [show]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [scheduleResponse, employeeResponse] = await Promise.all([
        scheduleApi.getAllSchedules(),
        getEmployees()
      ]);

      if (scheduleResponse.data && scheduleResponse.data.schedules) {
        setSchedules(scheduleResponse.data.schedules);
      }

      if (employeeResponse.data && employeeResponse.data.employees) {
        setEmployees(employeeResponse.data.employees);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      alert('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayOfWeek) => {
    const days = { 'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed', 'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun' };
    return days[dayOfWeek] || dayOfWeek;
  };

  const getEmployeeName = ( employeeId) => {
    const employee = employees.find(emp => emp.employee_id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : employeeId;
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = searchTerm === '' || 
      getEmployeeName(schedule.employee_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.day_of_week.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEmployee = filterEmployee === 'all' || schedule.employee_id === filterEmployee;
    
    return matchesSearch && matchesEmployee;
  });

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Schedule Management</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 flex gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by employee or day..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#274b46]"
            />
          </div>

          {/* Employee Filter */}
          <div className="w-64">
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#274b46]"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading schedules...</div>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">No schedules found</div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Day</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Start Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">End Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map(schedule => (
                  <tr key={schedule.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {getEmployeeName(schedule.employee_id)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {schedule.day_of_week}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {schedule.start_time}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {schedule.end_time}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {schedule.is_rest_day ? (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">Rest Day</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Active</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => onEdit(schedule)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Schedule"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(schedule)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Schedule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {filteredSchedules.length} of {schedules.length} schedules
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleListModal;