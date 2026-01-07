import { useAdminPerformance } from "@/components/Custom/Performance/Admin/Hooks/useAdminPerformance";
import { PerformanceNotification } from "@/components/Custom/Performance/Admin/Components/PerformanceNotification";
import { PerformanceFilters } from "@/components/Custom/Performance/Admin/Components/PerformanceFilters";
import { PerformanceSearchBar } from "@/components/Custom/Performance/Admin/Components/PerformanceSearchBar";

import { PerformanceTable } from "@/components/Custom/Performance/Admin/Components/PerformanceTable";
import { PerformancePagination } from "@/components/Custom/Performance/Admin/Components/PerformancePagination";
import { PerformanceLoadingSpinner } from "@/components/Custom/Performance/Admin/Components/PerformanceLoadingSpinner";
import PerformanceLayout from "@/components/Custom/Performance/PerformanceLayout";

const PerformanceEvaluationDashboard = () => {
  const { 
    today, sidebarOpen, filters, searchQuery, debouncedSearchQuery, currentPage, isLoading, loadingType, error, successMessage, filteredData, paginationData, uniqueDepartments, uniqueEmployees, stats,
    handleRefresh, handlePrevPage, handleNextPage, getStatusBadge,
    handleFilterChange, handleApply, handleClear, handleSearchChange, setError, setSuccessMessage 
  } = useAdminPerformance();

  const { totalPages, startIndex, endIndex, currentItems } = paginationData;

  if (isLoading && loadingType === "data") {
    return <PerformanceLoadingSpinner loadingType={loadingType} />;
  }

  return (
    <PerformanceLayout>
      {/* Error Message */}
      {error && (
        <PerformanceNotification 
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Success Message */}
      {successMessage && (
        <PerformanceNotification 
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      <PerformanceFilters 
        filters={filters}
        handleFilterChange={handleFilterChange}
        handleApply={handleApply}
        handleClear={handleClear}
        isLoading={isLoading}
        uniqueDepartments={uniqueDepartments}
        uniqueEmployees={uniqueEmployees}
      />

      <PerformanceSearchBar 
        searchQuery={searchQuery}
        handleSearchChange={handleSearchChange}
        filteredDataLength={filteredData.length}
        isLoading={isLoading}
      />



      <PerformanceTable 
        currentItems={currentItems}
        getStatusBadge={getStatusBadge}
        debouncedSearchQuery={debouncedSearchQuery}
        filters={filters}
        isLoading={isLoading}
      />

      {!isLoading && filteredData.length > 0 && (
        <PerformancePagination 
          startIndex={startIndex}
          endIndex={endIndex}
          totalRecords={filteredData.length}
          currentPage={currentPage}
          totalPages={totalPages}
          handlePrevPage={handlePrevPage}
          handleNextPage={handleNextPage}
          isLoading={isLoading}
        />
      )}
    </PerformanceLayout>
  );
};

export default PerformanceEvaluationDashboard;