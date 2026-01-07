import { useState, useCallback } from 'react';

const useRequirementsModal = () => {
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewRequirements = useCallback((applicant) => {
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
