import { useState } from 'react';
import { useUIStore } from '@/stores';
import { useToastStore } from '@/stores';
import { useApplicantData, useApplicantFilters, useApplicantActions, Applicant } from '@applicant/Hooks';
import { AssignInterviewerModal, ScheduleInterviewModal } from '@applicant/Modals';
import { ApplicantTabs, ApplicantFilters, ApplicantTable, InterviewPanel, PublicInquiries, LiveSupportChat, SecurityAuditLogs } from '@applicant/Components';
import ConfirmDialog from '@/components/Custom/Shared/ConfirmDialog';
import Pagination from '@/components/CustomUI/Pagination';
import type { ScheduleInterviewFormData } from '@/schemas/recruitmentSchema';

const ApplicantList = () => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const showToast = useToastStore((state) => state.showToast);
  const showNotification = (message: string, type: 'success' | 'error') => showToast(message, type);
  
  // Custom Hooks
  const { applicants, interviewers, loading, isRefetching, fetchData } = useApplicantData(showNotification);
  const { 
    searchTerm, setSearchTerm, 
    sourceFilter, setSourceFilter, 
    activeTab, setActiveTab, 
    currentPage, setCurrentPage, 
    filteredApplicants, currentItems, totalPages 
  } = useApplicantFilters(applicants);
  
  const { handleAssignInterviewer, handleScheduleInterview, handleRejectApplicant, handleRestoreApplicant, handleDeleteApplicant } = useApplicantActions(fetchData, showNotification);

  // Modal State - Properly typed
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [selectedInterviewer, setSelectedInterviewer] = useState<string>('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    isDestructive: false,
    confirmText: 'Confirm',
    onConfirm: () => {}
  });
  
  // Interview State
  const [showInterview, setShowInterview] = useState<boolean>(false);
  const [interviewApplicant, setInterviewApplicant] = useState<Applicant | null>(null);

  const onAssignClick = (applicant: Applicant): void => {
    setSelectedApplicant(applicant);
    setShowAssignModal(true);
  };

  const onScheduleClick = (applicant: Applicant): void => {
    setSelectedApplicant(applicant);
    setShowScheduleModal(true);
  };

  const onJoinInterview = (applicant: Applicant): void => {
    if (applicant.interview_link) {
      setInterviewApplicant(applicant);
      setShowInterview(true);
    } else {
      showNotification('No interview link available. Please schedule an interview first.', 'error');
    }
  };

  const onViewDetailsClick = (applicant: Applicant): void => {
    window.open(`${import.meta.env.VITE_API_URL || ''}/api/recruitment/applicants/${applicant.id}/pdf`, '_blank');
  };
  
  const onRejectClick = (applicant: Applicant): void => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject and Archive Applicant',
      message: `Are you sure you want to reject and archive ${applicant.first_name} ${applicant.last_name}?`,
      isDestructive: true,
      confirmText: 'Reject',
      onConfirm: () => handleRejectApplicant(Number(applicant.id))
    });
  };

  const onRestoreClick = (applicant: Applicant): void => {
    setConfirmModal({
      isOpen: true,
      title: 'Restore Applicant',
      message: `Are you sure you want to restore ${applicant.first_name} ${applicant.last_name} to the active pipeline?`,
      isDestructive: false,
      confirmText: 'Restore',
      onConfirm: () => handleRestoreApplicant(Number(applicant.id))
    });
  };

  const onDeleteClick = (applicant: Applicant): void => {
    setConfirmModal({
      isOpen: true,
      title: 'Permanently Delete Applicant',
      message: `WARNING: Are you sure you want to PERMANENTLY delete ${applicant.first_name} ${applicant.last_name}? This cannot be undone.`,
      isDestructive: true,
      confirmText: 'Delete',
      onConfirm: () => handleDeleteApplicant(Number(applicant.id))
    });
  };

  const onConfirmAssign = (): void => {
    if (!selectedApplicant) return;
    handleAssignInterviewer(Number(selectedApplicant.id), Number(selectedInterviewer), () => setShowAssignModal(false));
  };

  const onConfirmSchedule = (data: ScheduleInterviewFormData): void => {
    if (!selectedApplicant) return;
    handleScheduleInterview(Number(selectedApplicant.id), data, () => setShowScheduleModal(false));
  };

  // Show interview panel if active
  if (showInterview && interviewApplicant) {
    return (
      <InterviewPanel
        roomName={interviewApplicant.interview_link?.split('/').pop() || 'interview'}
        displayName="Interviewer"
        applicantId={interviewApplicant.id}
        applicantName={`${interviewApplicant.first_name} ${interviewApplicant.last_name}`}
        applicantEmail={interviewApplicant.email}
        jobTitle={interviewApplicant.job_title}
        interviewLink={interviewApplicant.interview_link}
        resumePath={interviewApplicant.resume_path}
        onClose={() => {
          setShowInterview(false);
          setInterviewApplicant(null);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>

      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Applicant List</h2>
          <p className="text-sm text-gray-600 mt-1">Fair Hiring Procedure: Review, Assign, Schedule</p>
        </div>
      </div>

      <hr className="mb-6 border-gray-200" />

      <ApplicantTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {activeTab !== 'Inquiries' && activeTab !== 'Chat' && activeTab !== 'Security Audit' ? (
        <>
          <ApplicantFilters 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            sourceFilter={sourceFilter} 
            setSourceFilter={setSourceFilter} 
          />

          <ApplicantTable 
            loading={loading}
            isRefetching={isRefetching}
            filteredApplicants={currentItems}
            onAssign={onAssignClick}
            onSchedule={onScheduleClick}
            onJoinInterview={onJoinInterview}
            onReject={onRejectClick}
            onRestore={onRestoreClick}
            onViewDetails={onViewDetailsClick}
            onDelete={onDeleteClick}
          />

          <Pagination 
            currentPage={currentPage}
            itemsPerPage={10}
            totalItems={filteredApplicants.length}
            onPageChange={setCurrentPage}
            totalPages={totalPages}
          />
        </>
      ) : activeTab === 'Inquiries' ? (
        <PublicInquiries />
      ) : activeTab === 'Chat' ? (
        <LiveSupportChat />
      ) : (
        <SecurityAuditLogs />
      )}

      {/* Modals */}
      <AssignInterviewerModal 
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onConfirm={onConfirmAssign}
        interviewers={interviewers}
        selectedApplicant={selectedApplicant}
        selectedInterviewer={selectedInterviewer}
        setSelectedInterviewer={setSelectedInterviewer}
      />

      <ScheduleInterviewModal 
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onConfirm={onConfirmSchedule}
        selectedApplicant={selectedApplicant}
      />

      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
        confirmText={confirmModal.confirmText}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
      />

    </div>
  );
};

export default ApplicantList;
