import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

export default function AddEventModal({ show, newEvent, setNewEvent, onClose, onAdd, hours, departments = [] }) {
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const dropdownRef = useRef(null);
  const deptDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTimeOpen(false);
      }
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target)) {
        setIsDeptOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!show) return null; 

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200 w-100 shadow-xl mt-16 relative">
        
        {/* Header */}
        <div className="bg-gray-200 px-4 py-4 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-800">Add New Event</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition z-20"
          >
            <X className="w-5 h-5 text-red-800" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-4 space-y-3">
          {/* Event Title */}
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1">
              Event Title
            </label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200 text-sm"
              placeholder="Enter event name"
            />
          </div>

          {/* Date Fields - Grid Layout */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-normal text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={newEvent.startDate || newEvent.date || ''}
                onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-normal text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={newEvent.endDate || newEvent.startDate || newEvent.date || ''}
                onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                min={newEvent.startDate || newEvent.date || ''}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200 text-sm"
              />
            </div>
          </div>

          {/* Custom Time Dropdown */}
          <div ref={dropdownRef}>
            <label className="block text-sm font-normal text-gray-700 mb-1">
              Time
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTimeOpen(!isTimeOpen)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-md focus:outline-none bg-white text-left flex items-center justify-between text-sm"
              >
                <span className={newEvent.time ? 'text-gray-900' : 'text-gray-400'}>
                  {newEvent.time || 'Select time'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isTimeOpen ? 'rotate-180' : ''}`} />
              </button>

              {isTimeOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-md max-h-32 overflow-y-auto">
                  {hours.map((hour, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setNewEvent({ ...newEvent, time: hour });
                        setIsTimeOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left hover:bg-gray-100 transition text-sm ${
                        newEvent.time === hour ? 'bg-gray-100 text-gray-700 font-normal' : 'text-gray-700'
                      }`}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Department Dropdown */}
          <div ref={deptDropdownRef}>
            <label className="block text-sm font-normal text-gray-700 mb-1">
              Department
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDeptOpen(!isDeptOpen)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-md focus:outline-none bg-white text-left flex items-center justify-between text-sm"
              >
                <span className={newEvent.department ? 'text-gray-900' : 'text-gray-400'}>
                  {newEvent.department || 'All Departments'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDeptOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDeptOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-md max-h-32 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setNewEvent({ ...newEvent, department: '' });
                      setIsDeptOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left hover:bg-gray-100 transition text-sm ${
                      !newEvent.department ? 'bg-gray-100 text-gray-700 font-normal' : 'text-gray-700'
                    }`}
                  >
                    All Departments
                  </button>
                  {departments.map((dept, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setNewEvent({ ...newEvent, department: dept.name || dept });
                        setIsDeptOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left hover:bg-gray-100 transition text-sm ${
                        newEvent.department === (dept.name || dept) ? 'bg-gray-100 text-gray-700 font-normal' : 'text-gray-700'
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
            <label className="block text-sm font-normal text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newEvent.description || ''}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-md focus:outline-none focus:border-gray-200 text-sm"
              placeholder="Enter event description"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg shadow-md hover:text-red-800"
            >
              Cancel
            </button>
            <button
              onClick={onAdd}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg shadow-md hover:text-green-800"
            >
              Add Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}