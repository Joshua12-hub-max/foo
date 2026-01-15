import { useState, useEffect } from 'react';
import { recruitmentApi } from '@/api/recruitmentApi';
import { JobFormData } from '@/types';

const useJobActions = (
  loadJobs: () => void, 
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void
) => {
  const [saving, setSaving] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<number | null>(null);

  const handleSaveJob = async (
    isEditing: boolean, 
    selectedJobId: number | null, 
    formData: JobFormData, 
    onSuccess: () => void
  ) => {
    setSaving(true);
    try {
      if (isEditing && selectedJobId) {
        await recruitmentApi.updateJob(selectedJobId, formData);
      } else {
        await recruitmentApi.createJob(formData);
      }
      onSuccess();
      loadJobs();
    } catch (err: any) {
      console.error('Failed to save job:', err);
      showNotification(err.response?.data?.message || 'Failed to save job posting', 'error');
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
    } catch (err) {
      console.error('Failed to delete job:', err);
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
