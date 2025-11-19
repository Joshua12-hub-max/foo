// Qoute of the day"Di ka uusad kung puro ka refactor!" -Date-11/02/2025
import { useMemo, useCallback } from "react";
import { useOutletContext } from 'react-router-dom';
import { useAttendanceData } from '../../components/Custom/AttendanceHR/Hooks/useAttendanceData';
import { useLoadingState } from '../../components/Custom/AttendanceHR/Hooks/useLoadingState';
import { useAttendanceActions } from '../../components/Custom/AttendanceHR/Hooks/useAttendanceActions';
import AttendanceHeader from '../../components/Custom/AttendanceHR/components/AttendanceHeader';
import {ErrorBanner} from '../../components/Custom/AttendanceHR/components/ErrorBanner';
import {SuccessBanner} from '../../components/Custom/AttendanceHR/components/SuccessBanner';
import AttendanceFilters from '../../components/Custom/AttendanceHR/components/AttendanceFilters';
import SearchBar from '../../components/Custom/AttendanceHR/components/SearchBar';
import ExportButtons from '../../components/Custom/AttendanceHR/components/ExportButtons';
import AttendanceTable from '../../components/Custom/AttendanceHR/components/AttendanceTable';
import Pagination from '../../components/Custom/AttendanceHR/components/Pagination';
import LoadingSpinner from '../../components/Custom/AttendanceHR/components/LoadingSpinner';

const Attendance = () => {
  
  
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;
  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);
  
  //Ito ytung custom hooks na ginamit pang kuha ng different values mula sa useAttendanceData() "ang tawag dit ay object destructuring.!"
  const { filters, setFilters, searchQuery, setSearchQuery, debouncedSearchQuery, currentPage, setCurrentPage, 
           handleFilterChange, handleSearchChange, uniqueDepartments, uniqueEmployees, filteredData, paginationData,
        } = useAttendanceData();

  //Ito yung custom hooks na ginamit pang kuha ng different values mula sa useLoadingState() "ang tawag din dito ay object destructuring.!"
  const { isLoading, setIsLoading, loadingType, setLoadingType, error, setError, successMessage, setSuccessMessage,} = useLoadingState();

  const { handleApply, handleClear, handleExportCSV, handleExportPDF, handleRefresh,} = useAttendanceActions
  ({ filteredData, setFilters, setSearchQuery, setSuccessMessage, setError, setIsLoading, setLoadingType, today, });
  
  // ito yung Pagination handlers
  const handlePrevPage = useCallback(() => {setCurrentPage((prev) => Math.max(prev - 1, 1));}, [setCurrentPage]);
  const handleNextPage = useCallback(() => {setCurrentPage((prev) => Math.min(prev + 1, paginationData.totalPages)); }, [paginationData.totalPages, setCurrentPage]);
  const { totalPages, startIndex, endIndex, currentItems } = paginationData;
  
  // for loading spinner lang to
  if (isLoading) {
    return <LoadingSpinner loadingType={loadingType} />;
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      <AttendanceHeader
        today={today}
        handleRefresh={handleRefresh}
        isLoading={isLoading}
      />

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      <SuccessBanner message={successMessage} onDismiss={() => setSuccessMessage(null)} />

      <AttendanceFilters
        filters={filters}
        handleFilterChange={handleFilterChange}
        handleApply={handleApply}
        handleClear={handleClear}
        uniqueDepartments={uniqueDepartments}
        uniqueEmployees={uniqueEmployees}
        isLoading={isLoading}
      />

      <SearchBar
        searchQuery={searchQuery}
        handleSearchChange={handleSearchChange}
        filteredDataLength={filteredData.length}
        isLoading={isLoading}
      />

      <ExportButtons
        handleExportCSV={handleExportCSV}
        handleExportPDF={handleExportPDF}
        isLoading={isLoading}
        hasData={filteredData.length > 0}
      />

      <AttendanceTable
        currentItems={currentItems}
        debouncedSearchQuery={debouncedSearchQuery}
        filters={filters}
      />

      {!isLoading && filteredData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          totalItems={filteredData.length}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default Attendance;