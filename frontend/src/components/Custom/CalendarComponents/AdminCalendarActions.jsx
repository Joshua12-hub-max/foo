import { Plus, Calendar as CalendarIcon, Menu, Megaphone } from 'lucide-react';

/**
 * Admin Calendar Actions
 * Action buttons specific to admin calendar (Add Event, Schedule, Menu, Announcement)
 */
const AdminCalendarActions = ({ 
  onAddEvent,
  onSchedule,
  onAnnouncement,
  onOpenDrawer
}) => {
  return (
    <>
      <button
        onClick={onAnnouncement}
        className="px-4 py-2 text-sm font-semibold text-gray-800 border border-gray-400 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
      >
        <Megaphone className="w-4 h-4" />
        Announcement
      </button>

      <button
        onClick={onSchedule}
        className="px-4 py-2 text-sm font-semibold text-gray-800 border border-gray-400 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
      >
        <CalendarIcon className="w-4 h-4" />
        Create Schedule
      </button>

      <button
        onClick={onAddEvent}
        className="px-4 py-2 text-sm font-semibold text-gray-800 border border-gray-400 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Create Event
      </button>

      <button
        onClick={onOpenDrawer}
        className="p-2 border border-gray-400 rounded-lg hover:bg-gray-300 transition-colors"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>
    </>
  );
};

export default AdminCalendarActions;