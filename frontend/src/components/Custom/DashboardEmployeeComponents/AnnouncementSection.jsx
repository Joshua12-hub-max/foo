import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { announcementApi } from '../../../api/announcementApi';

export default function AnnouncementSection() {
  const [announcements, setAnnouncements] = useState([]);

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
    <div className="bg-[#F8F9FA] rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Announcements</h3>
      
      {announcements.length > 0 ? (
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {announcements.map((announcement) => (
            <div key={announcement.id || Math.random()} className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-bold text-gray-800">{announcement.title}</h4>
                {announcement.priority && announcement.priority !== 'normal' && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                    announcement.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {announcement.priority}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600">{announcement.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center">
          <Bell className="w-8 h-8 text-gray-500 mx-auto mb-3" />
          <p className="text-sm text-gray-600">No new announcements</p>
        </div>
      )}
    </div>
  );
}
