import { useState, useCallback } from 'react';

const useJobForm = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: 'Main Office',
    employment_type: 'Full-time',
    salary_range: '',
    application_email: '',
    job_description: '',
    requirements: '',
    status: 'Open'
  });

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      department: '',
      location: 'Main Office',
      employment_type: 'Full-time',
      salary_range: '',
      application_email: '',
      job_description: '',
      requirements: '',
      status: 'Open'
    });
  }, []);

  const openCreateForm = useCallback(() => {
    setIsEditing(false);
    resetForm();
    setIsFormOpen(true);
  }, [resetForm]);

  const openEditForm = useCallback((job) => {
    setIsEditing(true);
    setFormData({
      title: job.title,
      department: job.department,
      location: job.location || 'Main Office',
      employment_type: job.employment_type || 'Full-time',
      salary_range: job.salary_range || '',
      application_email: job.application_email || '',
      job_description: job.job_description || '',
      requirements: job.requirements || '',
      status: job.status
    });
    setIsFormOpen(true);
  }, []);

  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return {
    isFormOpen,
    setIsFormOpen,
    isEditing,
    formData,
    handleFormChange,
    openCreateForm,
    openEditForm
  };
};

export default useJobForm;
