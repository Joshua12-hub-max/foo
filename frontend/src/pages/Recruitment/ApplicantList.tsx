import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { useToastStore } from '@/stores';
import { Archive, UserCheck } from 'lucide-react';
import { useApplicantData, useApplicantFilters, useApplicantActions, Applicant } from '@applicant/Hooks';
import { AssignInterviewerModal, ScheduleInterviewModal, DocumentListModal, ConfirmHiredModal } from '@applicant/Modals';
import { ApplicantTabs, ApplicantFilters, ApplicantTable, InterviewPanel, PublicInquiries, LiveSupportChat, ApplicantDetailModal, SecurityAuditLogs } from '@applicant/Components';
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
  archiveSubTab, setArchiveSubTab,
  currentPage, setCurrentPage, 
  filteredApplicants, currentItems, totalPages 
  } = useApplicantFilters(applicants);  
  const { 
    handleAssignInterviewer, 
    handleScheduleInterview, 
    handleRejectApplicant, 
    handleRestoreApplicant, 
    handleDeleteApplicant,
    handleConfirmHired
  } = useApplicantActions(fetchData, showNotification);

  // Modal State - Properly typed
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showDocumentModal, setShowDocumentModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showConfirmHiredModal, setShowConfirmHiredModal] = useState<boolean>(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [selectedInterviewer, setSelectedInterviewer] = useState<string>('');
  const [searchParams] = useSearchParams();

  // Handle deep-linking from notifications
  useEffect(() => {
    const applicantId = searchParams.get('id');
    if (applicantId && applicants.length > 0) {
      const applicant = applicants.find(a => a.id.toString() === applicantId);
      if (applicant) {
        if (applicant.stage === 'Hired') {
          // 100% PRECISION: Only redirect to Archive if BOTH isConfirmed AND startDate are present
          if (applicant.isConfirmed && applicant.startDate) {
            setActiveTab('Archive');
            setArchiveSubTab('Hired');
          } else {
            setActiveTab('Hired');
          }
        } else if (applicant.stage === 'Rejected') {
          setActiveTab('Archive');
          setArchiveSubTab('Rejected');
        } else if (applicant.stage === 'Screening') {
          setActiveTab('Reviewed');
          setSelectedApplicant(applicant);
          setShowDetailModal(true);
        } else if (applicant.stage === 'Initial Interview') {
          setActiveTab('Initial Interview');
          setSelectedApplicant(applicant);
          setShowDetailModal(true);
        } else if (applicant.stage === 'Final Interview') {
          setActiveTab('Final Interview');
          setSelectedApplicant(applicant);
          setShowDetailModal(true);
        } else if (applicant.stage === 'Applied') {
          setActiveTab('Pending');
          setSelectedApplicant(applicant);
          setShowDetailModal(true);
        } else {
          setSelectedApplicant(applicant);
          setShowDetailModal(true);
        }
      }
    }
  }, [searchParams, applicants, setActiveTab, setArchiveSubTab]);

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

  const onViewDocumentsClick = (applicant: Applicant): void => {
    setSelectedApplicant(applicant);
    setShowDocumentModal(true);
  };

  const onJoinInterview = (applicant: Applicant): void => {
    if (applicant.interviewLink) {
      setInterviewApplicant(applicant);
      setShowInterview(true);
    } else {
      showNotification('No interview link available. Please schedule an interview first.', 'error');
    }
  };

  const onViewDetailsClick = (applicant: Applicant): void => {
    setSelectedApplicant(applicant);
    setShowDetailModal(true);
  };

  const onConfirmClick = (applicant: Applicant): void => {
    setSelectedApplicant(applicant);
    setShowConfirmHiredModal(true);
  };
  
  const onRejectClick = (applicant: Applicant): void => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject and Archive Applicant',
      message: `Are you sure you want to reject and archive ${applicant.firstName} ${applicant.lastName}?`,
      isDestructive: true,
      confirmText: 'Reject',
      onConfirm: () => handleRejectApplicant(Number(applicant.id))
    });
  };

  const onRestoreClick = (applicant: Applicant): void => {
    setConfirmModal({
      isOpen: true,
      title: 'Restore Applicant',
      message: `Are you sure you want to restore ${applicant.firstName} ${applicant.lastName} to the active pipeline?`,
      isDestructive: false,
      confirmText: 'Restore',
      onConfirm: () => handleRestoreApplicant(Number(applicant.id))
    });
  };

  const onDeleteClick = (applicant: Applicant): void => {
    setConfirmModal({
      isOpen: true,
      title: 'Permanently Delete Applicant',
      message: `WARNING: Are you sure you want to PERMANENTLY delete ${applicant.firstName} ${applicant.lastName}? This cannot be undone.`,
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
        roomName={interviewApplicant.interviewLink?.split('/').pop() || 'interview'}
        displayName="Interviewer"
        applicantId={interviewApplicant.id}
        applicantName={`${interviewApplicant.firstName} ${interviewApplicant.lastName}`}
        applicantEmail={interviewApplicant.email}
        jobTitle={interviewApplicant.jobTitle}
        interviewLink={interviewApplicant.interviewLink}
        resumePath={interviewApplicant.resumePath}
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
      
      {activeTab === 'Archive' && (
        <div className="flex gap-2 mb-6 bg-white/50 p-1.5 rounded-xl border border-gray-200 w-fit">
          <button
            onClick={() => setArchiveSubTab('Rejected')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              archiveSubTab === 'Rejected'
                ? 'bg-gray-300 text-gray-800 shadow-sm'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Rejected Applicants
          </button>
          <button
            onClick={() => setArchiveSubTab('Hired')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              archiveSubTab === 'Hired'
                ? 'bg-gray-300 text-gray-800 shadow-sm'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Archived Hired
          </button>
        </div>
      )}

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
        onViewDocuments={onViewDocumentsClick}
        onDelete={onDeleteClick}
        onConfirm={onConfirmClick}
        isArchiveHired={activeTab === 'Archive' && archiveSubTab === 'Hired'}
      />

      <Pagination 
        currentPage={currentPage}
        itemsPerPage={10}
        totalItems={filteredApplicants.length}
        onPageChange={setCurrentPage}
        totalPages={totalPages}
      />

      {/* Modals */}
      <ConfirmHiredModal
        isOpen={showConfirmHiredModal}
        onClose={() => setShowConfirmHiredModal(false)}
        applicant={selectedApplicant}
        onConfirm={async (id, startDate, selectedDocs, customNotes) => {
            await handleConfirmHired(id, startDate, selectedDocs, customNotes, () => setShowConfirmHiredModal(false));
        }}
      />
      <ApplicantDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        applicant={selectedApplicant!}
      />

      <DocumentListModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        applicant={selectedApplicant}
      />

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
        initialData={selectedApplicant ? {
          platform: selectedApplicant.interviewPlatform || 'Jitsi Meet',
          link: selectedApplicant.interviewLink || '',
          date: selectedApplicant.interviewDate ? selectedApplicant.interviewDate.split('T')[0] : '',
          time: selectedApplicant.interviewDate ? new Date(selectedApplicant.interviewDate).toTimeString().substring(0, 5) : '',
          notes: selectedApplicant.interviewNotes || ''
        } : undefined}
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
