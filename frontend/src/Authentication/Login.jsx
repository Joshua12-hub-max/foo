// Required imports from React and other libraries.
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IdCardLanyard, FileLock, ShieldCheck, Mail, ArrowRight, Loader2 } from "lucide-react";
import AuthLayout from "@components/Custom/Auth/AuthLayout";
import { useAuth } from "@hooks/useAuth";
import { verifyTwoFactorOTP, resendTwoFactorOTP } from "@/Service/Auth";
import OTPInput from "./OTPInput";
import { GoogleLogin } from '@react-oauth/google';

// Main component for the login page.
export default function Login() {
  // 'useState' manages form state, errors, and loading status.
  const [form, setForm] = useState({ employeeId: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  
  // 2FA State
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const navigate = useNavigate(); // Used to redirect users.
  const { login, googleLogin, setUser } = useAuth();

  // 'useEffect' runs when the component mounts. It checks if the user is already logged in.
  useEffect(() => {
    // Automatically populates the employee ID from the last registration.
    const lastUser = localStorage.getItem("lastRegisteredUser");
    if (lastUser) {
      try {
        const user = JSON.parse(lastUser);
        setForm((prev) => ({ ...prev, employeeId: user.email || "" }));
        setRole(user.role);
        // Clears after use to avoid confusion.
        localStorage.removeItem("lastRegisteredUser");
      } catch (error) {
        console.error("Error parsing last user:", error);
        localStorage.removeItem("lastRegisteredUser");
      }
    }
  }, []);

  // Timer for Resend OTP
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handles changes in input fields.
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // Handles form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validates if inputs are filled.
    if (!form.employeeId.trim() || !form.password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await login({
        identifier: form.employeeId.trim(),
        password: form.password
      });

      // CHECK FOR 2FA CHALLENGE
      if (response && response.requires2FA) {
          setMaskedEmail(response.maskedEmail);
          setForm(prev => ({ ...prev, employeeId: response.identifier })); // Store actual identifier for OTP
          setShowOTP(true);
          setLoading(false);
          return;
      }

      handleLoginSuccess(response);

    } catch (err) {
      console.error("Login error:", err);
      handleError(err);
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
        const response = await googleLogin(credentialResponse.credential);
        
        // CHECK FOR 2FA CHALLENGE (Strict Google Login)
        if (response && response.requires2FA) {
            setMaskedEmail(response.maskedEmail);
            setForm(prev => ({ ...prev, employeeId: response.identifier })); // Store actual identifier for OTP
            setShowOTP(true);
            setLoading(false);
            return;
        }

        handleLoginSuccess(response);
    } catch (err) {
        console.error("Google Login Error:", err);
        handleError(err);
        setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
      e.preventDefault();
      if(otp.length !== 6) {
          setError("Please enter a valid 6-digit OTP.");
          return;
      }
      
      setOtpLoading(true);
      setError("");

      try {
          // Verify OTP and get user data from response
          const response = await verifyTwoFactorOTP(form.employeeId.trim(), otp);
          
          // Update auth context and redirect based on role
          setUser(response.data);
          localStorage.setItem('isLoggedIn', 'true');
          handleLoginSuccess(response.data); 

      } catch (err) {
          console.error("OTP Error:", err);
          setError(err.response?.data?.message || "Invalid OTP. Please try again.");
          setOtpLoading(false);
      }
  };

  const handleResendOTP = async () => {
      if (resendTimer > 0) return;
      
      setError("");
      try {
          await resendTwoFactorOTP(form.employeeId.trim());
          setResendTimer(60);
      } catch (err) {
          setError("Failed to resend OTP.");
      }
  };

  const handleLoginSuccess = (user) => {
      if (!user || !user.role) {
        throw new Error("Invalid user data received");
      }

      // Redirects based on user role.
      const role = user.role.toLowerCase();
      if (role === "hr" || role === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else if (role === "employee") {
        navigate("/employee-dashboard", { replace: true });
      } else {
        throw new Error("Invalid user role");
      }
  };

  const handleError = (err) => {
      // Handles different error scenarios.
      if (err.response) {
        // Server responded with an error.
        setError(err.response.data?.message || "Login failed. Please try again.");
      } else if (err.request) {
        // Request was made but no response received.
        setError("Unable to connect to server. Please check your connection.");
      } else {
        // Other errors.
        setError(err.message || "An unexpected error occurred.");
      }
  };

  // Renders the login form UI.
  return (
    <AuthLayout title={showOTP ? "Two-Factor Authentication" : "Welcome Back!"}>
      {/* Displays error message if any */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
          {error}
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
                role.toLowerCase() === "admin" || role.toLowerCase() === "hr" ? "bg-gray-200" : "bg-gray-100"
                }`}
            >
                {role}
            </span>
            </div>
        )}

        {/* The login form itself */}
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
            <label className="text-sm text-gray-700 mb-1 block">Employee ID or Email</label>
            <div className="relative">
                <IdCardLanyard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={17} />
                <input
                type="text"
                name="employeeId"
                value={form.employeeId}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border-[2px] border-gray-300 rounded-[15px] shadow-md bg-white focus:ring focus:ring-gray-100 focus:outline-none"
                placeholder="Enter your ID or Email"
                disabled={loading}
                required
                />
            </div>
            </div>

            <div>
            <label className="text-sm text-gray-700 mb-1 block">Password</label>
            <div className="relative">
                <FileLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={17} />
                <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border-[2px] border-gray-300 rounded-[15px] shadow-md bg-white focus:ring focus:ring-gray-100 focus:outline-none"
                placeholder="Enter your password"
                disabled={loading}
                required
                />
            </div>
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
                onError={() => handleError({ message: "Google Sign-In failed" })}
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