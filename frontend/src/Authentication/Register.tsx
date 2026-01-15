import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Briefcase, Building2, AlertCircle, Loader2 } from "lucide-react";
import AuthLayout from "@components/Custom/Auth/AuthLayout";
import { register as registerApi } from "@/Service/Auth";
import { fetchPublicDepartments } from "@/api/departmentApi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema, RegisterInput } from "@/schemas/authSchema";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function Register() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState("");

  // React Hook Form
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "employee",
      department: ""
    }
  });

  // Fetch Departments using React Query
  const { data: deptData, isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments', 'public'],
    queryFn: fetchPublicDepartments,
    staleTime: 1000 * 60 * 5 // 5 minutes cache
  });

  const departments = deptData?.departments || [];

  // Register Mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterInput) => registerApi(data),
    onSuccess: (response, variables) => {
      setSuccessMessage(response.data.message || "Registration successful! Please check your email.");
      
      // Store for login pre-fill
      localStorage.setItem("lastRegisteredUser", JSON.stringify({ email: variables.email, role: variables.role }));
      
      // Redirect to verification page
      setTimeout(() => {
          navigate("/verify-account", { state: { email: variables.email } });
      }, 1500);
    },
    onError: (error: any) => {
      console.error("Registration error:", error);
    }
  });

  const onSubmit = (data: RegisterInput) => {
    setSuccessMessage("");
    registerMutation.mutate(data);
  };

  return (
    <AuthLayout title="Create Account">
      <div className="space-y-4">
        <div className="text-center">
            <p className="text-gray-500 mt-1 text-sm">Join us and start your journey</p>
        </div>

        {registerMutation.isError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} />
            <span>{(registerMutation.error as any).response?.data?.message || "Registration failed. Please try again."}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                <label className="text-xs font-medium text-gray-700 mb-0.5 block">Full Name</label>
                <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                    type="text"
                    autoComplete="name"
                    {...register("name")}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="John Doe"
                />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name.message}</p>}
            </div>

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
                    placeholder="john@example.com"
                />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                <label className="text-xs font-medium text-gray-700 mb-0.5 block">Role</label>
                <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <select
                    {...register("role")}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-sm ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
                >
                    <option value="">Select Role</option>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                    <option value="hr">HR</option>
                </select>
                </div>
                {errors.role && <p className="text-red-500 text-xs mt-1 ml-1">{errors.role.message}</p>}
            </div>

            <div>
                <label className="text-xs font-medium text-gray-700 mb-0.5 block">Department</label>
                <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <select
                    {...register("department")}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-sm ${errors.department ? 'border-red-500' : 'border-gray-300'}`}
                    disabled={departmentsLoading}
                >
                    <option value="">{departmentsLoading ? 'Loading...' : 'Select Department'}</option>
                    {departments.map((dept: any) => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                </select>
                </div>
                {errors.department && <p className="text-red-500 text-xs mt-1 ml-1">{errors.department.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    placeholder="Create a strong password"
                />
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
             </div>
             
             <div>
                <label className="text-xs font-medium text-gray-700 mb-0.5 block">Confirm Password</label>
                <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                    type="password"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Confirm your password"
                />
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword.message}</p>}
             </div>
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
