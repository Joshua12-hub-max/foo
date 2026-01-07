import { useOutletContext } from 'react-router-dom';
import { ToastNotification, useNotification } from '../../components/Custom/EmployeeManagement/Admin';
import { KanbanSkeleton } from '../../components/Custom/Shared';
import { useKanbanData, useKanbanDragDrop, useRequirementsModal } from '@kanban/Hooks';
import { KanbanHeader, KanbanBoard } from '@kanban/Components';
import { RequirementsModal } from '@kanban/Modals';

const InterviewKanban = () => {
  const { sidebarOpen } = useOutletContext();
  const { notification, showNotification } = useNotification();
  
  // Custom Hooks
  const { applicants, setApplicants, loading, fetchApplicants } = useKanbanData(showNotification);
  const { 
    sensors, 
    activeId, 
    activeApplicant, 
    handleDragStart, 
    handleDragEnd, 
    handleDragOver, 
    COLUMNS 
  } = useKanbanDragDrop(applicants, setApplicants, fetchApplicants, showNotification);
  
  const { 
    selectedApplicant, 
    isModalOpen, 
    handleViewRequirements, 
    handleCloseModal 
  } = useRequirementsModal();

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      <ToastNotification notification={notification} />

      <KanbanHeader />

      {loading ? (
        <KanbanSkeleton columns={5} cardsPerColumn={2} />
      ) : (
        <KanbanBoard 
          applicants={applicants}
          COLUMNS={COLUMNS}
          sensors={sensors}
          activeId={activeId}
          activeApplicant={activeApplicant}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          handleDragOver={handleDragOver}
          handleViewRequirements={handleViewRequirements}
        />
      )}

      <RequirementsModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        applicant={selectedApplicant}
      />
    </div>
  );
};

export default InterviewKanban;
