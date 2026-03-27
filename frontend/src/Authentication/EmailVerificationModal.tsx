import { useState, useEffect } from "react";
import { ShieldCheck, Loader2, ArrowRight, X } from "lucide-react";
import OTPInput from "./OTPInput";
import { verifyRegistrationOTP, resendVerification } from "@/Service/Auth";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/meycauayan-logo.png";

interface EmailVerificationModalProps {
  isOpen: boolean;
  email: string;
  employeeDbId?: number;
  redirectToLogin?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export default function EmailVerificationModal({ 
  isOpen, 
  email, 
  employeeDbId, 
  redirectToLogin, 
  onSuccess,
  onClose,
  showCloseButton
}: EmailVerificationModalProps) {
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

  // Removed early return to prevent hook order violation. All logic moved into conditional rendering below.

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
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

  useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] w-full max-w-md overflow-hidden border border-gray-100 flex flex-col transition-all duration-300"
          >
            {/* Standard Header */}
            <div className="flex flex-col items-center px-8 pt-8 pb-3 bg-white">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shadow-sm">
                    <img 
                      src="/Logo.Municipal of Meycuayan.png" 
                      alt="Logo" 
                      className="w-7 h-7 object-contain" 
                    />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                    {verifiedData ? "Verification Success" : "Account Verification"}
                  </h2>
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-900 transition-all p-1.5 rounded-full hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="p-8 overflow-y-auto max-h-[80vh]">
              {verifiedData ? (
                <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                  <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12 }}
                    >
                      <ShieldCheck className="w-10 h-10 text-green-600" />
                    </motion.div>
                  </div>
                  
                  <div className="text-center space-y-1.5">
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">You're all set!</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                      Your account has been successfully verified and activated.
                    </p>
                  </div>

                  <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 space-y-3 shadow-inner">
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
                </div>
              ) : (
                <div className="space-y-6 py-2">
                  <div className="text-center space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500 font-medium max-w-[280px] mx-auto leading-relaxed">
                            A 6-digit verification code was sent to <br/>
                            <span className="font-bold text-gray-900 px-1 bg-green-50 rounded break-all">{email}</span>
                        </p>
                      </div>
                  </div>

                  <div className="bg-white p-2">
                     <OTPInput length={6} value={otp} onChange={setOtp} />
                  </div>

                  {(error || success) && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl text-sm font-bold text-center border ${
                            error ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'
                        }`}
                      >
                          {error || success}
                      </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Shaded Footer */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 space-y-4">
              {verifiedData ? (
                <div className="space-y-4">
                  {redirectToLogin ? (
                    <button
                      onClick={() => navigate("/login")}
                      className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-sm tracking-tight hover:bg-slate-800 transition shadow-lg shadow-slate-200 flex justify-center items-center gap-3 active:scale-95 group"
                    >
                      Go to Login
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : employeeDbId ? (
                    <button
                      onClick={() => navigate(`/admin-dashboard/employees/profile/${employeeDbId}`)}
                      className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-sm tracking-tight hover:bg-black transition shadow-lg shadow-slate-200 flex justify-center items-center gap-3 active:scale-95 group"
                    >
                      View Employee Profile
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate("/login")}
                      className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-sm tracking-tight hover:bg-slate-800 transition shadow-lg shadow-slate-200 flex justify-center items-center gap-3 active:scale-95 group"
                    >
                      Go to Login
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                  
                  {!redirectToLogin && (
                    <button
                      onClick={() => navigate("/admin-dashboard")}
                      className="w-full bg-white text-gray-700 py-3 rounded-xl font-bold text-xs border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
                    >
                      Return to Dashboard
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                      onClick={() => handleSubmit()}
                      disabled={loading || otp.length !== 6 || !!success}
                      className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm tracking-tight hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-200 flex justify-center items-center gap-3 active:scale-95 group"
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
                  
                  <div className="text-center pt-2">
                      <p className="text-sm text-gray-500 font-medium">
                          Didn't receive the code?{" "}
                          <button
                              type="button"
                              onClick={handleResend}
                              disabled={resendTimer > 0}
                              className="font-extrabold text-blue-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:underline transition-colors"
                          >
                              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Now"}
                          </button>
                      </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
