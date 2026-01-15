import { memo, useMemo } from "react";
import { Bell, Calendar, AlertCircle, LucideIcon } from "lucide-react";

interface Announcement {
  id: string | number;
  title: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
}

interface ItemProps {
  title: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
}

/* -------------------- Memoized Item Component -------------------- */
const AnnouncementItem = memo(({ title, date, priority }: ItemProps) => {
  const priorityConfig = useMemo(() => {
    switch (priority) {
      case "high":
        return { color: "bg-red-950/10 text-red-950 border-red-950/20", icon: AlertCircle };
      case "medium":
        return { color: "bg-amber-900/10 text-amber-900 border-amber-900/20", icon: Bell };
      case "low":
        return { color: "bg-gray-100 text-gray-800 border-gray-200", icon: Calendar };
      default:
        return { color: "bg-slate-900/10 text-slate-900 border-slate-900/20", icon: Calendar };
    }
  }, [priority]);

  const Icon: LucideIcon = priorityConfig.icon;

  return (
    <div className="group flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all duration-300 hover:border-gray-200">
      <div className={`p-2 rounded-lg ${priorityConfig.color} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-semibold text-gray-800 mb-1 group-hover:text-blue-950 transition-colors truncate">
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

interface AnnouncementsListProps {
  announcements?: Announcement[];
}

/* -------------------- Main Announcements List -------------------- */
function AnnouncementsList({ announcements = [] }: AnnouncementsListProps) {
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
