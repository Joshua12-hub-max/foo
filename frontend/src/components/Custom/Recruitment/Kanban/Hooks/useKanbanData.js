import { useState, useCallback, useEffect } from 'react';
import { recruitmentApi } from '@api/recruitmentApi';

const useKanbanData = (showNotification) => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch applicants from all relevant stages
  const fetchApplicants = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all applicants and filter in frontend
      const { data } = await recruitmentApi.getApplicants();
      // Include all pipeline stages (Applied/null = new applicants)
      const relevantApplicants = data.applicants.filter(a => 
        ['Applied', 'Screening', 'Initial Interview', 'Final Interview', 'Offer', 'Hired', 'Rejected'].includes(a.stage) ||
        a.stage === null  // New applicants with no stage set
      ).map(a => ({
        ...a,
        stage: a.stage || 'Applied'  // Normalize null to 'Applied'
      }));
      setApplicants(relevantApplicants);
    } catch (err) {
      console.error('Error fetching applicants:', err);
      showNotification('Failed to load applicants', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  return {
    applicants,
    setApplicants,
    loading,
    fetchApplicants
  };
};

export default useKanbanData;
