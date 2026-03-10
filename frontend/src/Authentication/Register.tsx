import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { MapPin, Fingerprint, Upload, CheckCircle2, AlertCircle, Loader2, Mail, Lock, Check, X, Calendar, Droplet, Hash, Phone, Building2, Facebook, Twitter, Linkedin, Briefcase } from "lucide-react";
import AuthLayout from "@components/Custom/Auth/AuthLayout";
import Combobox from "@/components/Custom/Combobox";
import ConfirmationModal from '../components/CustomUI/ConfirmationModal';
import { PhilippineAddressSelector } from '@components/Custom/Shared/PhilippineAddressSelector';
import type { Region, Province, CityMunicipality } from '@/types/ph-address';
import { useBiometricDevice } from "@/hooks/useBiometricDevice";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema } from "@/schemas/authSchema";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { useRegisterMutation } from "@/hooks/useAuthQueries";
import { useDepartmentsQuery, usePositionsQuery, useNextEmployeeIdQuery, useHiredApplicantSearch } from "@/hooks/useCommonQueries";
import { useAuth } from "@/hooks/useAuth";
import { HiredApplicant } from "@/types/recruitment_applicant";
import ph from 'phil-reg-prov-mun-brgy';
import { EDUCATION_LEVELS } from "../schemas/recruitment";

type EducationLevel = typeof EDUCATION_LEVELS[number] | "";
type RegisterFormValues = z.infer<typeof RegisterSchema>;

interface SetupData {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
  email?: string;
  password?: string;
  department?: string;
  position?: string;
  role?: "Administrator" | "Human Resource" | "Employee";
  dutyType?: "Standard" | "Irregular";
  appointmentType?: string; // This can be many values, keeping as string or can use union
}

interface LocationState {
  setupData?: SetupData;
}

/* eslint-disable @typescript-eslint/naming-convention */
interface PhilAddressLibraryLocal {
  regions: Region[];
  provinces: Province[];
  city_mun: CityMunicipality[];
}
/* eslint-enable @typescript-eslint/naming-convention */

const addressLib = ph as unknown as PhilAddressLibraryLocal;

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const setupData = state?.setupData;
  
  const registerMutation = useRegisterMutation();
  const loading = registerMutation.isPending;
  const [searchParams] = useSearchParams();
  
  const { user, checkAuth } = useAuth();
  
  // Robust Detection: Use both URL mode and user's profile status
  const isFinalizingSetup = searchParams.get('mode') === 'finalize-setup' || user?.profileStatus === 'Initial';

  const { 
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      employeeId: "",
      firstName: "",
      lastName: "",
      middleName: "",
      suffix: "",
      email: "",
      password: "",
      educationalBackground: "",
      yearsOfExperience: "",
      experience: "",
      skills: "",
      eligibilityType: "",
      eligibilityNumber: "",
      eligibilityDate: "",
      address: "",
      residentialZipCode: "",
      permanentAddress: "",
      permanentZipCode: "",
      emergencyContact: "",
      emergencyContactNumber: "",
      isMeycauayan: "false",
      barangay: "",
      department: "",
      position: "",
      role: "Employee",
      avatar: undefined,
      gender: "",
      civilStatus: "",
      dutyType: "Standard",
      appointmentType: "Permanent",
      gsisNumber: "",
      pagibigNumber: "",
      philhealthNumber: "",
      umidNumber: "",
      philsysId: "",
      tinNumber: "",
      schoolName: "",
      yearGraduated: "",
      course: ""
    }
  });

  useEffect(() => {
    register("department");
    register("position");
  }, [register]);

  useEffect(() => {
    if (isFinalizingSetup && user) {
      setValue("firstName", user.firstName || "");
      setValue("lastName", user.lastName || "");
      setValue("middleName", user.middleName || "");
      setValue("suffix", user.suffix || "");
      setValue("department", user.department || "");
      setValue("employeeId", user.employeeId || "");
      setValue("dutyType", user.dutyType || "Standard");
      setValue("appointmentType", (user.appointmentType as RegisterFormValues["appointmentType"]) || "Permanent");
      // Visual Pre-fill: Leave blank so placeholder shows
      setValue("password", "");
      // Role is already correct in user object
      setValue("role", user.role as unknown as RegisterFormValues["role"]);
      toast.success("Initial account verified! Please complete your PDS and Biometrics.");
    }
  }, [isFinalizingSetup, user, setValue]);

  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [enrollStep, setEnrollStep] = useState(0);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showPreFillModal, setShowPreFillModal] = useState(false);
  const [matchedApplicant, setMatchedApplicant] = useState<HiredApplicant | null>(null);
  const [hasAutomaticallyChecked, setHasAutomaticallyChecked] = useState(false);
  
  const { data: departments = [] } = useDepartmentsQuery();
  const { data: positions = [] } = usePositionsQuery();

  // Track if address is pre-filled as a raw string from Applicant record
  const [isAddressPrefilled, setIsAddressPrefilled] = useState(false);
  const [prefilledAddress, setPrefilledAddress] = useState("");
  const [prefilledPermanentAddress, setPrefilledPermanentAddress] = useState("");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bioEnrolled, setBioEnrolled] = useState(false);
  
  const { data: nextIdData } = useNextEmployeeIdQuery();
  const actualEmployeeId = nextIdData || "";

  const [enrollError, setEnrollError] = useState<string | null>(null);

  const enrollStepRef = useRef(enrollStep);
  useEffect(() => { enrollStepRef.current = enrollStep; }, [enrollStep]);

  useEffect(() => {
    if (setupData) {
      setValue("firstName", setupData.firstName || "");
      setValue("lastName", setupData.lastName || "");
      setValue("middleName", setupData.middleName || "");
      setValue("suffix", setupData.suffix || "");
      setValue("email", setupData.email || "");
      setValue("password", setupData.password || "");
      setValue("department", setupData.department || "");
      setValue("position", setupData.position || "");
      setValue("role", setupData.role as RegisterFormValues["role"] || "Employee");
      toast.success(`Initializing as ${setupData.role}. Some fields are locked.`);
    }
  }, [setupData, setValue]);

  const { 
      status: bioStatus, 
      deviceConnected, 
      enroll, 
      resetDevice
  } = useBiometricDevice({
      onEnrollSuccess: () => {
           toast.success("Biometrics enrolled successfully!");
           setEnrollError(null);
           setBioEnrolled(true);
           setEnrollStep(2);
      },
      onEnrollFail: (msg) => {
          const errorMsg = msg || "Unknown error";
          setEnrollError(errorMsg);
          toast.error(`Enrollment failed: ${errorMsg}`);
          setTimeout(() => {
              setEnrollStep(0);
              setEnrollError(null);
          }, 3000);
      },
      onEnrollProgress: (step) => {
          setEnrollError(null); 
          if (step === 1) {
            setEnrollStep(1);
            toast("Remove finger...", { icon: '👆' });
          }
          if (step === 2) {
            setEnrollStep(2);
            toast("Place finger again...", { icon: '👇' });
          }
      }
  });


  const isMeycauayan = watch("isMeycauayan") === "true";
  const firstName = watch("firstName");
  const lastName = watch("lastName");
   // Watch for dynamic address preview
  const resRegion = watch("resRegion");
  const resProvince = watch("resProvince");
  const resCity = watch("resCity");
  const resBrgy = watch("resBrgy");
  const resHouse = watch("resHouseBlockLot");
  const resSubd = watch("resSubdivision");
  const resStreet = watch("resStreet");
  const permRegion = watch("permRegion");
  const permProvince = watch("permProvince");
  const permCity = watch("permCity");
  const permBrgy = watch("permBrgy");
  const permHouse = watch("permHouseBlockLot");
  const permSubd = watch("permSubdivision");
  const permStreet = watch("permStreet");
  const avatarRef = useRef<HTMLInputElement>(null);

  const formatAddr = (reg: string, prov: string, city: string, brgy: string, house: string, subd: string, street: string) => {
      const rName = addressLib.regions.find(x => x.reg_code === reg)?.name || '';
      const pName = addressLib.provinces.find(x => x.prov_code === prov)?.name || '';
      const cName = addressLib.city_mun.find(x => x.mun_code === city)?.name || '';
      const bName = brgy; // Barangay values are stored as their name
      return [house, subd, street, bName, cName, pName, rName].filter(Boolean).join(', ');
  };

  // Real-time residential address
  useEffect(() => {
      if (prefilledAddress || (isFinalizingSetup && user?.address)) {
          if (!watch("barangay")) setValue("barangay", "Prefilled"); // Bypass Zod Validation
          return;
      }
      const addr = formatAddr(resRegion||'', resProvince||'', resCity||'', resBrgy||'', resHouse||'', resSubd||'', resStreet||'');
      if (addr) {
          setValue("address", addr);
          setValue("residentialAddress", addr);
      }
      if (resBrgy) {
          setValue("barangay", resBrgy);
      } else {
          setValue("barangay", "");
      }
  }, [resRegion, resProvince, resCity, resBrgy, resHouse, resSubd, resStreet, setValue, prefilledAddress, isFinalizingSetup, user]);

  // Real-time permanent address
  useEffect(() => {
      if (prefilledPermanentAddress || (isFinalizingSetup && user?.permanentAddress)) {
          return;
      }
      const addr = formatAddr(permRegion||'', permProvince||'', permCity||'', permBrgy||'', permHouse||'', permSubd||'', permStreet||'');
      if (addr) {
          setValue("permanentAddress", addr);
      }
  }, [permRegion, permProvince, permCity, permBrgy, permHouse, permSubd, permStreet, setValue, prefilledPermanentAddress, isFinalizingSetup, user]);

  // Search for hired applicant when name is entered
  const { data: hiredApplicant } = useHiredApplicantSearch(
    firstName, 
    lastName, 
    !hasAutomaticallyChecked && firstName?.length > 2 && lastName?.length > 2
  );

  useEffect(() => {
    if (hiredApplicant && !hasAutomaticallyChecked) {
      setMatchedApplicant(hiredApplicant);
      setShowPreFillModal(true);
      setHasAutomaticallyChecked(true);
    }
  }, [hiredApplicant, hasAutomaticallyChecked]);

  const handlePreFill = () => {
    if (!matchedApplicant) return;

    // Map applicant fields to form fields
    setValue("middleName", matchedApplicant.middleName || "");
    setValue("suffix", matchedApplicant.suffix || "");
    setValue("email", matchedApplicant.email || "");
    setValue("birthDate", matchedApplicant.birthDate ? matchedApplicant.birthDate.split('T')[0] : "");
    setValue("placeOfBirth", matchedApplicant.birthPlace || "");
    setValue("gender", matchedApplicant.sex || "");
    setValue("civilStatus", matchedApplicant.civilStatus || "");
    setValue("bloodType", matchedApplicant.bloodType || "");
    setValue("heightM", matchedApplicant.height || "");
    setValue("weightKg", matchedApplicant.weight || "");
    setValue("mobileNo", matchedApplicant.phoneNumber || "");
    
    // Emergency Contact
    setValue("emergencyContact", matchedApplicant.emergencyContact || "");
    setValue("emergencyContactNumber", matchedApplicant.emergencyContactNumber || "");

    // Government IDs — correct mappings
    setValue("gsisNumber", matchedApplicant.gsisNumber || "");
    setValue("pagibigNumber", matchedApplicant.pagibigNumber || "");
    setValue("philhealthNumber", matchedApplicant.philhealthNumber || "");
    setValue("umidNumber", matchedApplicant.umidNumber || "");
    setValue("philsysId", matchedApplicant.philsysId || "");
    setValue("tinNumber", matchedApplicant.tinNumber || "");
    
    // Education & Background - Handle HTML escaping from backend
    let educationalBackgroundValue = matchedApplicant.educationalBackground || "";
    if (educationalBackgroundValue) {
        // Unescape common HTML entities that come from sanitizeInput
        educationalBackgroundValue = educationalBackgroundValue
            .replace(/&#039;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
    }
    setValue("educationalBackground", (educationalBackgroundValue as EducationLevel) || "");
    setValue("schoolName", matchedApplicant.schoolName || "");
    setValue("course", matchedApplicant.course || "");
    setValue("yearGraduated", matchedApplicant.yearGraduated || "");
    setValue("experience", matchedApplicant.experience || "");
    setValue("skills", matchedApplicant.skills || "");
    setValue("yearsOfExperience", matchedApplicant.totalExperienceYears?.toString() || "");

    // Eligibility
    setValue("eligibilityType", matchedApplicant.eligibilityType || "");
    setValue("eligibilityNumber", matchedApplicant.licenseNo || "");
    if (matchedApplicant.eligibilityDate) {
        setValue("eligibilityDate", matchedApplicant.eligibilityDate.split('T')[0]);
    }
    
    // Residential Address
    if (matchedApplicant.address) {
        setIsAddressPrefilled(true);
        setPrefilledAddress(matchedApplicant.address);
        // We defer setting form values for the dropdowns because that breaks the UI toggles.
        // On submit, if isAddressPrefilled is true, we will inject this string payload.
        setValue("resStreet", "");
    } else {
        setIsAddressPrefilled(false);
        setPrefilledAddress("");
    }
    if (matchedApplicant.zipCode) {
        setValue("residentialZipCode", matchedApplicant.zipCode);
    }

    // Permanent Address
    if (matchedApplicant.permanentAddress) {
        setPrefilledPermanentAddress(matchedApplicant.permanentAddress);
        // Defer form hook population logic to onSubmit identical to residential address parsing
        setValue("permStreet", "");
    } else {
        setPrefilledPermanentAddress("");
    }
    if (matchedApplicant.permanentZipCode) {
        setValue("permanentZipCode", matchedApplicant.permanentZipCode);
    }

    // Meycauayan Resident
    setValue("isMeycauayan", matchedApplicant.isMeycauayanResident ? "true" : "false");

    // Pre-fill Duty and Appointment from Job Posting
    setValue("dutyType", (matchedApplicant.dutyType || "Standard") as RegisterFormValues["dutyType"]);
    setValue("appointmentType", (matchedApplicant.employmentType || "Permanent") as RegisterFormValues["appointmentType"]);

    // Photo — display applicant's ID photo as avatar preview
    if (matchedApplicant.photoUrl) {
        setAvatarPreview(matchedApplicant.photoUrl);
    }

    // Store applicant metadata for linking during registration
    setValue("applicantId", matchedApplicant.id);
    if (matchedApplicant.hiredDate) {
        setValue("applicantHiredDate", matchedApplicant.hiredDate.split('T')[0]);
    }
    if (matchedApplicant.photoPath) {
        setValue("applicantPhotoPath", matchedApplicant.photoPath);
    }

    toast.success("Form pre-filled from your application data!");
    setShowPreFillModal(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      setValue("avatar", file);
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    if (!bioEnrolled) {
        toast.error("Please enroll your fingerprint first!");
        document.getElementById('biometrics-section')?.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    const formData = new FormData();
    
    // If address was pre-filled and never cleared by the user, we keep the original string
    // Otherwise we format it from the PhilippineAddressSelector fields
    if (isAddressPrefilled) {
        data.address = prefilledAddress;
        data.residentialAddress = prefilledAddress;
        
        // Use prefilled permanent address if available, otherwise fallback to residential
        const finalPerm = prefilledPermanentAddress || prefilledAddress;
        data.permanentAddress = finalPerm;
    } 

    const ignoreKeys = ['avatar', 'employeeId'];

    // Append simple fields
    (Object.keys(data) as Array<keyof RegisterFormValues>).forEach((key) => {
        const value = data[key];
        if (!ignoreKeys.includes(key as string) && value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    });
    formData.append("employeeId", data.employeeId || actualEmployeeId);
    if (avatarRef.current?.files?.[0]) {
        formData.append("avatar", avatarRef.current.files[0]);
    }

    // Append applicant linking data for backend processing
    if (data.applicantId) formData.append("applicantId", String(data.applicantId));
    if (data.applicantHiredDate) formData.append("applicantHiredDate", data.applicantHiredDate);
    if (data.applicantPhotoPath) formData.append("applicantPhotoPath", data.applicantPhotoPath);

    try {
      await registerMutation.mutateAsync({ 
        data: formData, 
        mode: isFinalizingSetup ? 'finalize-setup' : undefined 
      });

      if (isFinalizingSetup) {
          toast.success("Profile permanently saved! Redirecting to your dashboard...");
          // Sync auth state to get full permissions
          await checkAuth();
          navigate("/dashboard");
      } else {
          toast.success("Registration Successful! Please check your email.");
          navigate("/verify-account", { state: { email: data.email } });
      }
    } catch (error: unknown) {

      console.error(error);
      let msg = "Registration failed";
      
      interface ServerErrorData {
          message?: string;
          code?: string;
          errors?: Array<{ path: string[]; message: string }>;
      }
      
      const serverError = error as { response?: { data?: ServerErrorData } };
      const resData = serverError.response?.data;

      if (resData?.code === 'DUPLICATE_NAME') {
          setShowDuplicateModal(true);
          return;
      }

      if (resData?.code === 'ACCOUNT_LOCKED') {
          msg = resData.message || "Account is temporarily locked.";
      } else if (resData?.errors && Array.isArray(resData.errors)) {
          msg = resData.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(' | ');
      } else {
          msg = resData?.message || msg;
      }
      
      toast.error(msg, { duration: 5000 });
    }
  };

  const confirmDuplicateRegistration = () => {
      setShowDuplicateModal(false);
      setValue("ignoreDuplicateWarning", true);
      handleSubmit(onSubmit)();
  };

  const inputClass = `w-full pl-9 pr-3 py-2 text-sm border-[1.5px] rounded-[10px] shadow-sm bg-gray-50/50 hover:bg-white focus:bg-white focus:ring-[3px] focus:ring-green-100 focus:border-green-600 focus:outline-none border-gray-200 transition-all`;
  const errorClass = `border-red-400 focus:ring-red-100 focus:border-red-500 bg-red-50/30`;
  
  const cardClass = "bg-white p-5 rounded-[15px] border border-gray-100 shadow-sm space-y-4 mb-6 relative overflow-hidden";
  const cardHeaderClass = "text-sm font-bold text-gray-800 tracking-wide uppercase border-b border-gray-100 pb-2 mb-3 flex items-center gap-2";

  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Complete your Employee Record profile"
      maxWidth="max-w-2xl"
    >
      <div className="absolute top-4 right-4 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 shadow-sm flex items-center gap-2">
         <span className="relative flex h-2 w-2">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
           <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
         </span>
         Employee ID: {actualEmployeeId}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 mt-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Photo Upload Card */}
        <div className="flex flex-col items-center gap-3 mb-6">
           <div className="w-24 h-24 rounded-full bg-gray-50 overflow-hidden border-[3px] border-dashed border-gray-300 flex items-center justify-center relative shadow-inner hover:bg-gray-100 transition-colors">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Upload className="text-gray-400" />
              )}
           </div>
           <label className="cursor-pointer text-sm font-semibold text-green-700 hover:text-green-800 hover:underline bg-green-50 px-4 py-1.5 rounded-full border border-green-100 shadow-sm transition-all transform hover:scale-105 active:scale-95">
              Upload 2x2 Photo
              <input type="file" className="hidden" accept="image/*" ref={avatarRef} onChange={handleAvatarChange} />
           </label>
        </div>

        {/* Account Details */}
        <div className={cardClass}>
           <h4 className={cardHeaderClass}>Account Details</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 ml-1">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    {...register("email")} 
                    type="email" 
                    autoComplete="email" 
                    className={`${inputClass} !pl-3 ${errors.email ? errorClass : ''} ${setupData ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    placeholder="" 
                    readOnly={!!setupData}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-[11px] ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 ml-1">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    {...register("password")} 
                    type="password" 
                    autoComplete="new-password" 
                    className={`${inputClass} !pl-3 ${errors.password ? errorClass : ''} ${(setupData || isFinalizingSetup) ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    placeholder={isFinalizingSetup ? "••••••••" : ""} 
                    readOnly={!!setupData || isFinalizingSetup}
                  />                </div>
                {errors.password && <p className="text-red-500 text-[11px] ml-1">{errors.password.message}</p>}
              </div>
           </div>
        </div>

        {/* Personal Information */}
        <div className={cardClass}>
           <h4 className={cardHeaderClass}>Personal Information</h4>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 ml-1">Last Name <span className="text-red-500">*</span></label>
                <div className="relative">
                    <input {...register("lastName")} autoComplete="family-name" className={`${inputClass} !pl-3 ${errors.lastName ? errorClass : ''}`} placeholder="" />
                </div>
                {errors.lastName && <p className="text-red-500 text-[11px] ml-1">{errors.lastName.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 ml-1">First Name <span className="text-red-500">*</span></label>
                <div className="relative">
                    <input {...register("firstName")} autoComplete="given-name" className={`${inputClass} !pl-3 ${errors.firstName ? errorClass : ''}`} placeholder="" />
                </div>
                {errors.firstName && <p className="text-red-500 text-[11px] ml-1">{errors.firstName.message}</p>}
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Middle Name</label>
                 <div className="relative">
                    <input {...register("middleName")} autoComplete="additional-name" className={`${inputClass} !pl-3`} placeholder="" />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Suffix</label>
                 <div className="relative">
                    <input {...register("suffix")} autoComplete="honorific-suffix" className={`${inputClass} !pl-3`} placeholder="" />
                 </div>
              </div>
           </div>

           <div className="pt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Birth Date</label>
                 <div className="relative">
                    <input type="date" {...register("birthDate")} className={`${inputClass} !pl-3`} />
                 </div>
              </div>
              
              <div className="space-y-1 col-span-2 md:col-span-2">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Place of Birth</label>
                 <div className="relative">
                    <input {...register("placeOfBirth")} className={`${inputClass} !pl-3`} placeholder="" />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Gender</label>
                 <select {...register("gender")} className={`${inputClass} !pl-3`}>
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                 </select>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Civil Status</label>
                 <select {...register("civilStatus")} className={`${inputClass} !pl-3`}>
                    <option value="">Select...</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                    <option value="Annulled">Annulled</option>
                 </select>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Nationality</label>
                 <input {...register("nationality")} className={`${inputClass} !pl-3`} placeholder="" />
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Blood Type</label>
                 <select {...register("bloodType")} className={`${inputClass} !pl-3`}>
                    <option value="">Select...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                 </select>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Height (m)</label>
                 <input type="number" step="0.01" {...register("heightM")} className={`${inputClass} !pl-3`} placeholder="" />
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Weight (kg)</label>
                 <input type="number" step="0.1" {...register("weightKg")} className={`${inputClass} !pl-3`} placeholder="" />
              </div>
           </div>
        </div>

        {/* Contact & Address */}
        <div className={cardClass}>
           <h4 className={cardHeaderClass}>Contact & Address</h4>
           
           <div className="space-y-3 pb-3 border-b border-gray-100">
               <div className="bg-gray-50/50 p-3 rounded-[10px] border border-gray-100">
                   <label className="text-xs font-semibold text-gray-700 block mb-2">Are you a resident of Meycauayan?</label>
                   <div className="flex gap-4">
                     <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:bg-white px-3 py-1 rounded-md border border-transparent hover:border-gray-200 transition-all">
                       <input type="radio" value="true" {...register("isMeycauayan")} className="accent-green-600 w-4 h-4" /> Yes
                     </label>
                     <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:bg-white px-3 py-1 rounded-md border border-transparent hover:border-gray-200 transition-all">
                       <input type="radio" value="false" {...register("isMeycauayan")} className="accent-green-600 w-4 h-4" /> No
                     </label>
                   </div>
               </div>

               {prefilledAddress ? (
                   <div className="pb-4 border-b border-gray-100 relative">
                      <div className="flex justify-between items-center mb-2">
                          <h5 className="text-sm font-bold text-gray-700">Residential Address</h5>
                          <button 
                            type="button" 
                            onClick={() => {
                                setIsAddressPrefilled(false);
                                setPrefilledAddress("");
                                setValue("address", "");
                                setValue("residentialAddress", "");
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
                          >
                             Edit Details
                          </button>
                      </div>
                      <textarea
                        readOnly
                        value={prefilledAddress}
                        className={`${inputClass} !pl-3 h-20 bg-gray-100 cursor-not-allowed resize-none`}
                      />
                      <p className="text-[10px] text-gray-500 mt-1 italic">
                        This address was auto-populated from your application. Click Edit to change location branches.
                      </p>
                   </div>
               ) : isMeycauayan ? (
                  <div className="pb-4 border-b border-gray-100">
                      <h5 className="text-sm font-bold text-gray-700 mb-2">Residential Address (Meycauayan)</h5>
                      <PhilippineAddressSelector 
                        prefix="res" 
                        register={register} 
                        watch={watch} 
                        setValue={setValue} 
                        errors={errors} 
                        inputClass={inputClass} 
                        isMeycauayanOnly={true} 
                      />
                  </div>
               ) : (
                  <div className="pb-4 border-b border-gray-100">
                      <h5 className="text-sm font-bold text-gray-700 mb-2">Residential Address</h5>
                      <PhilippineAddressSelector 
                        prefix="res" 
                        register={register} 
                        watch={watch} 
                        setValue={setValue} 
                        errors={errors} 
                        inputClass={inputClass} 
                      />
                  </div>
               )}

           <div className="pt-4 border-b border-gray-100 pb-4">
               {prefilledPermanentAddress ? (
                   <div>
                      <h5 className="text-sm font-bold text-gray-700 mb-2">Permanent Address</h5>
                      <textarea
                        readOnly
                        value={prefilledPermanentAddress}
                        className={`${inputClass} !pl-3 h-20 bg-gray-100 cursor-not-allowed resize-none`}
                      />
                   </div>
               ) : (
                   <>
                       <h5 className="text-sm font-bold text-gray-700 mb-2">Permanent Address</h5>
                       <PhilippineAddressSelector 
                          prefix="perm" 
                          register={register} 
                          watch={watch} 
                          setValue={setValue} 
                          errors={errors} 
                          inputClass={inputClass} 
                       />
                   </>
               )}
           </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Mobile Number</label>
                 <div className="relative">
                    <input {...register("mobileNo")} className={`${inputClass} !pl-3`} placeholder="" />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Telephone Number</label>
                 <div className="relative">
                    <input {...register("telephoneNo")} className={`${inputClass} !pl-3`} placeholder="" />
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-red-50/30 rounded-[10px] border border-red-50">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-red-500 ml-1 flex items-center gap-1">Emergency Contact Person</label>
                 <input {...register("emergencyContact")} className={`${inputClass} !pl-3`} placeholder="Full Name" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-red-500 ml-1">Emergency Phone Number</label>
                 <input {...register("emergencyContactNumber")} className={`${inputClass} !pl-3`} placeholder="09XX XXX XXXX" />
              </div>
           </div>
        </div>

        {/* Government Identification */}
        <div className={cardClass}>
           <h4 className={cardHeaderClass}>Government Identification</h4>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">GSIS ID No.</label>
                 <input {...register("gsisNumber")} className={`${inputClass} !pl-3`} placeholder="" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">PAG-IBIG No.</label>
                 <input {...register("pagibigNumber")} className={`${inputClass} !pl-3`} placeholder="" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">PhilHealth No.</label>
                 <input {...register("philhealthNumber")} className={`${inputClass} !pl-3`} placeholder="" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">UMID Number</label>
                 <input {...register("umidNumber")} className={`${inputClass} !pl-3`} placeholder="" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">PHILSYS ID</label>
                 <input {...register("philsysId")} className={`${inputClass} !pl-3`} placeholder="" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">TIN No.</label>
                 <input {...register("tinNumber")} className={`${inputClass} !pl-3`} placeholder="" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Agency Employee No.</label>
                 <input {...register("agencyEmployeeNo")} className={`${inputClass} !pl-3`} placeholder="" />
              </div>
           </div>
        </div>

        {/* Educational Background */}
        <div className={cardClass}>
           <h4 className={cardHeaderClass}>Educational Background</h4>
           <div className="space-y-4">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Highest Degree/Level Attained</label>
                 <select 
                    {...register("educationalBackground")} 
                    className={`${inputClass} !pl-3`}
                 >
                    <option value="">Select highest education attained</option>
                    {EDUCATION_LEVELS.map((level) => (
                        <option key={level} value={level}>{level}</option>
                    ))}
                 </select>
                 {errors.educationalBackground && (
                    <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.educationalBackground.message}</p>
                 )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 ml-1">School / University Name</label>
                    <input {...register("schoolName")} className={`${inputClass} !pl-3`} placeholder="e.g. Bulacan State University" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 ml-1">Year Graduated</label>
                    <input {...register("yearGraduated")} className={`${inputClass} !pl-3`} placeholder="e.g. 2020" />
                 </div>
              </div>

              {watch("educationalBackground") && !["Elementary School Graduate", "High School Graduate", "Senior High School Graduate"].includes(watch("educationalBackground") || "") && (
                  <div className="space-y-1">
                     <label className="text-xs font-semibold text-gray-600 ml-1">Course / Degree</label>
                     <input {...register("course")} className={`${inputClass} !pl-3`} placeholder="e.g. BS in Information Technology" />
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 ml-1">Years of Experience</label>
                    <input type="number" {...register("yearsOfExperience")} className={`${inputClass} !pl-3`} placeholder="e.g. 5" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 ml-1">Relevant Skills</label>
                    <textarea {...register("skills")} className={`${inputClass} !pl-3 min-h-[40px] resize-y`} placeholder="e.g. JavaScript, Project Management" />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Work Experience Summary</label>
                 <textarea {...register("experience")} className={`${inputClass} !pl-3 min-h-[80px] resize-y`} placeholder="Summarize your previous roles..." />
              </div>
           </div>
        </div>

        {/* Eligibility */}
        <div className={cardClass}>
           <h4 className={cardHeaderClass}>Eligibility / Civil Service</h4>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Eligibility Type</label>
                 <select {...register("eligibilityType")} className={`${inputClass} !pl-3`}>
                    <option value="">Select eligibility...</option>
                    <option value="csc_prof">CSC Professional</option>
                    <option value="csc_sub">CSC Sub-Professional</option>
                    <option value="ra_1080">RA 1080 (Board/Bar)</option>
                    <option value="special_laws">Special Laws</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="tesda">TESDA NC II/III</option>
                    <option value="none">None / N/A</option>
                    <option value="others">Others</option>
                 </select>
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">License/ID Number</label>
                 <input {...register("eligibilityNumber")} className={`${inputClass} !pl-3`} placeholder="e.g. 1234567" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Date of Validity</label>
                 <input type="date" {...register("eligibilityDate")} className={`${inputClass} !pl-3`} />
              </div>
           </div>
        </div>

        {/* Employment Record */}
        <div className={cardClass}>
           <h4 className={cardHeaderClass}>Employment Details</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                   <label className="text-xs font-semibold text-gray-600 ml-1 mb-1 block">Department / Office</label>
                   <Combobox
                       options={departments.map((d) => ({ value: d.name, label: d.name }))}
                       value={watch("department") || ""}
                       onChange={(val) => setValue("department", val)}
                       placeholder=""
                       error={!!errors.department}
                       buttonClassName={`pl-3 ${setupData ? 'bg-gray-100 cursor-not-allowed opacity-80' : ''}`}
                       disabled={!!setupData}
                   />
               </div>
               <div>
                   <label className="text-xs font-semibold text-gray-600 ml-1 mb-1 block">Plantilla Position</label>
                   <Combobox
                       options={positions
                           .filter((p) => !watch("department") || p.department === watch("department"))
                           .map((p) => ({ value: `${p.positionTitle} (${p.itemNumber})`, label: `${p.positionTitle} (${p.itemNumber})` }))}
                       value={watch("position") || ""}
                       onChange={(val) => setValue("position", val)}
                       placeholder=""
                       error={!!errors.position}
                       buttonClassName={`pl-3 ${setupData ? 'bg-gray-100 cursor-not-allowed opacity-80' : ''}`}
                       disabled={!!setupData}
                   />
               </div>
               <div>
                   <label className="text-xs font-semibold text-gray-600 ml-1 mb-1 block">Type of Duties</label>
                   <select 
                     {...register("dutyType")} 
                     className={`${inputClass} !pl-3 text-gray-700`}
                   >
                     <option value="Standard">Standard</option>
                     <option value="Irregular">Irregular</option>
                   </select>
               </div>
               <div>
                   <label className="text-xs font-semibold text-gray-600 ml-1 mb-1 block">Appointment Type</label>
                   <select 
                     {...register("appointmentType")} 
                     className={`${inputClass} !pl-3 text-gray-700`}
                   >
                     <option value="Permanent">Permanent</option>
                     <option value="Contractual">Contractual</option>
                     <option value="Casual">Casual</option>
                     <option value="Job Order">Job Order</option>
                     <option value="Coterminous">Coterminous</option>
                     <option value="Temporary">Temporary</option>
                     <option value="Contract of Service">Contract of Service</option>
                   </select>
               </div>
            </div>
        </div>

        {/* Social Accounts */}
        <div className={cardClass}>
           <h4 className={cardHeaderClass}><Linkedin size={16} className="text-gray-400" /> Social Links</h4>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Facebook</label>
                 <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#1877F2]" size={15} />
                    <input {...register("facebookUrl")} className={inputClass} placeholder="" />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">LinkedIn</label>
                 <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0A66C2]" size={15} />
                    <input {...register("linkedinUrl")} className={inputClass} placeholder="" />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Twitter (X)</label>
                 <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800" size={15} />
                    <input {...register("twitterHandle")} className={inputClass} placeholder="" />
                 </div>
              </div>
           </div>
        </div>

        {/* Biometrics Enroll */}
        <div id="biometrics-section" className="bg-white p-6 rounded-[15px] border border-gray-200 flex flex-col items-center gap-4 shadow-sm relative mb-4">
            
            <button 
                type="button"
                onClick={() => setResetModalOpen(true)}
                className="absolute top-2 right-2 text-[10px] text-gray-300 hover:text-red-500 font-bold uppercase tracking-wider transition-colors"
                title="Reset Device and DB"
            >
                Reset Scanner
            </button>

            <div className="text-center mb-2">
                <h3 className="font-bold text-lg text-gray-900 flex items-center justify-center gap-2">
                    <Fingerprint className={bioEnrolled ? 'text-green-600' : 'text-gray-700'} size={24} /> 
                    {bioEnrolled ? "Biometric Captured" : "Fingerprint Identity"}
                </h3>
                <p className="text-sm text-gray-500 max-w-[300px] mx-auto mt-1">
                    Secure your account by registering your fingerprint as your unique digital key.
                </p>
            </div>

            <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                enrollError ? 'bg-red-50 text-red-500 shadow-red-100 animate-pulse border-red-200' :
                bioEnrolled ? 'bg-green-50 text-green-500 shadow-green-100 border-green-200' : 
                bioStatus === 'CONNECTED' ? 'bg-blue-50 text-blue-500 shadow-blue-100 border-blue-200' : 'bg-gray-50 text-gray-400 shadow-gray-100 border-gray-200'
            } shadow-lg border-2`}>
                {bioEnrolled ? <CheckCircle2 size={48} /> : enrollError ? <AlertCircle size={48} /> : <Fingerprint size={48} strokeWidth={1.5} />}
            </div>
            
            <div className="mt-2 flex gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors duration-300 ${
                        enrollStep >= 1 || bioEnrolled ? 'bg-green-500 border-green-500 text-white' : 
                        enrollError && enrollStep === 0 ? 'bg-red-500 border-red-500 text-white' : 
                        'border-gray-300 text-gray-300'
                    }`}>
                        {(enrollStep >= 1 || bioEnrolled) && <Check size={10} strokeWidth={3} />}
                        {enrollError && enrollStep === 0 && <X size={10} strokeWidth={3} />}
                    </div>
                    <span className={enrollStep >= 1 || bioEnrolled ? 'text-green-700' : 'text-gray-500'}>Scan 1</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors duration-300 ${
                        enrollStep >= 2 || bioEnrolled ? 'bg-green-500 border-green-500 text-white' : 
                        enrollError && enrollStep === 1 ? 'bg-red-500 border-red-500 text-white' : 
                        'border-gray-300 text-gray-300'
                    }`}>
                        {(enrollStep >= 2 || bioEnrolled) && <Check size={10} strokeWidth={3} />}
                        {enrollError && enrollStep === 1 && <X size={10} strokeWidth={3} />}
                    </div>
                    <span className={enrollStep >= 2 || bioEnrolled ? 'text-green-700' : 'text-gray-500'}>Scan 2</span>
                </div>
            </div>

            <div className="mt-2 text-center">
                <p className={`text-sm font-semibold rounded-lg px-4 py-2 ${
                    enrollError ? 'text-red-600 bg-red-50' : 
                    bioEnrolled ? 'text-green-700 bg-green-50' : 
                    'text-gray-700 bg-gray-50'
                }`}>
                    {enrollError ? `Error: ${enrollError}` :
                     bioEnrolled ? "Your fingerprint has been successfully stored." : 
                     enrollStep === 1 ? "Great! Now remove your finger." :
                     enrollStep === 2 ? "Place the SAME finger again to confirm." :
                     bioStatus === 'CONNECTED' ? (deviceConnected ? "Scanner ready. Place your thumb to enroll." : "Scanner disconnected. Check USB cable.") : "Middleware disconnected. Check BioSync App."}
                </p>
            </div>
            
            {!bioEnrolled && (
                <button 
                    type="button"
                    onClick={() => {
                        // Prevent double click by setting step to 1 immediately or check if enrolling
                        if (enrollStep === 0) {
                             setEnrollStep(0.5); // temporary state to disable button
                             enroll(actualEmployeeId, `${watch("firstName")} ${watch("lastName")}`.trim() || "User", watch("department") || "Unassigned");
                        }
                    }}
                    disabled={bioStatus !== 'CONNECTED' || !deviceConnected || enrollStep > 0}
                    className="mt-2 px-8 py-2.5 bg-gray-900 border border-gray-800 text-white text-sm font-bold uppercase tracking-wider rounded-full disabled:opacity-50 disabled:bg-gray-400 hover:bg-gray-800 hover:shadow-lg transition-all active:scale-95"
                >
                    {enrollStep > 0 && enrollStep < 1 ? "Starting..." : "Start Scanner"}
                </button>
            )}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-md pt-2 pb-4 mt-8 flex flex-col relative z-20 shadow-[0_-10px_15px_-3px_rgba(255,255,255,1)]">
            <div className="mb-4 px-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                        type="checkbox" 
                        required 
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 transition-all cursor-pointer"
                    />
                    <span className="text-[11px] text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">
                        I hereby certify that the information provided is true and correct. I authorize the CHRMO to collect and process my biometric data and personal information in accordance with the <a href="https://www.officialgazette.gov.ph/2012/08/15/republic-act-no-10173/" target="_blank" rel="noopener noreferrer" className="font-bold text-green-700 hover:underline">Data Privacy Act of 2012</a>.
                    </span>
                </label>
            </div>

            <button 
              type="submit" 
              disabled={loading || isSubmitting}
              className="w-full bg-gray-900 text-white py-3.5 rounded-xl text-[15px] font-extrabold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex justify-center items-center gap-2 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle2 size={18} />}
              Create Employee Record
            </button>
            <div className="text-center text-xs mt-4 text-gray-500 font-medium">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-gray-900 hover:text-green-700 hover:underline transition-colors pb-1 border-b border-transparent hover:border-green-700">
                Sign in here
              </Link>
            </div>
        </div>

      </form>

      {/* Tailwind Scrollbar customization added globally or inline, 'custom-scrollbar' used playfully above */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #d1d5db; }
      `}</style>

      <ConfirmationModal
        isOpen={showPreFillModal}
        title="Application Found!"
        message={`We found a hired application for ${matchedApplicant?.firstName} ${matchedApplicant?.lastName}. Would you like to automatically pre-fill the form with your information?`}
        confirmText="Yes, Pre-fill Form"
        cancelText="No, Type Manually"
        onConfirm={handlePreFill}
        onClose={() => {
            setShowPreFillModal(false);
            setHasAutomaticallyChecked(true); // Don't ask again for this session
        }}
        variant="info"
      />

      <ConfirmationModal
        isOpen={isResetModalOpen}
        title="Reset Scanner Device"
        message="Are you sure you want to completely erase the physical fingerprint scanner memory and clear the database? This action cannot be undone."
        confirmText="Yes, Erase Memory"
        cancelText="Cancel"
        onConfirm={() => {
            resetDevice();
            setResetModalOpen(false);
            setEnrollError(null);
            setBioEnrolled(false);
            setEnrollStep(0);
        }}
        onClose={() => setResetModalOpen(false)}
        variant="danger"
      />

      {/* Duplicate Name Confirmation Modal */}
      {showDuplicateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[20px] shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-3 text-amber-600 mb-4">
                      <div className="bg-amber-50 p-2 rounded-full">
                          <AlertCircle size={24} />
                      </div>
                      <h3 className="text-lg font-bold">Duplicate Name Detected</h3>
                  </div>
                  
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                      An employee named <span className="font-bold text-gray-900">{watch("firstName")} {watch("lastName")}</span> is already registered in our system.
                      <br /><br />
                      If you are sure you are a different person with the same name, click <strong>Confirm and Register</strong> to proceed.
                  </p>

                  <div className="flex gap-3">
                      <button 
                          onClick={() => setShowDuplicateModal(false)}
                          className="flex-1 px-4 py-2.5 rounded-[12px] border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          type="button"
                          onClick={confirmDuplicateRegistration}
                          className="flex-1 px-4 py-2.5 rounded-[12px] bg-green-600 text-white font-semibold text-sm hover:bg-green-700 shadow-md shadow-green-100 transition-all active:scale-95"
                      >
                          Confirm and Register
                      </button>
                  </div>
              </div>
          </div>
      )}
    </AuthLayout>
  );
}
