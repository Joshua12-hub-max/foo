/**
 * Employee Department Page
 * Refactored to use modular components and custom hook
 * Read-only view of employee's department info and colleagues
 */

import { Building2, Users, User, RefreshCw } from 'lucide-react';
import { useEmployeeDepartment } from '../../components/Custom/DepartmentComponents/Hooks/useEmployeeDepartment';
import EmployeeDepartmentHeader from '../../components/Custom/DepartmentComponents/Components/EmployeeDepartmentHeader';
import ColleaguesTable from '../../components/Custom/DepartmentComponents/Components/ColleaguesTable';

const EmployeeDepartment = () => {
  const {
    // Data
    departmentData,
    colleagues,
    totalMembers,
    loading,
    error,
    
    // Actions
    refresh
  } = useEmployeeDepartment();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-100 to-stone-100 rounded-xl p-7">
        <div className="text-gray-500 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading department info...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-neutral-100 to-stone-100 rounded-xl p-7">
        <div className="text-gray-500 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">{error}</p>
          <p className="text-sm text-gray-400 mt-1">Please contact HR for assistance</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-100 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      {/* Header */}
      <EmployeeDepartmentHeader onRefresh={refresh} />

      {/* Department Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gray-100 rounded-xl">
            <Building2 className="w-8 h-8 text-gray-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800">{departmentData?.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {departmentData?.description || 'No description available'}
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4 text-gray-400" />
                <span>Head: <span className="font-medium">{departmentData?.head_name || 'Not assigned'}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4 text-gray-400" />
                <span>Members: <span className="font-medium">{totalMembers}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Colleagues Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            My Colleagues
            <span className="text-sm font-normal text-gray-400">({colleagues.length})</span>
          </h3>
        </div>
        
        <ColleaguesTable colleagues={colleagues} />
      </div>
    </div>
  );
};

export default EmployeeDepartment;
