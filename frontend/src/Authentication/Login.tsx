// Required imports from React and other libraries.
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IdCardLanyard, FileLock, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import AuthLayout from "@components/Custom/Auth/AuthLayout";
import { useAuth } from "@hooks/useAuth";
import { 
  useLoginMutation, 
  useGoogleLoginMutation, 
  useVerify2FAMutation, 
  useResend2FAMutation 
} from "@/hooks/useAuthQueries";
import OTPInput from "./OTPInput";
import { GoogleLogin } from '@react-oauth/google';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginInput, VerifyOTPInput, ResendOTPInput } from "@/schemas/authSchema";
import { ApiResponse, User } from "@/types";
import { AxiosResponse } from "axios";
import { CredentialResponse } from "@react-oauth/google";

// Main component for the login page.
export default function Login() {
  // Navigation and Auth State
  const navigate = useNavigate();
  const { setUser } = useAuth(); // Only need non-async actions from store if any, or setUser for manual updates? 
                                 // Actually mutation handles setUser, but verify2FA might need it if we handle it manually.
                                 // useAuthQueries handles setUser on success.

  // React Query Mutations
  const loginMutation = useLoginMutation();
  const googleLoginMutation = useGoogleLoginMutation();
  const verify2FAMutation = useVerify2FAMutation();
  const resend2FAMutation = useResend2FAMutation();

  // Local State for UI
  const [role, setRole] = useState("");
  
  // 2FA State
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState(""); 
  const [maskedEmail, setMaskedEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [authIdentifier, setAuthIdentifier] = useState(""); 

  // Combined Loading/Error State derived from Mutations
  const loading = loginMutation.isPending || googleLoginMutation.isPending;
  const error = loginMutation.error?.message || googleLoginMutation.error?.message || "";
  
  // 2FA Loading/Error
  const otpLoading = verify2FAMutation.isPending;
  const otpError = verify2FAMutation.error?.message || "";

  // React Hook Form for Main Login
  const { 
    register, 
    handleSubmit, 
    setValue, 
    formState: { errors } 
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      identifier: "",
      password: ""
    }
  });

  // 'useEffect' runs when the component mounts. It checks if the user is already logged in.
  useEffect(() => {
    // Automatically populates the employee ID from the last registration.
    const lastUser = localStorage.getItem("lastRegisteredUser");
    if (lastUser) {
      try {
        const user = JSON.parse(lastUser);
        setValue("identifier", user.email || "");
        setRole(user.role);
        localStorage.removeItem("lastRegisteredUser");
      } catch (error) {
        console.error("Error parsing last user:", error);
        localStorage.removeItem("lastRegisteredUser");
      }
    }
  }, [setValue]);

  // Timer for Resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handles form submission via RHF
  const onSubmit = (data: LoginInput) => {
    console.log("Submitting Login:", { identifier: data.identifier, password: data.password });
    loginMutation.mutate(
      { identifier: data.identifier.trim(), password: data.password },
      {
        onSuccess: (response: AxiosResponse<ApiResponse<{ requires2FA?: boolean; maskedEmail?: string; identifier?: string } | User>>) => {
             const payload = response.data;
             const authData = payload.data as { requires2FA?: boolean; maskedEmail?: string; identifier?: string };

             if (authData?.requires2FA) {
                setMaskedEmail(authData.maskedEmail || "");
                setAuthIdentifier(authData.identifier || "");
                setShowOTP(true);
             } else if (payload.data) {
                handleLoginSuccess(payload.data as User);
             }
        },
        onError: (err: Error) => {
            console.error("Login failed", err);
            const axiosErr = err as { response?: { data?: { code?: string } } };
            const response = axiosErr.response?.data;
            if (response?.code === 'BIOMETRIC_NOT_ENROLLED') {
                console.warn("User blocked: Biometric registration required.");
                // Optionally redirect to an info page or show a specific modal
            }
        }
      }
    );
  };

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
     if (!credentialResponse.credential) return;
     googleLoginMutation.mutate(credentialResponse.credential, {
        onSuccess: (response: AxiosResponse<ApiResponse<{ requires2FA?: boolean; maskedEmail?: string; identifier?: string } | User>>) => {
            const payload = response.data;
            const authData = payload.data as { requires2FA?: boolean; maskedEmail?: string; identifier?: string };

             if (authData?.requires2FA) {
                setMaskedEmail(authData.maskedEmail || "");
                setAuthIdentifier(authData.identifier || "");
                setShowOTP(true);
             } else if (payload.data) {
                handleLoginSuccess(payload.data as User);
             }
        }
     });
  };

  const handleOTPSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(otp.length !== 6) return; // Basic check, real validation in mutation if needed or schema
      
      verify2FAMutation.mutate(
        { identifier: authIdentifier, otp },
        {
            onSuccess: (response: ApiResponse<User>) => {
                 handleLoginSuccess(response.data);
            }
        }
      );
  };

  const handleResendOTP = () => {
      if (resendTimer > 0) return;
      resend2FAMutation.mutate(
          { identifier: authIdentifier },
          {
              onSuccess: () => {
                  setResendTimer(60);
              }
              // Error handled by mutation state if we want to show it
          }
      );
  };

  const handleLoginSuccess = (user: User) => {
      if (!user || !user.role) {
         console.error("Invalid user data", user);
         return;
      }

      const roleName = user.role.toLowerCase();
      // If they are Admin or HR, default to Admin dashboard UNLESS they are specifically trying to enter the employee dashboard
      if (roleName === "human resource" || roleName === "admin") {
        const isTargetingEmployeeDashboard = window.location.pathname.startsWith('/employee-dashboard');
        if (isTargetingEmployeeDashboard) {
           navigate("/employee-dashboard", { replace: true });
        } else {
           navigate("/admin-dashboard", { replace: true });
        }
      } else if (roleName === "employee" || roleName === "department head") {
        navigate("/employee-dashboard", { replace: true });
      } else {
        console.error("Unknown role", roleName);
      }
  };

  // Helper to extract error message from error object (Axios error usually)
  const getErrorMessage = (error: unknown) => {
      if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: { message?: string } } };
          return axiosError.response?.data?.message || "An error occurred";
      }
      return (error as Error)?.message || "An error occurred";
  };

  const displayedError = error ? getErrorMessage(loginMutation.error || googleLoginMutation.error) : "";
  const displayedOtpError = otpError ? getErrorMessage(verify2FAMutation.error) : "";

  // Renders the login form UI.
  return (
    <AuthLayout title={showOTP ? "Two-Factor Authentication" : "Welcome Back!"}>
      {/* Displays error message if any */}
      {(displayedError || displayedOtpError) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
          {displayedError || displayedOtpError}
        </div>
      )}

      {!showOTP ? (
      <>
        {/* Displays user role if available */}
        {role && (
            <div className="flex items-center justify-center gap-2 mb-5 py-2 px-4 rounded-[10px] border-[2px] border-gray-200 text-sm font-medium text-gray-900 shadow-md">
            <span className="opacity-80">Logging in as:</span>
            <span
                className={`capitalize px-3 py-[3px] rounded-md shadow-md font-semibold text-gray-900 ${
                role.toLowerCase() === "admin" || role.toLowerCase() === "human resource" ? "bg-gray-200" : "bg-gray-100"
                }`}
            >
                {role}
            </span>
            </div>
        )}

        {/* The login form itself */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
            <label className="text-sm text-gray-700 mb-1 block">Email or Employee ID</label>
            <div className="relative">
                <IdCardLanyard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={17} />
                <input
                type="text"
                autoComplete="username"
                {...register("identifier")}
                className={`w-full pl-10 pr-3 py-2 border-[2px] rounded-[15px] shadow-md bg-white focus:ring focus:ring-gray-100 focus:outline-none ${errors.identifier ? 'border-red-500' : 'border-gray-300'}`}
                placeholder=""
                disabled={loading}
                />
            </div>
            {errors.identifier && <p className="text-red-500 text-xs mt-1 ml-1">{errors.identifier.message}</p>}
            </div>

            <div>
            <label className="text-sm text-gray-700 mb-1 block">Password</label>
            <div className="relative">
                <FileLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={17} />
                <input
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className={`w-full pl-10 pr-3 py-2 border-[2px] rounded-[15px] shadow-md bg-white focus:ring focus:ring-gray-100 focus:outline-none ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                placeholder=""
                disabled={loading}
                />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
             <div className="mt-1 flex justify-end">
                <Link to="/forgot-password" className="text-xs font-medium text-gray-500 hover:text-gray-900">
                    Forgot Password?
                </Link>
             </div>
            </div>

            {/* Submit button */}
            <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-2 rounded-[10px] font-bold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex justify-center items-center"
            >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Login"}
            </button>
        </form>

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.error("Google Login Failed")}
                theme="outline"
                shape="pill"
                size="large"
                width="350"
                text="signin_with"
            />
        </div>

        {/* Link for registration */}
        <p className="text-center mt-5 text-gray-700 text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-black hover:underline">
            Register here
            </Link>
        </p>

        <p className="text-center mt-2 text-gray-500 text-xs">
            Looking for a job?{" "}
            <Link to="/careers" className="font-semibold text-blue-600 hover:underline">
            View Job Openings
            </Link>
        </p>

      </>
      ) : (
        /* 2FA Form */
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Verify it's you</h3>
                <p className="text-sm text-gray-500">
                    We've sent a code to <span className="font-medium text-gray-900">{maskedEmail}</span>
                </p>
            </div>

            <form onSubmit={handleOTPSubmit} className="space-y-6">
                 <OTPInput length={6} value={otp} onChange={setOtp} />
                 
                 <div className="flex flex-col gap-3">
                    <button
                        type="submit"
                        disabled={otpLoading || otp.length !== 6}
                        className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex justify-center items-center gap-2"
                    >
                        {otpLoading ? (
                            <>
                                <Loader2 className="animate-spin h-4 w-4" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                Verify & Login
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>

                     <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={resendTimer > 0}
                        className="text-sm text-slate-600 hover:text-slate-900 font-medium disabled:opacity-50"
                    >
                        {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
                    </button>
                 </div>
            </form>

             <button 
                onClick={() => setShowOTP(false)}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-900 mt-4"
             >
                Back to Login
             </button>
        </div>
      )}
    </AuthLayout>
  );
}
