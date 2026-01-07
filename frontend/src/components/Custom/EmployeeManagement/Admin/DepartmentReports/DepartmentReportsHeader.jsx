import { memo } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Header component for Department Reports page
 */
export const DepartmentReportsHeader = memo(({ today, handleRefresh, isLoading }) => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Attendance Reports</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-sm text-gray-800 bg-[#F8F9FA] px-4 py-2 rounded-lg border border-gray-300 shadow-sm">
            Date today: <span className="text-gray-800 font-semibold">{today}</span>
          </span>
        </div>
      </div>
      <hr className="mb-6 border-[1px] border-gray-200" />
    </>
  );
});

DepartmentReportsHeader.displayName = 'DepartmentReportsHeader';

export default DepartmentReportsHeader;
