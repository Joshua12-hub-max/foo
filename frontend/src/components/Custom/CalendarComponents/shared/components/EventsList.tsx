import React from 'react';
import { Clock } from 'lucide-react';

interface EventsListProps {
  events: any[];
  currentDate: Date;
  hours?: { [key: string]: string };
  onEventClick?: (event: any) => void;
}

const EventsList: React.FC<EventsListProps> = ({  events,  currentDate, hours, onEventClick }) => {
  const todaysEvents = events.filter(e => 
    !e.isHoliday || (e.month === currentDate.getMonth() && e.day === currentDate.getDate())
  );
  // Get styling for each item typ
  const getItemColor = (item: any) => {
    if (item.isSchedule || item.type === 'schedule') {
      return 'bg-gray-200 border-gray-300 text-gray-700';
    }
    if (item.isAnnouncement || item.type === 'announcement') {
      return 'bg-gray-200 border-gray-300 text-gray-700';
    }
    if (item.isHoliday || item.type === 'holiday') {
      return 'bg-red-50 border-red-400 text-red-800';
    }
    return 'bg-gray-200 border-gray-300 text-gray-700';
  };

  // Get time display for each item type
  const getTimeDisplay = (item: any) => {
    if (item.isHoliday) return 'All Day';
    if (item.isSchedule || item.type === 'schedule') {
      return item.description || `${item.time} - ${item.endTime || ''}`;
    }
    return hours?.[item.time] || item.time || 'All Day';
  };

  return (
    <div>
      <h2 className="text-xl-md font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-gray-700" />
        Today's Schedule
      </h2>
      {todaysEvents.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No events scheduled</p>
      ) : (
        <div className="space-y-3">
          {todaysEvents.map((event, idx) => (
            <div
              key={event.id || `event-${idx}`}
              className={`p-3 rounded-lg border-l-4 ${getItemColor(event)} cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => onEventClick && onEventClick(event)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{event.title}</div>
                  <div className="text-xs mt-1 opacity-70">
                    {getTimeDisplay(event)}
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
