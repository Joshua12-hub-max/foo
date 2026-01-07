import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ToastNotification, useNotification } from '@components/Custom/EmployeeManagement/Admin';
import { useJobData, useJobForm, useJobFilters, useJobActions } from '@jobposting/Hooks';
import { JobHeader, JobFilters, JobTable } from '@jobposting/Components';
import { JobFormModal, JobDetailsModal, DeleteJobModal, ShareJobModal } from '@jobposting/Modals';

const JobPosting = () => {
  const { sidebarOpen } = useOutletContext();
  const { notification, showNotification } = useNotification();
  
  // Custom Hooks
  const { jobs, loading, error, checkingEmails, loadJobs, handleCheckEmails } = useJobData(showNotification);
  const { searchTerm, setSearchTerm, statusFilter, setStatusFilter, filteredJobs } = useJobFilters(jobs);
  const { isFormOpen, setIsFormOpen, isEditing, formData, handleFormChange, openCreateForm, openEditForm } = useJobForm();
  const { saving, handleSaveJob, handleDeleteJob, handlePostToTelegram, handlePostToLinkedIn } = useJobActions(loadJobs, showNotification);

  // Local Modal Logic
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // Handle LinkedIn Callback logic inside the popup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedInSuccess = params.get('linkedin_auth_success');
    const linkedInError = params.get('linkedin_auth_error');

    if (linkedInSuccess) {
        if (window.opener) {
            window.opener.postMessage({ type: 'LINKEDIN_AUTH_SUCCESS' }, '*');
            window.close();
        } else {
            // Fallback if not in popup (rare)
            const newUrl = window.location.href.split('?')[0];
            window.history.replaceState({}, document.title, newUrl);
            showNotification('LinkedIn connected successfully!', 'success');
        }
    } else if (linkedInError) {
         if (window.opener) {
            window.opener.postMessage({ type: 'LINKEDIN_AUTH_ERROR' }, '*');
            window.close();
         } else {
            showNotification('Failed to connect LinkedIn.', 'error');
         }
    }
  }, []);

  const handleOpenView = (job) => {
    setSelectedJob(job);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (job) => {
    setSelectedJob(job);
    setIsDeleteOpen(true);
  };

  const handleOpenShare = (job) => {
    setSelectedJob(job);
    setIsShareOpen(true);
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
      <ToastNotification notification={notification} />
      
      <JobHeader 
        checkingEmails={checkingEmails}
        onCheckEmails={handleCheckEmails}
        onApiSetup={() => handleOpenShare(null)}
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
        onShare={handleOpenShare}
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

      <ShareJobModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        selectedJob={selectedJob}
        handlePostToTelegram={() => handlePostToTelegram(selectedJob.id, () => setIsShareOpen(false))}
        handlePostToLinkedIn={() => handlePostToLinkedIn(selectedJob.id, () => setIsShareOpen(false))}
        saving={saving}
      />

    </div>
  );
};

export default JobPosting;
