import { useQuery, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { PublicJob, JobApplicationSchema, JobApplicationInput, RecruitmentErrorResponse } from '@/schemas/recruitment';
import { recruitmentApi } from '@/api';

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

export const useJobApplication = (
  onSuccess?: (response: { data: { success: boolean, requiresVerification?: boolean, email?: string, applicantId?: number } }) => void, 
  onError?: (error: AxiosError<RecruitmentErrorResponse>) => void
) => {
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: JobApplicationInput }) => {
            // Better debug logging that shows File objects
            const debugData = { ...data };
            if (debugData.resume instanceof File) debugData.resume = `[FILE: ${debugData.resume.name}]` as any;
            if (debugData.photo instanceof File) debugData.photo = `[FILE: ${debugData.photo.name}]` as any;
            if (debugData.eligibilityCert instanceof File) debugData.eligibilityCert = `[FILE: ${debugData.eligibilityCert.name}]` as any;
            console.log('[DEBUG] useJobApplication mutation data:', JSON.stringify(debugData, null, 2));

            const formData = new FormData();
            formData.append('jobId', id);

            // Fields that are frontend-only and should NOT be sent to the backend
            const skipFields = new Set(['photoPreview', 'jobId']);
            // File fields need special handling
            const fileFields = new Set(['resume', 'photo', 'eligibilityCert']);
            
            Object.keys(data).forEach(key => {
                if (skipFields.has(key)) return;

                const value = data[key as keyof JobApplicationInput];
                if (value === null || value === undefined) return;

                if (fileFields.has(key)) {
                    // Only append if it's actually a File object
                    if (value instanceof File) {
                        console.log(`[FormData] Appending FILE: ${key} = ${value.name} (${value.size} bytes)`);
                        formData.append(key, value);
                    } else {
                        console.warn(`[FormData] Skipping ${key}: Not a File object, got:`, typeof value, value);
                    }
                } else if (value !== null && typeof value === 'object') {
                    // 100% PRECISION: Stringify objects and arrays for multipart/form-data
                    formData.append(key, JSON.stringify(value));
                } else if (typeof value === 'boolean') {
                    formData.append(key, value ? 'true' : 'false');
                } else if (typeof value === 'number') {
                    formData.append(key, String(value));
                } else if (typeof value === 'string' && value !== '') {
                    formData.append(key, value);
                }
            });

            // Log final FormData contents
            console.log('[FormData] Final FormData entries:');
            for (const [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`  ${key}: [FILE] ${value.name} (${value.size} bytes)`);
                } else {
                    console.log(`  ${key}:`, typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value);
                }
            }

            return await recruitmentApi.applyJob(formData);
        },
        onSuccess,
        onError: (error: AxiosError<RecruitmentErrorResponse>) => onError?.(error)
    });
};
