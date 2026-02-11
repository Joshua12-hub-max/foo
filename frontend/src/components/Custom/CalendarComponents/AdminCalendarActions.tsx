import { Menu } from 'lucide-react';

interface AdminCalendarActionsProps {
  onOpenDrawer: () => void;
}

/**
 * Admin Calendar Actions
 * Action buttons specific to admin calendar (Menu for drawer)
 */
const AdminCalendarActions = ({ 
  onOpenDrawer
}: AdminCalendarActionsProps) => {
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

export default AdminCalendarActions;
