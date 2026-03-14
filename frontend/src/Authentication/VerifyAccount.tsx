import { useState, useEffect, FormEvent } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import AuthLayout from "@components/Custom/Auth/AuthLayout";
import OTPInput from "./OTPInput";
import { verifyRegistrationOTP, resendVerification } from "@/Service/Auth";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";

interface LocationState {
  email?: string;
}

export default function VerifyAccount() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [verifiedData, setVerifiedData] = useState<{ email: string; employeeId: string; fullName: string } | null>(null);

  useEffect(() => {
    // Get email from navigation state or URL param
    const state = location.state as LocationState;
    const stateEmail = state?.email;
    const searchParams = new URLSearchParams(location.search);
    const urlEmail = searchParams.get('email');

    if (stateEmail) setEmail(stateEmail);
    else if (urlEmail) setEmail(urlEmail!);
    else {
        // If no email, redirect back to register
        navigate("/register", { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSubmit = async (e: FormEvent) => {
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

    } catch (err: unknown) {
        console.error("Verification error:", err);
        const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
        setError(msg || "Verification failed. Please try again.");
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
      } catch (err) {
          setError("Failed to resend code. Please try again.");
      }
  };

  if (verifiedData) {
    return (
      <AuthLayout title="Registration Complete">
        <div className="space-y-8 text-center animate-in zoom-in duration-300">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <ShieldCheck className="h-10 w-10 text-green-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-black text-gray-900">You're all set!</h3>
            <p className="text-sm text-gray-500 font-medium">Your account has been successfully verified and activated.</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee ID</span>
              <span className="text-sm font-bold text-gray-900 font-mono tracking-tighter">{verifiedData.employeeId}</span>
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
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-sm tracking-tight hover:bg-slate-800 transition shadow-lg shadow-slate-200 flex justify-center items-center gap-3 active:scale-95"
            >
              Go to Login
              <ArrowRight size={18} />
            </button>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Admin will grant access to your portal soon
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verify Your Account">
      <div className="space-y-6">
        <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500">
                We've sent a 6-digit code to <br/>
                <span className="font-medium text-gray-900">{email}</span>
            </p>
        </div>

        {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in fade-in slide-in-from-top-2 text-center">
                {error}
            </div>
        )}

        {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm animate-in fade-in slide-in-from-top-2 text-center">
                {success}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            <OTPInput length={6} value={otp} onChange={setOtp} />
            
            <button
                type="submit"
                disabled={loading || otp.length !== 6 || !!success}
                className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex justify-center items-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        Verifying...
                    </>
                ) : (
                    <>
                        Verify Account
                        <ArrowRight size={16} />
                    </>
                )}
            </button>
        </form>

        <div className="text-center">
            <p className="text-sm text-gray-500">
                Didn't receive the code?{" "}
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendTimer > 0}
                    className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
                >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
                </button>
            </p>
        </div>

        <div className="text-center mt-4">
             <Link to="/register" className="text-sm text-gray-500 hover:text-gray-900">
                Back to Registration
             </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
