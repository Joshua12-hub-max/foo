import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Plus } from 'lucide-react';
import { useUIStore } from '@/stores';
import { usePlantilla, Position } from '@features/EmployeeManagement/Admin/Plantilla/hooks/usePlantilla';
import PlantillaHeader from '@features/EmployeeManagement/Admin/Plantilla/components/PlantillaHeader';
import PlantillaTable from '@features/EmployeeManagement/Admin/Plantilla/components/PlantillaTable';
import PlantillaFormModal from '@features/EmployeeManagement/Admin/Plantilla/components/PlantillaFormModal';
import AppointmentFormModal from '@features/EmployeeManagement/Admin/Plantilla/components/AppointmentFormModal';
import { AssignModal, VacateModal, HistoryModal, GuideModal } from '@features/EmployeeManagement/Admin/Plantilla/components/PlantillaModals';

const BudgetTrackingDashboard = React.lazy(() => import('@/components/Custom/Compliance/BudgetTrackingDashboard'));
const ComplianceReportsDashboard = React.lazy(() => import('@/components/Custom/Compliance/ComplianceReportsDashboard'));
const StepIncrementDashboard = React.lazy(() => import('@/components/Custom/Compliance/StepIncrementDashboard'));
const QualificationStandardsPage = React.lazy(() => import('@/pages/EmployeeManagementAdmin/QualificationStandardsPage'));

interface OutletContext {
  sidebarOpen?: boolean;
}


interface PlantillaManagementProps {
  hideHeader?: boolean;
}

export interface PlantillaManagementRef {
  openAddModal: () => void;
}

interface FormData {
  item_number: string;
  position_title: string;
  salary_grade: string;
  step_increment: number;
  department: string;
  monthly_salary: string;
  is_vacant: boolean;
}

type TabType = 'positions' | 'qualifications' | 'step-increment' | 'budget' | 'reports';

const PlantillaManagement = forwardRef<PlantillaManagementRef, PlantillaManagementProps>(({ hideHeader = false }, ref) => {
    const sidebarOpen = useUIStore((state) => state.sidebarOpen);
    const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<TabType>('positions');

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
        handleDelete, handleCreateOrUpdate, handleAssign, handleVacate, fetchHistory, openAssignModal, openAppointmentModal,
        isAppointmentModalOpen, setIsAppointmentModalOpen
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

    const tabs = [
        { id: 'positions' as TabType, label: 'Positions' },
        { id: 'qualifications' as TabType, label: 'Qualification Standards' },
        { id: 'step-increment' as TabType, label: 'Step Increment' },
        { id: 'budget' as TabType, label: 'Budget Tracking' },
        { id: 'reports' as TabType, label: 'Compliance Reports' },
    ];

    return (
        <div className="w-full">
            {/* Header Section */}
            {!hideHeader && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Plantilla Management System</h2>
                        <p className="text-sm text-gray-600 mt-1">100% CSC/DBM/COA Compliant Position & Personnel Management</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-all text-sm font-semibold"
                            onClick={() => setIsGuideOpen(true)}
                        >
                            View Guide
                        </button>
                        {activeTab === 'positions' && (
                            <button 
                                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-bold"
                                onClick={handleOpenCreate}
                            >
                                <Plus size={18} />
                                New Position
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Tabs Navigation */}
            <div className="bg-gray-100 p-1 rounded-xl mb-6 inline-flex gap-1 w-fit">
                <div className="flex overflow-x-auto gap-1">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                    isActive
                                        ? 'text-gray-900 bg-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                {activeTab === 'positions' && (
                    <>
                        <PlantillaHeader 
                            departments={departments}
                            selectedDept={selectedDept}
                            setSelectedDept={setSelectedDept}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            summary={summary}
                            onCreateNew={handleOpenCreate}
                            hideHeader={true}
                            onExportPDF={() => {
                                import('@features/EmployeeManagement/Admin/Plantilla/components/print/psipop_pdf_generator')
                                    .then(({ generatePSIPOPPDF }) => {
                                        const deptName = selectedDept === 'All' 
                                            ? 'All Departments' 
                                            : departments.find(d => String(d.id) === String(selectedDept))?.name || 'Unknown';
                                        
                                        generatePSIPOPPDF(filteredPositions, {
                                            departmentGocc: deptName,
                                            bureauAgency: 'LGU Ligao',
                                            preparedBy: 'HR Officer',
                                            approvedBy: 'City Mayor'
                                        });
                                    });
                            }}
                            onExportExcel={() => {
                                import('@features/EmployeeManagement/Admin/Plantilla/components/print/psipop_excel_generator')
                                    .then(({ generatePSIPOPExcel }) => {
                                        const deptName = selectedDept === 'All' 
                                            ? 'All Departments' 
                                            : departments.find(d => String(d.id) === String(selectedDept))?.name || 'Unknown';
                                        generatePSIPOPExcel(filteredPositions, { departmentGocc: deptName });
                                    });
                            }}
                        />

                        <PlantillaTable 
                            positions={filteredPositions}
                            loading={loading}
                            onEdit={handleOpenEdit}
                            onDelete={handleDelete}
                            onAssign={openAssignModal}
                            onVacate={handleOpenVacate}
                            onViewHistory={fetchHistory}
                        />
                    </>
                )}

                {activeTab === 'qualifications' && (
                    <React.Suspense fallback={
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
                        </div>
                    }>
                        <QualificationStandardsPage />
                    </React.Suspense>
                )}

                {activeTab === 'step-increment' && (
                    <React.Suspense fallback={
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
                        </div>
                    }>
                        <StepIncrementDashboard />
                    </React.Suspense>
                )}

                {activeTab === 'budget' && (
                    <React.Suspense fallback={
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
                        </div>
                    }>
                        <BudgetTrackingDashboard selectedDeptName={
                            selectedDept === 'All' 
                                ? 'All' 
                                : departments.find(d => String(d.id) === String(selectedDept))?.name || 'All'
                        } />
                    </React.Suspense>
                )}

                {activeTab === 'reports' && (
                    <React.Suspense fallback={
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
                        </div>
                    }>
                        <ComplianceReportsDashboard />
                    </React.Suspense>
                )}
            </div>

            {/* Modals */}
            <PlantillaFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode={modalMode}
                position={currentPosition}
                onSubmit={handleCreateOrUpdate}
                departments={departments}
            />

            <AssignModal 
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                position={currentPosition}
                availableEmployees={availableEmployees}
                selectedEmployee={selectedEmployee}
                setSelectedEmployee={setSelectedEmployee}
                onAssign={handleAssign}
            />

            <VacateModal 
                isOpen={isVacateModalOpen}
                onClose={() => setIsVacateModalOpen(false)}
                position={currentPosition}
                vacateReason={vacateReason}
                setVacateReason={setVacateReason}
                onVacate={handleVacate}
            />

            <HistoryModal 
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                position={currentPosition}
                history={positionHistory}
            />

            <AppointmentFormModal 
                isOpen={isAppointmentModalOpen}
                onClose={() => setIsAppointmentModalOpen(false)}
                position={currentPosition}
            />

            <GuideModal  
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
            />
        </div>
    );
});

PlantillaManagement.displayName = 'PlantillaManagement';

export default PlantillaManagement;
