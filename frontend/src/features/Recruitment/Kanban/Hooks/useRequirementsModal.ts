import { useState, useCallback } from 'react';
import { KanbanApplicant } from './useKanbanData';

const useRequirementsModal = () => {
  const [selectedApplicant, setSelectedApplicant] = useState<KanbanApplicant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewRequirements = useCallback((applicant: KanbanApplicant) => {
    setSelectedApplicant(applicant);
    setIsModalOpen(true);
  }, []);
  
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedApplicant(null);
  }, []);

  return {
    selectedApplicant,
    isModalOpen,
    handleViewRequirements,
    handleCloseModal
  };
};

export default useRequirementsModal;
