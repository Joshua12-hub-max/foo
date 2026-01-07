import { useState, useEffect } from 'react';
import { recruitmentApi } from '@api/recruitmentApi';

const useJobActions = (loadJobs, showNotification) => {
  const [saving, setSaving] = useState(false);

  const handleSaveJob = async (isEditing, selectedJobId, formData, onSuccess) => {
    setSaving(true);
    try {
      if (isEditing && selectedJobId) {
        await recruitmentApi.updateJob(selectedJobId, formData);
      } else {
        await recruitmentApi.createJob(formData);
      }
      onSuccess();
      loadJobs();
    } catch (err) {
      console.error('Failed to save job:', err);
      showNotification(err.response?.data?.message || 'Failed to save job posting', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJob = async (jobId, onSuccess) => {
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

  const handlePostToTelegram = async (jobId, onSuccess) => {
    setSaving(true);
    try {
      const response = await recruitmentApi.postJobToTelegram(jobId);
      if (response.data.success) {
        showNotification('Successfully posted to Telegram!', 'success');
        onSuccess();
        loadJobs();
      }
    } catch (err) {
      console.error('Failed to post:', err);
      showNotification(err.response?.data?.message || 'Failed to post to Telegram', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* 
   * NEW: Ref to track which job was being shared when auth popup opened 
   */
  const [pendingJobId, setPendingJobId] = useState(null);

  // Listen for popup success message
  useEffect(() => {
    const handleMessage = (event) => {
        if (event.data?.type === 'LINKEDIN_AUTH_SUCCESS') {
            console.log('LinkedIn Auth Success received!', event.data);
            if (pendingJobId) {
                showNotification('LinkedIn authorized! Posting job now...', 'info');
                // Retry the post
                handlePostToLinkedIn(pendingJobId, () => {
                   setPendingJobId(null);
                   // We need to pass the original onSuccess but we don't have it stored. 
                   // Ideally we reload jobs.
                });
            }
        }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pendingJobId]); // Dependency on pendingJobId to ensure we have latest value... actually closure might capture old value if not careful.
  // Correction: better to use ref for pendingJobId or include it in deps. 
  // If we stick to state `pendingJobId`, re-attaching listener is fine.

  /* End Listener */

  const handlePostToLinkedIn = async (jobId, onSuccess) => {
    setSaving(true);
    try {
      const response = await recruitmentApi.postJobToLinkedIn(jobId);
      if (response.data.success) {
        showNotification('Successfully posted to LinkedIn!', 'success');
        if (onSuccess) onSuccess(); 
        
        // If this was a retry, pendingJobId matches, clear it
        if (jobId === pendingJobId) setPendingJobId(null);
        
        loadJobs();
      }
    } catch (err) {
      console.error('Failed to post:', err);
      
      const errorData = err.response?.data;
      
      // Check for authUrl in the response (indicates OAuth needed)
      if (errorData?.authUrl) {
        console.log('LinkedIn OAuth URL:', errorData.authUrl);
        showNotification('LinkedIn authorization required. Opening LinkedIn login...', 'info');
        
        // Store context for retry
        setPendingJobId(jobId);

        // Try popup first
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
            errorData.authUrl, 
            'linkedin_auth', 
            `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
        );
        
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // Popup was blocked, use redirect instead (user flow breaks here but best effort)
          console.log('Popup blocked, redirecting...');
          window.location.href = errorData.authUrl;
        }
      } else {
        showNotification(errorData?.message || 'Failed to post to LinkedIn', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePostToFacebook = async (jobId, onSuccess) => {
    setSaving(true);
    try {
      const response = await recruitmentApi.postJobToFacebook(jobId);
      if (response.data.success) {
        showNotification('Successfully posted to Facebook Page!', 'success');
        onSuccess();
        loadJobs();
      }
    } catch (err) {
      console.error('Failed to post:', err);
      showNotification(err.response?.data?.message || 'Failed to post to Facebook', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestFacebook = async () => {
    setSaving(true);
    try {
      const res = await recruitmentApi.testFacebookConnection();
      if (res.data.success) {
        showNotification(`Connected to: ${res.data.pageName}`, 'success');
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Connection failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    handleSaveJob,
    handleDeleteJob,
    handlePostToTelegram,
    handlePostToLinkedIn,
    handlePostToFacebook,
    handleTestFacebook
  };
};

export default useJobActions;
