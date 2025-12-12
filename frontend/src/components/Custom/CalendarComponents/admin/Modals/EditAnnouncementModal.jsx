import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function EditAnnouncementModal({ show, announcement, onClose, onUpdate }) {
  const [formData, setFormData] = useState({title: '', content: '', priority: 'normal', start_date: '', end_date: '', start_time: '', end_time: ''});

  useEffect(() => {
    if (announcement) {
      setFormData({title: announcement.title || '', content: announcement.content || '', priority: announcement.priority || 'normal', start_date: announcement.start_date ? announcement.start_date.split('T')[0] : '', end_date: announcement.end_date ? announcement.end_date.split('T')[0] : '', start_time: announcement.start_time || '', end_time: announcement.end_time || ''});
    }
  }, [announcement]);

  if (!show || !announcement) return null;

  const handleSubmit = () => {
    onUpdate(announcement.id, formData);
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md shadow-xl mt-16 relative">
        
        {/* Header */}
        <div className="bg-gray-200 px-4 py-4 flex items-center shadow-md justify-between">
          <h2 className="text-base font-bold text-gray-800">Edit Announcement</h2>
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
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200"
              placeholder="Announcement Headline"
            />
          </div>

          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200"
            >
              <option value="normal">Normal</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-normal text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-normal text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
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
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200"
              />
            </div>
            <div> 
              <label className="block text-sm font-normal text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200 h-32 resize-none"
              placeholder="Write your announcement description here..."
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
              Update Announcement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
