import { DAYS_FULL } from '../constants/calendarConstants';

/**
 * Week View Component
 * Weekly calendar layout with hourly time slots
 */
const WeekView = ({ currentDate, events = [], onEventClick }) => {
  // Get the start of the week (Sunday)
  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay()); // Go to Sunday
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 10 PM

  const getEventsForDayAndHour = (day, hour) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      const eventHour = event.time || 9;
      
      return eventDate.toDateString() === day.toDateString() && 
             eventHour === hour;
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with days */}
      <div className="grid grid-cols-8 border-b border-gray-300 bg-gray-50">
        <div className="p-2 text-xs font-semibold text-gray-600">Time</div>
        {weekDays.map((day, idx) => (
          <div 
            key={idx} 
            className={`p-2 text-center ${isToday(day) ? 'bg-[#274b46] text-white' : ''}`}
          >
            <div className="text-xs font-semibold">{DAYS_FULL[day.getDay()]}</div>
            <div className={`text-lg font-bold ${isToday(day) ? 'text-white' : 'text-gray-800'}`}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Time slots grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8">
          {hours.map(hour => (
            <>
              {/* Time label */}
              <div key={`time-${hour}`} className="p-2 text-xs text-gray-600 border-r border-b border-gray-200 bg-gray-50">
                {hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
              </div>
              
              {/* Day cells */}
              {weekDays.map((day, dayIdx) => {
                const dayEvents = getEventsForDayAndHour(day, hour);
                
                return (
                  <div 
                    key={`${hour}-${dayIdx}`} 
                    className="min-h-[60px] p-1 border-r border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={`text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80 ${event.color || 'bg-blue-100 text-blue-800'}`}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekView;

