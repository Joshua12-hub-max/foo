import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Users, IdCardLanyard, FileLock } from "lucide-react";
import AuthLayout from "../components/Custom/Auth/AuthLayout";
import api from "../api/axios";

export default function Register() {
  const [form, setForm] = useState({ name: "", role: "", employeeId: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await api.post("/register", form);
      
      // Store last registered user for login page
      localStorage.setItem("lastRegisteredUser", JSON.stringify({
        employeeId: form.employeeId,
        role: form.role
      }));
      
      setSuccess(res.data.message);
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create an Account" subtitle="Please fill in the details to register.">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border-[2px] border-gray-300 rounded-[15px] shadow-md bg-white focus:ring focus:ring-gray-100"
              placeholder="Enter your full name"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Role</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={17} />
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border-[2px] border-gray-300 rounded-[15px] shadow-md bg-white focus:ring focus:ring-gray-100 appearance-none"
              required
            >
              <option value="">Select a role</option>
              <option value="employee">Employee</option>
              <option value="hr">Human Resource</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Employee ID</label>
          <div className="relative">
            <IdCardLanyard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="text"
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border-[2px] border-gray-300 rounded-[15px] shadow-md bg-white focus:ring focus:ring-gray-100"
              placeholder="Enter your Employee ID"
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
              className="w-full pl-10 pr-3 py-2 border-[2px] border-gray-300 rounded-[15px] shadow-md bg-white focus:ring focus:ring-gray-100"
              placeholder="Enter a strong password"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-slate-950 to-green-700 text-white py-2 rounded-[10px] font-semibold hover:from-slate-700 hover:to-green-500 transition disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Register"}
        </button>
      </form>

      <p className="text-center mt-5 text-gray-700 text-sm">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-gray-900 hover:underline">
          Login here
        </Link>
      </p>
    </AuthLayout>
  );
}