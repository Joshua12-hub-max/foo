import { useAdminPerformance } from "@/features/Performance/Admin/Hooks/useAdminPerformance";
import { PerformanceNotification } from "@/features/Performance/Admin/Components/PerformanceNotification";
import { PerformanceFilters } from "@/features/Performance/Admin/Components/PerformanceFilters";
import { PerformanceSearchBar } from "@/features/Performance/Admin/Components/PerformanceSearchBar";

import { PerformanceTable } from "@/features/Performance/Admin/Components/PerformanceTable";
import { PerformanceLoadingSpinner } from "@/features/Performance/Admin/Components/PerformanceLoadingSpinner";
import PerformanceLayout from "@/features/Performance/PerformanceLayout";
import Pagination from '@/components/CustomUI/Pagination';

const PerformanceEvaluationDashboard = () => {
  const { 
    today, sidebarOpen, filters, searchQuery, debouncedSearchQuery, currentPage, isLoading, loadingType, error, successMessage, filteredData, paginationData, uniqueDepartments, uniqueEmployees, stats,
    handleRefresh, handlePageChange, getStatusBadge,
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
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={filteredData.length}
          itemsPerPage={5} // Based on standard or check constant in hook
        />
      )}
    </PerformanceLayout>
  );
};

export default PerformanceEvaluationDashboard;