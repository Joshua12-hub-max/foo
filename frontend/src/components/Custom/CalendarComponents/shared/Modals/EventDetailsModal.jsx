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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Clock className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">
              {event.isHoliday ? 'All Day' : hours[event.time]}
            </span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
             <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <CalendarDays className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">{dayName}, {month} {day}</span>
          </div>
          {event.description && (
            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed">
              {event.description}
            </div>
          )}
          {event.recurring_pattern && event.recurring_pattern !== 'none' && (
            <div className="mt-2 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full inline-block font-medium border border-blue-100">
              Recurring: {event.recurring_pattern.charAt(0).toUpperCase() + event.recurring_pattern.slice(1)}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          {canModify && (
            <>
              <button
                onClick={() => onEdit(event)}
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium shadow-lg shadow-gray-900/20"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => onDelete(event)}
                className="flex-1 px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className={`${canModify ? 'flex-1' : 'w-full'} px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm font-medium shadow-sm`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;

