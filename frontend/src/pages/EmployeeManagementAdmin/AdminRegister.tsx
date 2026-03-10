import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { 
  ArrowLeft, Fingerprint, Upload, CheckCircle2, 
  AlertCircle, Loader2, Lock, Check, X, 
  Facebook, Twitter, Linkedin 
} from "lucide-react";

import { RegisterSchema, RegisterInput } from "@/schemas/authSchema";
import { useBiometricDevice } from "@/hooks/useBiometricDevice";
import { useRegisterMutation } from "@/hooks/useAuthQueries";
import { useAuth } from "@hooks/useAuth";
import { useBarangaysQuery, useDepartmentsQuery, usePositionsQuery, useNextEmployeeIdQuery, useEmploymentMetadataQuery } from "@/hooks/useCommonQueries";
import { recruitmentApi } from '@/api/recruitmentApi';
import type { HiredApplicant } from '@/types/recruitment_applicant';

import Combobox from "@/components/Custom/Combobox";
import ConfirmationModal from '@/components/CustomUI/ConfirmationModal';
import { PhilippineAddressSelector } from '@/components/Custom/Shared/PhilippineAddressSelector';
import HiredApplicantsListModal from '@/components/Custom/EmployeeManagement/Admin/Modals/HiredApplicantsListModal';
import ph from 'phil-reg-prov-mun-brgy';

import { EDUCATION_LEVELS } from '@/schemas/recruitment';

type EducationLevel = typeof EDUCATION_LEVELS[number] | "";

/* eslint-disable @typescript-eslint/naming-convention */
interface PhilAddressLibraryLocal {
  regions: { name: string; reg_code: string }[];
  provinces: { name: string; prov_code: string }[];
  city_mun: { name: string; mun_code: string }[];
  barangays: { name: string; mun_code: string }[];
}
/* eslint-enable @typescript-eslint/naming-convention */

type RegisterFormValues = RegisterInput & {
  avatar?: File;
  applicantId?: number;
  applicantHiredDate?: string;
  applicantPhotoPath?: string;
  ignoreDuplicateWarning?: boolean;
  
  resRegion?: string;
  resProvince?: string;
  resCity?: string;
  resBrgy?: string;
  resHouseBlockLot?: string;
  resSubdivision?: string;
  resStreet?: string;
  
  permRegion?: string;
  permProvince?: string;
  permCity?: string;
  permBrgy?: string;
  permHouseBlockLot?: string;
  permSubdivision?: string;
  permStreet?: string;

  facebookUrl?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  
  agencyEmployeeNo?: string;
  schoolName?: string;
  course?: string;
  yearGraduated?: string;

  gsisNumber?: string;
  pagibigNumber?: string;
  philhealthNumber?: string;
  umidNumber?: string;
  philsysId?: string;
  tinNumber?: string;
  
  nationality?: string;
  placeOfBirth?: string;
  birthDate?: string;
  bloodType?: string;
  heightM?: string;
  weightKg?: string;
  mobileNo?: string;
  telephoneNo?: string;
};

export default function AdminRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // URL Params
  const queryDutiesRaw = searchParams.get('duties');
  const queryDuties = (queryDutiesRaw === 'Standard' || queryDutiesRaw === 'Irregular') ? queryDutiesRaw : null;
  const queryType = searchParams.get('type'); // 'hired' or 'old'
  const queryDept = searchParams.get('dept');
  const queryMode = searchParams.get('mode');

  const duties = queryDuties || 'Standard';
  const isHiredType = queryType === 'hired';
  
  const { user: authUser, checkAuth } = useAuth();
  
  // Robust Detection: Use both URL mode and user's profile status
  const isFinalizingSetup = queryMode === 'finalize-setup' || authUser?.profileStatus === 'Initial';

  // State
  const [showHiredModal, setShowHiredModal] = useState(isHiredType);
  const [matchedApplicant, setMatchedApplicant] = useState<HiredApplicant | null>(null);
  
  const registerMutation = useRegisterMutation();
  const loading = registerMutation.isPending;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      employeeId: "", firstName: "", lastName: "", middleName: "", suffix: "", email: "", password: "",
      educationalBackground: "", address: "", residentialZipCode: "", permanentAddress: "", permanentZipCode: "",
      emergencyContact: "", emergencyContactNumber: "", isMeycauayan: "false", barangay: "",
      department: queryDept || "",
      position: "",
      role: "Employee",
      gender: "",
      civilStatus: "",
      dutyType: (duties === 'Standard' || duties === 'Irregular' ? duties : 'Standard'),
      appointmentType: "",
      yearsOfExperience: "", experience: "", skills: "", eligibilityType: "", eligibilityNumber: "", eligibilityDate: "",
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

  const { data: nextEmployeeId } = useNextEmployeeIdQuery();
  const actualEmployeeId = nextEmployeeId || "1";
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bioEnrolled, setBioEnrolled] = useState(false);
  const [_unusedReset, _setResetModalOpen] = useState(false);
  const [enrollStep, setEnrollStep] = useState(0);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFinalizingSetup && actualEmployeeId) {
      setValue("employeeId", String(actualEmployeeId));
    }
  }, [actualEmployeeId, isFinalizingSetup, setValue]);

  useBarangaysQuery();
  const { data: departments = [] } = useDepartmentsQuery();
  const { data: positions = [] } = usePositionsQuery();
  const { data: empMetadata } = useEmploymentMetadataQuery();

  // Track if address is pre-filled as a raw string from Applicant record
  const [_unusedAddress, _setIsAddressPrefilled] = useState(false);
  const [prefilledAddress, setPrefilledAddress] = useState("");
  const [prefilledPermanentAddress, setPrefilledPermanentAddress] = useState("");

  const { status: bioStatus, deviceConnected, enroll } = useBiometricDevice({
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
  const avatarRef = useRef<HTMLInputElement>(null);

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

  const extractName = <T extends { name: string }>(arr: T[], key: keyof T, val: string): string => arr.find(x => String(x[key]) === val)?.name || '';
  
  const formatAddr = (reg: string, prov: string, city: string, brgy: string, house: string, subd: string, street: string) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const lib = ph as unknown as PhilAddressLibraryLocal;
      const rName = extractName(lib.regions, 'reg_code', reg);
      const pName = extractName(lib.provinces, 'prov_code', prov);
      const cName = extractName(lib.city_mun, 'mun_code', city);
      const bName = extractName(lib.barangays, 'name', brgy);
      return [house, subd, street, bName, cName, pName, rName].filter(Boolean).join(', ');
  };

  // Real-time residential address and validation fixes
  useEffect(() => {
      // If we have prefilled raw address strings, we skip the dynamic selector logic to avoid overwriting
      if (prefilledAddress || (isFinalizingSetup && authUser?.address)) {
          if (!watch("barangay")) setValue("barangay", "Prefilled"); // Bypass Zod Validation
          return;
      }
      
      const addr = formatAddr(resRegion||'', resProvince||'', resCity||'', resBrgy||'', resHouse||'', resSubd||'', resStreet||'');
      if (addr) {
          setValue("address", addr);
          setValue("residentialAddress", addr);
      }
      if (resBrgy) {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const lib = ph as unknown as PhilAddressLibraryLocal;
          setValue("barangay", extractName(lib.barangays, 'name', resBrgy));
      } else {
          setValue("barangay", "");
      }
  }, [resRegion, resProvince, resCity, resBrgy, resHouse, resSubd, resStreet, setValue, prefilledAddress, isFinalizingSetup, authUser]);

  // Real-time permanent address
  useEffect(() => {
      if (prefilledPermanentAddress || (isFinalizingSetup && authUser?.permanentAddress)) {
          return;
      }
      
      const addr = formatAddr(permRegion||'', permProvince||'', permCity||'', permBrgy||'', permHouse||'', permSubd||'', permStreet||'');
      if (addr) {
          setValue("permanentAddress", addr);
      }
  }, [permRegion, permProvince, permCity, permBrgy, permHouse, permSubd, permStreet, setValue, prefilledPermanentAddress, isFinalizingSetup, authUser]);

  // Eligibility auto-population removed or simplified if needed, keeping manual selection for admin
  
  // Handle Selection from Modal
  const handleSelectApplicant = async (applicantId: number) => {
    try {
      const dutyResponse = await recruitmentApi.getHiredApplicantsByDuty<HiredApplicant>(duties);
      const applicants = dutyResponse.data.applicants;
      const applicant = applicants.find((a: HiredApplicant) => a.id === applicantId);

      if (applicant) {
        setMatchedApplicant(applicant);
        handlePreFill(applicant);
        setShowHiredModal(false);
      }
    } catch {
       toast.error("Failed to load applicant details.");
    }
  };

  const handlePreFill = (applicant: HiredApplicant) => {
    setValue("firstName", applicant.firstName || "");
    setValue("lastName", applicant.lastName || "");
    setValue("middleName", applicant.middleName || "");
    setValue("suffix", applicant.suffix || "");
    setValue("email", applicant.email || "");
    
    // Removed autoGenPassword as per user request to manually encode it
    setValue("password", "");
    
    // Auto-populate Job Applied
    if (applicant.department) setValue("department", applicant.department);
    if (applicant.jobTitle) setValue("position", applicant.jobTitle);

    // Pre-fill Duty and Appointment from Job Posting
    if (applicant.dutyType) {
        setValue("dutyType", applicant.dutyType as RegisterFormValues["dutyType"]);
    }
    if (applicant.employmentType) {
        setValue("appointmentType", applicant.employmentType as RegisterFormValues["appointmentType"]);
    }
    
    if (applicant.birthDate) {
        setValue("birthDate", applicant.birthDate.split('T')[0]);
    }
    setValue("placeOfBirth", applicant.birthPlace || "");
    setValue("gender", applicant.sex || "");
    setValue("civilStatus", applicant.civilStatus || "");
    setValue("bloodType", applicant.bloodType || "");
    setValue("heightM", applicant.height || "");
    setValue("weightKg", applicant.weight || "");
    setValue("mobileNo", applicant.phoneNumber || "");

    setValue("gsisNumber", applicant.gsisNumber || "");
    setValue("pagibigNumber", applicant.pagibigNumber || "");
    setValue("philhealthNumber", applicant.philhealthNumber || "");
    setValue("umidNumber", applicant.umidNumber || "");
    setValue("philsysId", applicant.philsysId || "");
    setValue("tinNumber", applicant.tinNumber || "");

    setValue("emergencyContact", applicant.emergencyContact || "");
    setValue("emergencyContactNumber", applicant.emergencyContactNumber || "");
 
    let eduLevelValue = applicant.educationalBackground || "";
    if (eduLevelValue) {
        // Unescape common HTML entities that come from sanitizeInput
        eduLevelValue = eduLevelValue
            .replace(/&#039;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
    }
    const isEduLevel = (val: string): val is EducationLevel => 
        (EDUCATION_LEVELS).some(x => x === val);
    setValue("educationalBackground", isEduLevel(eduLevelValue) ? eduLevelValue : "");
    setValue("schoolName", applicant.schoolName || "");
    setValue("course", applicant.course || "");
    setValue("yearGraduated", applicant.yearGraduated || "");
    setValue("experience", applicant.experience || "");
    setValue("skills", applicant.skills || "");
    setValue("yearsOfExperience", applicant.totalExperienceYears?.toString() || "");

    setValue("eligibilityType", applicant.eligibilityType || "");
    setValue("eligibilityNumber", applicant.licenseNo || "");
    if (applicant.eligibilityDate) {
        setValue("eligibilityDate", applicant.eligibilityDate.split('T')[0]);
    }
    
    if (applicant.address) {
        setPrefilledAddress(applicant.address);
        setValue("address", applicant.address);
        setValue("residentialAddress", applicant.address);
        setValue("resStreet", ""); // clear street to prevent leak into forms
    }
    if (applicant.zipCode) {
        setValue("residentialZipCode", applicant.zipCode);
    }

    if (applicant.permanentAddress) {
        setPrefilledPermanentAddress(applicant.permanentAddress);
        setValue("permanentAddress", applicant.permanentAddress);
        setValue("permStreet", ""); // clear street to prevent leak
    }
    if (applicant.permanentZipCode) {
        setValue("permanentZipCode", applicant.permanentZipCode);
    }
    
    setValue("mobileNo", applicant.phoneNumber || "");
    setValue("emergencyContactNumber", applicant.phoneNumber || "");

    setValue("isMeycauayan", applicant.isMeycauayanResident ? "true" : "false");

    if (applicant.photoUrl) {
        setAvatarPreview(applicant.photoUrl);
    }

    setValue("applicantId", applicant.id);
    if (applicant.hiredDate) {
        setValue("applicantHiredDate", applicant.hiredDate.split('T')[0]);
    }
    if (applicant.photoPath) {
        setValue("applicantPhotoPath", applicant.photoPath);
    }

    toast.success(`Form pre-filled with ${applicant.firstName}'s data!`);
  };

  /**
   * Auto-population Logic for Setup Finalization (Administrative Roles)
   */
  useEffect(() => {
    // Trigger if in explicit mode OR if the logged in user is still initializing their profile
    const shouldPreFill = isFinalizingSetup || authUser?.profileStatus === 'Initial';
    
    if (shouldPreFill && authUser) {
      // Basic Info
      if (authUser.firstName) setValue("firstName", authUser.firstName);
      if (authUser.lastName) setValue("lastName", authUser.lastName);
      if (authUser.middleName) setValue("middleName", authUser.middleName);
      if (authUser.suffix) setValue("suffix", authUser.suffix);
      if (authUser.email) setValue("email", authUser.email);

      // Work Info
      if (authUser.department) setValue("department", authUser.department);
      if (authUser.role) setValue("role", authUser.role);
      
      if (authUser.jobTitle && positions.length > 0) {
          const userJobTitle = authUser.jobTitle;
          // Attempt to find a matching position in the loaded positions list
          const matchingPos = positions.find(p => {
              const fullTitle = `${p.positionTitle} (${p.itemNumber})`;
              return p.positionTitle === userJobTitle || 
                     fullTitle === userJobTitle ||
                     userJobTitle.startsWith(p.positionTitle);
          });
          
          if (matchingPos) {
              setValue("position", `${matchingPos.positionTitle} (${matchingPos.itemNumber})`);
          } else {
              setValue("position", userJobTitle);
          }
      }

      // Visual Pre-fill: We leave it blank so the placeholder "••••••••" shows
      if (shouldPreFill) {
          setValue("password", "");
      }

      // Personal Details
      if (authUser.birthDate) {
          const bday = authUser.birthDate.includes('T') ? authUser.birthDate.split('T')[0] : authUser.birthDate;
          setValue("birthDate", bday);
      }
      if (authUser.gender) {
          const gender = authUser.gender;
          if (gender === "Male" || gender === "Female") setValue("gender", gender);
      }
      if (authUser.civilStatus) {
          const status = authUser.civilStatus;
          const validStatuses = ["Single", "Married", "Widowed", "Separated", "Annulled"] as const;
          const isValidStatus = (s: string): s is typeof validStatuses[number] => 
              validStatuses.some(v => v === s);
          if (isValidStatus(status)) setValue("civilStatus", status);
      }
      if (authUser.nationality) setValue("nationality", authUser.nationality);
      if (authUser.bloodType) setValue("bloodType", authUser.bloodType);
      if (authUser.heightM) setValue("heightM", String(authUser.heightM));
      if (authUser.weightKg) setValue("weightKg", String(authUser.weightKg));

      // Contact
      if (authUser.mobileNo) setValue("mobileNo", authUser.mobileNo);
      if (authUser.telephoneNo) setValue("telephoneNo", authUser.telephoneNo);
      
      // Address
      if (authUser.address) {
          setValue("address", authUser.address);
          setValue("residentialAddress", authUser.address);
          _setIsAddressPrefilled(true);
          setPrefilledAddress(authUser.address);
      }
      if (authUser.permanentAddress) {
          setValue("permanentAddress", authUser.permanentAddress);
          setPrefilledPermanentAddress(authUser.permanentAddress);
      }

      // IDs
      if (authUser.gsisNumber) {
          setValue("gsisNumber", authUser.gsisNumber);
      }
      if (authUser.pagibigNumber    ) {
          setValue("pagibigNumber", authUser.pagibigNumber);
      }
      if (authUser.philhealthNumber) {
          setValue("philhealthNumber", authUser.philhealthNumber);
      }
      if (authUser.umidNumber) setValue("umidNumber", authUser.umidNumber);
      if (authUser.philsysId) setValue("philsysId", authUser.philsysId);
      if (authUser.tinNumber) {
          setValue("tinNumber", authUser.tinNumber);
      }

      // Emergency
      if (authUser.emergencyContact) setValue("emergencyContact", authUser.emergencyContact);
      if (authUser.emergencyContactNumber) setValue("emergencyContactNumber", authUser.emergencyContactNumber);

      // Duty & Appointment
      if (authUser.dutyType) {
          const duty = authUser.dutyType;
          if (duty === "Standard" || duty === "Irregular") setValue("dutyType", duty);
      }
      if (authUser.appointmentType) {
          const appt = authUser.appointmentType;
          const validAppts = ['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary', 'Contract of Service', 'JO', 'COS'] as const;
          const isValidAppt = (a: string): a is typeof validAppts[number] => 
              (validAppts).some(x => x === a);
          if (isValidAppt(appt)) setValue("appointmentType", appt);
      }

      // Background
      if (authUser.educationalBackground) {
          const eduValue = authUser.educationalBackground;
          const isEduLevelValue = (val: string): val is EducationLevel => 
              (EDUCATION_LEVELS).some(x => x === val);
          if (isEduLevelValue(eduValue)) setValue("educationalBackground", eduValue);
      }

      // If we are actually forced into this mode, show success
      if (isFinalizingSetup) {
        toast.success("Form pre-filled from your portal setup data!");
      }
    }
  }, [isFinalizingSetup, authUser, setValue, positions]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      setValue("avatar", file);
    }
  };

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data: RegisterFormValues) => {
    if (!bioEnrolled) {
        toast.error("Please enroll fingerprint first!");
        document.getElementById('biometrics-section')?.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    const formData = new FormData();

    if (prefilledPermanentAddress) {
        data.permanentAddress = prefilledPermanentAddress;
    }

    if (prefilledAddress) {
        data.residentialAddress = prefilledAddress;
        data.address = prefilledAddress;
    }

    const ignoreKeys = ['avatar', 'employeeId'];

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    (Object.keys(data) as Array<keyof RegisterFormValues>).forEach((key) => {
        const value = data[key];
        const keyStr: string = key;
        if (!ignoreKeys.includes(keyStr) && value !== undefined && value !== null) {
            formData.append(keyStr, String(value));
        }
    });
    formData.append("employeeId", data.employeeId || actualEmployeeId);
    if (avatarRef.current?.files?.[0]) {
        formData.append("avatar", avatarRef.current.files[0]);
    }

    if (data.applicantId) formData.append("applicantId", String(data.applicantId));
    if (data.applicantHiredDate) formData.append("applicantHiredDate", data.applicantHiredDate);
    if (data.applicantPhotoPath) formData.append("applicantPhotoPath", data.applicantPhotoPath);

    try {
      setIsSubmitting(true);
      await registerMutation.mutateAsync({ 
        data: formData, 
        mode: isFinalizingSetup ? 'finalize-setup' : undefined 
      });
      if (isFinalizingSetup) {
          await checkAuth();
      } else {
          // 100% Cleanup: Ensure no temp data stays for the next employee registration
          sessionStorage.clear();
      }
      toast.success("Employee Record Created Successfully!");
      navigate(`/admin-dashboard/departments?department=${queryDept || ''}`); // Return to department
    } catch (error) {
      console.error(error);
      let msg = "Registration failed";
      
      interface ZodFieldError { path: string[]; message: string }
      interface ServerErrorData { code?: string; errors?: ZodFieldError[] }
      interface ServerError { response?: { data?: ServerErrorData } }

      const isServerError = (err: unknown): err is ServerError => 
          typeof err === 'object' && err !== null && 'response' in err;
      
      if (isServerError(error)) {
          const resData = error.response?.data;

          if (resData?.code === 'DUPLICATE_NAME') {
              setShowDuplicateModal(true);
              setIsSubmitting(false);
              return;
          }

          if (resData?.errors && Array.isArray(resData.errors)) {
              msg = resData.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(' | ');
          }
      }
      
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDuplicateRegistration = () => {
      setShowDuplicateModal(false);
      setValue("ignoreDuplicateWarning", true);
      handleSubmit(onSubmit)();
  };

  const inputClass = "w-full px-3 py-2 bg-white border border-gray-300 rounded-md outline-none font-medium text-sm text-slate-700";
  const errorClass = "!border-red-500 ring-2 ring-red-100";
  const cardClass = "bg-white rounded-2xl border border-gray-100 p-6 shadow-sm";
  const cardHeaderClass = "text-sm font-bold text-gray-800 uppercase tracking-wider mb-5 flex items-center gap-2 pb-3 border-b border-gray-100";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col font-sans animate-in fade-in duration-300">
      
      {/* Return to Department Header */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-10">
        <button 
            onClick={() => navigate(`/admin-dashboard/departments?department=${queryDept}`)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 font-medium text-sm"
        >
            <ArrowLeft size={16} />
            Back to {queryDept || 'Departments'}
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1600px] xl:max-w-[88vw] mx-auto pt-14 md:pt-10 px-4 md:px-0">
        
        {/* Header */}
        <div className="w-full mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    Employee Registration
                </h1>
                <p className="text-gray-500 mt-2 text-lg">
                    {isHiredType 
                        ? "Registering a newly hired applicant into the employee database."
                        : "Manually encoding an existing employee into the system."}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        Duty: {watch("dutyType")}
                    </span>
                    {watch("appointmentType") && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            Type: {watch("appointmentType")}
                        </span>
                    )}
                    {queryDept && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                            Dept: {queryDept}
                        </span>
                    )}
                </div>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col lg:flex-row gap-8 items-start">
                
              {/* Left Column: Form Section */}
              <div className="flex-1 w-full space-y-6">
                
              {/* Profile Photo & Employee ID section */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                 <div className="flex-shrink-0 relative group">
                    <div className="w-32 h-32 rounded-[2rem] bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400 group-hover:bg-blue-50">
                       {avatarPreview ? (
                          <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                       ) : (
                          <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                       )}
                    </div>
                    <input type="file" ref={avatarRef} onChange={handleAvatarChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/jpeg,image/png,image/webp" />
                 </div>
                 <div className="flex-1 w-full space-y-4">
                    <div>
                       <h3 className="text-lg font-bold text-gray-900">Employee Identification</h3>
                       <p className="text-sm text-gray-500">Official system ID and photo for the user.</p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800 font-medium leading-relaxed">
                          Please use this <strong className="font-extrabold text-blue-900">EXACT Employee ID ({actualEmployeeId})</strong> when enrolling the fingerprint on the biometric device to strictly ensure accurate pairing.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="text-xs font-semibold text-gray-600 block mb-1.5 ml-1">System Employee ID</label>
                            <div className="flex bg-gray-100 border border-gray-200 rounded-lg overflow-hidden transition-all opacity-90 cursor-not-allowed">
                                <span className="flex items-center px-4 bg-gray-200 border-r border-gray-300 text-gray-600 font-mono font-bold text-sm">EMP-</span>
                                <input {...register("employeeId")} readOnly className="w-full bg-transparent text-gray-900 font-bold text-sm p-2.5 outline-none font-mono cursor-not-allowed" placeholder={actualEmployeeId || "Auto-generated"} />
                            </div>
                        </div>
                        <div className="relative">
                            <label className="text-xs font-semibold text-gray-600 block mb-1.5 ml-1">Current Role Status <span className="text-red-500">*</span></label>
                            <input {...register("role")} readOnly className={`${inputClass} bg-gray-50 border-gray-200 cursor-not-allowed font-bold text-blue-600`} />
                        </div>
                    </div>
                 </div>
              </div>

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
                      className={`${inputClass} ${errors.email ? errorClass : ''} ${isFinalizingSetup ? 'bg-gray-100 cursor-not-allowed opacity-80' : ''}`} 
                      placeholder="" 
                      readOnly={isFinalizingSetup}
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
                      className={`${inputClass} ${errors.password ? errorClass : ''}`}
                      placeholder=""
                    />
                  </div>
                  {errors.password && <p className="text-red-500 text-[11px] ml-1">{errors.password.message}</p>}
                </div>
             </div>
          </div>

          <div className={cardClass}>
             <h4 className={cardHeaderClass}>Personal Information</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 ml-1">Last Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                      <input {...register("lastName")} autoComplete="family-name" className={`${inputClass} ${errors.lastName ? errorClass : ''}`} placeholder="" />
                  </div>
                  {errors.lastName && <p className="text-red-500 text-[11px] ml-1">{errors.lastName.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 ml-1">First Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                      <input {...register("firstName")} autoComplete="given-name" className={`${inputClass} ${errors.firstName ? errorClass : ''}`} placeholder="" />
                  </div>
                  {errors.firstName && <p className="text-red-500 text-[11px] ml-1">{errors.firstName.message}</p>}
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Middle Name</label>
                   <div className="relative">
                      <input {...register("middleName")} autoComplete="additional-name" className={`${inputClass}`} placeholder="" />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Suffix</label>
                   <div className="relative">
                      <input {...register("suffix")} autoComplete="honorific-suffix" className={`${inputClass}`} placeholder="" />
                   </div>
                </div>
             </div>

             <div className="pt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Birth Date</label>
                   <div className="relative">
                      <input type="date" {...register("birthDate")} className={`${inputClass}`} />
                   </div>
                </div>
                
                <div className="space-y-1 col-span-2 md:col-span-2">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Place of Birth <span className="text-red-500">*</span></label>
                   <div className="relative">
                      <input {...register("placeOfBirth")} className={`${inputClass} ${errors.placeOfBirth ? errorClass : ''}`} placeholder="" />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Gender <span className="text-red-500">*</span></label>
                   <select {...register("gender")} className={`${inputClass} ${errors.gender ? errorClass : ''}`}>
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                   </select>
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Civil Status <span className="text-red-500">*</span></label>
                   <select {...register("civilStatus")} className={`${inputClass} ${errors.civilStatus ? errorClass : ''}`}>
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
                   <input {...register("nationality")} className={`${inputClass}`} placeholder="" />
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Blood Type</label>
                   <select {...register("bloodType")} className={`${inputClass} ${errors.bloodType ? errorClass : ''}`}>
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
                   <input type="number" step="0.01" {...register("heightM")} className={`${inputClass}`} placeholder="" />
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Weight (kg)</label>
                   <input type="number" step="0.1" {...register("weightKg")} className={`${inputClass}`} placeholder="" />
                </div>
             </div>
          </div>

          <div className={cardClass}>
             <h4 className={cardHeaderClass}>Contact & Address</h4>
             
             <div className="space-y-3 pb-3 border-b border-gray-100 mb-6">
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
                        <div className="flex justify-between items-center mb-2 mt-4">
                            <h5 className="text-sm font-bold text-gray-700">Residential Address</h5>
                            <button 
                              type="button" 
                              onClick={() => {
                                  _setIsAddressPrefilled(false);
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
                          className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl focus:border-green-600 outline-none text-sm font-medium text-gray-700 placeholder:text-gray-400 !pl-3 h-20 cursor-not-allowed resize-none"
                        />
                        <p className="text-[10px] text-gray-500 mt-1 italic">
                          This address was auto-populated from your application. Click Edit to change location branches.
                        </p>
                     </div>
                 ) : isMeycauayan ? (
                    <div className="pb-4 border-b border-gray-100">
                        <h5 className="text-sm font-bold text-gray-700 mb-2 mt-4">Residential Address (Meycauayan)</h5>
                        <PhilippineAddressSelector prefix="res" register={register} watch={watch} setValue={setValue} errors={errors} inputClass={inputClass} isMeycauayanOnly={true} />
                    </div>
                 ) : (
                    <div className="pb-4 border-b border-gray-100">
                        <h5 className="text-sm font-bold text-gray-700 mb-2 mt-4">Residential Address</h5>
                        <PhilippineAddressSelector prefix="res" register={register} watch={watch} setValue={setValue} errors={errors} inputClass={inputClass} />
                    </div>
                 )}

             <div className="pt-4 border-b border-gray-100 pb-4">
                 {prefilledPermanentAddress ? (
                     <div>
                        <h5 className="text-sm font-bold text-gray-700 mb-2 mt-2">Permanent Address</h5>
                        <textarea
                          readOnly
                          value={prefilledPermanentAddress}
                          className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl focus:border-green-600 outline-none text-sm font-medium text-gray-700 placeholder:text-gray-400 !pl-3 h-20 cursor-not-allowed resize-none"
                        />
                     </div>
                 ) : (
                     <>
                         <h5 className="text-sm font-bold text-gray-700 mb-2 mt-2">Permanent Address</h5>
                         <PhilippineAddressSelector prefix="perm" register={register} watch={watch} setValue={setValue} errors={errors} inputClass={inputClass} />
                     </>
                 )}
             </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Mobile Number</label>
                   <div className="relative">
                      <input {...register("mobileNo")} className={`${inputClass}`} placeholder="" />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Telephone Number</label>
                   <div className="relative">
                      <input {...register("telephoneNo")} className={`${inputClass}`} placeholder="" />
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 mt-2 bg-red-50/50 rounded-xl border border-red-100">
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-red-600 ml-1 flex items-center gap-1">Emergency Contact Person <span className="text-red-500">*</span></label>
                   <input {...register("emergencyContact")} className={`${inputClass} !border-red-200 focus:!border-red-500 ${errors.emergencyContact ? errorClass : ''}`} placeholder="Full Name" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-red-600 ml-1">Emergency Phone Number <span className="text-red-500">*</span></label>
                   <input {...register("emergencyContactNumber")} className={`${inputClass} !border-red-200 focus:!border-red-500 ${errors.emergencyContactNumber ? errorClass : ''}`} placeholder="09XX XXX XXXX" />
                </div>
             </div>
          </div>

          <div className={cardClass}>
             <h4 className={cardHeaderClass}>Government Identification</h4>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">GSIS ID No.</label>
                   <input {...register("gsisNumber")} className={`${inputClass}`} placeholder="" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">PAG-IBIG No.</label>
                   <input {...register("pagibigNumber")} className={`${inputClass}`} placeholder="" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">PhilHealth No.</label>
                   <input {...register("philhealthNumber")} className={`${inputClass}`} placeholder="" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">UMID ID</label>
                   <input {...register("umidNumber")} className={`${inputClass}`} placeholder="" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">PHILSYS ID</label>
                   <input {...register("philsysId")} className={`${inputClass}`} placeholder="" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">TIN No.</label>
                   <input {...register("tinNumber")} className={`${inputClass}`} placeholder="" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Agency Employee No.</label>
                   <input {...register("agencyEmployeeNo")} className={`${inputClass}`} placeholder="" />
                </div>
             </div>
          </div>

          <div className={cardClass}>
             <h4 className={cardHeaderClass}>Educational Background</h4>
             <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Highest Degree/Level Attained</label>
                   <select 
                       {...register("educationalBackground")} 
                       className={`${inputClass}`}
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
                      <input {...register("schoolName")} className={`${inputClass}`} placeholder="e.g. Bulacan State University" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600 ml-1">Year Graduated</label>
                      <input {...register("yearGraduated")} className={`${inputClass}`} placeholder="e.g. 2020" />
                   </div>
                </div>

                {watch("educationalBackground") && !["Elementary School Graduate", "High School Graduate", "Senior High School Graduate"].includes(watch("educationalBackground") || "") && (
                    <div className="space-y-1">
                       <label className="text-xs font-semibold text-gray-600 ml-1">Course / Degree</label>
                       <input {...register("course")} className={`${inputClass}`} placeholder="e.g. BS in Information Technology" />
                    </div>
                )}
             </div>
          </div>

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
                         buttonClassName="pl-3"
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
                         buttonClassName="pl-3"
                     />
                 </div>
                 <div className="md:col-span-1">
                      <label className="text-xs font-semibold text-gray-600 ml-1 mb-1 block">Type of Duties</label>
                       <select 
                        {...register("dutyType")} 
                        className={`${inputClass} bg-gray-50 font-bold`}
                      >
                        {empMetadata?.dutyTypes.map((dt) => (
                            <option key={dt} value={dt}>{dt}</option>
                        ))}
                        {!empMetadata && (
                            <>
                                <option value="Standard">Standard</option>
                                <option value="Irregular">Irregular</option>
                            </>
                        )}
                      </select>
                 </div>
                  <div className="md:col-span-1">
                      <label className="text-xs font-semibold text-gray-600 ml-1 mb-1 block">Appointment Type / Schedule</label>
                       <select 
                        {...register("appointmentType")} 
                        className={`${inputClass} bg-gray-50 font-bold`}
                      >
                        <option value="">Select type...</option>
                        {empMetadata?.appointmentTypes.map((at) => (
                            <option key={at} value={at}>{at}</option>
                        ))}
                        {!empMetadata && (
                            <>
                                <option value="Permanent">Permanent</option>
                                <option value="Job Order">Job Order</option>
                                <option value="Casual">Casual</option>
                                <option value="Contract of Service">Contract of Service</option>
                                <option value="Contractual">Contractual</option>
                                <option value="Coterminous">Coterminous</option>
                                <option value="Temporary">Temporary</option>
                            </>
                        )}
                      </select>
                  </div>
              </div>
              
              {/* Portal Login Details removed as Email & Password are in Account Details section */}
          </div>

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

          <div className={cardClass}>
             <h4 className={cardHeaderClass}>Eligibility & Experience</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">CSC Eligibility Type</label>
                   <select {...register("eligibilityType")} className={`${inputClass}`}>
                      <option value="none">None / Not Applicable</option>
                      <option value="csc_prof">CSC Professional</option>
                      <option value="csc_sub">CSC Subprofessional</option>
                      <option value="ra_1080">RA 1080 (Board/Bar)</option>
                      <option value="special_laws">Special Laws</option>
                      <option value="drivers_license">Driver's License</option>
                      <option value="tesda">TESDA NC II/III</option>
                      <option value="others">Others</option>
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Eligibility Number / License No.</label>
                   <input {...register("eligibilityNumber")} className={`${inputClass}`} placeholder="e.g. 123456" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Date of Examination / Conferment</label>
                   <input type="date" {...register("eligibilityDate")} className={`${inputClass}`} />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Cumulative Years of Experience</label>
                   <input type="number" step="0.5" {...register("yearsOfExperience")} className={`${inputClass}`} placeholder="e.g. 3.5" />
                </div>
                <div className="space-y-1 md:col-span-2">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Work Experience Log</label>
                   <textarea {...register("experience")} rows={3} className={`${inputClass}`} placeholder="List roles and responsibilities..." />
                </div>
                <div className="space-y-1 md:col-span-2">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Core Competencies / Skills</label>
                   <textarea {...register("skills")} rows={2} className={`${inputClass}`} placeholder="List key skills..." />
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Biometrics & Submit */}
        <div className="w-full lg:w-[420px] shrink-0 space-y-6 lg:sticky lg:top-8">
          
          {/* Biometrics Enroll */}
          <div id="biometrics-section" className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center justify-center gap-6 shadow-sm relative">
              <button 
                  type="button"
                  onClick={() => _setResetModalOpen(true)}
                  className="absolute top-4 right-4 text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase tracking-wider transition-colors"
                  title="Reset Device and DB"
              >
                  Reset Scanner
              </button>

              <div className="flex-1 text-left md:pr-8">
                  <h3 className="font-bold text-xl text-gray-900 flex items-center gap-3 mb-2">
                      <Fingerprint className={bioEnrolled ? 'text-green-600' : 'text-blue-600'} size={28} /> 
                      {bioEnrolled ? "Biometric Captured" : "Fingerprint Setup"}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                      Secure this account by registering the employee's fingerprint. This will be used for attendance tracking and authorization.
                  </p>
                  
                  <div className="flex gap-4 mb-6">
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 flex-1">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                              enrollStep >= 1 || bioEnrolled ? 'bg-green-500 border-green-500 text-white' : 
                              enrollError && enrollStep === 0 ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 text-gray-300'
                          }`}>
                              {(enrollStep >= 1 || bioEnrolled) && <Check size={12} strokeWidth={3} />}
                              {enrollError && enrollStep === 0 && <X size={12} strokeWidth={3} />}
                          </div>
                          <span className="text-xs font-bold text-gray-700">Initial Scan</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 flex-1">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                              enrollStep >= 2 || bioEnrolled ? 'bg-green-500 border-green-500 text-white' : 
                              enrollError && enrollStep === 1 ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 text-gray-300'
                          }`}>
                              {(enrollStep >= 2 || bioEnrolled) && <Check size={12} strokeWidth={3} />}
                              {enrollError && enrollStep === 1 && <X size={12} strokeWidth={3} />}
                          </div>
                          <span className="text-xs font-bold text-gray-700">Verification</span>
                      </div>
                  </div>

                  {!bioEnrolled && (
                      <button 
                          type="button"
                          onClick={() => {
                              if (enrollStep === 0) {
                                   setEnrollStep(0.5);
                                   enroll(actualEmployeeId, `${watch("firstName")} ${watch("lastName")}`.trim() || "User", watch("department") || "Unassigned");
                              }
                          }}
                          disabled={bioStatus !== 'CONNECTED' || !deviceConnected || enrollStep > 0}
                          className="px-8 py-3 bg-blue-600 border border-blue-700 text-white text-sm font-bold tracking-wide rounded-xl disabled:opacity-50 disabled:bg-gray-400 hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95 shadow-md flex items-center gap-2"
                      >
                          <Fingerprint size={18} />
                          {enrollStep > 0 && enrollStep < 1 ? "Scanner Starting..." : "Initialize Scanner"}
                      </button>
                  )}
              </div>

              <div className="flex flex-col items-center justify-center w-full mt-6 pt-6 border-t border-gray-100">
                  <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${
                      enrollError ? 'bg-red-50 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-pulse border-2 border-red-200' :
                      bioEnrolled ? 'bg-green-50 text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)] border-2 border-green-200' : 
                      bioStatus === 'CONNECTED' ? 'bg-blue-50 text-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)] border-2 border-blue-200' : 'bg-gray-50 text-gray-400 shadow-sm border border-gray-200'
                  }`}>
                      {bioEnrolled ? <CheckCircle2 size={48} /> : enrollError ? <AlertCircle size={48} /> : <Fingerprint size={48} strokeWidth={1} />}
                  </div>
                  
                  <p className={`text-xs font-bold mt-4 text-center rounded-full px-4 py-1.5 ${
                      enrollError ? 'text-red-700 bg-red-100' : 
                      bioEnrolled ? 'text-green-700 bg-green-100' : 
                      'text-gray-700 bg-gray-100'
                  }`}>
                      {enrollError ? `Failed: ${enrollError}` :
                       bioEnrolled ? "Stored Successfully" : 
                       enrollStep === 1 ? "Now remove finger" :
                       bioStatus === 'CONNECTED' ? "Ready to Scan" : "Scanner Disconnected"}
                  </p>
              </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mt-2 flex flex-col gap-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                      type="checkbox" 
                      required 
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 transition-all cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">
                      By submitting this form on behalf of the employee, I certify that civil service records, government identifiers, and placement requirements have been fully verified.
                  </span>
              </label>

              <button 
                type="submit" 
                disabled={loading || isSubmitting || !bioEnrolled}
                className={`w-full ${!bioEnrolled ? 'bg-gray-400' : 'bg-gray-900 hover:bg-gray-800'} text-white px-8 py-3.5 rounded-xl text-sm font-extrabold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex justify-center items-center gap-2 active:scale-95`}
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (bioEnrolled ? <CheckCircle2 size={18} /> : <Lock size={18} />)}
                {bioEnrolled ? "Complete Registration" : "Enroll Biometrics to Proceed"}
              </button>
          </div>
        </div>
        </form>
      </div>

      <HiredApplicantsListModal
          isOpen={showHiredModal}
          onClose={() => {
             setShowHiredModal(false);
             if(!matchedApplicant) navigate(-1); // Go back if they cancel
          }}
          dutyType={duties}
          departmentName={queryDept || 'the department'}
          onSelectApplicant={handleSelectApplicant}
      />

      <ConfirmationModal
        isOpen={showDuplicateModal}
        title="Duplicate Found"
        message="An employee with this name already exists. Are you sure you want to proceed and create a NEW account instead of linking?"
        confirmText="Yes, Proceed Anyway"
        cancelText="No, Cancel"
        onConfirm={confirmDuplicateRegistration}
        onClose={() => setShowDuplicateModal(false)}
        variant="danger"
      />
    </div>
  );
}
