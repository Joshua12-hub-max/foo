import { RefreshCw } from "lucide-react";

const DepartmentHeader = ({ onRefresh, isLoading }) => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Department Management</h2>
          <p className="text-sm text-gray-800 mt-1">Manage organizational structure and departments</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <hr className="mb-6 border-[1px] border-gray-200" />
    </>
  );
};

export default DepartmentHeader;
