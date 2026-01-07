import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
// API
import { leaveApi } from '@api';
// Components
import SubmitLeaveRequestModal from '@components/Custom/Timekeeping/LeaveRequestComponents/Employee/Modals/SubmitLeaveRequestModal';
import FinalizeModal from '@components/Custom/Timekeeping/LeaveRequestComponents/Employee/Modals/Finalize';
import Header from '@components/Custom/Timekeeping/LeaveRequestComponents/Employee/components/Header';
import LoadingSpinner from '@components/Custom/Timekeeping/LeaveRequestComponents/Employee/components/LoadingSpinner';
import ErrorAlert from '@components/Custom/Timekeeping/LeaveRequestComponents/Employee/components/ErrorAlert';
import SuccessAlert from '@components/Custom/Timekeeping/LeaveRequestComponents/Employee/components/SuccessAlert';
import Filters from '@components/Custom/Timekeeping/LeaveRequestComponents/Employee/components/Filters';
import SearchBar from '@components/Custom/Timekeeping/LeaveRequestComponents/Employee/components/SearchBar';
import ExportOptions from '@components/Custom/Timekeeping/LeaveRequestComponents/Employee/components/ExportOptions';
import Table from '@components/Custom/Timekeeping/LeaveRequestComponents/Employee/components/Table';
import Pagination from '@components/Custom/Timekeeping/LeaveRequestComponents/Employee/components/Pagination';

// Hooks
import { useLeaveData } from '@components/Custom/Timekeeping/LeaveRequestComponents/Employee/hooks/useLeaveData';
import { useFilters } from '@components/Custom/Timekeeping/LeaveRequestComponents/Employee/hooks/useFilters';
import { usePagination } from '@components/Custom/Timekeeping/LeaveRequestComponents/Employee/hooks/usePagination';
import { useExport } from '@components/Custom/Timekeeping/LeaveRequestComponents/Employee/hooks/useExport';

const LeaveRequest = () => {
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;

  // State management
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [finalizeModal, setFinalizeModal] = useState({ isOpen: false, request: null });
  
  // Credits State
  const [credits, setCredits] = useState([]);

  // Custom hooks
  const { leaves: data, loading: isLoading, error: dataError, refreshLeaves: refetch } = useLeaveData();
  
  const { filters, appliedFilters, searchQuery, debouncedSearchQuery, filteredData, handleFilterChange, handleApplyFilters, handleSearchChange, handleClear } = useFilters(data);
  
  const { currentPage, totalPages, startIndex, endIndex, currentItems, handlePrevPage, handleNextPage, resetPage } = usePagination(filteredData);
  
  const { isExporting, exportError, handleExportCSV, handleExportPDF } = useExport();

  // Fetch Credits on mount
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await leaveApi.getMyCredits();
        console.log('📋 Credits API response:', res.data);
        if (res.data && res.data.credits) {
          console.log('📋 Setting credits:', res.data.credits);
          setCredits(res.data.credits);
        }
      } catch (err) {
        console.error("Failed to fetch credits:", err);
      }
    };
    fetchCredits();
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (error || dataError || exportError) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dataError, exportError]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Reset page when applied filters change
  useEffect(() => {
    resetPage();
  }, [appliedFilters, debouncedSearchQuery, resetPage]);

  // Handle submit modal
  const handleSubmitRequest = () => {
    setSuccessMessage('Leave request submitted successfully!');
    setIsSubmitModalOpen(false);
    refetch();
  };

  const handleOpenFinalize = (request) => {
    setFinalizeModal({ isOpen: true, request });
  };

  const handleFinalizeSuccess = () => {
    setSuccessMessage('Leave request finalized successfully!');
    setFinalizeModal({ isOpen: false, request: null });
    refetch();
  };

  // Combined error message
  const currentError = error || dataError || exportError;

  // Loading state
  if (isLoading && data.length === 0) {
    return <LoadingSpinner />;
  }

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
        onDismiss={() => setError(null)} 
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
        hasCredits={credits.length > 0 && credits.some(c => parseFloat(c.balance) > 0)}
      />

      {/* Search */}
      <SearchBar 
        searchQuery={searchQuery}
        onChange={handleSearchChange}
        resultCount={filteredData.length}
        isLoading={isLoading || isExporting}
      />

      {/* Export Options */}
      <ExportOptions 
        onExportCSV={() => handleExportCSV(filteredData)}
        onExportPDF={() => handleExportPDF(filteredData)}
        isLoading={isLoading || isExporting}
        hasData={filteredData.length > 0}
      />

      {/* Table */}
      <Table 
        data={currentItems}
        searchQuery={debouncedSearchQuery}
        filters={filters}
        onFinalize={handleOpenFinalize}
      />

      {/* Pagination */}
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={filteredData.length}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        isLoading={isLoading || isExporting}
      />

      {/* Submit Leave Request Modal */}
      <SubmitLeaveRequestModal
        isOpen={isSubmitModalOpen}
        onSubmit={handleSubmitRequest}
        onClose={() => setIsSubmitModalOpen(false)}
        credits={credits}
      />

      {/* Finalize Modal */}
      <FinalizeModal
        isOpen={finalizeModal.isOpen}
        request={finalizeModal.request}
        onConfirm={handleFinalizeSuccess}
        onCancel={() => setFinalizeModal({ isOpen: false, request: null })}
      />
    </div>
  );
};

export default LeaveRequest;