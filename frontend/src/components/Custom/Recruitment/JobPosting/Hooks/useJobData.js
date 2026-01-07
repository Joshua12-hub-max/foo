import { useState, useCallback, useEffect } from 'react';
import { recruitmentApi } from '@api/recruitmentApi';

const useJobData = (showNotification) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingEmails, setCheckingEmails] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await recruitmentApi.getJobs();
      if (response.data.success) {
        setJobs(response.data.jobs);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError('Failed to load job postings');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCheckEmails = useCallback(async () => {
    setCheckingEmails(true);
    try {
      const { data } = await recruitmentApi.checkEmails();
      if (data.processed > 0) {
        showNotification(`Found ${data.processed} new application(s) from email`, 'success');
      } else {
        showNotification('No new email applications found', 'info');
      }
    } catch (err) {
      console.error('Email check failed:', err);
      showNotification('Failed to check emails. Make sure IMAP is configured.', 'error');
    } finally {
      setCheckingEmails(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return {
    jobs,
    loading,
    error,
    checkingEmails,
    loadJobs,
    handleCheckEmails
  };
};

export default useJobData;
