import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { biometricsApi } from '../api/biometricsApi';
import { StartEnrollmentValues } from '../schemas/biometricsSchema';
import { useToastStore } from '@/stores';

export const useEnrollmentStatus = (employeeId: string) => {
    return useQuery({
        queryKey: ['enrollmentStatus', employeeId],
        queryFn: () => biometricsApi.getEnrollmentStatus(employeeId),
        enabled: !!employeeId,
    });
};

export const useStartEnrollment = () => {
    const showToast = useToastStore((state) => state.showToast);

    return useMutation({
        mutationFn: (data: StartEnrollmentValues) => biometricsApi.startEnrollment(data),
        onSuccess: (data) => {
            showToast(data.data.message || 'Enrollment started. Check device.', 'success');
        },
        onError: (error: any) => {
            showToast(error.response?.data?.message || 'Failed to start enrollment', 'error');
        }
    });
};
