import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import AuthLayout from "@components/Custom/Auth/AuthLayout";
import EmailVerificationModal from './EmailVerificationModal';
import { useBiometricDevice } from "@/hooks/useBiometricDevice";
import { useForm, SubmitHandler, Path, get, FieldError as RHFFieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema } from "@/schemas/authSchema";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { useRegisterMutation } from "@/hooks/useAuthQueries";
import { useNextEmployeeIdQuery } from "@/hooks/useCommonQueries";
import { useAuth } from "@/hooks/useAuth";
import SEO from "@/components/Global/SEO";
import { pdsApi } from "@/api/pdsApi";

export type RegisterFormValues = z.input<typeof RegisterSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registerMutation = useRegisterMutation();
  const { user, checkAuth } = useAuth();
  
  const isFinalizingSetup = searchParams.get('mode') === 'finalize-setup' || user?.profileStatus === 'Initial';

  const { 
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    mode: "onBlur",
    defaultValues: {
      employeeId: "", firstName: "", lastName: "", middleName: "", suffix: "", email: "", password: "",
      department: "", position: "", role: "Employee", dutyType: "Standard", appointmentType: "Permanent",
      birthDate: "", placeOfBirth: "", gender: "", civilStatus: "", mobileNo: "", telephoneNo: "",
      nationality: "Filipino", citizenship: "Filipino", bloodType: "", heightM: "", weightKg: "",
      gsisNumber: "", pagibigNumber: "", philhealthNumber: "", tinNumber: "", umidNumber: "", philsysId: "", agencyEmployeeNo: "",
      resHouseBlockLot: "", resStreet: "", resSubdivision: "", resBarangay: "", resCity: "", resProvince: "", resRegion: "", residentialZipCode: "",
      permHouseBlockLot: "", permStreet: "", permSubdivision: "", permBarangay: "", permCity: "", permProvince: "", permRegion: "", permanentZipCode: "",
      educations: [], eligibilities: [], workExperiences: [], learningDevelopments: [], familyBackground: [], otherInfo: [],
      voluntaryWorks: [], references: [],
      certifiedCorrect: false
    }
  });

  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [enrollStep, setEnrollStep] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bioEnrolled, setBioEnrolled] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [isParsingPds, setIsParsingPds] = useState(false);
  const [pdsFileName, setPdsFileName] = useState<string | null>(null);
  const [pdsExtracted, setPdsExtracted] = useState(false);

  const { data: nextIdData, isLoading: isNextIdLoading } = useNextEmployeeIdQuery();
  const actualEmployeeId = nextIdData || ""; 
  const avatarRef = useRef<HTMLInputElement>(null);

  const { status: bioStatus, deviceConnected, enroll, resetDevice } = useBiometricDevice({
      onEnrollSuccess: () => {
           toast.success("Biometrics enrolled successfully!");
           setBioEnrolled(true);
           setEnrollStep(2);
      },
      onEnrollFail: (msg) => {
          setEnrollError(msg || "Enrollment failed");
          setEnrollStep(0);
      },
      onEnrollProgress: (step) => {
          setEnrollStep(step);
          if (step === 1) toast("Remove finger...", { icon: '👆' });
          if (step === 2) toast("Place finger again...", { icon: '👇' });
      }
  });

  const handlePdsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPds(true);
    setPdsFileName(file.name);
    const toastId = toast.loading("Processing official PDS document...");

    try {
      const response = await pdsApi.parsePds(file);
      if (response.data.success) {
        handlePdsExtracted(response.data.data);
        if (response.data.avatar) setAvatarPreview(response.data.avatar);
        setPdsExtracted(true);
        toast.success("PDS Extracted Successfully!", { id: toastId });
      } else {
        toast.error(response.data.message || "Failed to parse PDS", { id: toastId });
      }
    } catch (err) {
      toast.error("Error connecting to extraction service", { id: toastId });
    } finally {
      setIsParsingPds(false);
    }
  };

  const handlePdsExtracted = (data: any) => {
    // Top-level name fields from PdsParserOutput
    if (data.firstName) setValue("firstName", data.firstName);
    if (data.lastName) setValue("lastName", data.lastName);
    if (data.middleName) setValue("middleName", data.middleName);
    if (data.email) setValue("email", data.email);

    // Personal info lives under data.personal in canonical PdsParserOutput
    const p = data.personal ?? {};
    if (p.birthDate) setValue("birthDate", p.birthDate);
    if (p.placeOfBirth) setValue("placeOfBirth", p.placeOfBirth);
    if (p.gender) setValue("gender", p.gender);
    if (p.civilStatus) setValue("civilStatus", p.civilStatus);
    if (p.bloodType) setValue("bloodType", p.bloodType);
    if (p.heightM != null) setValue("heightM", String(p.heightM));
    if (p.weightKg != null) setValue("weightKg", String(p.weightKg));
    if (p.citizenship) setValue("citizenship", p.citizenship);
    if (p.citizenshipType) setValue("citizenshipType", p.citizenshipType);
    if (p.dualCountry) setValue("dualCountry", p.dualCountry);
    if (p.telephoneNo) setValue("telephoneNo", p.telephoneNo);
    if (p.mobileNo) setValue("mobileNo", p.mobileNo);

    // Government IDs
    if (p.gsisNumber) setValue("gsisNumber", p.gsisNumber);
    if (p.pagibigNumber) setValue("pagibigNumber", p.pagibigNumber);
    if (p.philhealthNumber) setValue("philhealthNumber", p.philhealthNumber);
    if (p.tinNumber) setValue("tinNumber", p.tinNumber);
    if (p.umidNumber) setValue("umidNumber", p.umidNumber);
    if (p.philsysId) setValue("philsysId", p.philsysId);
    if (p.agencyEmployeeNo) setValue("agencyEmployeeNo", p.agencyEmployeeNo);

    // Residential address
    if (p.resHouseBlockLot) setValue("resHouseBlockLot", p.resHouseBlockLot);
    if (p.resStreet) setValue("resStreet", p.resStreet);
    if (p.resSubdivision) setValue("resSubdivision", p.resSubdivision);
    if (p.resBarangay) setValue("resBarangay", p.resBarangay);
    if (p.resCity) setValue("resCity", p.resCity);
    if (p.resProvince) setValue("resProvince", p.resProvince);
    if (p.resRegion) setValue("resRegion", p.resRegion);
    if (p.residentialZipCode) setValue("residentialZipCode", p.residentialZipCode);

    // Permanent address
    if (p.permHouseBlockLot) setValue("permHouseBlockLot", p.permHouseBlockLot);
    if (p.permStreet) setValue("permStreet", p.permStreet);
    if (p.permSubdivision) setValue("permSubdivision", p.permSubdivision);
    if (p.permBarangay) setValue("permBarangay", p.permBarangay);
    if (p.permCity) setValue("permCity", p.permCity);
    if (p.permProvince) setValue("permProvince", p.permProvince);
    if (p.permRegion) setValue("permRegion", p.permRegion);
    if (p.permanentZipCode) setValue("permanentZipCode", p.permanentZipCode);

    // PDS arrays — canonical names
    if (Array.isArray(data.educations) && data.educations.length > 0) setValue("educations", data.educations);
    if (Array.isArray(data.eligibilities) && data.eligibilities.length > 0) setValue("eligibilities", data.eligibilities);
    if (Array.isArray(data.workExperiences) && data.workExperiences.length > 0) setValue("workExperiences", data.workExperiences);
    if (Array.isArray(data.learningDevelopments) && data.learningDevelopments.length > 0) setValue("learningDevelopments", data.learningDevelopments);
    if (Array.isArray(data.voluntaryWorks) && data.voluntaryWorks.length > 0) setValue("voluntaryWorks", data.voluntaryWorks);
    if (Array.isArray(data.references) && data.references.length > 0) setValue("references", data.references);
    if (Array.isArray(data.familyBackground) && data.familyBackground.length > 0) setValue("familyBackground", data.familyBackground);
    if (Array.isArray(data.otherInfo) && data.otherInfo.length > 0) setValue("otherInfo", data.otherInfo);
    if (data.declarations) setValue("declarations", data.declarations);

    // Forced defaults
    setValue("dutyType", "Standard");
    setValue("appointmentType", "Permanent");
    setValue("role", "Employee");
    setValue("certifiedCorrect", true);
  };

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    // 100% Zero-Validation: Biometric enrollment check removed for automated flow
    const formData = new FormData();
    const finalData = { ...data, employeeId: actualEmployeeId };

    Object.keys(finalData).forEach((key) => {
        const val = (finalData as any)[key];
        if (val !== undefined && val !== null && key !== 'avatar') {
            if (typeof val === 'object') formData.append(key, JSON.stringify(val));
            else formData.append(key, String(val));
        }
    });

    if (avatarRef.current?.files?.[0]) {
        formData.append("avatar", avatarRef.current.files[0]);
    }

    try {
      const response = await registerMutation.mutateAsync({ 
        data: formData, 
        mode: isFinalizingSetup ? 'finalize-setup' : undefined 
      });
      
      if (response.data?.data?.requiresVerification) {
          setVerificationEmail(data.email || "");
          setIsVerifyModalOpen(true);
      } else {
          toast.success("Account created! Redirecting to login...");
          setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <AuthLayout 
      title="Employee Registration" 
      subtitle="Official Portal Onboarding System"
      maxWidth="max-w-xl"
    >
      <SEO title="Registration" description="100% Automated PDS-based employee registration." />
      
      <div className="absolute top-4 right-4 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-[10px] font-black border border-gray-200 shadow-sm flex items-center gap-2">
         <div className="h-2 w-2 rounded-full bg-gray-400"></div>
         Next sequence: {isNextIdLoading ? 'Syncing...' : (actualEmployeeId || 'Pending')}
      </div>
      <div className="flex justify-start mb-6 -mt-2">
        <button 
          onClick={() => navigate("/login")}
          className="group flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-900 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to login
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8">
        
        {/* PDS Upload Area */}
        <div className="w-full bg-gray-900 rounded-xl p-8 flex flex-col items-center justify-center gap-6 shadow-2xl border border-gray-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-lg -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-white/10" />
            <div className="relative z-10 text-center space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight">Automated PDS extraction</h3>
                <p className="text-gray-400 text-xs max-w-sm mx-auto leading-relaxed font-medium">
                    Upload your official **PDS (CS Form 212)** to verify your identity and generate your record.
                </p>
            </div>
            
            <label className="relative z-10 flex items-center justify-center gap-3 px-8 h-12 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-black cursor-pointer transition-all shadow-lg active:scale-95 w-full">
                {isParsingPds ? <Loader2 className="animate-spin" size={20} /> : null}
                {isParsingPds ? 'Extracting data...' : 'Choose PDS file'}
                <input type="file" className="hidden" accept=".xlsx,.xls,.pdf" onChange={handlePdsUpload} disabled={isParsingPds} />
            </label>

            {pdsFileName && (
                <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] bg-slate-400/10 px-4 py-2 rounded-lg border border-slate-400/20">
                    {pdsFileName}
                </div>
            )}
        </div>

        {/* Dynamic Summary/Biometrics Slot */}
        {pdsExtracted ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Visible Identity Card (Restored) */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 border-b border-gray-50 pb-5">
                        <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center">
                            <span className="text-white font-black text-[10px]">ID</span>
                        </div>
                        <h4 className="text-sm font-black text-gray-900 tracking-tight">Extracted profile</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-600 mb-1.5 ml-1 block">Last name <span className="text-rose-500">*</span></label>
                            <input 
                                {...register("lastName")} 
                                className="w-full h-11 px-4 bg-gray-100/60 border-[1.5px] border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:ring-4 focus:ring-gray-100 focus:border-gray-800 focus:bg-white outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                            />
                            {errors.lastName && <p className="text-[9px] text-rose-500 font-bold ml-1">{errors.lastName.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-600 mb-1.5 ml-1 block">First name <span className="text-rose-500">*</span></label>
                            <input 
                                {...register("firstName")} 
                                className="w-full h-11 px-4 bg-gray-100/60 border-[1.5px] border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:ring-4 focus:ring-gray-100 focus:border-gray-800 focus:bg-white outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                            />
                            {errors.firstName && <p className="text-[9px] text-rose-500 font-bold ml-1">{errors.firstName.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-600 mb-1.5 ml-1 block">Middle name</label>
                            <input 
                                {...register("middleName")} 
                                className="w-full h-11 px-4 bg-gray-100/60 border-[1.5px] border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:ring-4 focus:ring-gray-100 focus:border-gray-800 focus:bg-white outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-600 mb-1.5 ml-1 block">Name extension (Optional)</label>
                            <input 
                                {...register("suffix")} 
                                className="w-full h-11 px-4 bg-gray-100/60 border-[1.5px] border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:ring-4 focus:ring-gray-100 focus:border-gray-800 focus:bg-white outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                            />
                        </div>
                    </div>

                    <div className="pt-5 border-t border-gray-100">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-600 mb-1.5 ml-1 block">Account password <span className="text-rose-500">*</span></label>
                            <input 
                                type="password" 
                                {...register("password")} 
                                placeholder="Create your password"
                                className="w-full h-11 px-4 bg-gray-100/60 border-[1.5px] border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:ring-4 focus:ring-gray-100 focus:border-gray-800 focus:bg-white outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                            />
                            {errors.password && <p className="text-[9px] text-rose-500 font-bold ml-1">{errors.password.message}</p>}
                        </div>
                    </div>
                </div>

            {/* BIOMETRICS SECTION */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8 flex flex-col items-center gap-5 shadow-sm relative overflow-hidden">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
                    <div className="text-white font-black text-xs">BIO</div>
                </div>
                <div className="text-center">
                    <h4 className="text-sm font-black text-gray-900 tracking-tight">Biometric identity link</h4>
                    <p className="text-[11px] text-gray-500 mt-1 max-w-[220px] font-medium leading-relaxed">Secure your presence by scanning your fingerprint for entry.</p>
                </div>

                {!bioEnrolled && (
                    <button 
                        type="button" 
                        onClick={() => {
                            setBioEnrolled(false); // 100% FIX: Reset state before starting new scan
                            enroll(actualEmployeeId, `${watch("firstName")} ${watch("lastName")}`, watch("department") || "Staff");
                        }}
                        disabled={!deviceConnected || enrollStep > 0}
                        className="bg-gray-900 h-12 text-white px-8 rounded-xl text-sm font-black hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center"
                    >
                        {enrollStep > 0 ? "Scanner initializing..." : "Start fingerprint scan"}
                    </button>
                )}
                
                {enrollError && <p className="text-[11px] text-rose-600 font-bold mt-2">{enrollError}</p>}
            </div>

            {/* EMPLOYMENT PLACEMENT SECTION */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-50 pb-5">
                    <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center">
                        <span className="text-white font-black text-[10px]">HR</span>
                    </div>
                    <h4 className="text-sm font-black text-gray-900 tracking-tight">HR & placement</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-600 mb-1.5 ml-1 block">Department</label>
                        <input {...register("department")} className="w-full h-11 px-4 bg-gray-100/60 border-[1.5px] border-gray-200 rounded-lg text-sm font-bold text-gray-900 outline-none transition-all cursor-not-allowed" readOnly />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-600 mb-1.5 ml-1 block">Position title</label>
                        <input {...register("position")} className="w-full h-11 px-4 bg-gray-100/60 border-[1.5px] border-gray-200 rounded-lg text-sm font-bold text-gray-900 outline-none transition-all cursor-not-allowed" readOnly />
                    </div>
                </div>
            </div>

            {/* Hidden Inputs for Form Submission (100% Automated Logic Support) */}
            <div className="hidden">
                <input {...register("employeeId")} />
                <input {...register("dutyType")} />
                <input {...register("birthDate")} />
                <input {...register("placeOfBirth")} />
                <input {...register("gender")} />
                <input {...register("civilStatus")} />
                <input {...register("mobileNo")} />
                <input {...register("telephoneNo")} />
                <input {...register("nationality")} />
                <input {...register("citizenship")} />
                <input {...register("citizenshipType")} />
                <input {...register("dualCountry")} />
                <input {...register("bloodType")} />
                <input {...register("heightM")} />
                <input {...register("weightKg")} />
                <input {...register("emergencyContact")} />
                <input {...register("emergencyContactNumber")} />
                
                {/* Address Infrastructure */}
                <input {...register("address")} />
                <input {...register("residentialAddress")} />
                <input {...register("resRegion")} />
                <input {...register("resProvince")} />
                <input {...register("resCity")} />
                <input {...register("resBarangay")} />
                <input {...register("resHouseBlockLot")} />
                <input {...register("resStreet")} />
                <input {...register("resSubdivision")} />
                <input {...register("residentialZipCode")} />
                
                <input {...register("permanentAddress")} />
                <input {...register("permRegion")} />
                <input {...register("permProvince")} />
                <input {...register("permCity")} />
                <input {...register("permBarangay")} />
                <input {...register("permHouseBlockLot")} />
                <input {...register("permStreet")} />
                <input {...register("permSubdivision")} />
                <input {...register("permanentZipCode")} />

                <input {...register("gsisNumber")} />
                <input {...register("pagibigNumber")} />
                <input {...register("philhealthNumber")} />
                <input {...register("tinNumber")} />
                <input {...register("umidNumber")} />
                <input {...register("agencyEmployeeNo")} />
            </div>

                <div className="bg-slate-50 rounded-lg p-4 flex gap-3 border border-slate-100">
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                        By proceeding, you certify that all data from your PDS and the corrections made above are accurate.
                    </p>
                </div>

                <button 
                  type="submit" 
                  disabled={!bioEnrolled || isSubmitting}
                  className="w-full h-14 bg-gray-900 text-white rounded-xl text-sm font-black shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : null}
                  Complete official registration
                </button>
            </div>
        ) : (
            <div className="py-20 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center text-center opacity-40">
                 <p className="text-[11px] font-black text-gray-400 tracking-widest">Waiting for document</p>
            </div>
        )}



        {/* Hidden Schema Helpers for other extracted data */}
        <div className="hidden">
            <input {...register("employeeId")} />
            <input {...register("position")} />
            <input {...register("role")} />
            <input {...register("dutyType")} />
            <input {...register("appointmentType")} />
            <input {...register("certifiedCorrect")} />
        </div>
      </form>

      <EmailVerificationModal isOpen={isVerifyModalOpen} email={verificationEmail} onClose={() => navigate("/login")} />
    </AuthLayout>
  );
}
