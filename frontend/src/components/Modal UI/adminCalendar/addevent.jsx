import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Plus } from 'lucide-react';

export default function AddEventModal({ show, newEvent, setNewEvent, onClose, onAdd, hours,}) {
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTimeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!show) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div className="bg-white rounded-lg border-2 border-gray-300 w-96 shadow-xl max-h-[90vh] mt-20 relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition z-20"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Header */}
        <div className="bg-[#274b46] px-4 py-2 flex items-start gap-4">
          <div className="pt-1">
            <Plus className="w-5 h-5 text-white flex-shrink-0" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Add New Event</h3>
            <p className="text-xs text-gray-300 mt-1">Event Information</p>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8 space-y-4">
          {/* Event Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Event Title
            </label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-300"
              placeholder="Enter event name"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={newEvent.date}
              onChange={(e) =>
                setNewEvent({ ...newEvent, date: e.target.value })
              }
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-300"
              required
            />
          </div>

          {/* Custom Time Dropdown */}
          <div ref={dropdownRef}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Time
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTimeOpen(!isTimeOpen)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-300 bg-white text-left flex items-center justify-between hover:border-gray-300 transition"
              >
                <span className={newEvent.time ? 'text-gray-900' : 'text-gray-400'}>
                  {newEvent.time || 'Select time'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isTimeOpen ? 'rotate-180' : ''}`} />
              </button>

              {isTimeOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {hours.map((hour, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setNewEvent({ ...newEvent, time: hour });
                        setIsTimeOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-300 transition ${
                        newEvent.time === hour ? 'bg-gray-100 text-gray-700 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 border-2 border-gray-300 rounded-md shadow-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={onAdd}
              className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 border-2 border-gray-300 rounded-md shadow-md hover:bg-gray-300"
            >
              Add Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}