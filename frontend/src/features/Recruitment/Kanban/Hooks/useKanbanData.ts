import { useState, useCallback, useEffect, useRef } from 'react';
import { recruitmentApi } from '@/api/recruitmentApi';

export interface KanbanApplicant {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  stage: string;
  status?: string;
  job_title?: string;
  job_requirements?: string;
  job_department?: string;
  source?: string;
  created_at?: string;
  interviewer_name?: string;
  interview_date?: string;
  resume_path?: string;
}

const useKanbanData = (showNotification: (message: string, type: 'success' | 'error') => void) => {
  const [applicants, setApplicants] = useState<KanbanApplicant[]>([]);
  const [loading, setLoading] = useState(true);

  // Use ref to avoid infinite loop from callback dependency
  const notificationRef = useRef(showNotification);
  notificationRef.current = showNotification;

  const fetchApplicants = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await recruitmentApi.getApplicants();
      const relevantStages = ['Applied', 'Screening', 'Initial Interview', 'Final Interview', 'Hired', 'Rejected'];
      const relevantApplicants: KanbanApplicant[] = data.applicants
        .filter(a => relevantStages.includes(a.stage) || a.stage === null || a.stage === 'Offer')
        .map(a => ({
          ...a,
          // Migrate 'Offer' stage to 'Final Interview' since Offer stage is removed
          stage: a.stage === 'Offer' ? 'Final Interview' : (a.stage || 'Applied')
        }));
      setApplicants(relevantApplicants);
    } catch (err) {
      console.error('Error fetching applicants:', err);
      notificationRef.current('Failed to load applicants', 'error');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - stable function reference

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

