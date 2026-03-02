import { useState, useMemo, useEffect } from 'react';
import type { Applicant } from '@/types/recruitment';

export type ActiveTab = 'All' | 'Pending' | 'Reviewed' | 'Interview' | 'Hired' | 'Archive' | 'Inquiries' | 'Chat' | 'Security Audit';
export type SourceFilter = 'All' | 'Web' | 'Email';

const useApplicantFilters = (applicants: Applicant[], itemsPerPage = 10) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('All');
  const [activeTab, setActiveTab] = useState<ActiveTab>('All');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredApplicants = useMemo(() => {
    return applicants.filter(app => {
      const matchesSearch = 
        (app.first_name + ' ' + app.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.job_title || app.email_subject || '').toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesSource = sourceFilter === 'All' || app.source === sourceFilter.toLowerCase();
      
      let matchesTab = true;
      if (activeTab === 'All') matchesTab = app.stage !== 'Rejected';
      else if (activeTab === 'Pending') matchesTab = app.stage === 'Applied';
      else if (activeTab === 'Reviewed') matchesTab = app.stage === 'Screening';
      else if (activeTab === 'Interview') matchesTab = ['Initial Interview', 'Final Interview'].includes(app.stage);
      else if (activeTab === 'Hired') matchesTab = app.stage === 'Hired';
      else if (activeTab === 'Archive') matchesTab = app.stage === 'Rejected';
  
      return matchesSearch && matchesSource && matchesTab;
    });
  }, [applicants, searchTerm, sourceFilter, activeTab]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredApplicants.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredApplicants.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sourceFilter, activeTab]);

  return {
    searchTerm, setSearchTerm,
    sourceFilter, setSourceFilter,
    activeTab, setActiveTab,
    currentPage, setCurrentPage,
    filteredApplicants,
    currentItems,
    totalPages,
    startIndex,
    endIndex
  };
};

export default useApplicantFilters;
