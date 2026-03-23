import { useState, useEffect } from "react";
import { ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import OTPInput from "./OTPInput";
import { verifyRegistrationOTP, resendVerification } from "@/Service/Auth";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface EmailVerificationModalProps {
  isOpen: boolean;
  email: string;
  employeeDbId?: number;
  redirectToLogin?: boolean;
  onSuccess?: () => void;
}

export default function EmailVerificationModal({ isOpen, email, employeeDbId, redirectToLogin, onSuccess }: EmailVerificationModalProps) {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [verifiedData, setVerifiedData] = useState<{ email: string; employeeId: string; fullName: string } | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
        setError("Please enter a valid 6-digit code.");
        return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
        const response = await verifyRegistrationOTP({ email, otp });
        const user = response.data.data;
        
        setSuccess("Account verified successfully!");
        setVerifiedData({
            email: email,
            employeeId: user?.employeeId || "Pending",
            fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
        });

        if (onSuccess) {
            onSuccess();
        }
    } catch (err: unknown) {
        console.error("Verification error:", err);
        let msg = "Verification failed. Please try again.";
        if (axios.isAxiosError<{ message?: string }>(err)) {
            const responseData = err.response?.data;
            if (responseData && typeof responseData === 'object' && responseData.message) {
                msg = responseData.message;
            }
        }
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  const handleResend = async () => {
      if (resendTimer > 0) return;
      
      try {
          await resendVerification({ email });
          setResendTimer(60);
          setSuccess("Verification code sent to your email.");
          setError("");
      } catch (err: unknown) {
          console.error("Resend error:", err);
          setError("Failed to resend code. Please try again.");
      }
  };

  if (verifiedData) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white rounded-[24px] shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-300">
          <div className="space-y-8 text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center shadow-inner">
              <ShieldCheck className="h-10 w-10 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900">You're all set!</h3>
              <p className="text-sm text-gray-500 font-medium italic">Your account has been successfully verified and activated.</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4 text-left shadow-sm">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee ID</span>
                <span className="text-sm font-bold text-gray-900 font-mono tracking-tighter bg-white px-2 py-0.5 rounded border border-gray-100 shadow-sm">{verifiedData.employeeId}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</span>
                <span className="text-sm font-bold text-gray-900">{verifiedData.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Login Email</span>
                <span className="text-sm font-bold text-gray-900">{verifiedData.email}</span>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              {redirectToLogin ? (
                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl font-black text-sm tracking-tight hover:bg-gray-800 transition shadow-lg shadow-gray-200 flex justify-center items-center gap-3 active:scale-95 group"
                >
                  Go to Login
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ) : employeeDbId ? (
                <button
                  onClick={() => navigate(`/admin-dashboard/employees/profile/${employeeDbId}`)}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-sm tracking-tight hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex justify-center items-center gap-3 active:scale-95 group"
                >
                  View Employee Profile
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl font-black text-sm tracking-tight hover:bg-gray-800 transition shadow-lg shadow-gray-200 flex justify-center items-center gap-3 active:scale-95 group"
                >
                  Go to Login
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {redirectToLogin 
                  ? "Access your Administrator / HR portal"
                  : employeeDbId 
                  ? "Redirection available for Administrator" 
                  : "Admin will grant access to your portal soon"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-[24px] shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-300">
        <div className="space-y-6">
          <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center shadow-inner">
                  <ShieldCheck className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Verify Your Account</h3>
                <p className="text-sm text-gray-500 mt-1">
                    We've sent a 6-digit code to <br/>
                    <span className="font-bold text-gray-900 underline underline-offset-4 decoration-blue-200">{email}</span>
                </p>
              </div>
          </div>

          {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[13px] font-semibold animate-in fade-in slide-in-from-top-2 text-center">
                  {error}
              </div>
          )}

          {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-[13px] font-semibold animate-in fade-in slide-in-from-top-2 text-center">
                  {success}
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 shadow-inner">
                <OTPInput length={6} value={otp} onChange={setOtp} />
              </div>
              
              <button
                  type="submit"
                  disabled={loading || otp.length !== 6 || !!success}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-gray-200 flex justify-center items-center gap-2 active:scale-95 group"
              >
                  {loading ? (
                      <>
                          <Loader2 className="animate-spin h-5 w-5" />
                          Verifying...
                      </>
                  ) : (
                      <>
                          Verify and Complete
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                  )}
              </button>
          </form>

          <div className="text-center pt-2">
              <p className="text-sm text-gray-500 font-medium">
                  Didn't receive the code?{" "}
                  <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendTimer > 0}
                      className="font-bold text-blue-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:underline transition-colors"
                  >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Now"}
                  </button>
              </p>
          </div>
        </div>
      </div>
    </div>
  );
}
