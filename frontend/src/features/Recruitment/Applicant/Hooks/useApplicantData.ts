import { useState, useCallback, useEffect, useRef } from 'react';
import { recruitmentApi } from '@/api/recruitmentApi';

export interface Applicant {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title?: string;
  email_subject?: string;
  source?: string;
  stage: string;
  status?: string;
  resume_path?: string;
  interview_date?: string;
  interview_link?: string;
  interview_platform?: string;
  interviewer_id?: number;
  interviewer_name?: string;
  notes?: string;
  created_at?: string;
}

export interface Interviewer {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  job_title?: string;
  department?: string;
}

const useApplicantData = (showNotification?: (message: string, type: 'success' | 'error') => void) => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  
  // Use ref to avoid infinite loop from callback dependency
  const notificationRef = useRef(showNotification);
  notificationRef.current = showNotification;

  const fetchData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setIsRefetching(true);

      const [appRes, intRes] = await Promise.all([
        recruitmentApi.getApplicants(),
        recruitmentApi.getInterviewers()
      ]);
      setApplicants(appRes.data.applicants || []);
      setInterviewers(intRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (notificationRef.current) notificationRef.current('Failed to load data', 'error');
    } finally {
      setLoading(false);
      setIsRefetching(false);
    }
  }, []); // Empty dependency array - stable function reference

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
