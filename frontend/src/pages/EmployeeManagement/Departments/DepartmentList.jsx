import { useDepartmentManagement } from '../../../components/Custom/DepartmentComponents/Hooks/useDepartmentManagement';
import { DepartmentHeader } from '../../../components/Custom/DepartmentComponents/Components/DepartmentHeader';
import { DepartmentSearch } from '../../../components/Custom/DepartmentComponents/Components/DepartmentSearch';
import { DepartmentTable } from '../../../components/Custom/DepartmentComponents/Components/DepartmentTable';
import DepartmentFormModal from '../../../components/Custom/DepartmentComponents/Modals/DepartmentFormModal';
import DepartmentDeleteModal from '../../../components/Custom/DepartmentComponents/Modals/DepartmentDeleteModal';

const DepartmentList = () => {
  const { 
    filteredDepartments, 
    loading,
    searchTerm, 
    isModalOpen, 
    editingDepartment, 
    // Delete modal state
    deleteModalOpen,
    departmentToDelete,
    isDeleting,
    // Actions
    handleSearchChange, 
    handleAdd, 
    handleEdit, 
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm, 
    handleModalSubmit, 
    handleModalClose, 
    refresh 
  } = useDepartmentManagement();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-100 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      {/* Header Section */}
      <DepartmentHeader 
        onRefresh={refresh} 
        isLoading={loading} 
      />

      {/* Search & Filters */}
      <DepartmentSearch 
        searchTerm={searchTerm} 
        onSearchChange={handleSearchChange} 
        totalRecords={filteredDepartments.length}
        onAdd={handleAdd}
      />

      {/* Main Table */}
      <DepartmentTable 
        departments={filteredDepartments} 
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {/* Add/Edit Modal */}
      <DepartmentFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        initialData={editingDepartment}
      />

      {/* Delete Confirmation Modal */}
      <DepartmentDeleteModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        department={departmentToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default DepartmentList;
