import { memo, useMemo } from "react";
import { Calendar, Clock, Star } from "lucide-react";
import { getEventStyles } from '../Custom/CalendarComponents/shared/utils/calendarItemUtils.js';

/* -------------------- Memoized Event Item -------------------- */
const EventItem = memo(({ title, date, type, priority }) => {
  const dateObj = new Date(date);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleString('default', { month: 'short' });

  const eventConfig = useMemo(() => {
    return getEventStyles(type, title, priority);
  }, [type, title, priority]);

  return (
    <div className="group flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all duration-300 hover:border-gray-200">
      {/* Calendar Leaf Date */}
      <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border ${eventConfig.bgColor} ${eventConfig.borderColor} ${eventConfig.textColor}`}>
        <span className="text-[10px] font-bold uppercase tracking-wider">{month}</span>
        <span className="text-lg font-bold leading-none">{day}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${eventConfig.badgeBg} ${eventConfig.badgeText}`}>
            {type}
          </span>
        </div>
        <h5 className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#34645c] transition-colors">
          {title}
        </h5>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
          <Clock className="w-3 h-3" />
          <span>All Day</span>
        </div>
      </div>
    </div>
  );
});
EventItem.displayName = "EventItem";

/* -------------------- Main Events List -------------------- */
function EventsList({ events = [] }) {
  if (!events.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <div className="bg-white p-3 rounded-full shadow-sm mb-3">
          <Calendar className="w-6 h-6 text-gray-400" />
        </div>
        <h4 className="text-sm font-medium text-gray-900">No Upcoming Events</h4>
        <p className="text-xs text-gray-500 mt-1">Enjoy your day!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          Upcoming Events
        </h4>
      </div>
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {events.map((event, index) => (
          <EventItem
            key={event.id ? `${event.id}-${index}` : `event-${index}`}
            title={event.title}
            date={event.date}
            type={event.type}
            priority={event.priority}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(EventsList);
