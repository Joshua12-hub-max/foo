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
import { FileText, FileSpreadsheet } from "lucide-react";
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
    handleExportCSV,
    handleExportPDF,
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

      <div className="flex flex-col sm:flex-row justify-between items-center my-6 gap-4">
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-gray-700">Export Report:</span>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-colors" />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors select-none">Group by Department</span>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors border border-emerald-200"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors border border-rose-200"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

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
