import { CalendarDays, Clock } from 'lucide-react';

/**
 * Agenda View Component
 * List view of upcoming events in chronological order
 */
const AgendaView = ({ events = [], announcements = [], onEventClick }) => {
  // Combine and sort events and announcements
  const allItems = [
    ...events.map(e => ({ ...e, type: 'event' })),
    ...announcements.map(a => ({ ...a, type: 'announcement', date: a.start_date || a.created_at }))
  ].filter(item => item.date) // Only items with dates
   .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Filter to show only upcoming events (today and future)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingItems = allItems.filter(item => new Date(item.date) >= today);

  // Group by date
  const groupedByDate = upcomingItems.reduce((groups, item) => {
    const dateKey = new Date(item.date).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
    return groups;
  }, {});

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatTime = (time) => {
    if (!time && time !== 0) return '';
    const hour = parseInt(time);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800">Upcoming Events</h2>
        <p className="text-sm text-gray-600 mt-1">
          {upcomingItems.length} event{upcomingItems.length !== 1 ? 's' : ''} scheduled
        </p>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-auto">
        {Object.keys(groupedByDate).length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No upcoming events</p>
            </div>
          </div>
        ) : (
          Object.keys(groupedByDate).map(dateKey => (
            <div key={dateKey} className="border-b border-gray-200 last:border-b-0">
              {/* Date Header */}
              <div className="sticky top-0 bg-gray-100 px-6 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">
                  {formatDate(dateKey)}
                </h3>
              </div>

              {/* Events for this date */}
              <div className="divide-y divide-gray-100">
                {groupedByDate[dateKey].map((item, idx) => (
                  <div
                    key={`${item.type}-${item.id}-${idx}`}
                    onClick={() => item.type === 'event' && onEventClick(item)}
                    className={`p-4 hover:bg-gray-50 transition-colors ${item.type === 'event' ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Time indicator */}
                      {item.type === 'event' && (
                        <div className="flex-shrink-0 w-20 text-sm text-gray-600">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {formatTime(item.time)}
                        </div>
                      )}

                      {/* Event details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                            {item.content && (
                              <p className="text-sm text-gray-600 mt-1">{item.content}</p>
                            )}
                          </div>
                          
                          {/* Type badge */}
                          <span className={`ml-2 px-2 py-1 text-xs rounded ${
                            item.type === 'event' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.type === 'event' ? 'Event' : 'Announcement'}
                          </span>
                        </div>

                        {/* Recurring indicator */}
                        {item.recurring_pattern && item.recurring_pattern !== 'none' && (
                          <div className="mt-2 text-xs text-gray-500">
                            🔄 Repeats {item.recurring_pattern}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AgendaView;

