import { useState, useCallback, useEffect } from 'react';
import { recruitmentApi } from '@/api/recruitmentApi';

export interface Applicant {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  emailSubject?: string;
  source?: string;
  stage: string;
  status?: string;
  resumePath?: string;
  interviewDate?: string;
  interviewLink?: string;
  interviewPlatform?: string;
  interviewerId?: number;
  interviewerName?: string;
  notes?: string;
  createdAt?: string;
}

export interface Interviewer {
  id: number;
  name: string;
  email: string;
  department?: string;
}

const useApplicantData = (showNotification?: (message: string, type: 'success' | 'error') => void) => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);

  const fetchData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setIsRefetching(true);

      const [appRes, intRes] = await Promise.all([
        recruitmentApi.getApplicants(),
        recruitmentApi.getInterviewers()
      ]);
      setApplicants(appRes.data.applicants || []);
      const mappedInterviewers: Interviewer[] = (intRes.data || []).map(i => ({
        id: i.id,
        name: i.name || `${i.firstName || ''} ${i.lastName || ''}`.trim() || 'Unknown',
        email: i.email,
        department: i.department
      }));
      setInterviewers(mappedInterviewers);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (showNotification) showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
      setIsRefetching(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    applicants, 
    interviewers, 
    loading, 
    isRefetching, 
    fetchData,
    setApplicants
  };
};

export default useApplicantData;
