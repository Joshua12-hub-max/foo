import { useState, useCallback } from 'react';
import { Job, JobFormData } from '@/types';

const INITIAL_FORM_DATA: JobFormData = {
  title: '',
  department: '',
  location: 'Main Office',
  employmentType: 'Full-time',
  dutyType: 'Standard',
  applicationEmail: '',
  jobDescription: '',
  requirements: '',
  status: 'Open',
  attachmentPath: null,
  requireCivilService: false,
  requireGovernmentIds: false,
  requireEducationExperience: false,
  education: '',
  experience: '',
  training: '',
  eligibility: '',
  otherQualifications: '',
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
      dutyType: job.dutyType || 'Standard',
      applicationEmail: job.applicationEmail || '',
      jobDescription: job.jobDescription,
      requirements: job.requirements || '',
      status: job.status,
      attachmentPath: job.attachmentPath || null,
      requireCivilService: job.requireCivilService,
      requireGovernmentIds: job.requireGovernmentIds,
      requireEducationExperience: job.requireEducationExperience,
      education: job.education || '',
      experience: job.experience || '',
      training: job.training || '',
      eligibility: job.eligibility || '',
      otherQualifications: job.otherQualifications || '',
    });
    setIsFormOpen(true);
  }, []);

  const handleFormChange = useCallback((field: keyof JobFormData, value: string | boolean | File | null) => {
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
