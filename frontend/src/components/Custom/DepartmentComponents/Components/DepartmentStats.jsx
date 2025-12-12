import { useState } from 'react';
import { Minimize2, Maximize2 } from 'lucide-react';

export const DepartmentStats = ({ stats }) => {
  const [isCompact, setIsCompact] = useState(false);

  return (
    <div className="mb-6">
      {/* Toggle Button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setIsCompact(!isCompact)}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title={isCompact ? 'Expand cards' : 'Compact cards'}
        >
          {isCompact ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          {isCompact ? 'Expand' : 'Compact'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isCompact ? 'gap-3' : 'gap-6'}`}>
        <div className={`bg-white flex items-center justify-between border border-gray-100 ${
          isCompact 
            ? 'px-4 py-2.5 rounded-lg shadow-sm' 
            : 'p-5 rounded-xl shadow-md'
        }`}>
          <div>
            <p className={`text-gray-500 font-semibold uppercase tracking-wider ${
              isCompact ? 'text-[10px]' : 'text-xs'
            }`}>Total Departments</p>
            <h3 className={`font-bold text-gray-800 ${
              isCompact ? 'text-lg' : 'text-3xl mt-1'
            }`}>{stats.total}</h3>
          </div>
          <div className={`rounded-full bg-[#79B791] ${
            isCompact ? 'w-7 h-7' : 'w-12 h-12'
          }`}></div>
        </div>

        <div className={`bg-white flex items-center justify-between border border-gray-100 ${
          isCompact 
            ? 'px-4 py-2.5 rounded-lg shadow-sm' 
            : 'p-5 rounded-xl shadow-md'
        }`}>
          <div>
            <p className={`text-gray-500 font-semibold uppercase tracking-wider ${
              isCompact ? 'text-[10px]' : 'text-xs'
            }`}>Total Employees</p>
            <h3 className={`font-bold text-gray-800 ${
              isCompact ? 'text-lg' : 'text-3xl mt-1'
            }`}>{stats.totalEmployees}</h3>
          </div>
          <div className={`rounded-full bg-[#7A0000] ${
            isCompact ? 'w-7 h-7' : 'w-12 h-12'
          }`}></div>
        </div>
      </div>
    </div>
  );
};
