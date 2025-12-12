/**
 * DepartmentDetail Page
 * Refactored to use modular components and custom hook
 */

import { ArrowLeft, Users, Search, UserPlus } from 'lucide-react';
import { useDepartmentDetail } from '../../../components/Custom/DepartmentComponents/Hooks/useDepartmentDetail';
import DepartmentEmployeeTable from '../../../components/Custom/DepartmentComponents/Components/DepartmentEmployeeTable';
import RemoveEmployeeModal from '../../../components/Custom/DepartmentComponents/Modals/RemoveEmployeeModal';
import AddEmployeeToDepartment from '../../../components/Custom/DepartmentComponents/Department/AddEmployeeToDepartment';

const DepartmentDetail = () => {
  const {
    // Data
    department,
    employees,
    filteredEmployees,
    loading,
    searchTerm,
    
    // Modal states
    isAddEmployeeModalOpen,
    deleteConfirm,
    isProcessing,
    
    // Actions
    loadData,
    navigateBack,
    navigateToEmployee,
    handleRemoveEmployee,
    handleSearchChange,
    openAddEmployeeModal,
    closeAddEmployeeModal,
    openDeleteConfirm,
    closeDeleteConfirm
  } = useDepartmentDetail();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-screen bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Department Not Found</h2>
        <button 
          onClick={navigateBack}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Back to Departments
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Remove Employee Confirmation Modal */}
      <RemoveEmployeeModal
        isOpen={!!deleteConfirm}
        onClose={closeDeleteConfirm}
        onConfirm={handleRemoveEmployee}
        employee={deleteConfirm}
        isProcessing={isProcessing}
      />

      {/* Header */}
      <div>
        <button 
          onClick={navigateBack}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          <span>Back to Departments</span>
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{department.name}</h1>
              <p className="text-sm text-gray-500">{department.description || 'No description'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total Employees</p>
              <p className="text-2xl font-bold text-blue-600">{employees.length}</p>
            </div>
          </div>

          <div className="flex gap-8 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Department Head</p>
              <p className="text-sm font-medium text-gray-800">{department.head_of_department || 'Not Assigned'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Department ID</p>
              <p className="text-sm font-medium text-gray-800">DEPT-{String(department.id).padStart(3, '0')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Management Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">Employee Management</h2>
            <p className="text-gray-500 text-xs">Manage employees in the {department.name} department</p>
          </div>
          <button
            onClick={openAddEmployeeModal}
            className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <UserPlus size={16} />
            <span>Add Employee</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300 max-w-sm mb-4">
          <Search className="text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Employee Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Employee</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Employee ID</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Position</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Contact</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Date Hired</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <DepartmentEmployeeTable
                employees={filteredEmployees}
                onViewEmployee={navigateToEmployee}
                onEditEmployee={navigateToEmployee}
                onRemoveEmployee={openDeleteConfirm}
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeToDepartment
        isOpen={isAddEmployeeModalOpen}
        onClose={closeAddEmployeeModal}
        department={department}
        onSuccess={loadData}
      />
    </div>
  );
};

export default DepartmentDetail;
