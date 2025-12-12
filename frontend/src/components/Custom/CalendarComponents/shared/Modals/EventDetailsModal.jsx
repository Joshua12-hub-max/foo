import { CalendarDays, Clock, Edit, Trash2 } from 'lucide-react';

/**
 * Event Details Modal
 * Shows detailed information about a selected event
 */
const EventDetailsModal = ({ event, onClose, hours, month, day, dayName, onEdit, onDelete, isAdmin }) => {
  if (!event) return null;

  const canModify = isAdmin && !event.isHoliday && !event.isAnnouncement;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-96 border border-gray-200" 
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">{event.title}</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {event.isHoliday ? 'All Day' : hours[event.time]}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm">{dayName}, {month} {day}</span>
          </div>
          {event.description && (
            <div className="mt-3 text-sm text-gray-600 bg-white p-3 rounded border border-gray-200">
              {event.description}
            </div>
          )}
          {event.recurring_pattern && event.recurring_pattern !== 'none' && (
            <div className="mt-2 text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
              Recurring: {event.recurring_pattern.charAt(0).toUpperCase() + event.recurring_pattern.slice(1)}
            </div>
          )}
        </div>
        <div className="mt-6 flex gap-3">
          {canModify && (
            <>
              <button
                onClick={() => onEdit(event)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow-md hover:text-green-800 transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => onDelete(event)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow-md hover:text-red-800 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className={`${canModify ? 'flex-1' : 'w-full'} px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:text-red-800 transition-colors`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;

