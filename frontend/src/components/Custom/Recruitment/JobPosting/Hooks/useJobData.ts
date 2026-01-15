import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recruitmentApi } from '@/api/recruitmentApi';
import { Job } from '@/types';

const useJobData = (showNotification?: (message: string, type: 'success' | 'error' | 'info') => void) => {
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await recruitmentApi.getJobs({});
      if (response.data.success) {
        return response.data.jobs;
      }
      throw new Error(response.data.message || 'Failed to load jobs');
    },
    // Initial data or placeholder could be set here if needed
  });

  const error = queryError instanceof Error ? queryError.message : (queryError ? String(queryError) : null);

  const loadJobs = useCallback(() => {
    refetch();
  }, [refetch]);

  const checkEmailsMutation = useMutation({
    mutationFn: recruitmentApi.checkEmails,
    onSuccess: (response) => {
       const { data } = response;
       if (data.processed > 0) {
         showNotification?.(`Found ${data.processed} new application(s) from email`, 'success');
         // Invalidate/refetch jobs if email check adds new jobs/applicants? 
         // Assuming it might, good practice to invalidate.
         queryClient.invalidateQueries({ queryKey: ['jobs'] });
       } else {
         showNotification?.('No new email applications found', 'info');
       }
    },
    onError: (err) => {
       console.error('Email check failed:', err);
       showNotification?.('Failed to check emails. Make sure IMAP is configured.', 'error');
    }
  });

  const handleCheckEmails = useCallback(() => {
     checkEmailsMutation.mutate();
  }, [checkEmailsMutation]);

  return {
    jobs,
    loading,
    error,
    checkingEmails: checkEmailsMutation.isPending,
    loadJobs,
    handleCheckEmails
  };
};

export default useJobData;
