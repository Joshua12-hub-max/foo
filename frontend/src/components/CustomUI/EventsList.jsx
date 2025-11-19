import React, { memo, useMemo } from "react";
import { Calendar } from "lucide-react";

/* -------------------- Memoized Event Item -------------------- */
const EventItem = memo(({ title, date, type }) => {
  const badgeClass = useMemo(() => {
    return type === "holiday"
      ? "bg-purple-100 text-purple-700"
      : "bg-blue-100 text-blue-700";
  }, [type]);

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-2">
        <Calendar className="w-3 h-3 text-gray-800 flex-shrink-0" />
        <div>
          <p className="text-xs font-medium text-slate-800">{title}</p>
          <p className="text-xs text-gray-500">{date}</p>
        </div>
      </div>
      <span
        className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${badgeClass}`}
      >
        {type}
      </span>
    </div>
  );
});
EventItem.displayName = "EventItem";

/* -------------------- Main Events List -------------------- */
function EventsList({ events = [] }) {
  if (!events.length) {
    return (
      <div>
        <h4 className="text-md font-medium text-slate-700 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-800" /> Events & Holidays
        </h4>
        <p className="text-sm text-gray-500 italic">No upcoming events or holidays.</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-md font-medium text-slate-700 mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gray-800" /> Events & Holidays
      </h4>

      <div className="space-y-2">
        {events.map((event) => (
          <EventItem
            key={event.id}
            title={event.title}
            date={event.date}
            type={event.type}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(EventsList);
