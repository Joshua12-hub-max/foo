import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import AuthLayout from "@components/Custom/Auth/AuthLayout";
import { toast } from "react-hot-toast";
import { useSetupPortalMutation } from "@/hooks/useAuthQueries";
import api from "@/api/axios";

export default function SetupPortal() {
  const navigate = useNavigate();
  const setupMutation = useSetupPortalMutation();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    positionId: "",
  });

  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const fetchHRDepartmentAndPositions = async () => {
      try {
        setVerifying(true);
        // We'll call an endpoint that fetches the exact setup positions, 
        // to keep the frontend clean and fast.
        const res = await api.get("/auth/setup-positions");
        setPositions(res.data.positions);
        setDepartmentId(res.data.departmentId);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Setup portal is not available.");
        navigate("/login");
      } finally {
        setVerifying(false);
      }
    };
    fetchHRDepartmentAndPositions();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.positionId) {
      toast.error("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);
      await setupMutation.mutateAsync({
        ...formData,
        departmentId
      });
      toast.success("Portal setup successful! You can now log in.");
      navigate("/login");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Setup failed.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <AuthLayout title="Setup Portal" maxWidth="max-w-md">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Setup Complete</h3>
          <p className="text-sm text-gray-500 mb-6">
            The initial HR and Administrator accounts have already been established. This portal is no longer accepting setups.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-gray-900 text-white rounded-xl py-2.5 font-bold hover:bg-gray-800 transition shadow-sm"
          >
            Go to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  const inputClass = "w-full pl-3 pr-3 py-2.5 text-sm border-[1.5px] rounded-xl shadow-sm bg-gray-50/50 hover:bg-white focus:bg-white focus:ring-[3px] focus:ring-green-100 focus:border-green-600 focus:outline-none border-gray-200 transition-all text-gray-900";

  return (
    <AuthLayout 
      title="System Initialization" 
      subtitle="Establish the first Administrator and Human Resource access."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3 mb-6">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-blue-800">Department</label>
            <input 
              type="text" 
              disabled 
              value="Human Resource Management Office" 
              className="w-full bg-white/50 border border-blue-200 rounded-lg text-sm text-blue-900 font-medium px-3 py-2 cursor-not-allowed" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-blue-800">Select Position</label>
            <select
              name="positionId"
              value={formData.positionId}
              onChange={handleChange}
              className="w-full bg-white border border-blue-300 rounded-lg text-sm text-blue-900 font-medium px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">Select a role...</option>
              {positions.map((pos) => (
                <option key={pos.id} value={pos.id}>{pos.positionTitle}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 ml-1">Last Name</label>
            <input
              name="lastName"
              placeholder="Ex: Dela Cruz"
              value={formData.lastName}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 ml-1">First Name</label>
            <input
              name="firstName"
              placeholder="Ex: Juan"
              value={formData.firstName}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 ml-1">Official Email Address</label>
          <input
            name="email"
            type="email"
            placeholder="Ex: hr.admin@meycauayan.gov.ph"
            value={formData.email}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5 pb-2">
          <label className="text-xs font-semibold text-gray-600 ml-1">Setup Password</label>
          <input
            name="password"
            type="password"
            placeholder="Min 8 characters"
            value={formData.password}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white rounded-xl py-3 font-bold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex justify-center items-center gap-2 mt-2"
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
            <>
              Complete Registration
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
