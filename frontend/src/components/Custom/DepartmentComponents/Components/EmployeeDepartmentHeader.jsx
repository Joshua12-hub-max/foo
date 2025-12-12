/**
 * EmployeeDepartmentHeader Component
 * Header section for Employee Department page
 */

import React, { memo } from 'react';
import { Building2, RefreshCw } from 'lucide-react';

const EmployeeDepartmentHeader = memo(({ onRefresh }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Building2 className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">My Department</h1>
          <p className="text-sm text-gray-500">View your department and colleagues</p>
        </div>
      </div>
      <button
        onClick={onRefresh}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Refresh"
      >
        <RefreshCw className="w-5 h-5" />
      </button>
    </div>
  );
});

EmployeeDepartmentHeader.displayName = 'EmployeeDepartmentHeader';

export default EmployeeDepartmentHeader;
