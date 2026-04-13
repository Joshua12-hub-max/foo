import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@api/attendanceApi';
import { AttendanceQueryValues } from '@/schemas/attendanceSchema';

export const useAttendanceLogs = (filters: AttendanceQueryValues) => {
    return useQuery({
        queryKey: ['attendanceLogs', filters],
        queryFn: () => attendanceApi.getLogs(filters),
    });
};


export const useRecentActivity = (params?: AttendanceQueryValues) => {
    return useQuery({
        queryKey: ['recentActivity', params],
        queryFn: () => attendanceApi.getRecentActivity(params),
    });
};

export const useTodayStatus = (employeeId?: string) => {
    return useQuery({
        queryKey: ['todayStatus', employeeId],
        queryFn: () => attendanceApi.getTodayStatus(employeeId),
    });
};

export const useDashboardStats = (params?: AttendanceQueryValues) => {
    return useQuery({
        queryKey: ['dashboardStats', params],
        queryFn: () => attendanceApi.getDashboardStats(params),
    });
};
