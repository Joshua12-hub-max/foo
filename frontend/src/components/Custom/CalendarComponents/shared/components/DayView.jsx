/**
 * Day View Component
 * Detailed daily calendar view with 30-minute interval slots
 */
const DayView = ({ currentDate, events = [], onEventClick }) => {
  // Generate 30-minute time slots from 6 AM to 10 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push({ hour, minute: 0 });
      slots.push({ hour, minute: 30 });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const formatTime = (hour, minute) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const displayMinute = minute === 0 ? '00' : minute;
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const getEventsForTimeSlot = (hour, minute) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      const eventHour = event.time || 9;
      
      // Check if event date matches current date and hour matches
      return eventDate.toDateString() === currentDate.toDateString() && 
             eventHour === hour &&
             minute === 0; // Events on the hour
    });
  };

  const isToday = currentDate.toDateString() === new Date().toDateString();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className={`p-4 border-b border-gray-300 ${isToday ? 'bg-[#274b46] text-white' : 'bg-gray-50'}`}>
        <div className="text-sm font-semibold">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
        </div>
        <div className="text-2xl font-bold">
          {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Time slots */}
      <div className="flex-1 overflow-auto">
        {timeSlots.map(({ hour, minute }, idx) => {
          const slotEvents = getEventsForTimeSlot(hour, minute);
          
          return (
            <div 
              key={idx} 
              className="flex border-b border-gray-200 hover:bg-gray-50 transition-colors min-h-[40px]"
            >
              {/* Time label */}
              <div className="w-24 p-2 text-xs text-gray-600 font-medium border-r border-gray-200 bg-gray-50">
                {formatTime(hour, minute)}
              </div>
              
              {/* Event area */}
              <div className="flex-1 p-2">
                {slotEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`text-sm p-2 rounded mb-1 cursor-pointer hover:opacity-80 ${event.color || 'bg-blue-100 text-blue-800 border-l-4 border-blue-600'}`}
                  >
                    <div className="font-semibold">{event.title}</div>
                    {event.description && (
                      <div className="text-xs mt-1 opacity-90">{event.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayView;

