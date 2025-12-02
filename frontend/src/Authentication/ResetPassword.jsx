import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import AuthLayout from "../components/Custom/Auth/AuthLayout";
import { resetPassword } from "../Service/Auth";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
        setError("Please fill in all fields.");
        return;
    }
    if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await resetPassword(token, password);
      setIsSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Link may be expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
        <AuthLayout title="Invalid Link">
            <div className="text-center space-y-4">
                <p className="text-red-600">This password reset link is invalid or missing a token.</p>
                <Link to="/forgot-password" className="text-blue-600 hover:underline">Request a new link</Link>
            </div>
        </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set New Password">
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-500 mt-2">
            Please enter your new password below.
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Password Reset Successful!</h3>
            <p className="text-gray-500 text-sm">
              You can now log in with your new password. Redirecting...
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Confirm Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
