import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, AlertCircle, Loader2, IdCard, CheckCircle2, ShieldCheck, UserCog } from "lucide-react";
import AuthLayout from "@components/Custom/Auth/AuthLayout";
import { verifyEnrollment } from "@/Service/Auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/zodResolver";
import { RegisterSchema, RegisterInput } from "@/schemas/authSchema";
import { useRegisterMutation } from "@/hooks/useAuthQueries";
import axios from "axios";

interface EnrollmentData {
  bioEmployeeId: number;
  systemEmployeeId: string;
  fullName: string;
  department: string | null;
  enrolledAt: string;
  alreadyRegistered: boolean;
}

export default function Register() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState("");
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'idle' | 'checking' | 'enrolled' | 'not_found' | 'already_registered' | 'error'>('idle');
  const [enrollmentError, setEnrollmentError] = useState("");

  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors } 
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      employee_id: "",
      email: "",
      password: "",
      role: "employee" as const,
    }
  });

  const employeeIdValue = watch("employee_id");

  // Register Mutation
  const registerMutation = useRegisterMutation();

  // Verify biometric enrollment
  const checkEnrollment = useCallback(async () => {
    const id = employeeIdValue?.trim();
    if (!id) return;

    setEnrollmentStatus('checking');
    setEnrollmentError("");
    setEnrollmentData(null);

    try {
      const response = await verifyEnrollment(id);
      
      if (response.success && response.data) {
        if (response.data.alreadyRegistered) {
          setEnrollmentStatus('already_registered');
          setEnrollmentError("This Employee ID is already registered in the system.");
          setEnrollmentData(response.data);
        } else {
          setEnrollmentStatus('enrolled');
          setEnrollmentData(response.data);
        }
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setEnrollmentStatus('not_found');
        setEnrollmentError("Employee ID not found in biometric enrollment. Please contact HR to enroll first.");
      } else {
        setEnrollmentStatus('error');
        setEnrollmentError("Failed to verify enrollment. Please try again.");
      }
    }
  }, [employeeIdValue]);

  const onSubmit = (data: RegisterInput) => {
    if (enrollmentStatus !== 'enrolled') {
      setEnrollmentError("Please verify your Employee ID first.");
      return;
    }

    setSuccessMessage("");
    registerMutation.mutate(
      { ...data },
      {
        onSuccess: (response: { data: { message?: string } }) => {
           setSuccessMessage(response.data.message || "Registration successful! Please check your email.");
      
           localStorage.setItem("lastRegisteredUser", JSON.stringify({ email: data.email }));
      
           setTimeout(() => {
              navigate("/verify-account", { state: { email: data.email } });
           }, 1500);
        },
        onError: (error: unknown) => {
           console.error("Registration error:", error);
        }
      }
    );
  };

  return (
    <AuthLayout title="Create Account">
      <div className="space-y-4">
        <div className="text-center">
            <p className="text-gray-500 mt-1 text-sm">Enter your Biometric Employee ID to get started</p>
        </div>

        {registerMutation.isError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} />
            <span>{(registerMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Registration failed. Please try again."}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Employee ID with Verify Button */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-0.5 block">Employee ID</label>
            <div className="flex gap-2">
              <div className="relative group flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IdCard className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  {...register("employee_id")}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm ${errors.employee_id ? 'border-red-500' : enrollmentStatus === 'enrolled' ? 'border-green-500' : 'border-gray-300'}`}
                  placeholder="e.g. 1, 001, or EMP-001"
                  disabled={enrollmentStatus === 'enrolled'}
                />
              </div>
              <button
                type="button"
                onClick={checkEnrollment}
                disabled={enrollmentStatus === 'checking' || !employeeIdValue?.trim() || enrollmentStatus === 'enrolled'}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all whitespace-nowrap"
              >
                {enrollmentStatus === 'checking' ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : enrollmentStatus === 'enrolled' ? (
                  <CheckCircle2 className="h-4 w-4 text-white" />
                ) : (
                  "Verify"
                )}
              </button>
            </div>
            {errors.employee_id && <p className="text-red-500 text-xs mt-1 ml-1">{errors.employee_id.message}</p>}
            
            {/* Enrollment Error */}
            {(enrollmentStatus === 'not_found' || enrollmentStatus === 'error' || enrollmentStatus === 'already_registered') && (
              <div className="flex items-center gap-2 mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{enrollmentError}</span>
              </div>
            )}
          </div>

          {/* Auto-filled Biometric Info (read-only) */}
          {enrollmentStatus === 'enrolled' && enrollmentData && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-green-700 text-xs font-semibold">
                <ShieldCheck size={14} />
                <span>Biometric Enrollment Verified</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">{enrollmentData.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-sm font-medium text-gray-900">{enrollmentData.department || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">System ID</p>
                  <p className="text-sm font-medium text-gray-900">{enrollmentData.systemEmployeeId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Enrolled</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(enrollmentData.enrolledAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email, Role, and Password — only show after enrollment verified */}
          {enrollmentStatus === 'enrolled' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              {/* Role Selector */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-0.5 block">User Role</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCog className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <select
                    {...register("role")}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none cursor-pointer ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">Human Resource</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                {errors.role && <p className="text-red-500 text-xs mt-1 ml-1">{errors.role.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-0.5 block">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="your.email@example.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-0.5 block">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    autoComplete="new-password"
                    {...register("password")}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Min. 8 characters"
                  />
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full flex justify-center items-center py-2 px-4 rounded-xl text-sm font-semibold glass-button glass-button-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                {registerMutation.isPending ? (
                    <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Creating Account...
                    </>
                ) : (
                    "Create Account"
                )}
              </button>
            </div>
          )}
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
            Sign in instead
          </Link>
        </p>

        <div className="mt-4 text-center border-t border-gray-100 pt-4">
          <Link to="/careers" className="text-sm text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1">
            Looking for a job? View Open Positions
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
