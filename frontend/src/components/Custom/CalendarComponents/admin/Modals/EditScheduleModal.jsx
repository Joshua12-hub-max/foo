import { useState, useEffect } from 'react';
import { Clock, X, User } from 'lucide-react';
import { fetchEmployees } from '@/api/employeeApi';

export default function EditScheduleModal({ show, schedule, onClose, onUpdate }) {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({employee_id: '', title: '', startDate: '', endDate: '', startTime: '', endTime: '', repeat: 'none'});

  useEffect(() => {
    if (show) {
      const loadEmployees = async () => {
        try {
          const data = await fetchEmployees();
          setEmployees(data.employees || []);
        } catch (err) {
          console.error(err);
        }
      };
      loadEmployees();
    }
  }, [show]);

  useEffect(() => {
    if (schedule) {
      setFormData({employee_id: schedule.employee_id || '', title: schedule.title || '', startDate: schedule.start_date ? schedule.start_date.split('T')[0] : '', endDate: schedule.end_date ? schedule.end_date.split('T')[0] : '', startTime: schedule.start_time || '', endTime: schedule.end_time || '', repeat: schedule.repeat || 'none'});
    }
  }, [schedule]);

  if (!show || !schedule) return null;

  const handleSubmit = () => {
    onUpdate(schedule.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md shadow-xl mt-16">
        
        {/* Header */}
        <div className="bg-gray-200 px-4 py-4 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-800">Edit Schedule</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-red-800" />
          </button>
        </div>
          
        {/* Content */}
        <div className="p-4 space-y-3">
          <div>

              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> Select Employee
                </label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-md shadow-md focus:outline-none focus:border-gray-200 text-sm"
                >
                  <option value="">Select an employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.employee_id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="mt-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Schedule Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-md shadow-md focus:outline-none focus:border-gray-200 text-sm"
                  placeholder="Enter schedule title"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-md shadow-md focus:outline-none focus:border-gray-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-md shadow-md focus:outline-none focus:border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-md shadow-md focus:outline-none focus:border-gray-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-md shadow-md focus:outline-none focus:border-gray-200 text-sm"
                  />
                </div>    
              </div>

              {/* Repeat */}
              <div className="mt-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Repeat
                </label>
                <select
                  value={formData.repeat}
                  onChange={(e) => setFormData({ ...formData, repeat: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-md shadow-md focus:outline-none focus:border-gray-200 text-sm"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily (Mon-Fri)</option>
                  <option value="weekly">Weekly (Same day each week)</option>
                </select>
              </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-200 rounded-md shadow-md hover:text-red-800"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-200 rounded-md shadow-md hover:text-green-800"
          >
            Update Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
