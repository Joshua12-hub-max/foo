import { useState, useCallback, useEffect, useRef } from 'react';
import { recruitmentApi } from '@/api/recruitmentApi';
import type { Applicant, Interviewer } from '@/types/recruitment';

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
