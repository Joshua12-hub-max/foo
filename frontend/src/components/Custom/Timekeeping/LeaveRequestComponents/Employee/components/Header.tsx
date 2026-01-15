import React from 'react';
import { RefreshCw } from 'lucide-react';
import { getCurrentDate } from '@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/utils/dateTimeUtils';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, isLoading }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">My Leave Requests</h2>
        <p className="text-sm text-gray-800 mt-1">View and manage your personal leave requests</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          title="Refresh data"
          aria-label="Refresh data"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
        <span className="text-sm text-gray-800 bg-[#F8F9FA] px-4 py-2 border-[2px] border-gray-200 rounded-lg shadow-sm">
          Date today: <span className="text-gray-800 font-semibold">{getCurrentDate()}</span>
        </span>
      </div>
    </div>
  );
};

export default Header;
