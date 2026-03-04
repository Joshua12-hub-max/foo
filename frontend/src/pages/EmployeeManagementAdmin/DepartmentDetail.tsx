import React, { useState } from 'react';
import { ArrowLeft, Users, Search, UserPlus, UserPlus2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { useDepartmentDetails, DepartmentEmployeeTable, RemoveEmployeeModal, AddEmployeeToDepartment } from '@features/EmployeeManagement/Admin/Departments';
import { Employee as GlobalEmployee } from '@/types';
import Pagination from '@/components/CustomUI/Pagination';
import RegistrationTypeModal from '@/components/Custom/EmployeeManagement/Admin/Modals/RegistrationTypeModal';

interface OutletContext {
  sidebarOpen?: boolean;
}

interface Department {
  id: number;
  name: string;
  description?: string;
  headOfDepartment?: string;
}

interface Employee {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  job_title?: string | null;
  position_title?: string | null;
}

const DepartmentDetail: React.FC = () => {
  const navigate = useNavigate();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

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
  } = useDepartmentDetails();

  // Registration modal state
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);

  const handleSelectRegistrationType = (isOld: boolean, duties: string) => {
    setIsRegModalOpen(false);
    const params = new URLSearchParams({
      duties,
      type: isOld ? 'old' : 'hired',
      dept: department?.name || ''
    });
    navigate(`/admin-dashboard/register?${params.toString()}`);
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Pagination Calculation
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Pagination handler
  const handlePageChange = (page: number) => setCurrentPage(page);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-screen bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Department Not Found</h2>
        <button 
          onClick={navigateBack}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Back to Departments
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      <hr className="mb-6 border-[1px] border-gray-200" />
      {/* Remove Employee Confirmation Modal */}
      <RemoveEmployeeModal
        isOpen={!!deleteConfirm}
        onClose={closeDeleteConfirm}
        departmentId={department?.id || 0}
        onSuccess={() => {
            loadData();
            closeDeleteConfirm();
        }}
        employee={deleteConfirm || undefined}
      />

      {/* Header - Compact Version */}
      <div>
        <button 
          onClick={navigateBack}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          <span>Return to Directory</span>
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-2">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-lg font-bold text-gray-800">{department.name}</h1>
              <p className="text-xs text-gray-500">{department.description || 'No description'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500">Total Employees</p>
              <p className="text-xl font-bold text-blue-600">{employees.length}</p>
            </div>
          </div>

          <div className="flex gap-8 mt-3 pt-3 border-t border-gray-100">
            <div>
              <p className="text-[10px] text-gray-500">Department Head</p>
              <p className="text-xs font-medium text-gray-800">{department.headOfDepartment || 'Not Assigned'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Department ID</p>
              <p className="text-xs font-medium text-gray-800">DEPT-{String(department.id).padStart(3, '0')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Management Section */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">Employee Management</h2>
            <p className="text-gray-500 text-xs">Manage employees in the {department.name} department</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRegModalOpen(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-bold"
            >
              <UserPlus2 size={16} />
              <span>Register Employee</span>
            </button>
            <button
              onClick={openAddEmployeeModal}
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-bold"
            >
              <UserPlus size={16} />
              <span>Add Employee</span>
            </button>
          </div>
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

        {/* Employee Table - Timekeeping Style */}
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto bg-gray-50 rounded-lg scrollbar-bg-white">
            <table className="w-full text-left min-w-[1000px]">
              <thead className="bg-gray-200 shadow-md text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-700 text-sm tracking-wide">Employee</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-sm tracking-wide">Employee ID</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-sm tracking-wide">Position</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-sm tracking-wide">Duties</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-sm tracking-wide">Contact</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-sm tracking-wide">Date Hired</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-sm tracking-wide">Status</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-sm tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <DepartmentEmployeeTable
                  employees={currentEmployees as unknown as GlobalEmployee[]}
                  onViewEmployee={navigateToEmployee}
                  onEditEmployee={navigateToEmployee}
                  onRemoveEmployee={openDeleteConfirm}
                />
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalItems > 0 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>

        {/* Add Employee Modal */}
        <AddEmployeeToDepartment
            isOpen={isAddEmployeeModalOpen}
            onClose={closeAddEmployeeModal}
            department={department}
            onSuccess={loadData}
        />

        {/* Registration Type Selection Modal */}
        <RegistrationTypeModal
          isOpen={isRegModalOpen}
          onClose={() => setIsRegModalOpen(false)}
          departmentName={department?.name || ''}
          onSelectType={handleSelectRegistrationType}
        />
      </div>
    </div>
  );
};

export default DepartmentDetail;
