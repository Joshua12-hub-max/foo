import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Loader2, ArrowRight, User, Mail, Lock, Briefcase, Calendar, Clock } from "lucide-react";
import AuthLayout from "@components/Custom/Auth/AuthLayout";
import { toast } from "react-hot-toast";
import api from "@/api/axios";
import { useAuthStore } from "@/stores";
import { ApiError } from "@/types";
import axios, { AxiosError } from "axios";
import { useEmailUniquenessQuery } from "@/hooks/useCommonQueries";
import { useDebounce } from "@/hooks/useDebounce"; // Ensure this hook exists or use primitive
import Combobox from "@/components/Custom/Combobox";

import EmailVerificationModal from "./EmailVerificationModal";

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
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  // Email Uniqueness Check
  const debouncedEmail = useDebounce(formData.email, 500);
  const { data: emailUniqueness } = useEmailUniquenessQuery(
    debouncedEmail, 
    debouncedEmail.length > 5 && !loading
  );
  const isEmailTaken = emailUniqueness?.isUnique === false;

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
      } catch (err) {
        let message = "Setup portal is not available.";
        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError<{ message?: string }>;
          message = axiosError.response?.data?.message || message;
        }
        toast.error(message);
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
        toast.success(res.data.message || "Account created! Please check your email.");
        setVerificationEmail(formData.email);
        setIsVerifyModalOpen(true);
      }
    } catch (err) {
      let message = "Failed to initialize account.";
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message?: string }>;
        message = axiosError.response?.data?.message || message;
      }
      toast.error(message);
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

  return (
    <AuthLayout 
      title="System Initialization" 
      subtitle="Complete the initial portal setup"
      maxWidth="max-w-2xl"
    >
      <div className="flex justify-start mb-6 -mt-2">
        <button 
          onClick={() => navigate("/login")}
          className="group flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-blue-600 transition-all uppercase tracking-widest"
        >
          <ArrowRight className="rotate-180 w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to Terminal Login
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        
        {/* Row 1: Role & Position */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Administrative Role</label>
            <div className="z-50">
              <Combobox
                options={roles.map(r => ({ value: r, label: r }))}
                value={formData.role}
                onChange={(val) => setFormData({ ...formData, role: val })}
                placeholder="Select role"
                buttonClassName="pl-11 py-2.5"
                className="w-full"
              />
              <ShieldAlert className={iconClass} size={16} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Official Position</label>
            <div className="z-50">
              <Combobox
                options={positions.map(pos => ({ value: String(pos.id), label: pos.positionTitle }))}
                value={formData.positionId}
                onChange={(val) => setFormData({ ...formData, positionId: val })}
                placeholder="Select position"
                buttonClassName="pl-11 py-2.5"
                className="w-full"
              />
              <Briefcase className={iconClass} size={16} />
            </div>
          </div>
        </div>

        {/* Row 2: Duty & Appointment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Duty Status</label>
            <div className="z-40">
              <Combobox
                options={dutyTypes.map(d => ({ value: d, label: d }))}
                value={formData.dutyType}
                onChange={(val) => setFormData({ ...formData, dutyType: val })}
                placeholder="Select duty"
                buttonClassName="pl-11 py-2.5"
                className="w-full"
              />
              <Clock className={iconClass} size={16} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Appointment Type</label>
            <div className="z-40">
              <Combobox
                options={appointmentTypes.map(a => ({ value: a, label: a }))}
                value={formData.appointmentType}
                onChange={(val) => setFormData({ ...formData, appointmentType: val })}
                placeholder="Select appointment"
                buttonClassName="pl-11 py-2.5"
                className="w-full"
              />
              <Calendar className={iconClass} size={16} />
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
            <label className={`${labelClass} ${isEmailTaken ? 'text-red-500' : ''}`}>
              Official Email {isEmailTaken && <span className="ml-1">(Already exists)</span>}
            </label>
            <div className={`${inputContainerClass} ${isEmailTaken ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}>
              <Mail className={`${iconClass} ${isEmailTaken ? 'text-red-500' : ''}`} size={16} />
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
      <EmailVerificationModal 
        isOpen={isVerifyModalOpen}
        email={verificationEmail}
        redirectToLogin={true}
        onSuccess={() => {
          setIsVerifyModalOpen(false);
          navigate("/login");
        }}
      />
    </AuthLayout>
  );
}
