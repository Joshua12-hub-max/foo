import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Edit Event Modal
 * Modal for editing existing events
 */
const EditEventModal = ({ show, event, onClose, onUpdate, hours }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: 9,
    description: '',
    recurring_pattern: 'none',
    recurring_end_date: ''
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        date: event.date || '',
        time: event.time || 9,
        description: event.description || '',
        recurring_pattern: event.recurring_pattern || 'none',
        recurring_end_date: event.recurring_end_date || ''
      });
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Edit Event</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#274b46]"
              placeholder="Enter event title"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#274b46]"
              required
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <select
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#274b46]"
            >
              {hours.map((hour) => (
                <option key={hour} value={hour}>
                  {hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#274b46]"
              placeholder="Enter event description"
            />
          </div>

          {/* Recurring Pattern */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recurring
            </label>
            <select
              name="recurring_pattern"
              value={formData.recurring_pattern}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#274b46]"
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Recurring End Date */}
          {formData.recurring_pattern !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ends On
              </label>
              <input
                type="date"
                name="recurring_end_date"
                value={formData.recurring_end_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#274b46]"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#274b46] text-white rounded-lg hover:bg-[#1f3a36] transition-colors"
            >
              Update Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;