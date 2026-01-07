
import React from 'react';

/**
 * EmploymentStatusBadge Component
 * Standardized status badge for employee statuses including Disciplinary actions
 */
export const EmploymentStatusBadge = ({ status }) => {
  // Normalize status to handle potential case variations
  const normalizedStatus = status || 'Active';
  
  const getStyle = (statusVal) => {
    switch (statusVal) {
      case 'Active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Resigned':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Terminated':
      case 'Termination Notice':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Suspended':
      case 'Suspension Notice':
        return 'bg-red-500 text-white border-red-600';
      case 'Verbal Warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Written Warning':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Show Cause':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStyle(normalizedStatus)}`}>
      {normalizedStatus}
    </span>
  );
};

export default EmploymentStatusBadge;
