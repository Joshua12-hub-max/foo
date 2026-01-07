import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ToastNotification, useNotification } from '@components/Custom/EmployeeManagement/Admin';
import { useApplicantData, useApplicantFilters, useApplicantActions } from '@applicant/Hooks';
import { AssignInterviewerModal, ScheduleInterviewModal } from '@applicant/Modals';
import { ApplicantTabs, ApplicantFilters, ApplicantTable, Pagination } from '@applicant/Components';

const ApplicantList = () => {
  const { sidebarOpen } = useOutletContext();
  const { notification, showNotification } = useNotification();
  
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

  // Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [selectedInterviewer, setSelectedInterviewer] = useState('');
  
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
    platform: 'Google Meet',
    link: '',
    notes: ''
  });

  const onAssignClick = (applicant) => {
    setSelectedApplicant(applicant);
    setShowAssignModal(true);
  };

  const onScheduleClick = (applicant) => {
    setSelectedApplicant(applicant);
    setShowScheduleModal(true);
  };

  const onConfirmAssign = () => {
    handleAssignInterviewer(selectedApplicant.id, selectedInterviewer, () => setShowAssignModal(false));
  };

  const onConfirmSchedule = () => {
    handleScheduleInterview(selectedApplicant.id, scheduleData, () => setShowScheduleModal(false));
  };

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      <ToastNotification notification={notification} />
      
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
      />

      <Pagination 
        currentPage={currentPage}
        itemsPerPage={10}
        totalItems={filteredApplicants.length}
        onPageChange={setCurrentPage}
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
        scheduleData={scheduleData}
        setScheduleData={setScheduleData}
      />

    </div>
  );
};

export default ApplicantList;
