import React, { useMemo } from 'react';
import { useUIStore } from '@/stores';
import { AttendanceFilterValues } from '@/schemas/attendanceSchema';
import { 
  BiometricsHeader, 
  BiometricsNotification, 
  BiometricsFilters, 
  BiometricsTable,
  useBiometricsLogs 
} from "@settings/Biometrics/Logs";
import Pagination from '@/components/CustomUI/Pagination';
import StatCard from '@components/Custom/DashboardAdminComponents/StatCard';

const BiometricsLogsUI = () => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  
  const {
    today,
    isLoading,
    error,
    successMessage,
    paginationData,
    uniqueDepartments,
    uniqueEmployees,
    handleRefresh,
    handleFilterChange,
    handleApply,
    handleClear,
    handleSearchChange,
    searchQuery,
    filters,
    filteredData,
    handlePrevPage,
    handleNextPage,
    setPage,
    setSuccessMessage,
    setFilters,
    setError
  } = useBiometricsLogs();

  // Stats from Monitor (computed from filtered data)
  const stats = useMemo(() => ({
    onTime: filteredData.filter((l: any) => l.status === 'Present').length,
    late: filteredData.filter((l: any) => l.status === 'Late').length,
    total: filteredData.length,
  }), [filteredData]);

  // Map pagination data for the Pagination component
  const totalPages = paginationData.totalPages;
  const currentPage = Math.ceil((paginationData.startIndex + 1) / 10);
  const totalItems = paginationData.currentItems.length * totalPages;

  const handleFilterSubmit = (newFilters: AttendanceFilterValues) => {
      setFilters({
          department: newFilters.department || '',
          employeeId: newFilters.employeeId || '',
          startDate: newFilters.startDate || '',
          endDate: newFilters.endDate || ''
      });
  };

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${!sidebarOpen ? 'max-w-[1600px] xl:max-w-[88vw]' : 'max-w-[1400px] xl:max-w-[77vw]'}`}>
      
      <BiometricsHeader 
        today={today} 
        handleRefresh={handleRefresh} 
        isLoading={isLoading} 
      />

      {/* Stats Cards (matching Admin Dashboard style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-5">
        <StatCard
          title="On Time"
          data={stats.onTime}
        />
        <StatCard
          title="Late"
          data={stats.late}
        />
        <StatCard
          title="Total Records"
          data={stats.total}
        />
      </div>

      {error && (
        <BiometricsNotification 
          type="error" 
          message={error} 
          onClose={() => setError(null)} 
        />
      )}

      {successMessage && (
        <BiometricsNotification 
          type="success" 
          message={successMessage} 
          onClose={() => setSuccessMessage(null)} 
        />
      )}

      <BiometricsFilters 
        uniqueDepartments={uniqueDepartments}
        uniqueEmployees={uniqueEmployees}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={handleFilterSubmit}
      />

      <BiometricsTable 
        currentItems={paginationData.currentItems} 
        isLoading={isLoading} 
      />

      {paginationData.total > 0 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={paginationData.total}
          itemsPerPage={10}
        />
      )}
    </div>
  );
};

export default BiometricsLogsUI;
