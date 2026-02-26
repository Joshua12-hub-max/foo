import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  login, 
  googleLogin, 
  logout, 
  verifyTwoFactorOTP, 
  resendTwoFactorOTP,
  register,
  forgotPassword,
  resetPassword
} from '@/Service/Auth';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { LoginInput, RegisterInput, VerifyOTPInput, ResendOTPInput } from '@/schemas/authSchema';

export const useLoginMutation = () => {
    const setUser = useAuthStore((state) => state.setUser);
    
    return useMutation({
        mutationFn: (data: LoginInput) => login(data),
        onSuccess: (response) => {
            // Check for 2FA in response (handled in component usually, but we can return data)
            // If success without 2FA, update store
            if (!response.data.requires2FA) {
                const userData = response.data.data;
                setUser(userData);
                localStorage.setItem('isLoggedIn', 'true');
            }
        },
    });
};

export const useGoogleLoginMutation = () => {
    const setUser = useAuthStore((state) => state.setUser);

    return useMutation({
        mutationFn: (credential: string) => googleLogin(credential),
        onSuccess: (response) => {
            if (!response.data.requires2FA) {
                const userData = response.data.data;
                setUser(userData);
                localStorage.setItem('isLoggedIn', 'true');
            }
        },
    });
};

export const useLogoutMutation = () => {
    const logoutStore = useAuthStore((state) => state.logout);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: logout,
        onSuccess: () => {
            logoutStore(); // Clear store state
            localStorage.removeItem('isLoggedIn');
            queryClient.clear(); // Clear all queries
            navigate('/login');
        },
    });
};

export const useVerify2FAMutation = () => {
    const setUser = useAuthStore((state) => state.setUser);

    return useMutation({
        mutationFn: (data: VerifyOTPInput) => verifyTwoFactorOTP(data),
        onSuccess: (response) => {
             const userData = response.data; 
             // Note: API returns user data in 'data' or directly? 
             // authController verifyTwoFactorOTP returns { success: true, ..., data: { ... } }
             // Check Service/Auth.ts implementation of verifyTwoFactorOTP
             // It returns response.data directly. So response.data is the payload.
             // Payload has .data property with user info.
             if(userData.data) {
                setUser(userData.data);
                localStorage.setItem('isLoggedIn', 'true');
             } else {
                 // Fallback if structure differs
                 setUser(userData); 
             }
        }
    });
};

export const useResend2FAMutation = () => {
    return useMutation({
        mutationFn: (data: ResendOTPInput) => resendTwoFactorOTP(data)
    });
};

export const useRegisterMutation = () => {
    return useMutation({
        mutationFn: (data: RegisterInput | FormData) => register(data)
    });
};
