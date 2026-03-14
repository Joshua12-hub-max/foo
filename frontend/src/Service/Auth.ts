import api from '@/api/axios';
import { 
  LoginInput, 
  RegisterInput, 
  VerifyOTPInput, 
  EmailVerifyInput, 
  ResendOTPInput, 
  ForgotPasswordInput, 
  ResetPasswordInput,
  RegisterResponse 
} from '@/schemas/authSchema';
import { AxiosResponse } from 'axios';
import { User } from '@/types';

// Define response types if needed, or use generic any for data for now, 
// but inputs are strictly typed.

// Using partial for flexibility if schema is too strict for partial updates,
// but for Auth actions, strict schema is best.

export const findHiredApplicant = async (firstName: string, lastName: string) => {
  const response = await api.get(`/auth/hired-applicant-search`, {
    params: { firstName, lastName }
  });
  return response.data;
};

export const verifyEnrollment = async (employeeId: string) => {
  const response = await api.get(`/auth/verify-enrollment/${employeeId}`);
  return response.data;
};

export const register = (data: RegisterInput | FormData, mode?: string): Promise<AxiosResponse<RegisterResponse>> => 
  api.post<RegisterResponse>(`/auth/register${mode ? `?mode=${mode}` : ""}`, data);

export const login = (data: LoginInput) => api.post("/auth/login", data);

export const googleLogin = (credential: string) => api.post("/auth/google", { credential });

export const logout = () => api.post("/auth/logout");

export const resendVerification = async (data: ResendOTPInput | { email: string }) => {
  // Supports both object with identifier or simple email object for backward compat if needed
  // Using ResendOTPInput is preferred: { identifier: string }
  // Endpoint expects: { identifier } or { email }
  const payload = 'email' in data ? data : { identifier: data.identifier }; 
  const response = await api.post("/auth/resend-verification", payload);
  return response.data;
};

export const forgotPassword = async (data: ForgotPasswordInput) => {
  const response = await api.post("/auth/forgot-password", data);
  return response.data;
};

export const resetPassword = async (data: ResetPasswordInput) => {
  const response = await api.post("/auth/reset-password", data);
  return response.data;
};

export const getCurrentUser = async () => {
    const response = await api.get("/auth/me");
    return response.data.data.user;
};

export const enableTwoFactor = async () => {
    const response = await api.post("/auth/2fa/enable");
    return response.data;
};

export const disableTwoFactor = async () => {
    const response = await api.post("/auth/2fa/disable");
    return response.data;
};

export const verifyTwoFactorOTP = async (data: VerifyOTPInput) => {
    const response = await api.post("/auth/2fa/verify", data);
    return response.data;
};

export const resendTwoFactorOTP = async (data: ResendOTPInput) => {
    const response = await api.post("/auth/2fa/resend", data);
    return response.data;
};

export const updateProfile = async (formData: FormData) => {
    const response = await api.post("/auth/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
};

export const verifyRegistrationOTP = async (data: EmailVerifyInput): Promise<AxiosResponse<{ success: boolean; message: string; data: User }>> => {
    const response = await api.post<{ success: boolean; message: string; data: User }>("/auth/verify-registration", data);
    return response;
};

export const setupPortal = async (data: Record<string, unknown>) => {
    const response = await api.post("/auth/setup-portal", data);
    return response.data;
};

export default api;
