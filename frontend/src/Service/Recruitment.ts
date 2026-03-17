import api from '@/api/axios';

export const verifyApplicantOTP = async (data: { applicantId: number; otp: string }) => {
    const response = await api.post("/recruitment/verify-otp", data);
    return response.data;
};

// Add other recruitment services if needed
export const getJobs = async () => {
    const response = await api.get("/recruitment/jobs?publicView=true");
    return response.data;
};

export const applyJob = async (formData: FormData) => {
    const response = await api.post("/recruitment/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
};
