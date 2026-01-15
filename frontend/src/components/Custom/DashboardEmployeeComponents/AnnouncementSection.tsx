import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { announcementApi } from '../../../api/announcementApi';

interface Announcement {
  id: string | number;
  title: string;
  content: string;
  priority?: 'normal' | 'urgent' | 'high' | 'medium' | string;
}

export default function AnnouncementSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await announcementApi.getAnnouncements();
        if (response.data && response.data.announcements) {
          setAnnouncements(response.data.announcements);
        }
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      }
    };
    fetchAnnouncements();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-300">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <div className="w-1 h-6 bg-gray-800 rounded-full"></div>
        Announcements
      </h3>
      
      {announcements.length > 0 ? (
        <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
          {announcements.map((announcement) => (
            <div key={announcement.id || Math.random()} className="p-3 bg-gray-50 rounded-lg border border-gray-200/60 shadow-sm hover:border-emerald-500/30 transition-all">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-bold text-gray-800">{announcement.title}</h4>
                {announcement.priority && announcement.priority !== 'normal' && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                    announcement.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {announcement.priority}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 line-clamp-2">{announcement.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">No new announcements</p>
        </div>
      )}
    </div>
  );
}
