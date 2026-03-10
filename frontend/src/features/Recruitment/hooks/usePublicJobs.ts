import { useQuery, useMutation } from '@tanstack/react-query';
import { recruitmentApi } from '@/api/recruitmentApi';
import { PublicJob, JobApplicationSchema } from '@/schemas/recruitment';

export const usePublicJobs = (searchTerm: string = '') => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['public-jobs'],
        queryFn: async () => {
            const res = await recruitmentApi.getJobs({ public_view: true });
            if (res.data.success) {
                return res.data.jobs as PublicJob[];
            }
            return [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const jobs = data || [];
    const filteredJobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        job.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
        jobs,
        filteredJobs,
        isLoading,
        error
    };
};

export const usePublicJobDetail = (id: string | undefined) => {
    return useQuery({
        queryKey: ['job', id],
        queryFn: async () => {
            if (!id) throw new Error("Job ID is required");
            const res = await recruitmentApi.getJob(id);
            if (res.data.success) {
                return res.data.job as PublicJob;
            }
            throw new Error("Job not found");
        },
        enabled: !!id,
        retry: 1,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useJobApplication = (onSuccess?: () => void, onError?: (error: Error) => void) => {
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: JobApplicationSchema }) => {
            const formData = new FormData();
            formData.append('jobId', id);

            // Fields that are frontend-only and should NOT be sent to the backend
            const skipFields = new Set(['photoPreview', 'jobId']);
            // File fields need special handling
            const fileFields = new Set(['resume', 'photo', 'eligibilityCert']);
            
            Object.keys(data).forEach(key => {
                if (skipFields.has(key)) return;

                const value = data[key as keyof JobApplicationSchema];
                if (value === null || value === undefined) return;

                if (fileFields.has(key)) {
                    // Only append if it's actually a File object
                    if (value instanceof File) {
                        formData.append(key, value);
                    }
                } else if (typeof value === 'boolean') {
                    formData.append(key, value ? 'true' : 'false');
                } else if (typeof value === 'number') {
                    formData.append(key, String(value));
                } else if (typeof value === 'string' && value !== '') {
                    formData.append(key, value);
                }
            });
            
            return await recruitmentApi.applyJob(formData);
        },
        onSuccess,
        onError: (error: Error) => onError?.(error)
    });
};
