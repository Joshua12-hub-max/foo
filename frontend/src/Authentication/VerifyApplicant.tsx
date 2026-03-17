import { useState, useEffect, FormEvent } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Loader2, ArrowRight, UserCheck } from "lucide-react";
import AuthLayout from "@components/Custom/Auth/AuthLayout";
import OTPInput from "./OTPInput";
import { verifyApplicantOTP } from "@/Service/Recruitment";
import axios from "axios";

interface LocationState {
  email?: string;
  applicantId?: number;
}

export default function VerifyApplicant() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [applicantId, setApplicantId] = useState<number | null>(null);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const state = location.state as LocationState;
    const searchParams = new URLSearchParams(location.search);
    
    const targetEmail = state?.email || searchParams.get('email');
    const targetId = state?.applicantId || Number(searchParams.get('id'));

    if (targetEmail) setEmail(targetEmail);
    if (targetId) setApplicantId(targetId);

    if (!targetEmail || !targetId) {
        navigate("/careers", { replace: true });
    }
  }, [location, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!applicantId) return;
    if (otp.length !== 6) {
        setError("Please enter the 6-digit code sent to your email.");
        return;
    }

    setLoading(true);
    setError("");

    try {
        await verifyApplicantOTP({ applicantId, otp });
        setSuccess("Email verified successfully!");
        setVerified(true);
    } catch (err: unknown) {
        console.error("Verification error:", err);
        const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
        setError(msg || "Verification failed. Please check your code and try again.");
    } finally {
        setLoading(false);
    }
  };

  if (verified) {
    return (
      <AuthLayout title="Application Verified">
        <div className="space-y-8 text-center animate-in zoom-in duration-300">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <UserCheck className="h-10 w-10 text-green-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-black text-gray-900">Verification Complete!</h3>
            <p className="text-sm text-gray-500 font-medium">
                Thank you for verifying your email. Your job application has been successfully submitted and is now under review by our HR team.
            </p>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 space-y-4 text-left">
            <p className="text-xs text-blue-700 font-medium leading-relaxed">
                <strong>Next Steps:</strong> We will notify you via email regarding the status of your application. Please keep an eye on your inbox for interview invitations or further instructions.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={() => navigate("/careers")}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-sm tracking-tight hover:bg-slate-800 transition shadow-lg shadow-slate-200 flex justify-center items-center gap-3 active:scale-95"
            >
              Back to Careers
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verify Your Application">
      <div className="space-y-6">
        <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500">
                To complete your application, please enter the 6-digit verification code we sent to: <br/>
                <span className="font-bold text-gray-900">{email}</span>
            </p>
        </div>

        {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-semibold animate-in fade-in slide-in-from-top-2 text-center">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            <OTPInput length={6} value={otp} onChange={setOtp} />
            
            <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-sm tracking-tight hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200 flex justify-center items-center gap-2 active:scale-95"
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        Verifying...
                    </>
                ) : (
                    <>
                        Verify & Submit Application
                        <ArrowRight size={18} />
                    </>
                )}
            </button>
        </form>

        <div className="text-center pt-4">
             <Link to="/careers" className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition">
                Cancel Application
             </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
