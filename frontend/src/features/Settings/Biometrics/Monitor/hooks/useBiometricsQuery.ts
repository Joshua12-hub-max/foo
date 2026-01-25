
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/api/attendanceApi';
import { biometricsApi } from '@/api/biometricsApi';

// Keys for caching
export const BIOMETRICS_KEYS = {
  logs: ['biometrics', 'logs'],
  device: ['biometrics', 'device'],
  status: (employeeId: string) => ['biometrics', 'status', employeeId],
};

// Hook for fetching Activity Logs
export const useBiometricsLogs = (enabled = true) => {
  return useQuery({
    queryKey: BIOMETRICS_KEYS.logs,
    queryFn: async () => {
      const res = await attendanceApi.getRecentActivity();
      // Ensure we always return an array
      if (res.data && res.data.success) {
        return res.data.data;
      }
      return [];
    },
    refetchInterval: 3000, // Poll every 3 seconds
    enabled,
    staleTime: 1000,
  });
};

// Hook for fetching Device Status
export const useDeviceStatus = (enabled = true) => {
  return useQuery({
    queryKey: BIOMETRICS_KEYS.device,
    queryFn: async () => {
      const res = await biometricsApi.getDeviceStatus();
      if (res.data && res.data.success) {
        return res.data;
      }
      throw new Error('Failed to fetch device status');
    },
    refetchInterval: 5000, // Poll every 5s
    enabled,
    retry: false, // Don't retry on 404/500 to keep UI responsive
  });
};

// Hook for Starting Enrollment
export const useStartEnrollment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ employeeId, name, department }: { employeeId: string, name?: string, department?: string }) => {
      const res = await biometricsApi.startEnrollment({ employeeId, name, department });
      return res.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: BIOMETRICS_KEYS.status(variables.employeeId) });
      queryClient.invalidateQueries({ queryKey: BIOMETRICS_KEYS.device });
    },
  });
};

// Hook for Checking Enrollment Status
export const useEnrollmentStatus = (employeeId: string | null) => {
  return useQuery({
    queryKey: BIOMETRICS_KEYS.status(employeeId || ''),
    queryFn: async () => {
      if (!employeeId) return null;
      const res = await biometricsApi.getEnrollmentStatus(employeeId);
      return res.data;
    },
    enabled: !!employeeId,
  });
};
