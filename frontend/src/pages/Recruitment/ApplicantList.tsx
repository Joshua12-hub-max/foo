import React from 'react';
import { useState } from 'react';
import { useUIStore } from '@/stores';
import { useToastStore } from '@/stores';
import { useApplicantData, useApplicantFilters, useApplicantActions, Applicant } from '@applicant/Hooks';
import { AssignInterviewerModal, ScheduleInterviewModal } from '@applicant/Modals';
import { ApplicantTabs, ApplicantFilters, ApplicantTable, InterviewPanel } from '@applicant/Components';
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
  
  const { handleAssignInterviewer, handleScheduleInterview } = useApplicantActions(fetchData, showNotification);

  // Modal State - Properly typed
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [selectedInterviewer, setSelectedInterviewer] = useState<string>('');
  
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
      />

      <Pagination 
        currentPage={currentPage}
        itemsPerPage={10}
        totalItems={filteredApplicants.length}
        onPageChange={setCurrentPage}
        totalPages={totalPages}
      />

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

    </div>
  );
};

export default ApplicantList;
