import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '@/stores';
import { useAttendanceLogs } from '../../features/Attendance/hooks/useAttendance';
import { useBiometricsStore } from '@/stores/biometricsStore';
import { useFilterOptions } from '@/hooks/useFilterOptions';


import { 
  BiometricsHeader, 
  BiometricsNotification, 
  BiometricsFilters, 
  BiometricsTable 
} from "@settings/Biometrics/Logs";
import Pagination from '@/components/CustomUI/Pagination';

const BiometricsLogsUI = () => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const { 
    logPagination, 
    setLogPage, 
    getLogQuery, 
    statusMessage, 
    setStatusMessage 
  } = useBiometricsStore();

  const queryParams = getLogQuery();

  // 1. Fetch Logs
  const { data, isLoading, error, refetch } = useAttendanceLogs(queryParams);

  const logs = data?.data?.data || [];
  const paginationData = data?.data?.pagination;

  // 2. Fetch Filter Options
  const { data: filterOptions, isLoading: loadingFilters } = useFilterOptions();


  // 3. Map Data for Table
  const tableData = logs.map((log: any) => ({
    id: log.employee_id,
    department: log.department || 'N/A',
    name: log.employee_name || `${log.first_name || ''} ${log.last_name || ''}`.trim(),
    date: new Date(log.scan_time).toLocaleDateString(),
    time: new Date(log.scan_time).toLocaleTimeString(),
    type: log.type,
    status: 'Logged',
  }));

  const handlePageChange = (newPage: number) => {
    setLogPage(newPage);
  };
  
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${!sidebarOpen ? 'max-w-[1600px] xl:max-w-[88vw]' : 'max-w-[1400px] xl:max-w-[77vw]'}`}>
      
      <BiometricsHeader 
        today={today} 
        handleRefresh={refetch} 
        isLoading={isLoading} 
      />

      <hr className="mb-6 h-px bg-gray-200 border-0" />

      {error && (
        <BiometricsNotification 
          type="error" 
          message={error instanceof Error ? error.message : 'Failed to fetch logs'} 
          onClose={() => {}} 
        />
      )}

      {statusMessage && (
        <BiometricsNotification 
          type="success" 
          message={statusMessage} 
          onClose={() => setStatusMessage('')} 
        />
      )}

      <BiometricsFilters 
        uniqueDepartments={filterOptions.departments}
        uniqueEmployees={filterOptions.employees}
        isLoading={loadingFilters || isLoading}
      />

      <BiometricsTable 
        currentItems={tableData} 
        isLoading={isLoading} 
      />

      {paginationData && (
        <Pagination 
          currentPage={paginationData.page}
          totalPages={paginationData.totalPages}
          totalItems={paginationData.total}
          itemsPerPage={paginationData.limit}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default BiometricsLogsUI;