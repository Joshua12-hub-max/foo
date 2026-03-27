import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import AuthLayout from "@components/Custom/Auth/AuthLayout";
import { forgotPassword, resetPassword } from "@/Service/Auth";
import OTPInput from "./OTPInput";
import axios from "axios";
import SEO from "@/components/Global/SEO";
import { useToastStore } from "@/stores";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 2 State
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRequestOTP = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError("");
    setIsSubmitting(true);

    try {
      await forgotPassword({ email });
      setStep("verify");
      showToast("Verification code sent to your email", "success");
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setError(msg || "Failed to send code. Please check your email.");
      showToast(msg || "Failed to send code", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await resetPassword({
        identifier: email,
        otp,
        newPassword,
        confirmNewPassword: confirmPassword
      });
      setIsSuccess(true);
      showToast("Password reset successfully!", "success");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setError(msg || "Failed to reset password. Code may be invalid or expired.");
      showToast(msg || "Reset failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelClass = "text-xs font-semibold text-gray-600 mb-1.5 ml-1 block";
  const inputContainerClass = "relative flex items-center bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all overflow-hidden shadow-sm";
  const iconClass = "absolute left-3.5 text-gray-400";
  const inputClass = "w-full bg-transparent pl-11 pr-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 font-medium";

  return (
    <AuthLayout title={isSuccess ? "Success" : step === "request" ? "Reset Password" : "Enter Code"}>
      <SEO 
        title="Forgot Password"
        description="Reset your CHRMO account password using a secure verification code."
      />
      
      <div className="space-y-6">
        {isSuccess ? (
          <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-50">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Password Updated!</h3>
            <p className="text-gray-500 text-sm">
              Your password has been changed successfully. Redirecting to login...
            </p>
          </div>
        ) : step === "request" ? (
          <>
            <div className="text-center">
              <p className="text-gray-500 text-sm">
                Enter your email address and we'll send you a 6-digit code to reset your password.
              </p>
            </div>

            <form onSubmit={handleRequestOTP} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-medium flex gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className={labelClass}>Email Address</label>
                <div className={inputContainerClass}>
                  <Mail className={iconClass} size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="name@agency.gov.ph"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  "Send Code"
                )}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-xs font-bold text-gray-500 hover:text-slate-900 flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to Sign In
                </Link>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck size={12} />
                Identity Verification
              </div>
              <p className="text-gray-500 text-sm">
                Enter the 6-digit code sent to <br/><span className="font-bold text-gray-900">{email}</span>
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-medium flex gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex justify-center pb-2">
                <OTPInput 
                  length={6}
                  value={otp}
                  onChange={setOtp}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>New Password</label>
                  <div className={inputContainerClass}>
                    <Lock className={iconClass} size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={inputClass}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <div className={inputContainerClass}>
                    <Lock className={iconClass} size={16} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputClass}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.length !== 6}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  "Reset Password"
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep("request")}
                className="w-full text-xs font-bold text-gray-500 hover:text-slate-900 flex items-center justify-center gap-2 transition-colors py-1"
              >
                Change Email Address
              </button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
