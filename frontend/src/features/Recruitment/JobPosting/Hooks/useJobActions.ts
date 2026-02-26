import { useState, useEffect } from 'react';
import { recruitmentApi } from '@/api/recruitmentApi';
import { JobFormData } from '@/types';

interface AxiosErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const useJobActions = (
  loadJobs: () => void, 
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void
) => {
  const [saving, setSaving] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<number | null>(null);

  const handleSaveJob = async (
    isEditing: boolean, 
    selectedJobId: number | null, 
    formData: JobFormData | FormData, 
    onSuccess: () => void
  ) => {
    setSaving(true);
    try {
      if (isEditing && selectedJobId) {
        await recruitmentApi.updateJob(selectedJobId, formData);
      } else {
        await recruitmentApi.createJob(formData);
      }
      
      // Artificial delay for UX
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      onSuccess();
      loadJobs();
    } catch (error: unknown) {
      console.error('Failed to save job:', error);
      const axiosError = error as AxiosErrorLike;
      const message = axiosError.response?.data?.message || 
                     (error instanceof Error ? error.message : 'Failed to save job posting');
      showNotification(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJob = async (jobId: number, onSuccess: () => void) => {
    setSaving(true);
    try {
      await recruitmentApi.deleteJob(jobId);
      onSuccess();
      loadJobs();
    } catch (error: unknown) {
      console.error('Failed to delete job:', error);
      showNotification('Failed to delete job posting', 'error');
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    handleSaveJob,
    handleDeleteJob
  };
};

export default useJobActions;
