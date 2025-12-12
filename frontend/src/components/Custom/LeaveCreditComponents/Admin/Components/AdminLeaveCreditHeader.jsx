import { RefreshCw } from 'lucide-react';

export const AdminLeaveCreditHeader = ({ today, onRefresh, isLoading }) => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Leave Credits</h2>
          <p className="text-sm text-gray-600 mt-1">Manage employee leave balances and requests</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onRefresh} 
            disabled={isLoading} 
            className="text-gray-600 hover:text-gray-800 disabled:opacity-50" 
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-sm text-gray-700 bg-gray-100 px-4 py-2 border-2 border-gray-200 rounded-lg">
            {today}
          </span>
        </div>
      </div>
      <hr className="mb-6 border-[#274b46]" />
    </>
  );
};
