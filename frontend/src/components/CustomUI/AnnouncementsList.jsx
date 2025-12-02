import { memo, useMemo } from "react";
import { Bell, Calendar, AlertCircle } from "lucide-react";

/* -------------------- Memoized Item Component -------------------- */
const AnnouncementItem = memo(({ title, date, priority }) => {
  const priorityConfig = useMemo(() => {
    switch (priority) {
      case "high":
        return { color: "bg-[#7A0000]/10 text-[#7A0000] border-[#7A0000]/20", icon: AlertCircle };
      case "medium":
        return { color: "bg-[#CF9033]/10 text-[#CF9033] border-[#CF9033]/20", icon: Bell };
      case "low":
        return { color: "bg-[#79B791]/10 text-[#79B791] border-[#79B791]/20", icon: Calendar };
      default:
        return { color: "bg-[#778797]/10 text-[#778797] border-[#778797]/20", icon: Calendar };
    }
  }, [priority]);

  const Icon = priorityConfig.icon;

  return (
    <div className="group flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all duration-300 hover:border-gray-200">
      <div className={`p-2 rounded-lg ${priorityConfig.color} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-semibold text-gray-800 mb-1 group-hover:text-[#34645c] transition-colors truncate">
          {title}
        </h5>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-600 uppercase tracking-wider text-[10px]">
            {priority}
          </span>
          <span>•</span>
          <span>{date}</span>
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
      <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <div className="bg-white p-3 rounded-full shadow-sm mb-3">
          <Bell className="w-6 h-6 text-gray-400" />
        </div>
        <h4 className="text-sm font-medium text-gray-900">No Announcements</h4>
        <p className="text-xs text-gray-500 mt-1">Check back later for updates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-700 text-2xl" />
          Announcements
        </h4>
        <span className="text-xs font-medium text-white bg-gray-700 px-2 py-1 rounded-full">
          {announcements.length} New
              </span>
      </div>
     
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {announcements.map((a) => (
          <AnnouncementItem 
            key={a.id} 
            title={a.title} 
            date={a.date} 
            priority={a.priority} 
          />
        ))}
      </div>
    </div>
  );
}

export default memo(AnnouncementsList);
