import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '@/api/attendanceApi';

export interface AttendanceRecord {
  id: string | number;
  employee_id: string | number;
  name?: string;
  first_name?: string;
  last_name?: string;
  date: string;
  time_in: string;
  time_out: string;
  late: string | number;
  undertime: string | number;
  status: string;
  [key: string]: any;
}

export const useAttendanceData = (isAdmin = false) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['attendance', { isAdmin }],
    queryFn: async () => {
      const response = await attendanceApi.getLogs({});
      
      if (response && response.data) {
          const resData = response.data;
          if (Array.isArray(resData)) {
              return resData;
          } else if (resData.data && Array.isArray(resData.data)) {
              return resData.data;

          }
      } else if (Array.isArray(response)) {
          return response;
      }
      return [];
    },
    initialData: [] as AttendanceRecord[] 
  });

  return { 
    data: data as AttendanceRecord[], 
    isLoading, 
    error: error ? (error as Error).message : null, 
    refetch 
  };
};
