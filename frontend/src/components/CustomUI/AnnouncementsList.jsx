import { memo, useMemo } from "react";
import { Bell } from "lucide-react";

/* -------------------- Memoized Item Component -------------------- */
const AnnouncementItem = memo(({ title, date, priority }) => {
  const priorityColor = useMemo(() => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  }, [priority]);

  return (
    <div className="flex items-center justify-between p-10 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${priorityColor}`} />
        <div>
          <p className="text-xs font-medium text-slate-800">{title}</p>
          <p className="text-xs text-gray-500">{date}</p>
        </div>
      </div>
    </div>
  );
});
AnnouncementItem.displayName = "AnnouncementItem";

/* -------------------- Main Announcements List -------------------- */
function AnnouncementsList({ announcements = [] }) {
  if (!announcements.length) {
    return (
      <div>
        <h4 className="text-md font-medium text-slate-700 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-800" /> Announcements
        </h4>
        <p className="text-sm text-gray-500 italic">No announcements available.</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-md font-medium text-slate-700 mb-4 flex items-center gap-2">
        <Bell className="w-4 h-4 text-gray-800" /> Announcements
      </h4>
      <div className="space-y-2">{announcements.map((a) => (<AnnouncementItem key={a.id} title={a.title} date={a.date} priority={a.priority} />))}</div>
    </div>
  );
}

export default memo(AnnouncementsList);
