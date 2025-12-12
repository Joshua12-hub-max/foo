import { Clock, X, User } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchEmployees } from "@/api/employeeApi";

export default function ScheduleModal({ show, newSchedule, setNewSchedule, onClose, onCreate,}) {
  const [employees, setEmployees] = useState([]);

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
  
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4">
      {/* Modal Card */}
      <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md shadow-xl mt-16 relative">
        
        {/* Header */}
        <div className="bg-gray-200 px-4 py-4 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-800">Create Employee Schedule</h2>
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
                  value={newSchedule.employee_id || ""}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, employee_id: e.target.value })
                  }
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
                  value={newSchedule.title}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, title: e.target.value })
                  }
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
                    value={newSchedule.startDate}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-md shadow-md focus:outline-none focus:border-gray-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newSchedule.endDate}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        endDate: e.target.value,
                      })
                    }
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
                    value={newSchedule.startTime}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        startTime: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-md shadow-md focus:outline-none focus:border-gray-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> End Time
                  </label>
                  <input
                    type="time"
                    value={newSchedule.endTime}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        endTime: e.target.value,
                      })
                    }
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
                  value={newSchedule.repeat}
                  onChange={(e) =>
                    setNewSchedule({
                      ...newSchedule,
                      repeat: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-md shadow-md focus:outline-none focus:border-gray-200 text-sm"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Description */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newSchedule.description}
                  onChange={(e) =>
                    setNewSchedule({
                      ...newSchedule,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1 border-2 border-gray-200 rounded-md shadow-md focus:outline-none focus:border-gray-200 h-20 resize-none text-sm"
                  placeholder="Add description (optional)"
                />
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
            onClick={onCreate}
            className="flex-1 px-3 py-2 bg-gray-200 text-xs font-medium text-gray-700 border-2 border-gray-200 rounded-md shadow-md hover:text-green-800"
          >
            Create Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
