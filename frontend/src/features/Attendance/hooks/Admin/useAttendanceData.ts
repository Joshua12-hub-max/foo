import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '@/api/attendanceApi';
import { useState, useMemo, useCallback } from 'react';

import { AttendanceRecord } from '@/types/index';

const ITEMS_PER_PAGE = 15;

export const useAttendanceData = (isAdmin = false) => {
  const [page, setPage] = useState(1);

  const { data: rawData, isLoading, error, refetch } = useQuery({
    queryKey: ['attendance', { isAdmin }],
    queryFn: async () => {
      try {
        const response = await attendanceApi.getLogs({});
        
        if (response && response.data) {
            const resData = response.data;
            const items = Array.isArray(resData) 
              ? resData 
              : (resData.data && Array.isArray(resData.data)) 
                ? resData.data 
                : [];

            // Transform snake_case API fields → camelCase for AttendanceTable
            return items.map((item: any) => ({
              id: item.id,
              employeeId: item.employee_id || item.employeeId,
              employee_name: item.employee_name || item.name || 'Unknown',
              department: item.department || 'N/A',
              date: item.date,
              timeIn: item.time_in || item.timeIn || null,
              timeOut: item.time_out || item.timeOut || null,
              lateMinutes: Number(item.late_minutes ?? item.lateMinutes ?? 0),
              undertimeMinutes: Number(item.undertime_minutes ?? item.undertimeMinutes ?? 0),
              overtimeMinutes: Number(item.overtime_minutes ?? item.overtimeMinutes ?? 0),
              status: item.status || 'Absent',
              duties: item.duties || 'No Schedule',
            })) as AttendanceRecord[];
        }
        return [] as AttendanceRecord[];
      } catch (err) {
        console.error('[useAttendanceData] Fetch error:', err);
        throw err;
      }
    },
    initialData: [] as AttendanceRecord[] 
  });

  const data = rawData || [];

  // Pagination
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  }, [data, safePage]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  return { 
    data: paginatedData as AttendanceRecord[], 
    allData: data as AttendanceRecord[],
    isLoading, 
    error: error ? (error as Error).message : null, 
    refetch,
    pagination: {
      page: safePage,
      totalPages,
      totalItems,
      limit: ITEMS_PER_PAGE,
      onPageChange: handlePageChange,
    }
  };
};
