/**
 * EmployeeInfoCard Component
 * Displays employee information for review forms
 */

import { getStatusColor } from '../constants/performanceConstants';

const EmployeeInfoCard = ({
  formData,
  employees,
  cycles,
  isNew,
  onEmployeeChange,
  onCycleChange
}) => {
  const selectedEmployee = employees.find(e => e.id == formData.employee_id);
  const selectedCycle = cycles.find(c => c.id == formData.review_cycle_id);

  return (
    <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 bg-[#F8F9FA] border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 text-sm">Employee Information</h3>
        <span className={`px-3 py-1 rounded-sm text-xs font-bold ${getStatusColor(formData.status)}`}>
          {formData.status}
        </span>
      </div>

      {/* Content */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Employee Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-500">Employee Name</label>
          {isNew ? (
            <select
              value={formData.employee_id}
              onChange={(e) => onEmployeeChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-gray-300 outline-none"
            >
              <option value="">-- Select Employee --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          ) : (
            <div className="font-bold text-gray-800 text-lg">
              {formData.employee_first_name} {formData.employee_last_name}
            </div>
          )}
        </div>

        {/* Position */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-500">Position / Title</label>
          <div className="font-medium text-gray-700">
            {formData.employee_job_title || selectedEmployee?.job_title || 'N/A'}
          </div>
        </div>

        {/* Department */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-500">Department / Office</label>
          <div className="font-medium text-gray-700">
            {formData.employee_department || selectedEmployee?.department || 'N/A'}
          </div>
        </div>

        {/* Review Period */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-500">Review Period</label>
          {isNew ? (
            <select
              value={formData.review_cycle_id}
              onChange={(e) => onCycleChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-gray-300 outline-none"
            >
              <option value="">-- Select Cycle --</option>
              {cycles.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          ) : (
            <div className="font-medium text-gray-700">
              {selectedCycle?.title || 'Standard Cycle'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeInfoCard;
