import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

// API
import { leaveApi } from '../../api/leaveApi';

// Components
import SubmitLeaveRequestModal from '../../components/Custom/LeaveRequestComponents/Employee/components/Modals/SubmitLeaveRequestModal';
import FinalizeModal from '../../components/Custom/LeaveRequestComponents/Employee/components/Modals/Finalize';
import Header from '../../components/Custom/LeaveRequestComponents/Employee/components/Header';
import LoadingSpinner from '../../components/Custom/LeaveRequestComponents/Employee/components/LoadingSpinner';
import ErrorAlert from '../../components/Custom/LeaveRequestComponents/Employee/components/ErrorAlert';
import SuccessAlert from '../../components/Custom/LeaveRequestComponents/Employee/components/SuccessAlert';
import Filters from '../../components/Custom/LeaveRequestComponents/Employee/components/Filters';
import SearchBar from '../../components/Custom/LeaveRequestComponents/Employee/components/SearchBar';
import ExportOptions from '../../components/Custom/LeaveRequestComponents/Employee/components/ExportOptions';
import Table from '../../components/Custom/LeaveRequestComponents/Employee/components/Table';
import Pagination from '../../components/Custom/LeaveRequestComponents/Employee/components/Pagination';

// Hooks
import { useLeaveData } from '../../components/Custom/LeaveRequestComponents/Employee/hooks/useLeaveData';
import { useFilters } from '../../components/Custom/LeaveRequestComponents/Employee/hooks/useFilters';
import { usePagination } from '../../components/Custom/LeaveRequestComponents/Employee/hooks/usePagination';
import { useExport } from '../../components/Custom/LeaveRequestComponents/Employee/hooks/useExport';

const LeaveCreditsSummary = ({ credits }) => {
    if (!credits || credits.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {credits.map((credit) => (
                <div key={credit.credit_type} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#274b46] flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{credit.credit_type}</h3>
                        <span className="text-2xl font-bold text-gray-800">{credit.balance}</span>
                        <span className="text-gray-400 text-sm ml-1">days</span>
                    </div>
                    <div className="bg-green-100 p-2 rounded-full">
                        <Clock className="w-5 h-5 text-green-700" />
                    </div>
                </div>
            ))}
        </div>
    );
};

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
  const { data, isLoading, error: dataError, refetch } = useLeaveData();
  const { 
    filters, 
    searchQuery, 
    debouncedSearchQuery,
    filteredData, 
    handleFilterChange, 
    handleSearchChange, 
    handleClear 
  } = useFilters(data);
  const { 
    currentPage, 
    totalPages, 
    startIndex, 
    endIndex, 
    currentItems, 
    handlePrevPage, 
    handleNextPage,
    resetPage 
  } = usePagination(filteredData);
  const { 
    isExporting, 
    exportError,
    handleExportCSV, 
    handleExportPDF 
  } = useExport();

  // Fetch Credits
  useEffect(() => {
      const fetchCredits = async () => {
          try {
              const res = await leaveApi.getMyCredits();
              if (res.data && res.data.credits) {
                  setCredits(res.data.credits);
              }
          } catch (err) {
              console.error("Failed to fetch credits:", err);
          }
      };
      fetchCredits();
  }, [successMessage]); // Refresh credits when a request is submitted/finalized (though usually updates on approval)

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

  // Reset page when filters change
  useEffect(() => {
    resetPage();
  }, [filters, debouncedSearchQuery, resetPage]);

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
        onNewRequest={() => setIsSubmitModalOpen(true)}
        isLoading={isLoading || isExporting}
      />

      <hr className="mb-6 border-[#274b46]" />

      {/* Leave Credits Summary */}
      <LeaveCreditsSummary credits={credits} />

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
        onClear={handleClear}
        isLoading={isLoading || isExporting}
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