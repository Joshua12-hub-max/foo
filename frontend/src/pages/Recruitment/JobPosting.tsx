import { useState } from 'react';
import { useUIStore } from '@/stores';
import { useToastStore } from '@/stores';
import { useJobData, useJobForm, useJobFilters, useJobActions } from '../../features/Recruitment/JobPosting/Hooks';
import { JobHeader, JobFilters, JobTable } from '../../features/Recruitment/JobPosting/Components';
import { JobFormModal, JobDetailsModal, DeleteJobModal } from '../../features/Recruitment/JobPosting/Modals';
import { Job } from '@/types';

const JobPosting = () => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const showToast = useToastStore((state) => state.showToast);
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => showToast(message, type);
  
  // Custom Hooks
  const { jobs, loading, error, checkingEmails, loadJobs, handleCheckEmails } = useJobData(showNotification);
  const { searchTerm, setSearchTerm, statusFilter, setStatusFilter, filteredJobs } = useJobFilters(jobs);
  const { isFormOpen, setIsFormOpen, isEditing, formData, handleFormChange, openCreateForm, openEditForm, resetForm } = useJobForm();
  const { 
    saving, 
    handleSaveJob, 
    handleDeleteJob 
  } = useJobActions(() => {
    // Refresh logic if needed
    loadJobs();
  }, showNotification);

  // Local Modal Logic
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const handleOpenView = (job: Job) => {
    setSelectedJob(job);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (job: Job) => {
    setSelectedJob(job);
    setIsDeleteOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveJob(isEditing, selectedJob?.id ?? null, formData, () => setIsFormOpen(false));
  };

  const onConfirmDelete = () => {
    if (selectedJob) {
      handleDeleteJob(selectedJob.id, () => {
        setIsDeleteOpen(false);
        setSelectedJob(null);
      });
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>

      
      <JobHeader 
        checkingEmails={checkingEmails}
        onCheckEmails={handleCheckEmails}
        onCreateJob={openCreateForm}
      />

      <hr className="mb-6 border-gray-200" />

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <JobFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <JobTable 
        loading={loading}
        filteredJobs={filteredJobs}
        onEdit={(job: Job) => { 
            setSelectedJob(job); 
            openEditForm(job); 
        }}
        onDelete={handleOpenDelete}
        onView={handleOpenView}
      />

      {/* Modals */}
      <JobFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        isEditing={isEditing}
        initialData={formData}
        onSubmit={(data) => handleSaveJob(isEditing, selectedJob?.id ?? null, data, () => setIsFormOpen(false))}
        saving={saving}
      />

      <JobDetailsModal 
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        selectedJob={selectedJob}
        onEdit={(job: Job) => {
            setSelectedJob(job);
            openEditForm(job);
        }}
      />

      <DeleteJobModal 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        selectedJob={selectedJob}
        handleDelete={onConfirmDelete}
        saving={saving}
      />
    </div>
  );
};

export default JobPosting;
