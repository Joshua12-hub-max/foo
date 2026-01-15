import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@api/attendanceApi';
import { AttendanceQueryValues } from '@/schemas/attendanceSchema';

export const useAttendanceLogs = (filters: AttendanceQueryValues) => {
    return useQuery({
        queryKey: ['attendanceLogs', filters],
        queryFn: () => attendanceApi.getLogs(filters),
    });
};

export const useClockIn = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: attendanceApi.clockIn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['todayStatus'] });
            queryClient.invalidateQueries({ queryKey: ['recentActivity'] });
            queryClient.invalidateQueries({ queryKey: ['attendanceLogs'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        },
    });
};

export const useClockOut = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: attendanceApi.clockOut,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['todayStatus'] });
            queryClient.invalidateQueries({ queryKey: ['recentActivity'] });
            queryClient.invalidateQueries({ queryKey: ['attendanceLogs'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        },
    });
};

export const useRecentActivity = () => {
    return useQuery({
        queryKey: ['recentActivity'],
        queryFn: attendanceApi.getRecentActivity,
    });
};

export const useTodayStatus = (employeeId?: string) => {
    return useQuery({
        queryKey: ['todayStatus', employeeId],
        queryFn: () => attendanceApi.getTodayStatus(employeeId),
    });
};

export const useDashboardStats = () => {
    return useQuery({
        queryKey: ['dashboardStats'],
        queryFn: attendanceApi.getDashboardStats,
    });
};
