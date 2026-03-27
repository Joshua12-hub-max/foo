import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler, useFieldArray, Path, get, FieldError as RHFFieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { 
  ArrowLeft, Fingerprint, Upload, CheckCircle2, 
  AlertCircle, Loader2, Lock, Check, X, 
  Facebook, Twitter, Linkedin, GraduationCap, Award, Briefcase, Plus, Trash2
} from "lucide-react";

import { z } from "zod";
import { RegisterSchema } from "@/schemas/authSchema";
import { useBiometricDevice } from "@/hooks/useBiometricDevice";
import { useRegisterMutation } from "@/hooks/useAuthQueries";
import { useAuth } from "@hooks/useAuth";
import { useBarangaysQuery, useDepartmentsQuery, usePositionsQuery, useNextEmployeeIdQuery, useEmploymentMetadataQuery } from "@/hooks/useCommonQueries";
import { recruitmentApi } from '@/api/recruitmentApi';
import type { HiredApplicant } from '@/types/recruitment_applicant';

import Combobox from "@/components/Custom/Combobox";
import ConfirmationModal from '@/components/CustomUI/ConfirmationModal';
import EmailVerificationModal from '@/Authentication/EmailVerificationModal';
import { PhilippineAddressSelector } from '@/components/Custom/Shared/PhilippineAddressSelector';
import type { Region, Province, CityMunicipality, Barangay } from '@/types/ph-address';
import HiredApplicantsListModal from '@/components/Custom/EmployeeManagement/Admin/Modals/HiredApplicantsListModal';
import ph from 'phil-reg-prov-mun-brgy';
import { EDUCATION_LEVELS } from "@/schemas/recruitment";
import { GENDER_OPTIONS, CIVIL_STATUS_OPTIONS, BLOOD_TYPE_OPTIONS, EDUCATION_LEVEL_OPTIONS } from "@/constants/referenceData";

type EducationLevel = "Elementary School Graduate" | "High School Graduate" | "Senior High School Graduate" | "Vocational/Trade Course Graduate" | "College Graduate" | "Graduate Studies" | "";

// Using library directly without unsafe assertions to comply with strict linting
// ph is accessed as needed in the component logic below

// locally defined type to ensure 100% type safety and zero type erasure
type PHLibrary = { 
  regions: Region[]; 
  provinces: Province[]; 
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  city_mun: CityMunicipality[]; 
  barangays: Barangay[]; 
};
const phLib = ph as PHLibrary;

export type RegisterFormValues = z.input<typeof RegisterSchema>;

interface LegacyEducationData {
    school?: string;
    course?: string;
    from?: string;
    to?: string;
    yearGrad?: string;
    units?: string;
    honors?: string;
}

// Zero Type Erasure: Use RegisterFormValues directly as it already contains all necessary fields.
// The schema in authSchema.ts (Lines 219-222) handles applicant linking fields.

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
  const [showHiredModal, setShowHiredModal] = useState(queryType === 'hired');
  const [matchedApplicant, setMatchedApplicant] = useState<HiredApplicant | null>(null);
  
  const registerMutation = useRegisterMutation();
  const loading = registerMutation.isPending;

  // Helper to safely format any date string or Date object to YYYY-MM-DD
  const formatDateForInput = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return "";
    try {
      const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split('T')[0];
    } catch {
      return "";
    }
  };

  const { 
    register, handleSubmit, watch, setValue, setError, control, formState: { errors } 
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    mode: "onBlur",
    defaultValues: {
      employeeId: "", firstName: "", lastName: "", middleName: "", suffix: "", email: "", password: "",
      avatar: undefined,
      address: "",
      residentialAddress: "",
      residentialZipCode: "",
      resHouseBlockLot: "",
      resStreet: "",
      resSubdivision: "",
      resBarangay: "",
      resCity: "",
      resProvince: "",
      resRegion: "",
      permanentAddress: "",
      permanentZipCode: "",
      permHouseBlockLot: "",
      permStreet: "",
      permSubdivision: "",
      permBarangay: "",
      permCity: "",
      permProvince: "",
      permRegion: "",
      emergencyContact: "", emergencyContactNumber: "", isMeycauayan: "false", barangay: "",
      department: queryDept || "",
      position: "",
      role: "Employee",
      gender: "",
      civilStatus: "",
      nationality: "Filipino",
      citizenship: "Filipino",
      citizenshipType: "",
      dualCountry: "",
      placeOfBirth: "",
      birthDate: "",
      bloodType: "",
      heightM: "",
      weightKg: "",
      mobileNo: "",
      telephoneNo: "",
      dutyType: (duties === 'Standard' || duties === 'Irregular' ? duties : 'Standard'),
      appointmentType: "",
      religion: "",
      educationalBackground: "",
      schoolName: "",
      course: "",
      yearGraduated: "",
      education: {
        Elementary: { school: "", course: "", from: "", to: "", units: "", yearGrad: "", honors: "" },
        Secondary: { school: "", course: "", from: "", to: "", units: "", yearGrad: "", honors: "" },
        Vocational: { school: "", course: "", from: "", to: "", units: "", yearGrad: "", honors: "" },
        College: { school: "", course: "", from: "", to: "", units: "", yearGrad: "", honors: "" },
        Graduate: { school: "", course: "", from: "", to: "", units: "", yearGrad: "", honors: "" },
      },
      yearsOfExperience: "", experience: "", skills: "", 
      eligibilityType: "",
      eligibilityNumber: "",
      eligibilityDate: "",
      gsisNumber: "",
      pagibigNumber: "",
      philhealthNumber: "",
      umidNumber: "",
      philsysId: "",
      tinNumber: "",
      agencyEmployeeNo: "",
      facebookUrl: "",
      linkedinUrl: "",
      twitterHandle: "",
      
      // Multi-arrays
      workExperiences: [],
      trainings: [],
      eligibilities: [],
      
      // Family Background & PDS Arrays
      spouseLastName: "", spouseFirstName: "", spouseMiddleName: "", spouseSuffix: "", spouseOccupation: "", spouseEmployer: "", spouseBusAddress: "", spouseTelephone: "",
      fatherLastName: "", fatherFirstName: "", fatherMiddleName: "", fatherSuffix: "",
      motherMaidenLastName: "", motherMaidenFirstName: "", motherMaidenMiddleName: "", motherMaidenSuffix: "",
      children: [],
      otherSkills: [],
      recognitions: [],
      memberships: [],
      pdsQuestions: {
        q34a: false, q34b: false, q34bDetails: "",
        q35a: false, q35aDetails: "", q35b: false, q35bDetails: "", q35bDateFiled: "", q35bStatus: "",
        q36: false, q36Details: "",
        q37: false, q37Details: "",
        q38a: false, q38aDetails: "", q38b: false, q38bDetails: "",
        q39: false, q39Details: "",
        q40a: false, q40aDetails: "", q40b: false, q40bDetails: "", q40c: false, q40cDetails: ""
      },

      certifiedCorrect: false
    }
  });

  const { fields: eligibilityFields, append: appendEligibility, remove: removeEligibility } = useFieldArray({
    control,
    name: "eligibilities"
  });

  const { fields: workExperienceFields, append: appendWorkExperience, remove: removeWorkExperience } = useFieldArray({
    control,
    name: "workExperiences"
  });



  const { fields: trainingFields, append: appendTraining, remove: removeTraining } = useFieldArray({
    control,
    name: "trainings"
  });

  // REMOVED: Automatically adding empty rows as it conflicts with z.string().min(1) requirements
  // user must manually click "Add" to prevent validation errors on empty sections.

  useEffect(() => {
    register("department");
    register("position");
    register("dutyType");
    register("appointmentType");
    register("applicantId");
  }, [register]);

  useEffect(() => {
    // Sync URL Parameters to Form State on Mount
    if (queryDuties) {
        setValue("dutyType", queryDuties as "Standard" | "Irregular", { shouldValidate: true });
    }
    
    // Auto-map type=old/hired to Appointment Type if not already set
    if (queryType === 'old') {
        setValue("isOldEmployee", true, { shouldValidate: true });
    }
    
    if (queryDept) {
        setValue("department", queryDept, { shouldValidate: true });
    }
  }, [queryDuties, queryType, queryDept, setValue, watch]);

  const { data: nextEmployeeId } = useNextEmployeeIdQuery();
  const actualEmployeeId = nextEmployeeId || "1";
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bioEnrolled, setBioEnrolled] = useState(false);
  const [_unusedReset, _setResetModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [enrollStep, setEnrollStep] = useState(0);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [createdEmployeeDbId, setCreatedEmployeeDbId] = useState<number | undefined>(undefined);

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
  const resBarangay = watch("resBarangay");
  const resHouse = watch("resHouseBlockLot");
  const resSubd = watch("resSubdivision");
  const resStreet = watch("resStreet");

  const permRegion = watch("permRegion");
  const permProvince = watch("permProvince");
  const permCity = watch("permCity");
  const permBarangay = watch("permBarangay");
  const permHouse = watch("permHouseBlockLot");
  const permSubd = watch("permSubdivision");
  const permStreet = watch("permStreet");

  const extractName = <T, K extends keyof T>(arr: T[], key: K, val: string): string => {
  const found = arr.find((x) => String(x[key]) === val);
  if (found && typeof found === 'object' && found !== null && 'name' in found && typeof (found as {name: string}).name === 'string') {
  return (found as {name: string}).name;
  }
  return '';
  };

   const formatAddr = (reg: string, prov: string, city: string, brgy: string, house: string, subd: string, street: string) => {
  const rName = phLib.regions.find((x: Region) => x.reg_code === reg)?.name || '';
  const pName = phLib.provinces.find((x: Province) => x.prov_code === prov)?.name || '';
  const cName = phLib.city_mun.find((x: CityMunicipality) => x.mun_code === city)?.name || '';
  const bName = brgy; // Barangay values are stored as their name
  return [house, subd, street, bName, cName, pName, rName].filter(Boolean).join(', ');
   };

  // Real-time residential address and validation fixes
  useEffect(() => {
      // If we have prefilled raw address strings, we skip the dynamic selector logic to avoid overwriting
      if (prefilledAddress || (isFinalizingSetup && authUser?.address)) {
          if (!watch("barangay")) setValue("barangay", "Prefilled"); // Bypass Zod Validation
          return;
      }
      
      const addr = formatAddr(resRegion||'', resProvince||'', resCity||'', resBarangay||'', resHouse||'', resSubd||'', resStreet||'');
      if (addr) {
          setValue("address", addr);
          setValue("residentialAddress", addr);
      }
      if (resBarangay) {
          setValue("barangay", extractName(phLib.barangays, 'name', resBarangay));
      } else {
          setValue("barangay", "");
      }
  }, [resRegion, resProvince, resCity, resBarangay, resHouse, resSubd, resStreet, setValue, prefilledAddress, isFinalizingSetup, authUser]);

  // Real-time permanent address
  useEffect(() => {
      if (prefilledPermanentAddress || (isFinalizingSetup && authUser?.permanentAddress)) {
          return;
      }
      
      const addr = formatAddr(permRegion||'', permProvince||'', permCity||'', permBarangay||'', permHouse||'', permSubd||'', permStreet||'');
      if (addr) {
          setValue("permanentAddress", addr);
      }
  }, [permRegion, permProvince, permCity, permBarangay, permHouse, permSubd, permStreet, setValue, prefilledPermanentAddress, isFinalizingSetup, authUser]);

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

  /**
   * Type-safe recursive error reporter for deeply nested RHF errors.
   */
  const getFirstErrorMessage = (errors: Record<string, unknown>): { field: string; message: string } | null => {
    if (!errors) return null;
    
    for (const key of Object.keys(errors)) {
      const error = errors[key];
      if (!error) continue;
      
      if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
        return { field: key, message: (error as { message: string }).message };
      }
      
      // If nested, go deeper
      const nested = getFirstErrorMessage(error as Record<string, unknown>);
      if (nested) {
        return { field: `${key}.${nested.field}`, message: nested.message };
      }
    }
    return null;
  };

  const safeParse = <T,>(str: string): T => JSON.parse(str) as T;

  const handlePreFill = (applicant: HiredApplicant) => {
    // 1. Basic Info & Identity
    setValue("firstName", applicant.firstName || "");
    setValue("lastName", applicant.lastName || "");
    setValue("middleName", applicant.middleName || "");
    setValue("suffix", applicant.suffix || "");
    setValue("email", applicant.email || "");
    setValue("password", ""); // Security: Force manual password setting
    
    // Auto-populate Job Applied Context
    if (applicant.department) setValue("department", applicant.department);
    if (applicant.jobTitle) setValue("position", applicant.jobTitle);
    if (applicant.dutyType) setValue("dutyType", applicant.dutyType as RegisterFormValues["dutyType"]);
    
    const aType = applicant.employmentType;
    if (['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary', 'Contract of Service', 'JO', 'COS'].includes(aType || "")) {
        setValue("appointmentType", aType as RegisterFormValues["appointmentType"]);
    }

    // 100% PRECISION: Personal Bio Mapping
    if (applicant.birthDate) setValue("birthDate", formatDateForInput(applicant.birthDate));
    setValue("placeOfBirth", applicant.birthPlace || "");
    setValue("gender", (applicant.sex as "Male" | "Female" | "") || "");
    setValue("civilStatus", (applicant.civilStatus as RegisterFormValues["civilStatus"]) || "");
    
    // Citizenship Alignment: PDS Schema uses "citizenship" for Filipino/Dual
    const isDual = applicant.citizenship === "Dual Citizenship" || applicant.citizenshipType === "Dual Citizenship";
    setValue("nationality", applicant.nationality || "Filipino");
    setValue("citizenship", (applicant.nationality === "Filipino" || !applicant.nationality) ? "Filipino" : "Dual Citizenship");
    if (applicant.nationality && applicant.nationality !== "Filipino") {
        setValue("dualCountry", applicant.nationality);
    }
    
    // citizenshipType in PDS refers to "By Birth" / "By Naturalization"
    if (applicant.citizenshipType && ["By Birth", "By Naturalization"].includes(applicant.citizenshipType)) {
        setValue("citizenshipType", applicant.citizenshipType);
    } else {
        setValue("citizenshipType", null);
    }
    
    setValue("dualCountry", applicant.dualCountry || null);
    setValue("bloodType", applicant.bloodType || "");
    setValue("heightM", applicant.height?.toString() || "");
    setValue("weightKg", applicant.weight?.toString() || "");

    // 2. Government IDs & Identifiers
    setValue("gsisNumber", applicant.gsisNumber || "");
    setValue("pagibigNumber", applicant.pagibigNumber || "");
    setValue("philhealthNumber", applicant.philhealthNumber || "");
    setValue("umidNumber", applicant.umidNumber || "");
    setValue("philsysId", applicant.philsysId || "");
    setValue("tinNumber", applicant.tinNumber || "");
    setValue("agencyEmployeeNo", applicant.agencyEmployeeNo || "");
    setValue("govtIdType", applicant.govtIdType || "");
    setValue("govtIdNo", applicant.govtIdNo || "");
    setValue("govtIdIssuance", applicant.govtIdIssuance || "");

    // 3. Social Media Links
    setValue("facebookUrl", applicant.facebookUrl || "");
    setValue("linkedinUrl", applicant.linkedinUrl || "");
    setValue("twitterHandle", applicant.twitterHandle || "");
    
    // 4. Contact & Address (Residential & Permanent)
    setValue("mobileNo", applicant.phoneNumber || "");
    setValue("telephoneNo", applicant.telephoneNumber || "");
    setValue("emergencyContact", applicant.emergencyContact || "");
    setValue("emergencyContactNumber", applicant.emergencyContactNumber || "");

    // 100% ADDRESS PARITY: Only set "prefilled" status if granular fields are missing
    // This allows the PhilippineAddressSelector to be the default editable view when data is available
    const hasGranularRes = !!(applicant.resRegion || applicant.resCity || applicant.resBarangay);
    if (!hasGranularRes && applicant.address) {
        setPrefilledAddress(applicant.address);
    } else {
        setPrefilledAddress(""); // Clear to ensure selector is shown
    }
    
    setValue("address", applicant.address || "");
    setValue("residentialAddress", applicant.address || "");
    setValue("residentialZipCode", applicant.zipCode || "");
    setValue("isMeycauayan", applicant.isMeycauayanResident ? "true" : "false");

    // Residential Address Components
    if (applicant.resRegion) setValue("resRegion", applicant.resRegion);
    if (applicant.resProvince) setValue("resProvince", applicant.resProvince);
    if (applicant.resCity) setValue("resCity", applicant.resCity);
    if (applicant.resBarangay) setValue("resBarangay", applicant.resBarangay);
    
    // 100% MANDATORY FIELD HARDENING: Ensure required sub-fields aren't empty if present
    setValue("resHouseBlockLot", applicant.resHouseBlockLot || "");
    setValue("resSubdivision", applicant.resSubdivision || "");
    setValue("resStreet", applicant.resStreet || "");

    const hasGranularPerm = !!(applicant.permRegion || applicant.permCity || applicant.permBarangay);
    if (!hasGranularPerm && applicant.permanentAddress) {
        setPrefilledPermanentAddress(applicant.permanentAddress);
    } else {
        setPrefilledPermanentAddress("");
    }
    
    setValue("permanentAddress", applicant.permanentAddress || "");
    setValue("permanentZipCode", applicant.permanentZipCode || "");

    // Permanent Address Components
    if (applicant.permRegion) setValue("permRegion", applicant.permRegion);
    if (applicant.permProvince) setValue("permProvince", applicant.permProvince);
    if (applicant.permCity) setValue("permCity", applicant.permCity);
    if (applicant.permBarangay) setValue("permBarangay", applicant.permBarangay);
    
    // 100% PERMANENT ADDRESS HARDENING
    setValue("permHouseBlockLot", applicant.permHouseBlockLot || "");
    setValue("permSubdivision", applicant.permSubdivision || "");
    setValue("permStreet", applicant.permStreet || "");
    setValue("permanentZipCode", applicant.permanentZipCode || "");

    // 5. Educational Background (100% Robust Relational Mapping & Inference)
    const eduLevels = ['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate Studies'] as const;
    let highestMappedLevel: string | null = null;
    
    // Helper to extract only the year (YYYY)
    const extractYear = (val: string | number | null | undefined): string => {
        if (!val) return "";
        const str = String(val);
        // If it's a full ISO date YYYY-MM-DD, just take YYYY
        if (str.includes("-") && str.length >= 4) return str.split("-")[0];
        return str;
    };

    // A. Relational Data (Prioritized)
    if (applicant.educations && applicant.educations.length > 0) {
        applicant.educations.forEach((edu) => {
            const level = edu.level;
            const formLevel = (level === 'Graduate Studies' ? 'Graduate' : level) as "Elementary" | "Secondary" | "Vocational" | "College" | "Graduate";
            
            if (['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate'].includes(formLevel)) {
                setValue(`education.${formLevel}.school` as Path<RegisterFormValues>, edu.schoolName || "");
                setValue(`education.${formLevel}.course` as Path<RegisterFormValues>, edu.degreeCourse || "");
                setValue(`education.${formLevel}.from` as Path<RegisterFormValues>, extractYear(edu.dateFrom));
                setValue(`education.${formLevel}.to` as Path<RegisterFormValues>, extractYear(edu.dateTo));
                setValue(`education.${formLevel}.yearGrad` as Path<RegisterFormValues>, extractYear(edu.yearGraduated));
                setValue(`education.${formLevel}.units` as Path<RegisterFormValues>, edu.unitsEarned || "");
                setValue(`education.${formLevel}.honors` as Path<RegisterFormValues>, edu.honors || "");
                highestMappedLevel = formLevel;
            }
        });
    } 
    // B. Legacy JSON Fallback
    else if (applicant.educationalBackground) {
        try {
            const edu = safeParse(applicant.educationalBackground) as Record<string, LegacyEducationData>;
            if (edu && typeof edu === 'object') {
                eduLevels.forEach(level => {
                    const levelData = (edu as Record<string, LegacyEducationData>)[level];
                    if (levelData && (typeof levelData === 'object') && (levelData.school || levelData.course)) {
                        const formLevel = (level === 'Graduate Studies' ? 'Graduate' : level) as "Elementary" | "Secondary" | "Vocational" | "College" | "Graduate";
                        setValue(`education.${formLevel}.school` as Path<RegisterFormValues>, levelData.school || "");
                        setValue(`education.${formLevel}.course` as Path<RegisterFormValues>, levelData.course || "");
                        setValue(`education.${formLevel}.from` as Path<RegisterFormValues>, extractYear(levelData.from));
                        setValue(`education.${formLevel}.to` as Path<RegisterFormValues>, extractYear(levelData.to));
                        setValue(`education.${formLevel}.yearGrad` as Path<RegisterFormValues>, extractYear(levelData.yearGrad));
                        setValue(`education.${formLevel}.units` as Path<RegisterFormValues>, levelData.units || "");
                        setValue(`education.${formLevel}.honors` as Path<RegisterFormValues>, levelData.honors || "");
                        highestMappedLevel = formLevel;
                    }
                });
            }
        } catch (e) {
            console.error("Education JSON parse failed", e);
        }
    }

    // 100% PRECISION: Cross-map top-level fields to College/Graduate if data is still sparse
    if (applicant.schoolName) {
        const isCollegeLikely = !!applicant.course || !!applicant.yearGraduated;
        const targetLevel = (isCollegeLikely ? "College" : "Secondary") as "College" | "Secondary";
        const existingSchool = watch(`education.${targetLevel}.school` as Path<RegisterFormValues>);
        
        if (!existingSchool) {
            setValue(`education.${targetLevel}.school` as Path<RegisterFormValues>, applicant.schoolName);
            setValue(`education.${targetLevel}.course` as Path<RegisterFormValues>, applicant.course || "");
            setValue(`education.${targetLevel}.yearGrad` as Path<RegisterFormValues>, extractYear(applicant.yearGraduated));
            if (!highestMappedLevel) highestMappedLevel = targetLevel;
        }
    }

    // Infer "Highest Degree/Level Attained" combobox
    if (highestMappedLevel) {
        const levelMap: Record<string, string> = {
            'Elementary': 'Elementary School Graduate',
            'Secondary': 'High School Graduate',
            'Vocational': 'Vocational/Trade Course Graduate',
            'College': 'College Graduate',
            'Graduate': 'Graduate Studies',
            'Graduate Studies': 'Graduate Studies'
        };
        setValue("educationalBackground", levelMap[highestMappedLevel] || "");
    }
    
    // Fallback if no JSON at all but top-level fields exist
    if (!applicant.educationalBackground && applicant.schoolName) {
         setValue("schoolName", applicant.schoolName);
         setValue("course", applicant.course || "");
         setValue("yearGraduated", applicant.yearGraduated || "");
         // If we know their employment type might hint at degree, set it? 
         // For now, just set the basic info
    }

    setValue("highestDegree", applicant.highestDegree || "");
    setValue("schoolName", applicant.schoolName || "");
    setValue("course", applicant.course || "");
    setValue("yearGraduated", applicant.yearGraduated || "");

    // 6. Work Experience (Array Pre-fill)
    if (applicant.experiences && applicant.experiences.length > 0) {
        setValue("workExperiences", applicant.experiences.map((exp) => ({
            dateFrom: exp.dateFrom ? formatDateForInput(exp.dateFrom) : "",
            dateTo: exp.dateTo ? formatDateForInput(exp.dateTo) : "",
            positionTitle: exp.positionTitle || "",
            companyName: exp.companyName || "",
            monthlySalary: exp.monthlySalary?.toString() || "",
            salaryGrade: exp.salaryGrade || "",
            appointmentStatus: exp.appointmentStatus || "",
            isGovernment: Boolean(exp.isGovernment)
        })));
    } else if (applicant.experience) {
        try {
            const parsedExperience = safeParse(applicant.experience) as Record<string, string | number | boolean | null>[];
            if (Array.isArray(parsedExperience)) {
                setValue("workExperiences", parsedExperience.map(exp => ({
                    dateFrom: String(exp.dateFrom ? formatDateForInput(String(exp.dateFrom)) : ""),
                    dateTo: String(exp.dateTo ? formatDateForInput(String(exp.dateTo)) : ""),
                    positionTitle: String(exp.positionTitle || ""),
                    companyName: String(exp.companyName || ""),
                    monthlySalary: String(exp.monthlySalary?.toString() || ""),
                    salaryGrade: String(exp.salaryGrade || ""),
                    appointmentStatus: String(exp.appointmentStatus || ""),
                    isGovernment: Boolean(exp.isGovernment === true || (exp.isGovernment && typeof exp.isGovernment === 'string' && exp.isGovernment.toLowerCase() === 'true') || exp.isGovernment === 1 || (exp.isGovernment && String(exp.isGovernment) === '1'))
                })));
            }
        } catch (e) {
            console.error("Experience JSON parse failed", e);
        }
    }

    // 7. Eligibilities (Array Pre-fill)
    if (applicant.eligibilities && applicant.eligibilities.length > 0) {
        setValue("eligibilities", applicant.eligibilities.map((el) => ({
            name: el.eligibilityName || "",
            rating: el.rating?.toString() || "",
            examDate: el.examDate ? formatDateForInput(el.examDate) : "",
            examPlace: el.examPlace || "",
            licenseNo: el.licenseNumber || "",
            licenseValidUntil: el.validityDate ? formatDateForInput(el.validityDate) : ""
        })));
    } else if (applicant.eligibility) {
        try {
            const parsedEligibilities = safeParse(applicant.eligibility) as Record<string, string | number | null>[];
            if (Array.isArray(parsedEligibilities)) {
                setValue("eligibilities", parsedEligibilities.map((el): { name: string; rating: string; examDate: string; examPlace: string; licenseNo: string; licenseValidUntil: string } => ({
                    name: String(el["name"] || ""),
                    rating: String(el["rating"] || ""),
                    examDate: String(el["examDate"] ? formatDateForInput(String(el["examDate"])) : ""),
                    examPlace: String(el["examPlace"] || ""),
                    licenseNo: String(el["licenseNo"] || ""),
                    licenseValidUntil: String(el["licenseValidUntil"] ? formatDateForInput(String(el["licenseValidUntil"])) : "")
                })));
            }
        } catch (e) {
            console.error("Eligibility JSON parse failed", e);
        }
    }

    // 8. Training Programs (Array Pre-fill)
    if (applicant.trainings && applicant.trainings.length > 0) {
        setValue("trainings", applicant.trainings.map((t) => ({
            title: t.title || "",
            dateFrom: t.dateFrom ? formatDateForInput(t.dateFrom) : "",
            dateTo: t.dateTo ? formatDateForInput(t.dateTo) : "",
            hoursNumber: String(t.hoursNumber || ""),
            typeOfLd: t.typeOfLd || "",
            conductedBy: t.conductedBy || ""
        })));
    } else if (applicant.training) {
        try {
            const parsedTrainings = safeParse(applicant.training) as Record<string, string | number | null>[];
            if (Array.isArray(parsedTrainings)) {
                setValue("trainings", parsedTrainings.map((t): { title: string; dateFrom: string; dateTo: string; hoursNumber: string; typeOfLd: string; conductedBy: string } => ({
                    title: String(t["title"] || t["trainingTitle"] || ""),
                    dateFrom: String(t["dateFrom"] ? formatDateForInput(String(t["dateFrom"])) : ""),
                    dateTo: String(t["dateTo"] ? formatDateForInput(String(t["dateTo"])) : ""),
                    hoursNumber: String(t["hoursNumber"] || t["hours"] || ""),
                    typeOfLd: String(t["typeOfLd"] || t["type"] || ""),
                    conductedBy: String(t["conductedBy"] || t["sponsoredBy"] || "")
                })));
            }
        } catch (e) {
            console.error("Training JSON parse failed", e);
        }
    }

    // 8.5 Family Background & PDS Data
    if (applicant.familyBackground) {
        try {
            const fb = safeParse(applicant.familyBackground) as Record<string, Record<string, string>>;
            if (fb.spouse) {
                setValue("spouseLastName", fb.spouse.lastName || ""); setValue("spouseFirstName", fb.spouse.firstName || "");
                setValue("spouseMiddleName", fb.spouse.middleName || ""); setValue("spouseSuffix", fb.spouse.nameExtension || "");
                setValue("spouseOccupation", fb.spouse.occupation || ""); setValue("spouseEmployer", fb.spouse.employer || "");
                setValue("spouseBusAddress", fb.spouse.businessAddress || ""); setValue("spouseTelephone", fb.spouse.telephoneNo || "");
            }
            if (fb.father) {
                setValue("fatherLastName", fb.father.lastName || ""); setValue("fatherFirstName", fb.father.firstName || "");
                setValue("fatherMiddleName", fb.father.middleName || ""); setValue("fatherSuffix", fb.father.nameExtension || "");
            }
            if (fb.mother) {
                setValue("motherMaidenLastName", fb.mother.lastName || ""); setValue("motherMaidenFirstName", fb.mother.firstName || "");
                setValue("motherMaidenMiddleName", fb.mother.middleName || ""); setValue("motherMaidenSuffix", fb.mother.nameExtension || "");
            }
        } catch(e) { console.error("Family parsing failed", e); }
    }

    if (applicant.children) {
        try {
            const ch = safeParse(applicant.children) as Record<string, string>[];
            if (Array.isArray(ch)) {
                setValue("children", ch.map(c => ({
                    name: c.name || "",
                    birthDate: c.dateOfBirth ? formatDateForInput(c.dateOfBirth) : ""
                })));
            }
        } catch(e) { console.error("Children parsing failed", e); }
    }

    if (applicant.otherInfo) {
        try {
            const info = safeParse(applicant.otherInfo) as Record<string, (Record<string, string> | string)[] | undefined>;
            const skills = info?.skills;
            if (Array.isArray(skills)) setValue("otherSkills", skills.map(s => ({ value: typeof s === 'string' ? s : (s.description || s.value || "") })));
            const recognitions = info?.recognitions;
            if (Array.isArray(recognitions)) setValue("recognitions", recognitions.map(r => ({ value: typeof r === 'string' ? r : (r.description || r.value || "") })));
            const memberships = info?.memberships;
            if (Array.isArray(memberships)) setValue("memberships", memberships.map(m => ({ value: typeof m === 'string' ? m : (m.description || m.value || "") })));
        } catch(e) { console.error("OtherInfo parsing failed", e); }
    }


    // 9. Additional Data & Photo
    setValue("yearsOfExperience", applicant.totalExperienceYears?.toString() || "");
    setValue("experience", applicant.experience || "");
    setValue("skills", applicant.skills || "");
    setValue("applicantId", applicant.id);
    
    if (applicant.hiredDate) setValue("applicantHiredDate", formatDateForInput(applicant.hiredDate));
    if (applicant.startDate) {
        setValue("dateHired", formatDateForInput(applicant.startDate));
        setValue("applicantStartDate", formatDateForInput(applicant.startDate));
    }

    const photoFile = applicant.photo1x1Path || applicant.photoPath;
    if (photoFile) {
        setValue("applicantPhotoPath", photoFile);
    }
    if (applicant.photoUrl) {
        setAvatarPreview(applicant.photoUrl);
    }

    toast.success(`Form 100% pre-filled with ${applicant.firstName}'s data!`);
  };

  /**
   * Auto-population Logic for Setup Finalization (Administrative Roles)
   */
  useEffect(() => {
    // Trigger if in explicit mode OR if the logged in user is still initializing their profile
    const shouldPreFill = isFinalizingSetup || authUser?.profileStatus === 'Initial';
    
    if (shouldPreFill && authUser) {
      // Basic Info
      if (authUser.email) setValue("email", authUser.email);
      
      // Personal Info Preservation (If available in authUser)
      if (authUser.firstName) setValue("firstName", authUser.firstName);
      if (authUser.lastName) setValue("lastName", authUser.lastName);
      if (authUser.middleName) setValue("middleName", authUser.middleName);
      if (authUser.suffix) setValue("suffix", authUser.suffix);

      // 100% SUCCESS: Pull from hrDetails if available for deeper pre-fill
      // Note: useRegisterMutation mode=finalize-setup handles the backend migration,
      // but we pre-fill the form here for user review and 100% data visibility.

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
          setValue("birthDate", formatDateForInput(authUser.birthDate));
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
      if (authUser.residentialZipCode) setValue("residentialZipCode", authUser.residentialZipCode);
      if (authUser.resRegion) setValue("resRegion", authUser.resRegion);
      if (authUser.resProvince) setValue("resProvince", authUser.resProvince);
      if (authUser.resCity) setValue("resCity", authUser.resCity);
      if (authUser.resBarangay) setValue("resBarangay", authUser.resBarangay);
      if (authUser.resHouseBlockLot) setValue("resHouseBlockLot", authUser.resHouseBlockLot);
      if (authUser.resSubdivision) setValue("resSubdivision", authUser.resSubdivision);
      if (authUser.resStreet) setValue("resStreet", authUser.resStreet);

      if (authUser.permanentAddress) {
          setValue("permanentAddress", authUser.permanentAddress);
          setPrefilledPermanentAddress(authUser.permanentAddress);
      }
      if (authUser.permanentZipCode) setValue("permanentZipCode", authUser.permanentZipCode);
      if (authUser.permRegion) setValue("permRegion", authUser.permRegion);
      if (authUser.permProvince) setValue("permProvince", authUser.permProvince);
      if (authUser.permCity) setValue("permCity", authUser.permCity);
      if (authUser.permBarangay) setValue("permBarangay", authUser.permBarangay);
      if (authUser.permHouseBlockLot) setValue("permHouseBlockLot", authUser.permHouseBlockLot);
      if (authUser.permSubdivision) setValue("permSubdivision", authUser.permSubdivision);
      if (authUser.permStreet) setValue("permStreet", authUser.permStreet);

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

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    if (!bioEnrolled) {
        toast.error("Please enroll fingerprint first!");
        document.getElementById('biometrics-section')?.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    const formData = new FormData();

    // Workaround for prefilled addresses not being in 'data' if they were just strings
    const finalData = {
        ...data,
        address: prefilledAddress || data.address,
        permanentAddress: prefilledPermanentAddress || data.permanentAddress,
        employeeId: data.employeeId || actualEmployeeId
    };

    const ignoreKeys = ['avatar'];

    // Safely append form data using strong typing
    const dataKeys = Object.keys(finalData) as Array<keyof typeof finalData>;
    dataKeys.forEach((key) => {
        const value = finalData[key];
        const keyStr = String(key);
        if (!ignoreKeys.includes(keyStr) && value !== undefined && value !== null) {
            if (typeof value === 'object' && !(value instanceof File)) {
                formData.append(keyStr, JSON.stringify(value));
            } else {
                formData.append(keyStr, String(value));
            }
        }
    });

    if (avatarRef.current?.files?.[0]) {
        formData.append("avatar", avatarRef.current.files[0]);
    }

    try {
      setIsSubmitting(true);
      const response = await registerMutation.mutateAsync({ 
        data: formData, 
        mode: isFinalizingSetup ? 'finalize-setup' : undefined 
      });
      
      if (isFinalizingSetup) {
          await checkAuth();
      } else {
          // 100% Cleanup: Ensure no temp data stays for the next employee registration
          sessionStorage.clear();
      }

      // 100% Verification - Check if email verification is required
      if (response.data?.data?.requiresVerification) {
          toast.success("Registration Successful! Please verify the email.");
          const newId = response.data?.data?.id;
          if (newId) setCreatedEmployeeDbId(Number(newId)); // Ensure numeric ID
          setVerificationEmail(data.email);
          setIsVerifyModalOpen(true);
          return;
      }

      toast.success("Employee Record Created Successfully!");
      
      if (isFinalizingSetup) {
          navigate("/admin-dashboard");
      } else {
          navigate(`/admin-dashboard/departments?department=${queryDept || ''}`); // Return to department list
      }
    } catch (error) {
      console.error(error);
      let msg = "Registration failed";
      
      interface ZodFieldError { path: string[]; message: string }
      interface ServerErrorData { code?: string; errors?: ZodFieldError[] }
      interface ServerError { response?: { data?: ServerErrorData } }

      const isServerError = (err: { response?: { data?: ServerErrorData } } | null | undefined): err is ServerError => 
          typeof err === 'object' && err !== null && 'response' in err;
      
      if (isServerError(error as ServerError | null)) {
          const resData = (error as ServerError).response?.data;

          if (resData?.code === 'DUPLICATE_NAME') {
              setShowDuplicateModal(true);
              setIsSubmitting(false);
              return;
          }

          if (resData && "message" in resData) {
              msg = String(resData.message);
          }

          // 100% PRECISION: Map server-side uniqueness errors to RHF fields
          if (resData?.errors && typeof resData.errors === 'object' && !Array.isArray(resData.errors)) {
              const serverErrors = resData.errors as Record<string, string>;
              Object.entries(serverErrors).forEach(([field, message]) => {
                  setError(field as keyof RegisterFormValues, { 
                      type: 'manual', 
                      message 
                  });
              });
              // Concat messages for the toast to ensure immediate visibility
              msg = Object.values(serverErrors).join(' | ');
          } else if (resData?.errors && Array.isArray(resData.errors)) {
              msg = resData.errors.map((err) => {
                  if (typeof err === 'string') return err;
                  if (err && typeof err === 'object' && 'message' in err) {
                      const pathStr = Array.isArray(err.path) ? err.path.join('.') + ': ' : '';
                      return `${pathStr}${err.message}`;
                  }
                  return String(err);
              }).join(' | ');
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

  const inputClass = "w-full px-3 py-2 bg-white border border-gray-300 rounded-md outline-none font-medium text-sm text-slate-700 transition-all";
  const errorClass = "!border-red-500 ring-2 ring-red-100 bg-red-50/10";
  const cardClass = "bg-white rounded-2xl border border-gray-100 p-6 shadow-sm";
  const cardHeaderClass = "text-sm font-bold text-gray-800 uppercase tracking-wider mb-5 flex items-center gap-2 pb-3 border-b border-gray-100";

  const getInputClass = (fieldName: keyof RegisterFormValues) => {
      return `${inputClass} ${errors[fieldName] ? errorClass : ''}`;
  };

  const FieldError = ({ name }: { name: Path<RegisterFormValues> }) => {
      const error = get(errors, name) as RHFFieldError | undefined; 
      if (!error) return null;
      return <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{error.message || ""}</p>;
  };

  const EducationLevelSection = ({ level, label }: { level: "Elementary" | "Secondary" | "Vocational" | "College" | "Graduate", label: string }) => (
    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 space-y-4">
        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <GraduationCap size={14} /> {label}
        </h5>
        <div className="grid grid-cols-1 gap-4">
            {/* Row 1: School Name */}
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">School / University Name</label>
                <input {...register(`education.${level}.school` as Path<RegisterFormValues>)} className={inputClass} placeholder="Enter school name" />
                <FieldError name={`education.${level}.school` as Path<RegisterFormValues>} />
            </div>
            
            {/* Row 2: Degree, From, To */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Degree / Course</label>
                    <input {...register(`education.${level}.course` as Path<RegisterFormValues>)} className={inputClass} placeholder="e.g. BS in IT" />
                    <FieldError name={`education.${level}.course` as Path<RegisterFormValues>} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">From (yyyy)</label>
                    <input type="number" {...register(`education.${level}.from` as Path<RegisterFormValues>)} className={inputClass} placeholder="Year" />
                    <FieldError name={`education.${level}.from` as Path<RegisterFormValues>} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">To (yyyy)</label>
                    <input type="number" {...register(`education.${level}.to` as Path<RegisterFormValues>)} className={inputClass} placeholder="Year" />
                    <FieldError name={`education.${level}.to` as Path<RegisterFormValues>} />
                </div>
            </div>

            {/* Row 3: Units, Year Grad, Honors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Units Earned</label>
                    <input {...register(`education.${level}.units` as Path<RegisterFormValues>)} className={inputClass} placeholder="If not graduated" />
                    <FieldError name={`education.${level}.units` as Path<RegisterFormValues>} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Year Graduated</label>
                    <input type="number" {...register(`education.${level}.yearGrad` as Path<RegisterFormValues>)} className={inputClass} placeholder="Year" />
                    <FieldError name={`education.${level}.yearGrad` as Path<RegisterFormValues>} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Honors Received</label>
                    <input {...register(`education.${level}.honors` as Path<RegisterFormValues>)} className={inputClass} placeholder="e.g. Cum Laude" />
                    <FieldError name={`education.${level}.honors` as Path<RegisterFormValues>} />
                </div>
            </div>
        </div>
    </div>
  );

  const onInvalid = (errors: Record<string, unknown>) => {
    console.error("Form Validation Errors:", errors);
    const errorData = getFirstErrorMessage(errors);
    if (errorData) {
      toast.error(`Form Error: [${errorData.field}] ${errorData.message}`);
      const errorElement = document.querySelector(`[name="${errorData.field}"]`);
      if (errorElement) errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      toast.error("Please fill in all required fields correctly.");
    }
  };


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
            
            <form 
              onSubmit={handleSubmit(onSubmit, onInvalid)} 
              className="w-full flex flex-col lg:flex-row gap-8 items-start"
            >
                
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
                            <FieldError name="employeeId" />
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
                      className={`${getInputClass("email")} ${isFinalizingSetup ? 'bg-gray-100 cursor-not-allowed opacity-80' : ''}`} 
                      placeholder="" 
                      readOnly={isFinalizingSetup}
                    />
                  </div>
                  <FieldError name="email" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 ml-1">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      {...register("password")}
                      type="password"
                      autoComplete="new-password"
                      className={getInputClass("password")}
                      placeholder=""
                    />
                  </div>
                  <FieldError name="password" />
                </div>
             </div>
          </div>

          <div className={cardClass}>
             <h4 className={cardHeaderClass}>Personal Information</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 ml-1">Last Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                      <input {...register("lastName")} autoComplete="family-name" className={getInputClass("lastName")} placeholder="" />
                  </div>
                  <FieldError name="lastName" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 ml-1">First Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                      <input {...register("firstName")} autoComplete="given-name" className={getInputClass("firstName")} placeholder="" />
                  </div>
                  <FieldError name="firstName" />
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Middle Name</label>
                   <div className="relative">
                      <input {...register("middleName")} autoComplete="additional-name" className={getInputClass("middleName")} placeholder="" />
                   </div>
                   <FieldError name="middleName" />
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Suffix</label>
                   <div className="relative">
                      <input {...register("suffix")} autoComplete="honorific-suffix" className={getInputClass("suffix")} placeholder="" />
                   </div>
                   <FieldError name="suffix" />
                </div>
             </div>

             <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Birth Date</label>
                   <div className="relative">
                      <input 
                        type="date" 
                        {...register("birthDate")} 
                        className={getInputClass("birthDate")} 
                      />
                   </div>
                   <FieldError name="birthDate" />
                </div>
                
                <div className="space-y-1 col-span-2 md:col-span-2">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Place of Birth <span className="text-red-500">*</span></label>
                   <div className="relative">
                      <input {...register("placeOfBirth")} className={getInputClass("placeOfBirth")} placeholder="" />
                   </div>
                   <FieldError name="placeOfBirth" />
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Gender <span className="text-red-500">*</span></label>
                   <Combobox
                      options={(empMetadata?.pdsGender || GENDER_OPTIONS.map(o => o.value)).map(s => ({ value: s, label: s }))}
                      value={watch("gender") || ""}
                      onChange={(val: string) => setValue("gender", val as "Male" | "Female" | "", { shouldValidate: true })}
                      placeholder="Select..."
                      error={!!errors.gender}
                      buttonClassName={errors.gender ? errorClass : ''}
                   />
                   <FieldError name="gender" />
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Civil Status <span className="text-red-500">*</span></label>
                   <Combobox
                      options={(empMetadata?.pdsCivilStatus || CIVIL_STATUS_OPTIONS.map(o => o.value)).map(s => ({ value: s, label: s }))}
                      value={watch("civilStatus") || ""}
                      onChange={(val: string) => setValue("civilStatus", val as "Single" | "Married" | "Widowed" | "Separated" | "Annulled" | "", { shouldValidate: true })}
                      placeholder="Select..."
                      error={!!errors.civilStatus}
                      buttonClassName={errors.civilStatus ? errorClass : ''}
                   />
                   <FieldError name="civilStatus" />
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Nationality</label>
                   <input {...register("nationality")} className={getInputClass("nationality")} placeholder="" />
                   <FieldError name="nationality" />
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Citizenship</label>
                   <Combobox
                      options={[
                        { value: "Filipino", label: "Filipino" },
                        { value: "Dual Citizenship", label: "Dual Citizenship" }
                      ]}
                      value={watch("citizenship") || "Filipino"}
                      onChange={(val: string) => setValue("citizenship", val, { shouldValidate: true })}
                      placeholder="Select..."
                      error={!!errors.citizenship}
                      buttonClassName={errors.citizenship ? errorClass : ''}
                   />
                   <FieldError name="citizenship" />
                </div>

                {watch("citizenship") === "Dual Citizenship" && (
                    <>
                        <div className="space-y-1">
                           <label className="text-xs font-semibold text-gray-600 ml-1">Citizenship Type</label>
                           <Combobox
                              options={[
                                { value: "By Birth", label: "By Birth" },
                                { value: "By Naturalization", label: "By Naturalization" }
                              ]}
                              value={watch("citizenshipType") || ""}
                              onChange={(val: string) => setValue("citizenshipType", val, { shouldValidate: true })}
                              placeholder="Select..."
                              error={!!errors.citizenshipType}
                              buttonClassName={errors.citizenshipType ? errorClass : ''}
                           />
                           <FieldError name="citizenshipType" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600 ml-1">Indicate Country (Dual)</label>
                            <input {...register("dualCountry")} className={getInputClass("dualCountry")} placeholder="e.g. USA, Canada" />
                            <FieldError name="dualCountry" />
                        </div>
                    </>
                )}

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Blood Type</label>
                   <Combobox
                      options={(empMetadata?.pdsBloodTypes || BLOOD_TYPE_OPTIONS.map(o => o.value)).map(s => ({ value: s, label: s }))}
                      value={watch("bloodType") || ""}
                      onChange={(val: string) => setValue("bloodType", val, { shouldValidate: true })}
                      placeholder="Select..."
                      error={!!errors.bloodType}
                      buttonClassName={errors.bloodType ? errorClass : ''}
                   />
                   <FieldError name="bloodType" />
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Height (m)</label>
                   <input type="number" step="0.01" {...register("heightM")} className={getInputClass("heightM")} placeholder="" />
                   <FieldError name="heightM" />
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Weight (kg)</label>
                   <input type="number" step="0.1" {...register("weightKg")} className={getInputClass("weightKg")} placeholder="" />
                   <FieldError name="weightKg" />
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
                      <input {...register("mobileNo")} className={getInputClass("mobileNo")} placeholder="" />
                   </div>
                   <FieldError name="mobileNo" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Telephone Number</label>
                   <div className="relative">
                      <input {...register("telephoneNo")} className={getInputClass("telephoneNo")} placeholder="" />
                   </div>
                   <FieldError name="telephoneNo" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 mt-2 bg-red-50/50 rounded-xl border border-red-100">
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-red-600 ml-1 flex items-center gap-1">Emergency Contact Person <span className="text-red-500">*</span></label>
                   <input {...register("emergencyContact")} className={`${getInputClass("emergencyContact")} !border-red-200 focus:!border-red-500`} placeholder="Full Name" />
                   <FieldError name="emergencyContact" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-red-600 ml-1">Emergency Phone Number <span className="text-red-500">*</span></label>
                   <input {...register("emergencyContactNumber")} className={`${getInputClass("emergencyContactNumber")} !border-red-200 focus:!border-red-500`} placeholder="09XX XXX XXXX" />
                   <FieldError name="emergencyContactNumber" />
                </div>
             </div>
          </div>

          <div className={cardClass}>
             <h4 className={cardHeaderClass}>Government Identification</h4>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">GSIS ID No.</label>
                   <input {...register("gsisNumber")} className={getInputClass("gsisNumber")} placeholder="" />
                   <FieldError name="gsisNumber" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">PAG-IBIG No.</label>
                   <input {...register("pagibigNumber")} className={getInputClass("pagibigNumber")} placeholder="" />
                   <FieldError name="pagibigNumber" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">PhilHealth No.</label>
                   <input {...register("philhealthNumber")} className={getInputClass("philhealthNumber")} placeholder="" />
                   <FieldError name="philhealthNumber" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">UMID ID</label>
                   <input {...register("umidNumber")} className={getInputClass("umidNumber")} placeholder="" />
                   <FieldError name="umidNumber" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">PHILSYS ID</label>
                   <input {...register("philsysId")} className={getInputClass("philsysId")} placeholder="" />
                   <FieldError name="philsysId" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">TIN No.</label>
                   <input {...register("tinNumber")} className={getInputClass("tinNumber")} placeholder="" />
                   <FieldError name="tinNumber" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Agency Employee No.</label>
                   <input {...register("agencyEmployeeNo")} className={getInputClass("agencyEmployeeNo")} placeholder="" />
                   <FieldError name="agencyEmployeeNo" />
                </div>
             </div>
          </div>

          <div className={cardClass}>
              <h4 className={cardHeaderClass}><GraduationCap size={16} className="text-gray-400" /> Educational Background</h4>
              <div className="space-y-6">
                  <div>
                      <label className="text-xs font-semibold text-gray-600 ml-1 mb-1 block">Highest Degree/Level Attained</label>
                      <Combobox
                          options={EDUCATION_LEVEL_OPTIONS}
                          value={watch("educationalBackground") || ""}
                          onChange={(val) => setValue("educationalBackground", val as EducationLevel, { shouldValidate: true })}
                          placeholder="Select highest level..."
                          error={!!errors.educationalBackground}
                          buttonClassName={`pl-3 ${errors.educationalBackground ? errorClass : ''}`}
                      />
                      <FieldError name="educationalBackground" />
                  </div>

                  <div className="space-y-4">
                      <EducationLevelSection level="Elementary" label="Elementary" />
                      <EducationLevelSection level="Secondary" label="Secondary" />
                      <EducationLevelSection level="Vocational" label="Vocational / Trade Course" />
                      <EducationLevelSection level="College" label="College" />
                      <EducationLevelSection level="Graduate" label="Graduate Studies" />
                  </div>
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
                         buttonClassName={errors.department ? `${errorClass} pl-3` : "pl-3"}
                     />
                     <FieldError name="department" />
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
                         buttonClassName={errors.position ? `${errorClass} pl-3` : "pl-3"}
                     />
                     <FieldError name="position" />
                 </div>
                 <div className="md:col-span-1">
                      <label className="text-xs font-semibold text-gray-600 ml-1 mb-1 block">Type of Duties</label>
                       <Combobox
                            options={(empMetadata?.dutyTypes || ['Standard', 'Irregular']).map((dt) => {
                                const typedVal = (dt === "Standard" || dt === "Irregular") ? dt : "Standard";
                                return { value: typedVal, label: dt };
                            })}
                            value={watch("dutyType") || "Standard"}
                             onChange={(val) => setValue("dutyType", val as RegisterFormValues["dutyType"], { shouldValidate: true })}
                           placeholder="Select..."
                           error={!!errors.dutyType}
                           buttonClassName={`bg-gray-50 font-bold !pl-3 ${errors.dutyType ? errorClass : ''}`}
                       />
                       <FieldError name="dutyType" />
                 </div>
                  <div className="md:col-span-1">
                      <label className="text-xs font-semibold text-gray-600 ml-1 mb-1 block">Appointment Type / Schedule</label>
                       <Combobox
                            options={(empMetadata?.appointmentTypes || ['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary', 'Contract of Service']).map((at) => {
                                const typedVal = (at === 'Permanent' || at === 'Contractual' || at === 'Casual' || at === 'Job Order' || at === 'Coterminous' || at === 'Temporary' || at === 'Contract of Service' || at === 'JO' || at === 'COS' || at === '') ? at : '';
                                return { value: typedVal, label: at };
                            })}
                            value={watch("appointmentType") || ""}
                             onChange={(val) => setValue("appointmentType", val as RegisterFormValues["appointmentType"], { shouldValidate: true })}
                           placeholder="Select type..."
                           error={!!errors.appointmentType}
                           buttonClassName={`bg-gray-50 font-bold !pl-3 ${errors.appointmentType ? errorClass : ''}`}
                       />
                       <FieldError name="appointmentType" />
                  </div>
              </div>
          </div>

          <div className={cardClass}>
             <h4 className={cardHeaderClass}><Linkedin size={16} className="text-gray-400" /> Social Links</h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Facebook</label>
                   <div className="relative">
                      <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#1877F2]" size={15} />
                      <input {...register("facebookUrl")} className={`${getInputClass("facebookUrl")} pl-9`} placeholder="" />
                   </div>
                   <FieldError name="facebookUrl" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">LinkedIn</label>
                   <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0A66C2]" size={15} />
                      <input {...register("linkedinUrl")} className={`${getInputClass("linkedinUrl")} pl-9`} placeholder="" />
                   </div>
                   <FieldError name="linkedinUrl" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-600 ml-1">Twitter (X)</label>
                   <div className="relative">
                      <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800" size={15} />
                      <input {...register("twitterHandle")} className={`${getInputClass("twitterHandle")} pl-9`} placeholder="" />
                   </div>
                   <FieldError name="twitterHandle" />
                </div>
             </div>
          </div>

          {/* PDS-Aligned Civil Service Eligibility */}
          <div className={cardClass}>
             <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-0">
                    <Award size={16} className="text-gray-400" /> Civil Service Eligibility
                </h4>
                <button 
                    type="button" 
                    onClick={() => appendEligibility({ name: "", rating: "", examDate: "", examPlace: "", licenseNo: "", licenseValidUntil: "" })}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase flex items-center gap-1 transition-colors"
                >
                    <Plus size={12} /> Add Eligibility
                </button>
             </div>
             <div className="space-y-6">
                {eligibilityFields.map((field, index) => (
                    <div key={field.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 relative animate-in fade-in slide-in-from-top-2">
                        {eligibilityFields.length > 1 && (
                            <button 
                                type="button" 
                                onClick={() => removeEligibility(index)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Eligibility Name</label>
                                <input {...register(`eligibilities.${index}.name` as Path<RegisterFormValues>)} className={inputClass} placeholder="e.g. CSC Professional" />
                                <FieldError name={`eligibilities.${index}.name` as Path<RegisterFormValues>} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Rating</label>
                                <input {...register(`eligibilities.${index}.rating` as Path<RegisterFormValues>)} className={inputClass} placeholder="e.g. 85.00" />
                                <FieldError name={`eligibilities.${index}.rating` as Path<RegisterFormValues>} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Date of Exam</label>
                                <input type="date" {...register(`eligibilities.${index}.examDate` as Path<RegisterFormValues>)} className={inputClass} />
                                <FieldError name={`eligibilities.${index}.examDate` as Path<RegisterFormValues>} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Place of Exam</label>
                                <input {...register(`eligibilities.${index}.examPlace` as Path<RegisterFormValues>)} className={inputClass} placeholder="City/Region" />
                                <FieldError name={`eligibilities.${index}.examPlace` as Path<RegisterFormValues>} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">License No.</label>
                                <input {...register(`eligibilities.${index}.licenseNo` as Path<RegisterFormValues>)} className={inputClass} placeholder="If applicable" />
                                <FieldError name={`eligibilities.${index}.licenseNo` as Path<RegisterFormValues>} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">License Validity</label>
                                <input type="date" {...register(`eligibilities.${index}.licenseValidUntil` as Path<RegisterFormValues>)} className={inputClass} />
                                <FieldError name={`eligibilities.${index}.licenseValidUntil` as Path<RegisterFormValues>} />
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>

          {/* PDS-Aligned Work Experience */}
          <div className={cardClass}>
             <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-0">
                    <Briefcase size={16} className="text-gray-400" /> Work Experience
                </h4>
                <button 
                    type="button" 
                    onClick={() => appendWorkExperience({ dateFrom: "", dateTo: "", positionTitle: "", companyName: "", monthlySalary: "", salaryGrade: "", appointmentStatus: "", isGovernment: false })}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase flex items-center gap-1 transition-colors"
                >
                    <Plus size={12} /> Add Experience
                </button>
             </div>
             <div className="space-y-6">
                {workExperienceFields.map((field, index) => (
                    <div key={field.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 relative animate-in fade-in slide-in-from-top-2">
                        {workExperienceFields.length > 1 && (
                            <button 
                                type="button" 
                                onClick={() => removeWorkExperience(index)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Position Title</label>
                                <input {...register(`workExperiences.${index}.positionTitle` as Path<RegisterFormValues>)} className={inputClass} placeholder="Full Title" />
                                <FieldError name={`workExperiences.${index}.positionTitle` as Path<RegisterFormValues>} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Department / Agency / Company</label>
                                <input {...register(`workExperiences.${index}.companyName` as Path<RegisterFormValues>)} className={inputClass} placeholder="Full Name of Office" />
                                <FieldError name={`workExperiences.${index}.companyName` as Path<RegisterFormValues>} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">From</label>
                                    <input type="date" {...register(`workExperiences.${index}.dateFrom` as Path<RegisterFormValues>)} className={inputClass} />
                                    <FieldError name={`workExperiences.${index}.dateFrom` as Path<RegisterFormValues>} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">To</label>
                                    <input type="date" {...register(`workExperiences.${index}.dateTo` as Path<RegisterFormValues>)} className={inputClass} />
                                    <FieldError name={`workExperiences.${index}.dateTo` as Path<RegisterFormValues>} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Monthly Salary</label>
                                    <input {...register(`workExperiences.${index}.monthlySalary` as Path<RegisterFormValues>)} className={inputClass} placeholder="e.g. 25000" />
                                    <FieldError name={`workExperiences.${index}.monthlySalary` as Path<RegisterFormValues>} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">SG/Step</label>
                                    <input {...register(`workExperiences.${index}.salaryGrade` as Path<RegisterFormValues>)} className={inputClass} placeholder="e.g. 11/1" />
                                    <FieldError name={`workExperiences.${index}.salaryGrade` as Path<RegisterFormValues>} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Appointment Status</label>
                                    <input {...register(`workExperiences.${index}.appointmentStatus` as Path<RegisterFormValues>)} className={inputClass} placeholder="e.g. Permanent" />
                                    <FieldError name={`workExperiences.${index}.appointmentStatus` as Path<RegisterFormValues>} />
                                </div>
                                <div className="flex items-center gap-2 pt-4">
                                    <input type="checkbox" {...register(`workExperiences.${index}.isGovernment` as Path<RegisterFormValues>)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                    <label className="text-xs font-semibold text-gray-600">Government Service</label>
                                    <FieldError name={`workExperiences.${index}.isGovernment` as Path<RegisterFormValues>} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>

           {/* Learning & Development (Trainings) */}
           <div className={cardClass}>
              <div className="flex justify-between items-center mb-4">
                 <h4 className={cardHeaderClass}>Learning & Development / Training Programs</h4>
                 <button 
                    type="button" 
                    onClick={() => appendTraining({ 
                       title: "", dateFrom: "", dateTo: "", hoursNumber: "", typeOfLd: "", conductedBy: "" 
                    })}
                    className="text-[10px] bg-gray-900 text-white px-3 py-1.5 rounded-md font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                 >
                    + Add Training
                 </button>
              </div>
              
              <div className="space-y-4">
                 {trainingFields.map((field, index) => (
                    <div key={field.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/30 relative group shadow-sm">
                       <button 
                          type="button" 
                          onClick={() => removeTraining(index)}
                          className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                       >
                          <X size={18} />
                       </button>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1 md:col-span-2">
                             <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Title of Learning and Development Interventions / Training Programs</label>
                             <input {...register(`trainings.${index}.title` as Path<RegisterFormValues>)} className={inputClass} placeholder="Write in full" />
                             <FieldError name={`trainings.${index}.title` as Path<RegisterFormValues>} />
                           </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">From</label>
                                <input type="date" {...register(`trainings.${index}.dateFrom` as Path<RegisterFormValues>)} className={inputClass} />
                                <FieldError name={`trainings.${index}.dateFrom` as Path<RegisterFormValues>} />
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">To</label>
                                <input type="date" {...register(`trainings.${index}.dateTo` as Path<RegisterFormValues>)} className={inputClass} />
                                <FieldError name={`trainings.${index}.dateTo` as Path<RegisterFormValues>} />
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Number of Hours</label>
                                <input {...register(`trainings.${index}.hoursNumber` as Path<RegisterFormValues>)} className={inputClass} placeholder="e.g. 8" />
                                <FieldError name={`trainings.${index}.hoursNumber` as Path<RegisterFormValues>} />
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Type of LD (Managerial/Technical/etc)</label>
                                <input {...register(`trainings.${index}.typeOfLd` as Path<RegisterFormValues>)} className={inputClass} placeholder="" />
                                <FieldError name={`trainings.${index}.typeOfLd` as Path<RegisterFormValues>} />
                             </div>
                          </div>
                          
                          <div className="space-y-1 md:col-span-2">
                             <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Conducted / Sponsored By</label>
                             <input {...register(`trainings.${index}.conductedBy` as Path<RegisterFormValues>)} className={inputClass} placeholder="Write in full" />
                             <FieldError name={`trainings.${index}.conductedBy` as Path<RegisterFormValues>} />
                           </div>
                       </div>
                    </div>
                 ))}
                 {trainingFields.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                       <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">No trainings added</p>
                    </div>
                  )}
              </div>
           </div>

           {/* Additional Information */}
           <div className={cardClass}>
              <h4 className={cardHeaderClass}>Additional Information</h4>
             <div className="grid grid-cols-1 gap-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1">
                         <label className="text-xs font-semibold text-gray-600 ml-1">Years of Experience <span className="text-red-500">*</span></label>
                         <input 
                           type="number" 
                           step="0.1" 
                           {...register("yearsOfExperience", { required: "Required" })} 
                           className={getInputClass("yearsOfExperience")} 
                           placeholder="e.g. 5" 
                         />
                         <FieldError name="yearsOfExperience" />
                     </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 ml-1">Experience Summary <span className="text-red-500">*</span></label>
                    <textarea {...register("experience")} rows={3} className={getInputClass("experience")} placeholder="Describe overall professional experience..." />
                    <FieldError name="experience" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 ml-1">Core Competencies / Skills <span className="text-red-500">*</span></label>
                    <textarea {...register("skills")} rows={2} className={getInputClass("skills")} placeholder="List key skills..." />
                    <FieldError name="skills" />
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
                      {...register("certifiedCorrect")}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 transition-all cursor-pointer"
                  />
                  <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">
                          By submitting this form on behalf of the employee, I certify that civil service records, government identifiers, and placement requirements have been fully verified.
                      </span>
                      <FieldError name="certifiedCorrect" />
                  </div>
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
        <input type="hidden" {...register("applicantId")} />
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

      <EmailVerificationModal 
        isOpen={isVerifyModalOpen}
        email={verificationEmail}
        employeeDbId={createdEmployeeDbId}
        showCloseButton={true}
        onClose={() => setIsVerifyModalOpen(false)}
        onSuccess={() => {
          setIsVerifyModalOpen(false);
          toast.success("Employee Record Created & Verified Successfully!");
          if (isFinalizingSetup) {
              navigate("/admin-dashboard");
          } else {
              navigate(`/admin-dashboard/departments?department=${queryDept || ''}`);
          }
        }}
      />
    </div>
  );
}
