import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '@/stores';
import { ADMIN_ATTENDANCE_HEADERS } from '@features/Attendance/components/Admin/constants/attendanceConstants';
import { useAttendanceLogs } from '../../features/Attendance/hooks/useAttendance';
import { useAttendanceStore } from '@/stores/attendanceStore';

import AttendanceHeader from '@features/Attendance/components/Admin/AttendanceHeader';
import AttendanceFilters from '@features/Attendance/components/Admin/AttendanceFilters';

import AttendanceExport from '@features/Attendance/components/Admin/AttendanceExport';
import AttendanceTable from '@features/Attendance/components/Admin/AttendanceTable';

import { fetchDepartments } from '@api/departmentApi';
import { fetchEmployees } from '@api/employeeApi';

const AdminAttendance = () => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const { getQuery, setPage, pagination: storePagination } = useAttendanceStore();
  const queryParams = getQuery();

  // 1. Fetch Data
  const { data, isLoading, error, refetch } = useAttendanceLogs(queryParams);
  
  const logs = data?.data?.data || [];
  const paginationData = data?.data?.pagination;

  // Fetch Filter Options using React Query
  const { data: filterOptions, isLoading: loadingFilters } = useQuery({
    queryKey: ['attendance-filters'],
    queryFn: async () => {
      const [deptRes, empRes] = await Promise.all([
        fetchDepartments(),
        fetchEmployees()
      ]);
      
      const uniqueDepts = deptRes.success && deptRes.departments 
        ? Array.from(new Set(deptRes.departments.map((d: any) => d.name).filter(Boolean)))
        : [];
      
      const emps = empRes.success && empRes.employees
        ? empRes.employees.map((e: any) => ({
            id: e.employee_id || e.id,
            name: e.name || `${e.first_name} ${e.last_name}`
          })).filter((e: any) => e.id && e.name)
        : [];

      // Remove duplicates by ID (unique employee options)
      const uniqueEmps = Array.from(new Map(emps.map((item: any) => [item.id, item])).values());

      return { departments: uniqueDepts as string[], employees: uniqueEmps as {id: string, name: string}[] };
    },
    initialData: { departments: [], employees: [] }
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${!sidebarOpen ? 'max-w-[1600px] xl:max-w-[88vw]' : 'max-w-[1400px] xl:max-w-[77vw]'}`}>
      
      <AttendanceHeader 
        title="Attendance Records" 
        subtitle="Employee attendance monitoring"
        onRefresh={refetch}
        isLoading={isLoading || loadingFilters}
      />

      <hr className="mb-6 border-[1px] border-gray-200" />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error instanceof Error ? error.message : 'An error occurred fetching attendance logs.'}
        </div>
      )}

      {/* RHF + Zod + Zustand powered filters */}
      <AttendanceFilters 
        uniqueDepartments={filterOptions.departments}
        uniqueEmployees={filterOptions.employees}
        isLoading={loadingFilters || isLoading}
      />

      <AttendanceExport 
        data={logs}
        title="Attendance Records"
      />

      <AttendanceTable 
        data={logs}
        headers={ADMIN_ATTENDANCE_HEADERS.map((h) => h.label)}
        isLoading={isLoading}
        pagination={paginationData ? {
            page: paginationData.page,
            totalPages: paginationData.totalPages,
            totalItems: paginationData.total,
            limit: paginationData.limit,
            onPageChange: handlePageChange
        } : undefined}
      />
    </div>
  );
};

export default AdminAttendance;
