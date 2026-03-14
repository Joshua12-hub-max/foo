import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '@/api/attendanceApi';
import { AttendanceLogApiResponse } from '@/types/attendance';

// Keys for caching
export const BIOMETRICS_KEYS = {
  logs: ['biometrics', 'logs'],
};

// Hook for fetching Activity Logs
export const useBiometricsLogs = (enabled = true) => {
  return useQuery({
    queryKey: BIOMETRICS_KEYS.logs,
    queryFn: async () => {
      const res = await attendanceApi.getRawLogs({
          limit: 100 // Fetch recent 100 logs
      });

      if (res.data && res.data.success) {
        // Map AttendanceLogApiResponse to local format
        return res.data.data.map((record: AttendanceLogApiResponse) => ({
             id: record.id,
             employeeId: record.employeeId,
             time: record.scanTime,
             type: record.type,
             status: record.dtrStatus || 'Pending',
             firstName: record.firstName || '',
             lastName: record.lastName || '',
             name: `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Unknown',
             department: record.department || 'N/A',
             duties: record.duties || 'No Schedule',
             source: record.source || 'BIOMETRIC'
        }));
      }
      return [];
    },
    refetchInterval: 3000, // Poll every 3 seconds
    enabled,
    staleTime: 1000,
  });
};

