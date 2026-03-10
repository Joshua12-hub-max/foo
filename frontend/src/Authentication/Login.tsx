import { useState, FormEvent, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/Custom/Auth/AuthLayout";
import { useAuthStore, useToastStore, useFormWizardStore } from "@/stores";
import api from "@/api/axios";
import axios from "axios";
import OTPInput from "./OTPInput";
import { User, ApiError } from "@/types";
import { useVerify2FAMutation, useResend2FAMutation } from "@/hooks/useAuthQueries";

interface AuthData {
  requires2FA?: boolean;
  maskedEmail?: string;
  identifier?: string;
  token?: string;
  user?: User;
}

interface AuthPayload {
  success: boolean;
  data: AuthData;
  message?: string;
}

interface SetupPositionsResponse {
  positions: unknown[];
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const resetWizard = useFormWizardStore((state) => state.resetWizard);
  const showToast = useToastStore((state) => state.showToast);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 2FA state
  const [show2FA, setShow2FA] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [otpValue, setOtpValue] = useState("");

  const verify2FAMutation = useVerify2FAMutation();
  const resend2FAMutation = useResend2FAMutation();

  const [showSetupLink, setShowSetupLink] = useState(false);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await api.get<SetupPositionsResponse>("/auth/setup-positions");
        if (res.data.positions && res.data.positions.length > 0) {
          setShowSetupLink(true);
        }
      } catch {
        setShowSetupLink(false);
      }
    };
    checkSetup();
  }, []);

  /**
   * 100% Client-Side Cleanup:
   * Wipes all persistent data before entering setup to prevent data leaks or state conflicts.
   */
  const handleSetupClick = (e: React.MouseEvent) => {
    // Prevent default Link behavior to handle cleanup first
    e.preventDefault();

    // 1. Clear Zustand Stores
    logout(); // Resets authStore
    resetWizard(); // Resets registration/PDS wizard

    // 2. Wipe Browser Storage
    localStorage.clear();
    sessionStorage.clear();

    // 3. Force redirect to setup
    navigate("/setup-portal");
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<AuthPayload>("/auth/login", { 
        identifier, 
        password,
        rememberMe 
      });
      
      const payload = response.data;
      const authData = payload.data;

      if (authData.requires2FA) {
        setMaskedEmail(authData.maskedEmail || "");
        setLoginIdentifier(authData.identifier || identifier);
        setShow2FA(true);
        showToast("Verification code sent to your email", "success");
      } else if (authData.user) {
        const user = authData.user;
        
        // Ensure persistence layer is synced
        localStorage.setItem('isLoggedIn', 'true');
        
        setUser(user);
        showToast("Login successful!", "success");
        
        if (user.profileStatus === 'Initial') {
          navigate("/admin-dashboard/register?mode=finalize-setup&type=old&duties=Standard");
        } else {
          const role = user.role?.toLowerCase();
          if (role === 'administrator' || role === 'human resource') {
            navigate("/admin-dashboard");
          } else {
            navigate("/employee-dashboard");
          }
        }
      }
    } catch (err: unknown) {
      let message = "Invalid credentials";
      if (axios.isAxiosError(err)) {
          message = err.response?.data?.message || message;
      }
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = (user: User) => {
    setUser(user);
    showToast("Login successful!", "success");
    if (!user.employeeId) {
      navigate("/admin-dashboard/register?mode=finalize-setup");
    } else {
      navigate("/admin-dashboard");
    }
  };

  const labelClass = "text-xs font-semibold text-gray-600 mb-1.5 ml-1 block";
  const inputContainerClass = "relative flex items-center bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all overflow-hidden shadow-sm";
  const iconClass = "absolute left-3.5 text-gray-400";
  const inputClass = "w-full bg-transparent pl-11 pr-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 font-medium";
  const buttonClass = "w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-sm hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex justify-center items-center gap-2 active:scale-[0.98]";

  if (show2FA) {
    return (
      <AuthLayout 
        title="Verification Required" 
        subtitle={`Enter the 6-digit code sent to ${maskedEmail}`}
      >
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="bg-blue-50 p-4 rounded-full border border-blue-100">
              <CheckCircle className="text-blue-600 w-8 h-8" />
            </div>
          </div>
          
          <OTPInput 
            length={6}
            value={otpValue}
            onChange={(val) => {
              setOtpValue(val);
              if (val.length === 6) {
                verify2FAMutation.mutate({ identifier: loginIdentifier, otp: val }, {
                  onSuccess: (response) => {
                    const payload = response.data as AuthPayload;
                    const userData = payload.data.user;
                    if (userData) {
                        handle2FASuccess(userData);
                    }
                  },
                  onError: (err: unknown) => {
                    let message = "Invalid verification code";
                    if (axios.isAxiosError(err)) {
                        message = err.response?.data?.message || message;
                    }
                    showToast(message, "error");
                  }
                });
              }
            }}
          />

          <div className="flex flex-col gap-4">
            <button
              onClick={() => verify2FAMutation.mutate({ identifier: loginIdentifier, otp: otpValue }, {
                onSuccess: (response) => {
                  const payload = response.data as AuthPayload;
                  const userData = payload.data.user;
                  if (userData) {
                      handle2FASuccess(userData);
                  }
                }
              })}
              disabled={verify2FAMutation.isPending || otpValue.length !== 6}
              className={buttonClass}
            >
              {verify2FAMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : "Verify Identity"}
            </button>

            <button
              onClick={() => resend2FAMutation.mutate({ identifier: loginIdentifier }, {
                onSuccess: () => showToast("New code sent!", "success")
              })}
              disabled={resend2FAMutation.isPending}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
            >
              {resend2FAMutation.isPending ? "Sending code..." : "Resend verification code"}
            </button>

            <button
              onClick={() => setShow2FA(false)}
              className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors pt-2"
            >
              <ArrowLeft size={14} />
              Back to login
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Employee Portal" 
      subtitle="Sign in to access your HR dashboard"
    >
      <div className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-medium flex items-center gap-2 border border-red-100">
            <span className="w-1 h-1 bg-red-600 rounded-full shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className={labelClass}>Email or Employee ID</label>
            <div className={inputContainerClass}>
              <Mail className={iconClass} size={16} />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={inputClass}
                placeholder="name@agency.gov.ph"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label className={labelClass}>Password</label>
              <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700 mb-1.5 mr-1">
                Forgot?
              </Link>
            </div>
            <div className={inputContainerClass}>
              <Lock className={iconClass} size={16} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center py-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-4 h-4 border-2 border-gray-300 rounded peer-checked:bg-slate-900 peer-checked:border-slate-900 transition-all" />
                <CheckCircle className="absolute inset-0 text-white opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-75 transition-all" size={16} />
              </div>
              <span className="text-xs font-medium text-gray-500 group-hover:text-gray-900 transition-colors">Keep me signed in</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={buttonClass}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          {showSetupLink && (
            <Link 
              to="/setup-portal" 
              onClick={handleSetupClick}
              className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-wider"
            >
              Initialize Portal
            </Link>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
