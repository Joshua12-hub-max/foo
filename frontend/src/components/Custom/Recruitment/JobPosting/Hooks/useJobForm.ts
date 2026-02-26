import { useState, useCallback } from 'react';
import { Job, JobFormData } from '@/types';

const INITIAL_FORM_DATA: JobFormData = {
  title: '',
  department: '',
  location: 'Main Office',
  employment_type: 'Full-time',
  salary_range: '',
  application_email: '',
  job_description: '',
  requirements: '',
  status: 'Open',
  office_name: '',
  submission_address: '',
  education: '',
  experience: '',
  training: '',
  eligibility: '',
  other_qualifications: '',
  require_civil_service: false,
  require_government_ids: false,
  require_education_experience: false
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
      employment_type: job.employment_type,
      salary_range: job.salary_range || '',
      application_email: job.application_email || '',
      job_description: job.job_description,
      requirements: job.requirements,
      status: job.status,
      office_name: job.office_name || '',
      submission_address: job.submission_address || '',
      education: job.education || '',
      experience: job.experience || '',
      training: job.training || '',
      eligibility: job.eligibility || '',
      other_qualifications: job.other_qualifications || '',
      require_civil_service: job.require_civil_service || false,
      require_government_ids: job.require_government_ids || false,
      require_education_experience: job.require_education_experience || false
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
