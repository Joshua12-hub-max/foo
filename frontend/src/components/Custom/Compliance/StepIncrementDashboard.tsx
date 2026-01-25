import React from 'react';
import { useEligibleEmployees, useProcessStepIncrement } from '@/hooks/useStepIncrement';

export const StepIncrementDashboard: React.FC = () => {
  const { data, isLoading, error } = useEligibleEmployees();
  const processIncrement = useProcessStepIncrement();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-semibold">Failed to load eligible employees</p>
      </div>
    );
  }

  const eligibleEmployees = data?.eligible_employees || [];
  const count = data?.count || 0;

  const handleApprove = async (employee: any) => {
    if (!confirm(`Approve step increment for ${employee.employee_name}?\n\nThis will:\n- Increase step from ${employee.current_step} to ${employee.next_step}\n- Update monthly salary automatically`)) return;

    try {
      await processIncrement.mutateAsync({
        increment_id: employee.employee_id,
        status: 'Approved',
        remarks: 'Meets all requirements for step increment'
      });
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900">Step Increment Management</h3>
        <p className="text-sm text-gray-500 mt-1">Employees eligible for step increment after 3 years of continuous service</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
          <div className="text-3xl font-bold text-blue-900">{count}</div>
          <div className="text-xs text-blue-700 font-medium mt-2">Eligible Employees</div>
          <div className="text-xs text-blue-600 mt-1">Ready for approval</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
          <div className="text-3xl font-bold text-green-900">
            {eligibleEmployees.reduce((sum, e) => sum + (e.next_step - e.current_step), 0)}
          </div>
          <div className="text-xs text-green-700 font-medium mt-2">Total Step Increases</div>
          <div className="text-xs text-green-600 mt-1">Across all eligible</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200">
          <div className="text-3xl font-bold text-purple-900">
            {eligibleEmployees.length > 0 
              ? Math.round(eligibleEmployees.reduce((sum, e) => sum + e.years_in_position, 0) / eligibleEmployees.length) 
              : 0}
          </div>
          <div className="text-xs text-purple-700 font-medium mt-2">Avg Years in Position</div>
          <div className="text-xs text-purple-600 mt-1">Tenure average</div>
        </div>
      </div>

      {/* Policy Info */}
      <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-4">
        <h4 className="text-sm font-bold text-blue-900 mb-2">Step Increment Policy</h4>
        <p className="text-sm text-blue-800 leading-relaxed">
          Employees are eligible for step increment after <strong>3 years of continuous service</strong> in their current position, 
          provided they have not received a promotion during that period and their current step is below 8. 
          Approval will automatically update the employee's salary based on the salary schedule.
        </p>
      </div>

      {/* Eligible Employees Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h4 className="text-base font-bold text-gray-900">Eligible Employees</h4>
        </div>

        {eligibleEmployees.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium">No employees eligible at this time</p>
            <p className="text-sm mt-1">Employees become eligible after 3 years in their current position</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Salary Grade</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Current Step</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Next Step</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Years in Position</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Eligible Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {eligibleEmployees.map((employee: any) => (
                  <tr key={employee.employee_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{employee.employee_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{employee.employee_employee_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{employee.position_title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        Salary Grade {employee.salary_grade}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">Step {employee.current_step}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                        Step {employee.next_step}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">{employee.years_in_position} years</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(employee.eligible_date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleApprove(employee)}
                        disabled={processIncrement.isPending}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepIncrementDashboard;
