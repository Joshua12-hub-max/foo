import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Loader2, ArrowRight, User, Mail, Lock, Briefcase, Calendar, Clock, ChevronDown } from "lucide-react";
import AuthLayout from "@components/Custom/Auth/AuthLayout";
import { toast } from "react-hot-toast";
import api from "@/api/axios";
import { useAuthStore } from "@/stores";
import { ApiError } from "@/types";

interface SetupPosition {
  id: number;
  positionTitle: string;
  itemNumber: string;
  salaryGrade: number;
  isVacant: boolean;
}

interface SetupPositionsResponse {
  success: boolean;
  departmentId: number;
  positions: SetupPosition[];
  reservedId: string;
  appointmentTypes: string[];
  dutyTypes: string[];
  roles: string[];
}

export default function SetupPortal() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    email: "",
    password: "",
    positionId: "",
    role: "Administrator",
    dutyType: "Standard",
    appointmentType: "Permanent",
  });

  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [positions, setPositions] = useState<SetupPosition[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [dutyTypes, setDutyTypes] = useState<string[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const fetchHRDepartmentAndPositions = async () => {
      try {
        setVerifying(true);
        
        // 100% Cleanup: Wiping any old user session data before starting Setup
        logout();
        localStorage.clear();
        sessionStorage.clear();

        const res = await api.get<SetupPositionsResponse>("/auth/setup-positions");
        setPositions(res.data.positions);
        setDepartmentId(res.data.departmentId);
        setRoles(res.data.roles || ["Administrator", "Human Resource"]);
        setDutyTypes(res.data.dutyTypes || ["Standard", "Irregular"]);
        setAppointmentTypes(res.data.appointmentTypes || ["Permanent", "Contractual", "Casual", "Job Order", "Coterminous", "Temporary", "Contract of Service", "JO", "COS"]);
      } catch (err: unknown) {
        const apiErr = err as ApiError;
        toast.error(apiErr.response?.data?.message || "Setup portal is not available.");
        navigate("/login");
      } finally {
        setVerifying(false);
      }
    };
    fetchHRDepartmentAndPositions();
  }, [navigate, logout]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.positionId|| !formData.role || !formData.appointmentType) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post<{ success: boolean; message?: string }>("/auth/setup-portal", {
        ...formData,
        departmentId: departmentId
      });

      if (res.data.success) {
        // Cleanup again before redirecting to verification
        localStorage.clear();
        sessionStorage.clear();
        
        toast.success(res.data.message || "Account created! Please check your email.");
        navigate("/verify-account", { state: { email: formData.email } });
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      toast.error(apiErr.response?.data?.message || "Failed to initialize account.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <AuthLayout title="Initialization Complete" maxWidth="max-w-md">
        <div className="text-center py-6">
          <div className="mx-auto w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-5 border border-gray-100">
            <ShieldAlert className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mb-6 px-4 leading-relaxed">
            The initial administrative access has already been established.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-gray-900 text-white rounded-lg py-3 font-semibold hover:bg-black transition-all active:scale-[0.98]"
          >
            Go to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  const labelClass = "text-xs font-semibold text-gray-600 mb-1.5 ml-1 block";
  const inputContainerClass = "relative flex items-center bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all overflow-hidden shadow-sm";
  const iconClass = "absolute left-3.5 text-gray-400";
  const inputClass = "w-full bg-transparent pl-11 pr-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400";
  const selectClass = "w-full bg-transparent pl-11 pr-10 py-2.5 text-sm text-gray-900 outline-none appearance-none cursor-pointer";

  return (
    <AuthLayout 
      title="System Initialization" 
      subtitle="Complete the initial portal setup"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        
        {/* Row 1: Role & Position */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Administrative Role</label>
            <div className={inputContainerClass}>
              <ShieldAlert className={iconClass} size={16} />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={selectClass}
                required
              >
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 text-gray-400 pointer-events-none" size={14} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Official Position</label>
            <div className={inputContainerClass}>
              <Briefcase className={iconClass} size={16} />
              <select
                name="positionId"
                value={formData.positionId}
                onChange={handleChange}
                className={selectClass}
                required
              >
                <option value="">Select position</option>
                {positions.map((pos) => (
                  <option key={pos.id} value={pos.id}>{pos.positionTitle}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 text-gray-400 pointer-events-none" size={14} />
            </div>
          </div>
        </div>

        {/* Row 2: Duty & Appointment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Duty Status</label>
            <div className={inputContainerClass}>
              <Clock className={iconClass} size={16} />
              <select
                name="dutyType"
                value={formData.dutyType}
                onChange={handleChange}
                className={selectClass}
                required
              >
                {dutyTypes.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 text-gray-400 pointer-events-none" size={14} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Appointment Type</label>
            <div className={inputContainerClass}>
              <Calendar className={iconClass} size={16} />
              <select
                name="appointmentType"
                value={formData.appointmentType}
                onChange={handleChange}
                className={selectClass}
                required
              >
                {appointmentTypes.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 text-gray-400 pointer-events-none" size={14} />
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 my-2" />

        {/* Row 3: Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Last Name</label>
            <div className={inputContainerClass}>
              <User className={iconClass} size={16} />
              <input name="lastName" placeholder="Dela Cruz" value={formData.lastName} onChange={handleChange} className={inputClass} required />
            </div>
          </div>
          <div>
            <label className={labelClass}>First Name</label>
            <div className={inputContainerClass}>
              <User className={iconClass} size={16} />
              <input name="firstName" placeholder="Juan" value={formData.firstName} onChange={handleChange} className={inputClass} required />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Middle Name</label>
            <div className={inputContainerClass}>
              <User className={iconClass} size={16} />
              <input name="middleName" placeholder="Optional" value={formData.middleName} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Suffix</label>
            <div className={inputContainerClass}>
              <User className={iconClass} size={16} />
              <input name="suffix" placeholder="Jr., III, etc." value={formData.suffix} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Row 4: Credentials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Official Email</label>
            <div className={inputContainerClass}>
              <Mail className={iconClass} size={16} />
              <input name="email" type="email" placeholder="name@gov.ph" value={formData.email} onChange={handleChange} className={inputClass} required />
            </div>
          </div>
          <div>
            <label className={labelClass}>Initial Password</label>
            <div className={inputContainerClass}>
              <Lock className={iconClass} size={16} />
              <input name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} className={inputClass} required />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3">
            <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-sm hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex justify-center items-center gap-2 active:scale-[0.98]"
            >
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : (
                <>
                Initialize System
                <ArrowRight size={18} />
                </>
            )}
            </button>
        </div>

        <div className="text-center">
          <button 
            type="button"
            onClick={() => navigate("/login")}
            className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
