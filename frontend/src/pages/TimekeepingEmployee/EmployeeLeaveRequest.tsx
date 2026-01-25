import React from 'react';
import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores';
// API
import { leaveApi } from '@/api/leaveApi';
import { useQuery } from '@tanstack/react-query';
// Components
// Components
import { SubmitLeaveRequestModal } from '@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/Modals/SubmitLeaveRequestModal';
import FinalizeModal from '@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/Modals/Finalize';
import Header from '@/features/LeaveRequests/components/Employee/Header';
import LoadingSpinner from '@/features/LeaveRequests/components/Employee/LoadingSpinner';
import ErrorAlert from '@/features/LeaveRequests/components/Employee/ErrorAlert';
import SuccessAlert from '@/features/LeaveRequests/components/Employee/SuccessAlert';
import Filters from '@/features/LeaveRequests/components/Employee/Filters';
import SearchBar from '@/features/LeaveRequests/components/Employee/SearchBar';
import ExportOptions from '@/features/LeaveRequests/components/Employee/ExportOptions';
import Table from '@/features/LeaveRequests/components/Employee/Table';
import Pagination from '@/components/CustomUI/Pagination';

// Hooks
import { useLeaveData } from '@/features/LeaveRequests/hooks/Employee/useLeaveData';
import { useFilters } from '@/features/LeaveRequests/hooks/Employee/useFilters';
import { useExport } from '@/features/LeaveRequests/hooks/Employee/useExport';

const LeaveRequest = () => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  // State management
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [finalizeModal, setFinalizeModal] = useState({ isOpen: false, request: null as any });
  
  // Custom hooks
  // Extracted server-side pagination/filtering functions
  const { 
    leaves, 
    loading: isLoading, 
    error: dataError, 
    refreshLeaves: refetch, 
    pagination, 
    setPage, 
    updateFilters: updateServerFilters 
  } = useLeaveData();

  // Fetch Credits using React Query
  const { data: credits = [] } = useQuery({
    queryKey: ['employee-leave-credits'],
    queryFn: async () => {
      const res = await (leaveApi as any).getMyCredits();
      return res.data?.credits || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
  
  // useFilters now manages UI state of filters only
  const { 
    filters, 
    appliedFilters, 
    searchQuery, 
    debouncedSearchQuery, 
    handleFilterChange, 
    handleApplyFilters, 
    handleSearchChange, 
    handleClear 
  } = useFilters(leaves); // Passing leaves helps useFilters know data structure, though we don't use its filteredData return anymore for rendering
  
  const { isExporting, exportError, handleExportCSV, handleExportPDF } = useExport();

  // Sync Search with Server
  useEffect(() => {
    updateServerFilters({ search: debouncedSearchQuery });
  }, [debouncedSearchQuery]);

  // Sync Applied Filters with Server
  useEffect(() => {
    updateServerFilters({
      startDate: appliedFilters.date,
      endDate: appliedFilters.date ? undefined : undefined, // If date is single day, maybe we want exact match? for now just start date filter.
      status: appliedFilters.status,
      type: appliedFilters.type
    });
  }, [appliedFilters]);

  // Auto-dismiss messages
  useEffect(() => {
    const error = errorMessage || dataError || exportError;
    if (error) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, dataError, exportError]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle submit modal
  const handleSubmitRequest = () => {
    setSuccessMessage('Leave request submitted successfully!');
    setIsSubmitModalOpen(false);
    refetch();
  };

  const handleOpenFinalize = (request: unknown) => {
    setFinalizeModal({ isOpen: true, request });
  };

  const handleFinalizeSuccess = () => {
    setSuccessMessage('Leave request finalized successfully!');
    setFinalizeModal({ isOpen: false, request: null });
    refetch();
  };

  // Combined error message
  const currentError = errorMessage || dataError || exportError;

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${!sidebarOpen ? 'max-w-[1600px] xl:max-w-[88vw]' : 'max-w-[1400px] xl:max-w-[77vw]'}`}>
      {/* Header */}
      <Header 
        onRefresh={refetch}
        isLoading={isLoading || isExporting}
      />

      <hr className="mb-6 h-px bg-gray-200 border-0" />

      {/* Alerts */}
      <ErrorAlert 
        message={currentError} 
        onDismiss={() => setErrorMessage(null)} 
      />
      <SuccessAlert 
        message={successMessage} 
        onDismiss={() => setSuccessMessage(null)} 
      />

      {/* Filters */}
      <Filters 
        filters={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onClear={handleClear}
        onNewRequest={() => setIsSubmitModalOpen(true)}
        isLoading={isLoading || isExporting}
        hasCredits={credits.length > 0 && credits.some((c: any) => parseFloat(c.balance) > 0)}
      />

      {/* Search, Credits, and Create Button Row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
           <SearchBar 
              searchQuery={searchQuery}
              onChange={handleSearchChange}
              isLoading={isLoading || isExporting}
              resultCount={pagination.totalItems}
           />
        </div>

        {/* Right Side: Credits + Create Button */}
        <div className="flex items-center gap-4">
            {/* Credit Cards */}
            <div className="flex items-center gap-2">
              {credits.map((credit: any, idx: number) => (
                <div 
                  key={idx} 
                  className="bg-white px-3 py-2 rounded-lg border border-gray-300 shadow-sm flex items-center gap-2"
                >
                  <span className="text-xs font-medium text-gray-500">{credit.credit_type}:</span>
                  <span className={`text-sm font-bold ${parseFloat(credit.balance) > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                    {parseFloat(credit.balance).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>

            {/* Create New Request Button */}
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium shadow-md hover:bg-gray-800 transition-all active:scale-95 whitespace-nowrap text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              New Request
            </button>
        </div>
      </div>

      {/* Export Options */}
      <ExportOptions 
        onExportCSV={() => handleExportCSV(leaves)}
        onExportPDF={() => handleExportPDF(leaves)}
        isLoading={isLoading || isExporting}
        hasData={leaves.length > 0}
      />

      {/* Table */}
      {isLoading && leaves.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <Table 
          data={leaves}
          searchQuery={debouncedSearchQuery}
          filters={filters}
          onFinalize={handleOpenFinalize}
        />
      )}

      {/* Server-Side Pagination */}
      <Pagination 
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        onPageChange={setPage}
        itemsPerPage={pagination.limit}
      />

      {/* Submit Leave Request Modal */}
      <SubmitLeaveRequestModal
        isOpen={isSubmitModalOpen}
        onSubmit={handleSubmitRequest}
        onClose={() => setIsSubmitModalOpen(false)}
        credits={credits}
      />

      {/* Finalize Modal */}
      {finalizeModal.request && (
        <FinalizeModal
          isOpen={finalizeModal.isOpen}
          request={finalizeModal.request}
          onConfirm={handleFinalizeSuccess}
          onCancel={() => setFinalizeModal({ isOpen: false, request: null })}
        />
      )}
    </div>
  );
};

export default LeaveRequest;