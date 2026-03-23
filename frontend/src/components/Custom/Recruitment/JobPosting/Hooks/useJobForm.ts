import { useState, useCallback } from 'react';
import { Job, JobFormData, EmploymentType } from '@/types';

const INITIAL_FORM_DATA: JobFormData = {
  title: '',
  department: '',
  location: 'Main Office',
  employmentType: 'Full-time' as EmploymentType,
  dutyType: 'Standard',
  salaryRange: '',
  applicationEmail: '',
  jobDescription: '',
  requirements: '',
  status: 'Open',
  officeName: '',
  submissionAddress: '',
  education: '',
  experience: '',
  training: '',
  eligibility: '',
  otherQualifications: '',
  requireCivilService: false,
  requireGovernmentIds: false,
  requireEducationExperience: false
};

const useJobForm = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<JobFormData>(INITIAL_FORM_DATA);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
  }, []);

  const openCreateForm = useCallback(() => {
    setIsEditing(false);
    resetForm();
    setIsFormOpen(true);
  }, [resetForm]);

  const openEditForm = useCallback((job: Job) => {
    setIsEditing(true);
    setFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      employmentType: job.employmentType,
      dutyType: (job.dutyType as never) || 'Standard',
      salaryRange: job.salaryRange || '',
      applicationEmail: job.applicationEmail || '',
      jobDescription: job.jobDescription,
      requirements: job.requirements,
      status: job.status,
      officeName: job.officeName || '',
      submissionAddress: job.submissionAddress || '',
      education: job.education || '',
      experience: job.experience || '',
      training: job.training || '',
      eligibility: job.eligibility || '',
      otherQualifications: job.otherQualifications || '',
      requireCivilService: job.requireCivilService || false,
      requireGovernmentIds: job.requireGovernmentIds || false,
      requireEducationExperience: job.requireEducationExperience || false
    });
    setIsFormOpen(true);
  }, []);

  const handleFormChange = useCallback((field: keyof JobFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return {
    isFormOpen,
    setIsFormOpen,
    isEditing,
    formData,
    handleFormChange,
    openCreateForm,
    openEditForm,
    resetForm
  };
};

export default useJobForm;
