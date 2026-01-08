import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Briefcase, Building2, AlertCircle, Loader2 } from "lucide-react";
import AuthLayout from "@components/Custom/Auth/AuthLayout";
import { register } from "@/Service/Auth";
import axios from "@/api/axios";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    department: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('/departments/public');
        if (response.data.success) {
          setDepartments(response.data.departments);
        }
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      } finally {
        setDepartmentsLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      setSuccess(response.data.message || "Registration successful! Please check your email.");
      
      // Store for login pre-fill
      localStorage.setItem("lastRegisteredUser", JSON.stringify({ email: form.email, role: form.role }));
      
      // Redirect to verification page
      setTimeout(() => {
          navigate("/verify-account", { state: { email: form.email } });
      }, 1500);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create Account">
      <div className="space-y-4">
        <div className="text-center">
            <p className="text-gray-500 mt-1 text-sm">Join us and start your journey</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                <label className="text-xs font-medium text-gray-700 mb-0.5 block">Full Name</label>
                <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="John Doe"
                    required
                />
                </div>
            </div>

            <div>
                <label className="text-xs font-medium text-gray-700 mb-0.5 block">Email Address</label>
                <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="john@example.com"
                    required
                />
                </div>
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
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-sm"
                    required
                >
                    <option value="">Select Role</option>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                    <option value="hr">HR</option>
                </select>
                </div>
            </div>

            <div>
                <label className="text-xs font-medium text-gray-700 mb-0.5 block">Department</label>
                <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-sm"
                    required
                    disabled={departmentsLoading}
                >
                    <option value="">{departmentsLoading ? 'Loading...' : 'Select Department'}</option>
                    {departments.map((dept) => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                </select>
                </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-0.5 block">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                placeholder="Create a strong password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-2 px-4 rounded-xl text-sm font-semibold glass-button glass-button-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            {isSubmitting ? (
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
