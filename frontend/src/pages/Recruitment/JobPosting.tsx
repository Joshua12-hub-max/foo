import React from 'react';
import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores';
import { useToastStore } from '@/stores';
import { useJobData, useJobForm, useJobFilters, useJobActions } from '@jobposting/Hooks';
import { JobHeader, JobFilters, JobTable } from '@jobposting/Components';
import { JobFormModal, JobDetailsModal, DeleteJobModal } from '@jobposting/Modals';

const JobPosting = () => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const showToast = useToastStore((state) => state.showToast);
  const showNotification = (message: string, type: 'success' | 'error') => showToast(message, type);
  
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
  const [selectedJob, setSelectedJob] = useState(null);

  const handleOpenView = (job) => {
    setSelectedJob(job);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (job) => {
    setSelectedJob(job);
    setIsDeleteOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSaveJob(isEditing, selectedJob?.id, formData, () => setIsFormOpen(false));
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
        onEdit={(job) => { 
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
        formData={formData}
        handleFormChange={handleFormChange}
        handleSubmit={handleSubmit}
        saving={saving}
      />

      <JobDetailsModal 
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        selectedJob={selectedJob}
        onEdit={(job) => {
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
