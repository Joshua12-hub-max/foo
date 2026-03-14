import { useState, useMemo, useEffect } from 'react';
import type { Applicant } from '@/types/recruitment';

export type ActiveTab = 'All' | 'Pending' | 'Reviewed' | 'Interview' | 'Hired' | 'Archive';
export type ArchiveSubTab = 'Rejected' | 'Hired';
export type SourceFilter = 'All' | 'Web' | 'Email';

const useApplicantFilters = (applicants: Applicant[], itemsPerPage = 10) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('All');
  const [activeTab, setActiveTab] = useState<ActiveTab>('All');
  const [archiveSubTab, setArchiveSubTab] = useState<ArchiveSubTab>('Rejected');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredApplicants = useMemo(() => {
    return applicants.filter(app => {
      const matchesSearch = 
        (app.firstName + ' ' + app.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.jobTitle || app.emailSubject || '').toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesSource = sourceFilter === 'All' || app.source === sourceFilter.toLowerCase();
      
      let matchesTab = true;
      if (activeTab === 'All') {
        // Exclude Rejected and Confirmed Hired from the 'All' active dashboard
        matchesTab = app.stage !== 'Rejected' && !(app.stage === 'Hired' && app.isConfirmed);
      } else if (activeTab === 'Pending') {
        matchesTab = app.stage === 'Applied';
      } else if (activeTab === 'Reviewed') {
        matchesTab = app.stage === 'Screening';
      } else if (activeTab === 'Interview') {
        matchesTab = ['Initial Interview', 'Final Interview'].includes(app.stage);
      } else if (activeTab === 'Hired') {
        // Only show Hired applicants who are NOT YET confirmed
        matchesTab = app.stage === 'Hired' && !app.isConfirmed;
      } else if (activeTab === 'Archive') {
        // ARCHIVE AUDIT: Distinguish between truly Rejected and Archived Hired
        const hasBeenHired = !!app.hiredDate; // Data truth: Did they ever get hired?
        const isCurrentlyRejected = app.stage === 'Rejected';

        // Only show in Archive if they are Rejected OR they are a Confirmed Hire
        if (!isCurrentlyRejected && !(app.stage === 'Hired' && app.isConfirmed)) {
            matchesTab = false;
        } else {
            if (archiveSubTab === 'Hired') {
                // Archived Hired: Show if they have a hiredDate, even if stage was stuck
                matchesTab = hasBeenHired;
            } else {
                // Rejected Applicants: ONLY show if they were NEVER hired
                matchesTab = isCurrentlyRejected && !hasBeenHired;
            }
        }
      }
  
      return matchesSearch && matchesSource && matchesTab;
    });
  }, [applicants, searchTerm, sourceFilter, activeTab, archiveSubTab]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredApplicants.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredApplicants.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sourceFilter, activeTab, archiveSubTab]);

  return {
    searchTerm, setSearchTerm,
    sourceFilter, setSourceFilter,
    activeTab, setActiveTab,
    archiveSubTab, setArchiveSubTab,
    currentPage, setCurrentPage,
    filteredApplicants,
    currentItems,
    totalPages,
    startIndex,
    endIndex
  };
};

export default useApplicantFilters;
