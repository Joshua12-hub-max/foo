import { Bell } from 'lucide-react';

export default function AnnouncementSection() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <Bell className="w-4 h-4 text-gray-800" />
        Announcements
      </h3>
      <div className="text-center py-8">
        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No new announcements</p>
      </div>
    </div>
  );
}
