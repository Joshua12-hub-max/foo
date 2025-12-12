import { Menu } from 'lucide-react';
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
