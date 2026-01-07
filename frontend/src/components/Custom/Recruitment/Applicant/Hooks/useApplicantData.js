import { useState, useCallback, useEffect } from 'react';
import { recruitmentApi } from '@api/recruitmentApi';

const useApplicantData = (showNotification) => {
  const [applicants, setApplicants] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
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
      setInterviewers(intRes.data || []);
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
    setApplicants // Exposed for optimistic updates if needed
  };
};

export default useApplicantData;
