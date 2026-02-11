import { Menu } from 'lucide-react';

interface EmployeeCalendarActionsProps {
  onOpenDrawer: () => void;
}

const EmployeeCalendarActions = ({ onOpenDrawer }: EmployeeCalendarActionsProps) => {
  return (
    <>
      <button
        onClick={onOpenDrawer}
        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white shadow-sm"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>
    </>
  );
};

export default EmployeeCalendarActions;
