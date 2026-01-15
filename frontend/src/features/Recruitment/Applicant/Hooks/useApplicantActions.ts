import { recruitmentApi } from '@/api/recruitmentApi';

interface ScheduleData {
  date: string;
  time: string;
  link?: string;
  platform?: string;
  notes?: string;
}

const useApplicantActions = (
  fetchData: (isBackground?: boolean) => void, 
  showNotification: (message: string, type: 'success' | 'error') => void
) => {
  
  const handleAssignInterviewer = async (
    applicantId: number, 
    interviewerId: number, 
    onSuccess?: () => void
  ) => {
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
    scheduleData: ScheduleData, 
    onSuccess?: () => void
  ) => {
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

  return {
    handleAssignInterviewer,
    handleScheduleInterview
  };
};

export default useApplicantActions;
