import { Calendar, Clock, X } from "lucide-react";

export default function ScheduleModal({ show, newSchedule, setNewSchedule, onClose, onCreate,}) {
  
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4">
      {/* Modal Card */}
      <div className="bg-white rounded-xl border-2 border-gray-200 w-full max-w-md shadow-xl mt-20">
        
        {/* Header */}
          <div className="bg-[#274b46] rounded-t-xl px-6 py-4 flex items-start gap-4 shadow-sm relative">
            <div className="flex items-center gap-2 z-10">
              <div className="w-8 h-8 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-[#F8F9FA]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Create Employee Schedule
                </h2>
                <p className="text-xs text-white mt-1">Record Information</p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
        {/* Scrollable Content */}
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="p-6 space-y-3">
            <div className="bg-[#F8F9FA] border-2 border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Schedule Title
                </label>
                <input
                  type="text"
                  value={newSchedule.title}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-green-500 text-sm"
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
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
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
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
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
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
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
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
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
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Description */}
              <div className="mt-3">
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
                  className="w-full px-3 py-1 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 h-20 resize-none text-sm"
                  placeholder="Add description (optional)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-xs font-semibold text-gray-700 border-2 border-gray-200 rounded-lg shadow-md hover:bg-gray-200"
          >
            Cancel
          </button>

          <button
            onClick={onCreate}
            className="flex-1 px-3 py-2 bg-F8F8F8 text-xs font-semibold text-gray-700 border-2 border-gray-200 rounded-lg shadow-md hover:bg-gray-200"
          >
            Create Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
