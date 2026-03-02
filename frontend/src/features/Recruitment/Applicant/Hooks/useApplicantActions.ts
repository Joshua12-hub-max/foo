import { recruitmentApi } from '@/api/recruitmentApi';
import type { ScheduleInterviewFormData } from '@/schemas/recruitmentSchema';

const useApplicantActions = (
  fetchData: (isBackground?: boolean) => void, 
  showNotification: (message: string, type: 'success' | 'error') => void
) => {
  
  const handleAssignInterviewer = async (
    applicantId: number, 
    interviewerId: number, 
    onSuccess?: () => void
  ): Promise<void> => {
    try {
      await recruitmentApi.assignInterviewer(applicantId, interviewerId);
      showNotification('Interviewer assigned successfully', 'success');
      if (onSuccess) onSuccess();
      fetchData(true); // Background refresh
    } catch (err) {
      console.error(err);
      showNotification('Failed to assign interviewer', 'error');
    }
  };

  const handleScheduleInterview = async (
    applicantId: number, 
    scheduleData: ScheduleInterviewFormData, 
    onSuccess?: () => void
  ): Promise<void> => {
    try {
      const dateTime = `${scheduleData.date}T${scheduleData.time}`;
      await recruitmentApi.updateStage(applicantId, {
        stage: 'Initial Interview',
        interview_date: dateTime,
        interview_link: scheduleData.link,
        interview_platform: scheduleData.platform,
        notes: scheduleData.notes
      });
      showNotification('Interview scheduled & email sent!', 'success');
      if (onSuccess) onSuccess();
      fetchData(true); // Background refresh
    } catch (err) {
      console.error(err);
      showNotification('Failed to schedule interview', 'error');
    }
  };

  const handleRejectApplicant = async (
    applicantId: number,
    onSuccess?: () => void
  ): Promise<void> => {
    try {
      await recruitmentApi.updateStage(applicantId, {
        stage: 'Rejected'
      });
      showNotification('Applicant archived/rejected successfully', 'success');
      if (onSuccess) onSuccess();
      fetchData(true);
    } catch (err) {
      console.error(err);
      showNotification('Failed to archive applicant', 'error');
    }
  };

  const handleRestoreApplicant = async (
    applicantId: number,
    onSuccess?: () => void
  ): Promise<void> => {
    try {
      await recruitmentApi.updateStage(applicantId, {
        stage: 'Applied'
      });
      showNotification('Applicant restored successfully', 'success');
      if (onSuccess) onSuccess();
      fetchData(true);
    } catch (err) {
      console.error(err);
      showNotification('Failed to restore applicant', 'error');
    }
  };

  const handleDeleteApplicant = async (
    applicantId: number,
    onSuccess?: () => void
  ): Promise<void> => {
    try {
      await recruitmentApi.deleteApplicant(applicantId);
      showNotification('Applicant permanently deleted', 'success');
      if (onSuccess) onSuccess();
      fetchData(true);
    } catch (err) {
      console.error(err);
      showNotification('Failed to permanently delete applicant', 'error');
    }
  };

  return {
    handleAssignInterviewer,
    handleScheduleInterview,
    handleRejectApplicant,
    handleRestoreApplicant,
    handleDeleteApplicant
  };
};

export default useApplicantActions;
