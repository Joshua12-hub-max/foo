import React from 'react';
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
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
import Table from '@/features/LeaveRequests/components/Employee/Table';
import Pagination from '@/components/CustomUI/Pagination';

// Hooks
import { useLeaveData } from '@/features/LeaveRequests/hooks/Employee/useLeaveData';
import { EmployeeLeaveRequest } from "@/features/LeaveRequests/types";
import { LeaveStatus } from "@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/constants/leaveConstants";
import type { LeaveBalance, ApplicationStatus, LeaveType } from '@/types/leave.types';

const LeaveRequest = () => {
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  // State management
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [finalizeModal, setFinalizeModal] = useState<{ isOpen: boolean; request: EmployeeLeaveRequest | null }>({ isOpen: false, request: null });
  
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

  // Fetch Credits gamit ang React Query boi
  const { data: credits = [] } = useQuery<LeaveBalance[]>({
    queryKey: ['employee-leave-credits'],
    queryFn: async () => {
      const res = await leaveApi.getMyCredits();
      return res.data?.credits || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
  
  // Standardized approach: Let the Filters component handle its own internal RHF state
  // and update the LeaveStore directly on "Apply".

  // Sync Search with Server
  useEffect(() => {
    updateServerFilters({ search: debouncedSearchQuery });
  }, [debouncedSearchQuery, updateServerFilters]);

  // Auto-dismiss messages
  useEffect(() => {
    const error = errorMessage || dataError;
    if (error) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, dataError]);

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

  const handleOpenFinalize = (request: EmployeeLeaveRequest) => {
    setFinalizeModal({ isOpen: true, request });
  };

  const handleFinalizeSuccess = () => {
    setSuccessMessage('Leave request finalized successfully!');
    setFinalizeModal({ isOpen: false, request: null });
    refetch();
  };

  // Combined error message
  const currentError = errorMessage || dataError;

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${!sidebarOpen ? 'max-w-[1600px] xl:max-w-[88vw]' : 'max-w-[1400px] xl:max-w-[77vw]'}`}>
      {/* Header */}
      <Header 
        onRefresh={refetch}
        isLoading={isLoading}
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
        onNewRequest={() => setIsSubmitModalOpen(true)}
        isLoading={isLoading}
        hasCredits={credits.length > 0 && credits.some((c) => c.balance > 0)}
      />

      {/* Search, Credits, and Create Button Row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Placeholder for spacing where search bar was */}
        <div className="flex-1 max-w-md"></div>

        {/* Right Side: Credits + Create Button */}
        <div className="flex items-center gap-4">
            {/* Credit Cards - Enhanced */}
            <div className="flex items-center gap-2">
              {credits.map((credit, idx) => (
                <div 
                  key={idx} 
                  className="bg-white px-3 h-10 rounded-md border border-gray-200 shadow-sm flex flex-col justify-center min-w-[100px] transition-all hover:shadow-md hover:border-gray-300"
                >
                  <span className="text-[9px] font-bold text-gray-400 capitalize whitespace-nowrap leading-tight">
                    {credit.creditType.replace(' Leave', '').toLowerCase()}
                  </span>
                  <div className="flex items-baseline gap-1 leading-tight">
                    <span className={`text-sm font-black tracking-tight ${Number(credit.balance || 0) > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                      {Number(credit.balance || 0).toFixed(1)}
                    </span>
                    <span className="text-[8px] font-medium text-gray-400">Days</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Create New Request Button */}
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center gap-2 px-4 h-10 bg-gray-900 text-white rounded-md font-bold shadow-md hover:bg-gray-800 transition-all active:scale-95 whitespace-nowrap text-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              New Request
            </button>
        </div>
      </div>

      {/* Table */}
      {isLoading && leaves.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <Table 
          data={leaves}
          searchQuery={debouncedSearchQuery}
          onFinalize={(req) => handleOpenFinalize(req)}
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