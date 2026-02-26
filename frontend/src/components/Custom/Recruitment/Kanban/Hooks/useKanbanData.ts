import { useState, useCallback, useEffect } from 'react';
import { recruitmentApi } from '@/api/recruitmentApi';
import { Applicant } from '@/types/recruitment';

export interface KanbanApplicant {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  stage: string;
  job_title?: string;
  source?: string;
  created_at?: string;
  interviewer_name?: string;
  interview_date?: string;
}

const useKanbanData = (showNotification: (message: string, type: 'success' | 'error') => void) => {
  const [applicants, setApplicants] = useState<KanbanApplicant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplicants = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await recruitmentApi.getApplicants();
      const relevantApplicants = data.applicants.filter((a: Applicant) => 
        ['Applied', 'Screening', 'Initial Interview', 'Final Interview', 'Offer', 'Hired', 'Rejected'].includes(a.stage) ||
        !a.stage
      ).map((a: Applicant) => ({
        ...a,
        stage: a.stage || 'Applied'
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
