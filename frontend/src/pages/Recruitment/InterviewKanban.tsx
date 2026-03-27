import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { useToastStore } from '@/stores';
import { KanbanSkeleton } from '../../components/Custom/Shared';
import { useKanbanData, useKanbanDragDrop, useRequirementsModal } from '@kanban/Hooks';
import { KanbanHeader, KanbanBoard } from '@kanban/Components';
import { RequirementsModal } from '@kanban/Modals';

const InterviewKanban = () => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const showToast = useToastStore((state) => state.showToast);
  const showNotification = (message: string, type: 'success' | 'error') => showToast(message, type);
  
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
  
  const [searchParams] = useSearchParams();

  // Handle deep-linking from notifications
  useEffect(() => {
    const applicantId = searchParams.get('id');
    if (applicantId && applicants.length > 0) {
      const applicant = applicants.find(a => a.id.toString() === applicantId);
      if (applicant) {
        handleViewRequirements(applicant);
      }
    }
  }, [searchParams, applicants, handleViewRequirements]);

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>


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
