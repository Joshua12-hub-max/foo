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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 shrink-0 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Add New Event</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto">
          <div className="space-y-4">
            {/* Event Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Event Title
              </label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm"
                placeholder="Enter event name"
              />
            </div>

            {/* Date Fields - Grid Layout */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newEvent.startDate || newEvent.date || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={newEvent.endDate || newEvent.startDate || newEvent.date || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                  min={newEvent.startDate || newEvent.date || ''}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm"
                />
              </div>
            </div>

            {/* Custom Time Dropdown */}
            <div ref={dropdownRef}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Time
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTimeOpen(!isTimeOpen)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white text-left flex items-center justify-between text-sm hover:bg-gray-50 transition-colors"
                >
                  <span className={newEvent.time ? 'text-gray-900' : 'text-gray-400'}>
                    {newEvent.time || 'Select time'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isTimeOpen ? 'rotate-180' : ''}`} />
                </button>

                {isTimeOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                    {hours.map((hour, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setNewEvent({ ...newEvent, time: hour });
                          setIsTimeOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                          newEvent.time === hour ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-600'
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
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Department
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDeptOpen(!isDeptOpen)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white text-left flex items-center justify-between text-sm hover:bg-gray-50 transition-colors"
                >
                  <span className={newEvent.department ? 'text-gray-900' : 'text-gray-400'}>
                    {newEvent.department || 'All Departments'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDeptOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDeptOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => {
                        setNewEvent({ ...newEvent, department: '' });
                        setIsDeptOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                        !newEvent.department ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-600'
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
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                          newEvent.department === (dept.name || dept) ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-600'
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
                value={newEvent.description || ''}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm resize-none"
                placeholder="Enter event description"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20"
          >
            Add Event
          </button>
        </div>
      </div>
    </div>
  );
}