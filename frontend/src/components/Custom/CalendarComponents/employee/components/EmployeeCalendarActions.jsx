import { Menu, CalendarDays } from 'lucide-react';

/**
 * Employee Calendar Actions
 * Action buttons specific to employee calendar (Show Schedule toggle + Menu button)
 */
const EmployeeCalendarActions = ({ onOpenDrawer }) => {
  return (
    <>
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

export default EmployeeCalendarActions;
