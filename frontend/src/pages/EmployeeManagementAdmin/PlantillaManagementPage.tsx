import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Plus } from 'lucide-react';
import { useUIStore } from '@/stores';
import { usePlantilla, Position } from '@features/EmployeeManagement/Admin/Plantilla/hooks/usePlantilla';
import PlantillaHeader from '@features/EmployeeManagement/Admin/Plantilla/components/PlantillaHeader';
import PlantillaTable from '@features/EmployeeManagement/Admin/Plantilla/components/PlantillaTable';
import PlantillaFormModal from '@features/EmployeeManagement/Admin/Plantilla/components/PlantillaFormModal';
import { AssignModal, VacateModal, HistoryModal, GuideModal } from '@features/EmployeeManagement/Admin/Plantilla/components/PlantillaModals';

interface OutletContext {
  sidebarOpen?: boolean;
}

interface PlantillaManagementProps {
  hideHeader?: boolean;
}

export interface PlantillaManagementRef {
  openAddModal: () => void;
}
// Local Position interface removed


interface FormData {
  item_number: string;
  position_title: string;
  salary_grade: string;
  step_increment: number;
  department: string;
  monthly_salary: string;
  is_vacant: boolean;
}

const PlantillaManagement = forwardRef<PlantillaManagementRef, PlantillaManagementProps>(({ hideHeader = false }, ref) => {
    const sidebarOpen = useUIStore((state) => state.sidebarOpen);
    const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

    const {
        // State
        loading, error, departments, summary,
        selectedDept, setSelectedDept, searchTerm, setSearchTerm,
        isModalOpen, setIsModalOpen, modalMode, setModalMode, 
        currentPosition, setCurrentPosition,
        isAssignModalOpen, setIsAssignModalOpen, availableEmployees, selectedEmployee, setSelectedEmployee,
        isHistoryModalOpen, setIsHistoryModalOpen, positionHistory,
        isVacateModalOpen, setIsVacateModalOpen, vacateReason, setVacateReason,
        filteredPositions,

        // Actions
        handleDelete, handleCreateOrUpdate, handleAssign, handleVacate, fetchHistory, openAssignModal
    } = usePlantilla();

    const handleOpenCreate = useCallback((): void => {
        setModalMode('create');
        setCurrentPosition(null);
        setIsModalOpen(true);
    }, [setModalMode, setCurrentPosition, setIsModalOpen]);

    // Expose modal trigger to parent
    useImperativeHandle(ref, () => ({
        openAddModal: () => handleOpenCreate()
    }));

    const handleOpenEdit = useCallback((position: Position): void => {
        setModalMode('edit');
        setCurrentPosition(position);
        setIsModalOpen(true);
    }, [setModalMode, setCurrentPosition, setIsModalOpen]);

    const handleOpenVacate = useCallback((pos: Position): void => {
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
                mode={modalMode as any}
                initialData={currentPosition ? {
                    item_number: currentPosition.item_number,
                    position_title: currentPosition.position_title,
                    salary_grade: Number(currentPosition.salary_grade),
                    step_increment: currentPosition.step_increment,
                    department: currentPosition.department,
                    monthly_salary: Number(currentPosition.monthly_salary || 0),
                    is_vacant: Boolean(currentPosition.is_vacant)
                } : undefined}
                departments={departments}
                onSubmit={handleCreateOrUpdate}
            />

            <AssignModal 
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                currentPosition={currentPosition}
                availableEmployees={availableEmployees as any}
                onSuccess={() => {
                    // Refetch is handled by query invalidation in modals
                }}
            />

            <VacateModal 
                isOpen={isVacateModalOpen}
                onClose={() => setIsVacateModalOpen(false)}
                currentPosition={currentPosition}
                onSuccess={() => {
                   // Refetch is handled by query invalidation in modals
                }}
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

PlantillaManagement.displayName = 'PlantillaManagement';

export default PlantillaManagement;
