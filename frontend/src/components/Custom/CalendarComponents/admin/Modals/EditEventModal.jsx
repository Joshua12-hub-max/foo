import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';

/**
 * Edit Event Modal
 * Modal for editing existing events with start/end date and department support
 */
const EditEventModal = ({ show, event, onClose, onUpdate, hours, departments = [] }) => {
  const [formData, setFormData] = useState({ title: '', startDate: '', endDate: '', time: 9, description: '', department: '', recurring_pattern: 'none', recurring_end_date: '' });
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const deptDropdownRef = useRef(null);

  useEffect(() => {
    if (event) {
      setFormData({ title: event.title || '', startDate: event.start_date || event.date || '', endDate: event.end_date || event.start_date || event.date || '', time: event.time || 9, description: event.description || '', department: event.department || '', recurring_pattern: event.recurring_pattern || 'none', recurring_end_date: event.recurring_end_date || '' });
    }
  }, [event]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target)) {
        setIsDeptOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({ title: formData.title, start_date: formData.startDate, end_date: formData.endDate, date: formData.startDate, time: formData.time, description: formData.description, department: formData.department || null, recurring_pattern: formData.recurring_pattern, recurring_end_date: formData.recurring_end_date });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200 w-96 shadow-xl relative">
        {/* Header */}
        <div className="bg-gray-200 px-4 py-3 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-800">Edit Event</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 text-sm"
              placeholder="Enter event title"
              required
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-200 text-sm"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              min={formData.startDate}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-200 text-sm"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Time
            </label>
            <select
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-200 text-sm"
            >
              {hours.map((hour) => (
                <option key={hour} value={hour}>
                  {hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`}
                </option>
              ))}
            </select>
          </div>

          {/* Department Dropdown */}
          <div ref={deptDropdownRef}>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Department
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDeptOpen(!isDeptOpen)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none bg-white text-left flex items-center justify-between text-sm"
              >
                <span className={formData.department ? 'text-gray-900' : 'text-gray-400'}>
                  {formData.department || 'All Departments'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDeptOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDeptOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, department: '' }));
                      setIsDeptOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left hover:bg-gray-100 transition text-sm ${
                      !formData.department ? 'bg-gray-100 text-gray-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    All Departments
                  </button>
                  {departments.map((dept, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, department: dept.name || dept }));
                        setIsDeptOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left hover:bg-gray-100 transition text-sm ${
                        formData.department === (dept.name || dept) ? 'bg-gray-100 text-gray-700 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {dept.name || dept}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-200 text-sm"
              placeholder="Enter event description"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
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