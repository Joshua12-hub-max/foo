import { ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';

export default function RightSidebar({ month, year, days, renderCalendarDays, handlePrevMonth, handleNextMonth, sortedEvents, handleDeleteEvent, hours, onClose}) {
  return (
    <div className="h-full overflow-auto p-6">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <X className="w-5 h-5 text-gray-600" />
      </button>

      {/* Mini Calendar */}
      <div className="mb-8 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {month} {year}
          </h2>
          <div className="flex gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {days.map((day, index) => (
            <div
              key={`${day}-${index}`}
              className="text-center text-xs font-semibold text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays}
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          Today's Schedule
        </h3>

        {sortedEvents.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No events scheduled</p>
        ) : (
          <div className="space-y-3">
            {sortedEvents.map((event) => (
              <div
                key={event.id}
                className={`${event.color} border-l-4 rounded-lg p-3 relative group hover:shadow-md transition-all`}
              >
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="absolute top-2 right-2 bg-white border border-gray-300 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <X className="w-3 h-3 text-gray-700" />
                </button>
                <div className="font-bold text-sm mb-1">{event.title}</div>
                <div className="text-xs font-semibold opacity-75">
                  {hours[event.time]}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}