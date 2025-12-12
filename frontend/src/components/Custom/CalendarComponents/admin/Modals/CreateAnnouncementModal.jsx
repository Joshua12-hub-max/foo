import { useState } from 'react';
import { X } from 'lucide-react';

export default function CreateAnnouncementModal({ show, onClose, onCreate }) {
  const [announcement, setAnnouncement] = useState({ title: '', content: '', priority: 'normal', start_date: '', end_date: '', start_time: '', end_time: '' });
 if (!show) return null;

  const handleSubmit = () => {
    onCreate(announcement);
    setAnnouncement({ title: '', content: '', priority: 'normal', start_date: '', end_date: '', start_time: '', end_time: ''}); // Reset form
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md shadow-xl mt-16 relative">
        
        {/* Header */}
        <div className="bg-gray-200 px-4 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">New Announcement</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5 text-red-800" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={announcement.title}
              onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
              className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200"
              placeholder="Announcement Headline"
            />
          </div>

          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={announcement.priority}
              onChange={(e) => setAnnouncement({ ...announcement, priority: e.target.value })}
              className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200"
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
                className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-normal text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={announcement.end_date}
                onChange={(e) => setAnnouncement({ ...announcement, end_date: e.target.value })}
                className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-normal text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={announcement.start_time}
                onChange={(e) => setAnnouncement({ ...announcement, start_time: e.target.value })}
                className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-normal text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={announcement.end_time}
                onChange={(e) => setAnnouncement({ ...announcement, end_time: e.target.value })}
                className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={announcement.content}
              onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })}
              className="w-full px-4 py-1.5 border-2 border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200 h-32 resize-none"
              placeholder="Write your announcement here..."
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg shadow-md hover:text-red-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg shadow-md hover:text-green-800"
            >
              Post Announcement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
