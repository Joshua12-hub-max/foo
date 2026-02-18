
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/api/attendanceApi';

// Keys for caching
// Keys for caching
export const BIOMETRICS_KEYS = {
  logs: ['biometrics', 'logs'],
};

// Hook for fetching Activity Logs
export const useBiometricsLogs = (enabled = true) => {
  return useQuery({
    queryKey: BIOMETRICS_KEYS.logs,
    queryFn: async () => {
      const res = await attendanceApi.getLogs({
          limit: 100 // Fetch recent 100 logs for pagination
      });

      if (res.data && res.data.success) {
        // Map AttendanceRecord to MonitorLogData format
        return res.data.data.map((record: any) => ({
             id: record.id,
             employeeId: record.employee_id || record.employeeId,
             date: record.date,
             timeIn: record.time_in || record.timeIn || null,
             timeOut: record.time_out || record.timeOut || null,
             status: record.status || 'Present',
             updatedAt: record.updated_at || record.updatedAt || new Date().toISOString(),
             firstName: record.first_name || record.employee_name?.split(' ')[0] || '',
             lastName: record.last_name || record.employee_name?.split(' ').slice(1).join(' ') || '',
             name: record.employee_name || record.name || 'Unknown',
             department: record.department || 'N/A',
             duties: record.duties || 'No Schedule'
        }));
      }
      return [];
    },
    refetchInterval: 3000, // Poll every 3 seconds
    enabled,
    staleTime: 1000,
  });
};

// Legacy hooks (useDeviceStatus, useStartEnrollment, useEnrollmentStatus) removed as requested by user.
