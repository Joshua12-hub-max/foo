import { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Plus } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { usePlantilla } from '@components/Custom/EmployeeManagement/Admin/Plantilla/hooks/usePlantilla';
import PlantillaHeader from '@components/Custom/EmployeeManagement/Admin/Plantilla/components/PlantillaHeader';
import PlantillaTable from '@components/Custom/EmployeeManagement/Admin/Plantilla/components/PlantillaTable';
import PlantillaFormModal from '@components/Custom/EmployeeManagement/Admin/Plantilla/components/PlantillaFormModal';
import { AssignModal, VacateModal, HistoryModal, GuideModal } from '@components/Custom/EmployeeManagement/Admin/Plantilla/components/PlantillaModals';

const PlantillaManagement = forwardRef(({ hideHeader = false }, ref) => {
    const outletContext = useOutletContext() || { sidebarOpen: true };
    const { sidebarOpen = true } = outletContext;
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    const {
        // State
        loading, error, departments, summary,
        selectedDept, setSelectedDept, searchTerm, setSearchTerm,
        isModalOpen, setIsModalOpen, modalMode, setModalMode, 
        currentPosition, setCurrentPosition,
        formData, setFormData,
        isAssignModalOpen, setIsAssignModalOpen, availableEmployees, selectedEmployee, setSelectedEmployee,
        isHistoryModalOpen, setIsHistoryModalOpen, positionHistory,
        isVacateModalOpen, setIsVacateModalOpen, vacateReason, setVacateReason,
        filteredPositions,

        // Actions
        handleDelete, handleCreateOrUpdate, handleAssign, handleVacate, fetchHistory, openAssignModal
    } = usePlantilla();

    const handleOpenCreate = useCallback(() => {
        setModalMode('create');
        setFormData({
            item_number: '',
            position_title: '',
            salary_grade: '',
            step_increment: 1,
            department: departments[0] || '',
            monthly_salary: '',
            is_vacant: true
        });
        setIsModalOpen(true);
    }, [departments, setModalMode, setFormData, setIsModalOpen]);

    // Expose modal trigger to parent
    useImperativeHandle(ref, () => ({
        openAddModal: () => handleOpenCreate()
    }));

    const handleOpenEdit = useCallback((position) => {
        setModalMode('edit');
        setCurrentPosition(position);
        setFormData({
            item_number: position.item_number,
            position_title: position.position_title,
            salary_grade: position.salary_grade,
            step_increment: position.step_increment,
            department: position.department || '',
            monthly_salary: position.monthly_salary || '',
            is_vacant: position.is_vacant === 1
        });
        setIsModalOpen(true);
    }, [setModalMode, setCurrentPosition, setFormData, setIsModalOpen]);

    const handleOpenVacate = useCallback((pos) => {
        setCurrentPosition(pos);
        setVacateReason('');
        setIsVacateModalOpen(true);
    }, [setCurrentPosition, setVacateReason, setIsVacateModalOpen]);

    return (
        <div className="w-full">
            {/* Header Section - Modernized */}
            {!hideHeader && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Plantilla Management</h2>
                        <p className="text-sm text-gray-500">Track and manage organizational positions and vacancies</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-gray-200 shadow-sm transition-all text-sm font-semibold"
                            onClick={() => setIsGuideOpen(true)}
                        >
                            Guide
                        </button>
                        <button 
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-semibold"
                            onClick={handleOpenCreate}
                        >
                            <Plus size={18} />
                            New Position
                        </button>
                    </div>
                </div>
            )}

            <div className={hideHeader ? "" : "bg-white rounded-2xl shadow-sm border border-gray-100 p-6"}>
                <PlantillaHeader 
                    sidebarOpen={sidebarOpen}
                    onOpenGuide={() => setIsGuideOpen(true)}
                    onOpenCreate={handleOpenCreate}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedDept={selectedDept}
                    setSelectedDept={setSelectedDept}
                    departments={departments}
                    hideHeader={true} // Add this prop to hide the title/buttons in PlantillaHeader
                />


            <PlantillaTable 
                loading={loading}
                error={error}
                positions={filteredPositions}
                onOpenAssign={openAssignModal}
                onOpenVacate={handleOpenVacate}
                onViewHistory={fetchHistory}
                onOpenEdit={handleOpenEdit}
                onDelete={handleDelete}
            />

            <PlantillaFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode={modalMode}
                formData={formData}
                setFormData={setFormData}
                departments={departments}
                onSubmit={handleCreateOrUpdate}
            />

            <AssignModal 
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                currentPosition={currentPosition}
                availableEmployees={availableEmployees}
                selectedEmployee={selectedEmployee}
                setSelectedEmployee={setSelectedEmployee}
                onAssign={handleAssign}
            />

            <VacateModal 
                isOpen={isVacateModalOpen}
                onClose={() => setIsVacateModalOpen(false)}
                currentPosition={currentPosition}
                vacateReason={vacateReason}
                setVacateReason={setVacateReason}
                onVacate={handleVacate}
            />

            <HistoryModal 
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                currentPosition={currentPosition}
                positionHistory={positionHistory}
            />

            <GuideModal 
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
            />
            </div>
        </div>
    );
});

export default PlantillaManagement;

