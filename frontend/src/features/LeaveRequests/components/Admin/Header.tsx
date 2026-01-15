import React from 'react';
import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  today: string;
}

const Header: React.FC<HeaderProps> = ({ onRefresh, isLoading, today }) => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Leave Requests</h2>
          <p className="text-sm text-gray-800 mt-1">Manage employee leave requests</p>
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
          <span className="text-sm text-gray-800 bg-[#F8F9FA] px-4 py-2 rounded-lg shadow-md">
            Date today: <span className="text-gray-800 font-semibold">{today}</span>
          </span>
        </div>
      </div>
      <hr className="mb-6 border-[1px] border-gray-200" />
    </>
  );
};

export default Header;
