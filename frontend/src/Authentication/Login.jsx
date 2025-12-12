// Required imports from React and other libraries.
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IdCardLanyard, FileLock } from "lucide-react";
import AuthLayout from "../components/Custom/Auth/AuthLayout";
import { useAuth } from "../hooks/useAuth";

// Main component for the login page.
export default function Login() {
  // 'useState' manages form state, errors, and loading status.
  const [form, setForm] = useState({ employeeId: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const navigate = useNavigate(); // Used to redirect users.
  const { login } = useAuth();

  // 'useEffect' runs when the component mounts. It checks if the user is already logged in.
  useEffect(() => {
    // Automatically populates the employee ID from the last registration.
    const lastUser = localStorage.getItem("lastRegisteredUser");
    if (lastUser) {
      try {
        const user = JSON.parse(lastUser);
        setForm((prev) => ({ ...prev, employeeId: user.email || "" }));
        setRole(user.role);
        // Clears after use to avoid confusion.
        localStorage.removeItem("lastRegisteredUser");
      } catch (error) {
        console.error("Error parsing last user:", error);
        localStorage.removeItem("lastRegisteredUser");
      }
    }
  }, []);

  // Handles changes in input fields.
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // Handles form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validates if inputs are filled.
    if (!form.employeeId.trim() || !form.password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = await login({
        identifier: form.employeeId.trim(),
        password: form.password
      });

      if (!user || !user.role) {
        throw new Error("Invalid user data received");
      }

      // Redirects based on user role.
      const role = user.role.toLowerCase();
      if (role === "hr" || role === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else if (role === "employee") {
        navigate("/employee-dashboard", { replace: true });
      } else {
        throw new Error("Invalid user role");
      }
    } catch (err) {
      console.error("Login error:", err);
      
      // Handles different error scenarios.
      if (err.response) {
        // Server responded with an error.
        setError(err.response.data?.message || "Login failed. Please try again.");
      } else if (err.request) {
        // Request was made but no response received.
        setError("Unable to connect to server. Please check your connection.");
      } else {
        // Other errors.
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      // Ensures loading is set to false after attempt.
      setLoading(false);
    }
  };

  // Renders the login form UI.
  return (
    <AuthLayout title="Welcome Back!">
      {/* Displays error message if any */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Displays user role if available */}
      {role && (
        <div className="flex items-center justify-center gap-2 mb-5 py-2 px-4 rounded-[10px] border-[2px] border-gray-200 text-sm font-medium text-gray-900 shadow-md">
          <span className="opacity-80">Logging in as:</span>
          <span
            className={`capitalize px-3 py-[3px] rounded-md shadow-md font-semibold text-gray-900 ${
              role.toLowerCase() === "admin" || role.toLowerCase() === "hr" ? "bg-gray-200" : "bg-gray-100"
            }`}
          >
            {role}
          </span>
        </div>
      )}

      {/* The login form itself */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Employee ID or Email</label>
          <div className="relative">
            <IdCardLanyard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="text"
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border-[2px] border-gray-300 rounded-[15px] shadow-md bg-white focus:ring focus:ring-gray-100 focus:outline-none"
              placeholder="Enter your ID or Email"
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

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-slate-950 to-green-700 text-white py-2 rounded-[10px] font-semibold hover:from-slate-700 hover:to-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* Link for registration */}
      <p className="text-center mt-5 text-gray-700 text-sm">
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold text-black hover:underline">
          Register here
        </Link>
      </p>
    </AuthLayout>
  );
}