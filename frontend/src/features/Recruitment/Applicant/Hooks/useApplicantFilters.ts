import { useState, useMemo, useEffect } from 'react';
import type { Applicant } from '@/types/recruitment';

export type ActiveTab = 'All' | 'Pending' | 'Reviewed' | 'Initial Interview' | 'Final Interview' | 'Hired' | 'Archive';
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
      // 100% PRECISION: Exclude anyone who has already completed registration as an employee.
      // Once they are an employee, they should no longer appear in any recruitment/applicant lists.
      if (app.registeredEmployeeId !== null && app.registeredEmployeeId !== undefined) {
        return false;
      }

      const matchesSearch = 
        (app.firstName + ' ' + app.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.jobTitle || app.emailSubject || '').toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesSource = sourceFilter === 'All' || app.source === sourceFilter.toLowerCase();
      
      let matchesTab = true;
      if (activeTab === 'All') {
        // Exclude Rejected from the 'All' active dashboard
        matchesTab = app.stage !== 'Rejected';
      } else if (activeTab === 'Pending') {
        matchesTab = app.stage === 'Applied';
      } else if (activeTab === 'Reviewed') {
        matchesTab = app.stage === 'Screening';
      } else if (activeTab === 'Initial Interview') {
        matchesTab = app.stage === 'Initial Interview';
      } else if (activeTab === 'Final Interview') {
        matchesTab = app.stage === 'Final Interview';
      } else if (activeTab === 'Hired') {
        // 100% PRECISION: Show Hired applicants if NOT confirmed OR if confirmed but missing startDate (Auto-Archived Recovery)
        matchesTab = app.stage === 'Hired' && (!app.isConfirmed || !app.startDate);
      } else if (activeTab === 'Archive') {
        // ARCHIVE AUDIT: Distinguish between truly Rejected and Archived Hired
        const isCurrentlyRejected = app.stage === 'Rejected';
        const isCurrentlyHired = app.stage === 'Hired';

        if (archiveSubTab === 'Rejected') {
            // Rejected Sub-tab: Show if currently Rejected OR if Hired but NOT confirmed (Legacy check)
            matchesTab = isCurrentlyRejected;
        } else if (archiveSubTab === 'Hired') {
            // 100% PRECISION: Archived Hired only if they are Hired, Confirmed, AND have a startDate
            matchesTab = isCurrentlyHired && !!app.isConfirmed && !!app.startDate;
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
