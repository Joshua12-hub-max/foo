import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IdCardLanyard, FileLock } from "lucide-react";
import AuthLayout from "../components/Custom/Auth/AuthLayout";
import api from "../api/axios";

export default function Login() {
  const [form, setForm] = useState({ employeeId: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const existingUser = localStorage.getItem("user");
    const accessToken = sessionStorage.getItem("accessToken");
    
    if (existingUser && accessToken) {
      try {
        const userData = JSON.parse(existingUser);
        if (userData.role === "hr" || userData.role === "admin") {
          navigate("/admin-dashboard", { replace: true });
        } else if (userData.role === "employee") {
          navigate("/employee-dashboard", { replace: true });
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
        sessionStorage.removeItem("accessToken");
      }
    }

    // Pre-fill employee ID from last registration
    const lastUser = localStorage.getItem("lastRegisteredUser");
    if (lastUser) {
      try {
        const user = JSON.parse(lastUser);
        setForm((prev) => ({ ...prev, employeeId: user.employeeId }));
        setRole(user.role);
        // Clear after use to avoid confusion
        localStorage.removeItem("lastRegisteredUser");
      } catch (error) {
        console.error("Error parsing last user:", error);
        localStorage.removeItem("lastRegisteredUser");
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!form.employeeId.trim() || !form.password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/login", {
        employeeId: form.employeeId.trim(),
        password: form.password
      });

      const { accessToken, ...user } = res.data;

      // Validate response data
      if (!accessToken || !user.employeeId || !user.role) {
        throw new Error("Invalid response from server");
      }

      // Store user data and token
      localStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("accessToken", accessToken);

      // Navigate based on role
      if (user.role === "hr" || user.role === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else if (user.role === "employee") {
        navigate("/employee-dashboard", { replace: true });
      } else {
        throw new Error("Invalid user role");
      }
    } catch (err) {
      console.error("Login error:", err);
      
      // Clear any partial data on error
      localStorage.removeItem("user");
      sessionStorage.removeItem("accessToken");

      // Handle different error scenarios
      if (err.response) {
        // Server responded with error
        setError(err.response.data?.message || "Login failed. Please try again.");
      } else if (err.request) {
        // Request made but no response
        setError("Unable to connect to server. Please check your connection.");
      } else {
        // Other errors
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back!">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {role && (
        <div className="flex items-center justify-center gap-2 mb-5 py-2 px-4 rounded-[10px] border-[2px] border-gray-200 text-sm font-medium text-gray-900 shadow-md">
          <span className="opacity-80">Logging in as:</span>
          <span
            className={`capitalize px-3 py-[3px] rounded-md shadow-md font-semibold text-gray-900 ${
              role === "admin" || role === "hr" ? "bg-gray-200" : "bg-gray-100"
            }`}
          >
            {role}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Employee ID</label>
          <div className="relative">
            <IdCardLanyard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="text"
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border-[2px] border-gray-300 rounded-[15px] shadow-md bg-white focus:ring focus:ring-gray-100 focus:outline-none"
              placeholder="Enter your Employee ID"
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-slate-950 to-green-700 text-white py-2 rounded-[10px] font-semibold hover:from-slate-700 hover:to-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="text-center mt-5 text-gray-700 text-sm">
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold text-black hover:underline">
          Register here
        </Link>
      </p>
    </AuthLayout>
  );
}