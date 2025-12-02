import { useState } from 'react';
import { X, Megaphone } from 'lucide-react';

export default function CreateAnnouncementModal({ show, onClose, onCreate }) {
  const [announcement, setAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'normal',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: ''
  });

  if (!show) return null;

  const handleSubmit = () => {
    onCreate(announcement);
    setAnnouncement({ 
      title: '', 
      content: '', 
      priority: 'normal',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: ''
    }); // Reset form
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4">
      <div className="bg-white rounded-xl border-2 border-gray-200 w-full max-w-md shadow-xl mt-20 relative overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#274b46] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-white" />
            <div>
              <h3 className="text-lg font-bold text-white">New Announcement</h3>
              <p className="text-xs text-gray-300">Broadcast a message to the team</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={announcement.title}
              onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#274b46]"
              placeholder="Announcement Headline"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={announcement.priority}
              onChange={(e) => setAnnouncement({ ...announcement, priority: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#274b46]"
            >
              <option value="normal">Normal</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={announcement.start_date}
                onChange={(e) => setAnnouncement({ ...announcement, start_date: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#274b46]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={announcement.end_date}
                onChange={(e) => setAnnouncement({ ...announcement, end_date: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#274b46]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={announcement.start_time}
                onChange={(e) => setAnnouncement({ ...announcement, start_time: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#274b46]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={announcement.end_time}
                onChange={(e) => setAnnouncement({ ...announcement, end_time: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#274b46]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={announcement.content}
              onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#274b46] h-32 resize-none"
              placeholder="Write your announcement here..."
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-[#274b46] rounded-lg hover:bg-[#1e3a36]"
            >
              Post Announcement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
