import { useState, useMemo } from 'react';

const useApplicantFilters = (applicants, itemsPerPage = 10) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredApplicants = useMemo(() => {
    return applicants.filter(app => {
      const matchesSearch = 
        (app.first_name + ' ' + app.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.job_title || app.email_subject || '').toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesSource = sourceFilter === 'All' || app.source === sourceFilter.toLowerCase();
      
      let matchesTab = true;
      if (activeTab === 'Pending') matchesTab = app.stage === 'Applied';
      else if (activeTab === 'Reviewed') matchesTab = app.stage === 'Screening';
      else if (activeTab === 'Interview') matchesTab = ['Initial Interview', 'Final Interview'].includes(app.stage);
      else if (activeTab === 'Hired') matchesTab = app.stage === 'Hired';
  
      return matchesSearch && matchesSource && matchesTab;
    });
  }, [applicants, searchTerm, sourceFilter, activeTab]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredApplicants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredApplicants.slice(startIndex, endIndex);

  // Reset page when filters change
  useMemo(() => {
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
