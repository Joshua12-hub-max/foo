import { Clock } from 'lucide-react';

/**
 * Events List Component
 * Displays today's schedule
 */
const EventsList = ({ 
  events, 
  currentDate,
  hours,
  onEventClick 
}) => {
  const todaysEvents = events.filter(e => 
    !e.isHoliday || (e.month === currentDate.getMonth() && e.day === currentDate.getDate())
  );

  return (
    <div>
      <h2 className="text-xl-md font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-[#274b46]" />
        Today's Schedule
      </h2>
      {todaysEvents.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No events scheduled</p>
      ) : (
        <div className="space-y-3">
          {todaysEvents.map((event) => (
            <div
              key={event.id}
              className={`p-3 rounded-lg border-l-4 ${event.color} cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => onEventClick(event)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{event.title}</div>
                  <div className="text-xs mt-1 opacity-70">
                    {event.isHoliday ? 'All Day' : hours[event.time]}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsList;

