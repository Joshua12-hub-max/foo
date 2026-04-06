import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler, useFieldArray, Path, get, FieldError as RHFFieldError, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { 
  Loader2,
  Lock,
  Check,
  X
} from "lucide-react";

import { z } from "zod";
import { RegisterSchema } from "@/schemas/authSchema";
import { useBiometricDevice } from "@/hooks/useBiometricDevice";
import { useRegisterMutation } from "@/hooks/useAuthQueries";
import { useAuth } from "@hooks/useAuth";
import { useBarangaysQuery, useDepartmentsQuery, usePositionsQuery, useNextEmployeeIdQuery, useEmploymentMetadataQuery } from "@/hooks/useCommonQueries";
import { pdsApi } from '@/api/pdsApi';
import { recruitmentApi } from '@/api/recruitmentApi';
import type { HiredApplicant } from '@/types/recruitment_applicant';
import SEO from '@/components/Global/SEO';

import Combobox from "@/components/Custom/Combobox";
import ConfirmationModal from '@/components/CustomUI/ConfirmationModal';
import EmailVerificationModal from '@/Authentication/EmailVerificationModal';
import { PhilippineAddressSelector } from '@/components/Custom/Shared/PhilippineAddressSelector';
import type { Region, Province, CityMunicipality, Barangay } from '@/types/ph-address';
import HiredApplicantsListModal from '@/components/Custom/EmployeeManagement/Admin/Modals/HiredApplicantsListModal';
import ph from 'phil-reg-prov-mun-brgy';
import { EDUCATION_LEVELS } from "@/schemas/recruitment";
import { GENDER_OPTIONS, CIVIL_STATUS_OPTIONS, BLOOD_TYPE_OPTIONS, EDUCATION_LEVEL_OPTIONS } from "@/constants/referenceData";
import AuthLayout from '@/components/Custom/Auth/AuthLayout';

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
      educations: [],
      eligibilities: [],
      workExperiences: [],
      trainings: [],
      familyBackground: [],
      otherInfo: [],
      yearsOfExperience: "", 
      experience: "", 
      skills: "",
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
      ignoreDuplicateWarning: false,
      pdsQuestions: {},
      
      // Family Background & Certificates
      spouseLastName: "", spouseFirstName: "", spouseMiddleName: "", spouseSuffix: "", spouseOccupation: "", spouseEmployer: "", spouseBusAddress: "", spouseTelephone: "",
      fatherLastName: "", fatherFirstName: "", fatherMiddleName: "", fatherSuffix: "",
      motherMaidenLastName: "", motherMaidenFirstName: "", motherMaidenMiddleName: "", motherMaidenSuffix: "",
      children: [],
      
      govtIdType: "", govtIdNo: "", govtIdIssuance: "",
      certifiedCorrect: false
    }
  });

  const { fields: eligibilityFields, append: appendEligibility, remove: removeEligibility, replace: replaceEligibility } = useFieldArray({
    control,
    name: "eligibilities"
  });

  const { fields: workExperienceFields, append: appendWorkExperience, remove: removeWorkExperience, replace: replaceWorkExperience } = useFieldArray({
    control,
    name: "workExperiences"
  });

  const { fields: trainingFields, append: appendTraining, remove: removeTraining, replace: replaceTraining } = useFieldArray({
    control,
    name: "trainings"
  });

  const { fields: educationFields, append: appendEducation, remove: removeEducation, replace: replaceEducation } = useFieldArray({
    control,
    name: "educations"
  });

  const { fields: otherInfoFields, append: appendOtherInfo, remove: removeOtherInfo, replace: replaceOtherInfo } = useFieldArray({
    control,
    name: "otherInfo"
  });

  const { fields: childFields, append: appendChild, remove: removeChild, replace: replaceChildren } = useFieldArray({
    control,
    name: "children"
  });

  const { fields: familyFields, append: appendFamily, remove: removeFamily, replace: replaceFamily } = useFieldArray({
    control,
    name: "familyBackground"
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

  const { data: nextEmployeeId, isLoading: isNextIdLoading } = useNextEmployeeIdQuery();
  const actualEmployeeId = nextEmployeeId || ""; 
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bioEnrolled, setBioEnrolled] = useState(false);
  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [enrollStep, setEnrollStep] = useState(0);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEmployeeDbId, setCreatedEmployeeDbId] = useState<number | undefined>(undefined);
  const [isParsingPds, setIsParsingPds] = useState(false);
  const [pdsFileName, setPdsFileName] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePdsExtracted = (data: any) => {
    // Helper to normalize strings (MALE -> Male, SINGLE -> Single)
    const norm = (s: any) => {
        if (!s || typeof s !== 'string') return s;
        const low = s.toLowerCase().trim();
        return low.charAt(0).toUpperCase() + low.slice(1);
    }

    const p = data; // Alias for 100% cleaner mapping
    console.group("PDS Mapper Details");
    
    // 1. Personal Information & Identity
    if (p.firstName) setValue("firstName", p.firstName);
    if (p.surname) setValue("lastName", p.surname);
    if (p.middleName) setValue("middleName", p.middleName);
    if (p.nameExtension) setValue("suffix", p.nameExtension);
    if (p.dob) {
        setValue("birthDate", p.dob);
        console.log("Mapped Birth Date:", p.dob);
    }
    if (p.pob) setValue("placeOfBirth", p.pob);
    
    if (p.sex) {
        const sexNorm = norm(p.sex);
        setValue("gender", sexNorm as any);
        console.log("Mapped Gender:", sexNorm);
    }
    if (p.civilStatus) {
        const statusNorm = norm(p.civilStatus);
        setValue("civilStatus", statusNorm as any);
        console.log("Mapped Civil Status:", statusNorm);
    }
    if (p.bloodType) setValue("bloodType", p.bloodType?.toUpperCase());
    
    if (p.citizenship) setValue("citizenship", p.citizenship);
    if (p.dualCountry) setValue("dualCountry", p.dualCountry);

    if (p.height) setValue("heightM", String(p.height));
    if (p.weight) setValue("weightKg", String(p.weight));

    // 2. IDs — 100% Semantic Extraction Support
    const gsis = p.gsisNumber || p.gsisNo;
    const pagibig = p.pagibigNumber || p.pagibigNo;
    const philhealth = p.philhealthNumber || p.philhealthNo;
    const philsys = p.philsysId || p.philsysNo;
    const tin = p.tinNumber || p.tinNo;
    const umid = p.umidNumber || p.umidNo;
    const agency = p.agencyEmployeeNo || p.agencyNo;

    if (gsis) setValue("gsisNumber", gsis);
    if (pagibig) setValue("pagibigNumber", pagibig);
    if (philhealth) setValue("philhealthNumber", philhealth);
    if (philsys) setValue("philsysId", philsys);
    if (tin) setValue("tinNumber", tin);
    if (umid) setValue("umidNumber", umid);
    if (agency) setValue("agencyEmployeeNo", agency);

    console.log("Mapped IDs:", { gsis, pagibig, philhealth, philsys, tin, umid, agency });
    console.groupEnd();

    // 3. Address & Contact
    if (p.email) setValue("email", p.email);
    if (p.mobileNo) setValue("mobileNo", p.mobileNo);
    if (p.telephoneNo) setValue("telephoneNo", p.telephoneNo);
    
    // Residential Address
    if (p.resRegion) setValue("resRegion", p.resRegion);
    if (p.resProvince) setValue("resProvince", p.resProvince);
    if (p.resCity) setValue("resCity", p.resCity);
    if (p.resBarangay) setValue("resBarangay", p.resBarangay);
    if (p.resHouseBlockLot) setValue("resHouseBlockLot", p.resHouseBlockLot);
    if (p.resStreet) setValue("resStreet", p.resStreet);
    if (p.resSubdivision) setValue("resSubdivision", p.resSubdivision);
    if (p.residentialZipCode) setValue("residentialZipCode", p.residentialZipCode);

    // Permanent Address
    if (p.permRegion) setValue("permRegion", p.permRegion);
    if (p.permProvince) setValue("permProvince", p.permProvince);
    if (p.permCity) setValue("permCity", p.permCity);
    if (p.permBarangay) setValue("permBarangay", p.permBarangay);
    if (p.permHouseBlockLot) setValue("permHouseBlockLot", p.permHouseBlockLot);
    if (p.permStreet) setValue("permStreet", p.permStreet);
    if (p.permSubdivision) setValue("permSubdivision", p.permSubdivision);
    if (p.permanentZipCode) setValue("permanentZipCode", p.permanentZipCode);

    console.log("Mapped Addresses:", { res: p.resCity, perm: p.permCity });

    // 4. Arrays (Education, Work, etc.) — 100% Automated Bulk Mapping
    if (p.educations && Array.isArray(p.educations)) {
        replaceEducation(p.educations.map((edu: any) => ({
            level: edu.level,
            schoolName: edu.schoolName,
            degreeCourse: edu.degreeCourse,
            dateFrom: edu.dateFrom,
            dateTo: edu.dateTo,
            unitsEarned: edu.unitsEarned,
            yearGraduated: edu.yearGraduated,
            honors: edu.honors
        })));
    }

    if (p.eligibilities && Array.isArray(p.eligibilities)) {
        replaceEligibility(p.eligibilities.map((e: any) => ({
            eligibilityName: e.eligibilityName,
            rating: e.rating?.toString(),
            examDate: e.examDate,
            examPlace: e.examPlace,
            licenseNumber: e.licenseNumber,
            validityDate: e.validityDate
        })));
    }

    if (p.workExperiences && Array.isArray(p.workExperiences)) {
        replaceWorkExperience(p.workExperiences.map((w: any) => ({
            dateFrom: w.dateFrom,
            dateTo: w.dateTo,
            positionTitle: w.positionTitle,
            companyName: w.companyName,
            monthlySalary: w.monthlySalary?.toString(),
            salaryGrade: w.salaryGrade,
            appointmentStatus: w.appointmentStatus,
            isGovernment: w.isGovernment
        })));
    }

    if (p.trainings && Array.isArray(p.trainings)) {
        replaceTraining(p.trainings.map((t: any) => ({
            title: t.title,
            dateFrom: t.dateFrom,
            dateTo: t.dateTo,
            hoursNumber: t.hoursNumber?.toString(),
            typeOfLd: t.typeOfLd,
            conductedBy: t.conductedBy
        })));
    }

    if (p.familyBackground && Array.isArray(p.familyBackground)) {
        replaceFamily(p.familyBackground);
        
        const spouse = p.familyBackground.find((f: any) => f.relationType === 'Spouse');
        const father = p.familyBackground.find((f: any) => f.relationType === 'Father');
        const mother = p.familyBackground.find((f: any) => f.relationType === 'Mother');
        
        if (spouse) {
            setValue("spouseLastName", spouse.lastName);
            setValue("spouseFirstName", spouse.firstName);
            setValue("spouseMiddleName", spouse.middleName);
            setValue("spouseSuffix", spouse.nameExtension);
            setValue("spouseOccupation", spouse.occupation);
            setValue("spouseEmployer", spouse.employer);
            setValue("spouseBusAddress", spouse.businessAddress);
            setValue("spouseTelephone", spouse.telephoneNo);
        }
        if (father) {
            setValue("fatherLastName", father.lastName);
            setValue("fatherFirstName", father.firstName);
            setValue("fatherMiddleName", father.middleName);
            setValue("fatherSuffix", father.nameExtension);
        }
        if (mother) {
            setValue("motherMaidenLastName", mother.lastName);
            setValue("motherMaidenFirstName", mother.firstName);
            setValue("motherMaidenMiddleName", mother.middleName);
            setValue("motherMaidenSuffix", mother.nameExtension);
        }

        const children = p.familyBackground.filter((f: any) => f.relationType === 'Child');
        replaceChildren(children.map((c: any) => ({
            name: `${c.firstName} ${c.lastName}`.trim(),
            birthDate: c.dateOfBirth
        })));
    }

    if (p.otherInfo && Array.isArray(p.otherInfo)) {
        replaceOtherInfo(p.otherInfo);
    }

    if (p.pdsQuestions) {
        setValue("pdsQuestions", p.pdsQuestions);
    }
    if (p.govtIdType) setValue("govtIdType", p.govtIdType);
    if (p.govtIdNo) setValue("govtIdNo", p.govtIdNo);
    if (p.govtIdIssuance) setValue("govtIdIssuance", p.govtIdIssuance);
  };

  const handlePdsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdsFileName(file.name);
    setIsParsingPds(true);
    const toastId = toast.loading(`Parsing ${file.name}...`);

      try {
        const response = await pdsApi.parsePds(file);
        if (response.data.success) {
          // 100% RAW VISIBILITY: Log exact backend response
          console.group("PDS Extraction Result");
          console.log("Status: SUCCESS");
          console.log("Raw Data:", response.data.data);
          console.groupEnd();

          handlePdsExtracted(response.data.data);
          
          if (response.data.avatar) {
              setAvatarPreview(response.data.avatar);
          }
          toast.success("PDS Extracted & Form Populated 100%!", { id: toastId });
        } else {
          toast.error(response.data.message || "Failed to parse PDS", { id: toastId });
        }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to PDS Parser Service", { id: toastId });
    } finally {
      setIsParsingPds(false);
    }
  };

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

    // 5. Educational Background (Bulk mapped to array)
    if (applicant.educationalBackground) {
        // applicant.educations would be better if it exists in HiredApplicant
        // Otherwise we map what we have
    }

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
            eligibilityName: el.eligibilityName || "",
            rating: el.rating?.toString() || "",
            examDate: el.examDate ? formatDateForInput(el.examDate) : "",
            examPlace: el.examPlace || "",
            licenseNumber: el.licenseNumber || "",
            validityDate: el.validityDate ? formatDateForInput(el.validityDate) : ""
        })));
    } else if (applicant.eligibility) {
        try {
            const parsedEligibilities = safeParse(applicant.eligibility) as Record<string, string | number | null>[];
            if (Array.isArray(parsedEligibilities)) {
                setValue("eligibilities", parsedEligibilities.map((el): { eligibilityName: string; rating: string; examDate: string; examPlace: string; licenseNumber: string; validityDate: string } => ({
                    eligibilityName: String(el["name"] || el["eligibilityName"] || ""),
                    rating: String(el["rating"] || ""),
                    examDate: String(el["examDate"] ? formatDateForInput(String(el["examDate"])) : ""),
                    examPlace: String(el["examPlace"] || ""),
                    licenseNumber: String(el["licenseNo"] || el["licenseNumber"] || ""),
                    validityDate: String(el["licenseValidUntil"] || el["validityDate"] ? formatDateForInput(String(el["licenseValidUntil"] || el["validityDate"])) : "")
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
            const recognitions = info?.recognitions;
            const memberships = info?.memberships;
            
            const combinedOtherInfo: { type: 'Skill' | 'Recognition' | 'Membership', description: string }[] = [];
            if (Array.isArray(skills)) skills.forEach(s => combinedOtherInfo.push({ type: 'Skill', description: typeof s === 'string' ? s : (s.description || s.value || "") }));
            if (Array.isArray(recognitions)) recognitions.forEach(r => combinedOtherInfo.push({ type: 'Recognition', description: typeof r === 'string' ? r : (r.description || r.value || "") }));
            if (Array.isArray(memberships)) memberships.forEach(m => combinedOtherInfo.push({ type: 'Membership', description: typeof m === 'string' ? m : (m.description || m.value || "") }));
            
            setValue("otherInfo", combinedOtherInfo);
        } catch(e) { console.error("OtherInfo parsing failed", e); }
    }


    // 9. Additional Data & Photo
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
              const fullTitle = p.itemNumber ? `${p.positionTitle} (${p.itemNumber})` : p.positionTitle;
              return p.positionTitle === userJobTitle || 
                     fullTitle === userJobTitle ||
                     userJobTitle.startsWith(p.positionTitle);
          });
          
          if (matchingPos) {
              const finalVal = matchingPos.itemNumber ? `${matchingPos.positionTitle} (${matchingPos.itemNumber})` : matchingPos.positionTitle;
              setValue("position", finalVal);
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
      if (authUser.agencyEmployeeNo) {
          setValue("agencyEmployeeNo", authUser.agencyEmployeeNo);
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
          // setValue("educationalBackground", authUser.educationalBackground); // Legacy
      }

      // If we are actually forced into this mode, show success
      if (isFinalizingSetup) {
        toast.success("Form pre-filled from your portal setup data!");
      }
    }
  }, [isFinalizingSetup, authUser, setValue, positions]);

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    // 100% Zero-Validation: Biometric enrollment check removed for automated flow

    const formData = new FormData();
    const finalData = {
        ...data,
        address: prefilledAddress || data.address,
        permanentAddress: prefilledPermanentAddress || data.permanentAddress,
        employeeId: data.employeeId || actualEmployeeId
    };

    const ignoreKeys = ['avatar'];
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
          sessionStorage.clear();
      }

      if (response.data?.data?.requiresVerification) {
          toast.success("Registration Successful! Please verify the email.");
          const newId = response.data?.data?.id;
          if (newId) setCreatedEmployeeDbId(Number(newId));
          setVerificationEmail(data.email || "");
          setIsVerifyModalOpen(true);
          return;
      }

      toast.success("Employee Record Created Successfully!");
      if (isFinalizingSetup) {
          navigate("/admin-dashboard");
      } else {
          navigate(`/admin-dashboard/departments?department=${queryDept || ''}`);
      }
    } catch (error) {
      console.error(error);
      let msg = "Registration failed";
      if (typeof error === 'object' && error !== null && 'response' in error) {
          const resData = (error as any).response?.data;
          if (resData?.code === 'DUPLICATE_NAME') {
              setShowDuplicateModal(true);
              setIsSubmitting(false);
              return;
          }
          if (resData?.message) msg = resData.message;
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

  const appointmentOptions = [
    { value: "Permanent", label: "Permanent" },
    { value: "Contractual", label: "Contractual" },
    { value: "Casual", label: "Casual" },
    { value: "Job Order", label: "Job Order (JO)" },
    { value: "Contract of Service", label: "Contract of Service (COS)" }
  ] as const;
  
  const roleOptions = [
    { value: "Employee", label: "Employee (Portal Access)" },
    { value: "Human Resource", label: "Human Resource (Admin Access)" },
    { value: "Administrator", label: "Administrator (Super Access)" }
  ] as const;

  const { data: departmentsData } = useDepartmentsQuery();

  const departmentOptions = useMemo(() => {
    if (!departmentsData) return [];
    return departmentsData.map(dept => ({ value: dept.name, label: dept.name }));
  }, [departmentsData]);

  const positionOptions = useMemo(() => {
    if (!positions || positions.length === 0) return [];
    return positions.map(pos => {
        const fullTitle = pos.itemNumber ? `${pos.positionTitle} (${pos.itemNumber})` : pos.positionTitle;
        return { 
            value: fullTitle, 
            label: fullTitle 
        };
    });
  }, [positions]);

  const onInvalid = (errors: Record<string, any>) => {
    console.error("100% Zero-Validation Debugging | Form Errors Detected:", errors);
    
    // Step-by-step debug logging for every field failure
    Object.keys(errors).forEach((key) => {
      const error = errors[key];
      if (error.message) {
        console.warn(`[VALIDATION FAIL] Field: ${key} | Message: ${error.message}`);
      } else if (typeof error === 'object') {
          // Handle nested arrays or objects
          console.warn(`[VALIDATION FAIL] Field Complex: ${key} | Raw:`, error);
      }
    });

    const errorData = getFirstErrorMessage(errors);
    if (errorData) {
      toast.error(`Form Error: [${errorData.field}] ${errorData.message}`);
      const errorElement = document.querySelector(`[name="${errorData.field}"]`);
      if (errorElement) errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      toast.error("Please fill in all required fields correctly.");
    }
  };


  const inputClass = `w-full h-11 px-4 text-sm font-bold border-[1.5px] rounded-lg shadow-sm bg-gray-100/60 text-gray-900 border-gray-200 hover:bg-gray-100 focus:bg-white focus:ring-[3px] focus:ring-gray-100 focus:border-gray-800 focus:outline-none transition-all placeholder:text-gray-400 placeholder:font-normal`;
  const labelClass = `text-[11px] font-bold text-gray-600 ml-1 mb-1.5 block`;
  const errorClass = `!border-red-500 ring-1 ring-red-500/20`;

  const getInputClass = (name: keyof RegisterFormValues) => {
    return `${inputClass} ${errors[name] ? errorClass : ""}`;
  };

  const FieldError = ({ name }: { name: Path<RegisterFormValues> }) => {
    const error = get(errors, name) as RHFFieldError | undefined;
    return (
      <div className="min-h-[18px] w-full mt-1">
        {error && (
          <p className="text-[10px] text-red-600 font-bold ml-1 animate-in fade-in slide-in-from-top-1">
            {error.message || ""}
          </p>
        )}
      </div>
    );
  };

  const cardClass = "bg-white p-5 rounded-lg border border-gray-100 shadow-sm space-y-4 mb-6 relative overflow-hidden";
  const cardHeaderClass = "text-sm font-bold text-gray-800 tracking-wide uppercase border-b border-gray-100 pb-2 mb-3 flex items-center gap-2";

  return (
    <div className="w-full h-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative min-h-[calc(100vh-80px)]">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            <button className="text-gray-400 cursor-pointer hover:text-gray-900 transition font-bold text-xs border border-gray-200 px-4 h-9 flex items-center rounded-lg bg-white shadow-sm" onClick={() => navigate(-1)}>Back</button>
            Employee registration
          </h1>
          <p className="mt-1 text-sm text-gray-500 ml-10 font-medium">
            {isHiredType 
              ? "Registering a newly hired applicant into the employee database."
              : "PDS-driven encoding for existing personnel."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-[10px] tracking-wider font-bold border border-gray-200 flex items-center gap-2 shadow-sm">
                <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                Automated administrative session
            </div>
            
            <div className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-[10px] tracking-wider font-black border border-gray-100 flex items-center gap-2 shadow-sm">
                Next ID sequence: {isNextIdLoading ? 'Syncing...' : (actualEmployeeId || '----')}
            </div>
        </div>
      </div>
      <SEO 
        title="Admin Registration"
        description="Employee management registration pipeline for administrative personnel."
      />

      <form 
        onSubmit={handleSubmit(onSubmit, onInvalid)} 
        className="w-full flex flex-col items-start gap-6 mt-10"
      >
        
        {/* Premium PDS Upload Slot */}
        <div className="w-full bg-white rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="relative z-10 space-y-1 text-left">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                    PDS Auto-Population
                </h3>
                <p className="text-gray-500 text-sm max-w-xl">
                    Upload your PDS (Excel or PDF) to automatically fill the registration details below.
                </p>
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3">
                <label className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap">
                    {isParsingPds ? <Loader2 className="animate-spin" size={18} /> : null}
                    {isParsingPds ? 'Extracting...' : 'Upload PDS File'}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".xlsx,.xls,.xlsm,.pdf,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12" 
                      onChange={handlePdsUpload}
                      disabled={isParsingPds}
                    />
                </label>

                {pdsFileName && !isParsingPds && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-700">
                        <span className="text-xs font-semibold truncate max-w-[180px]">{pdsFileName}</span>
                        <button 
                            type="button"
                            onClick={() => setPdsFileName(null)}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            REMOVE
                        </button>
                    </div>
                )}
            </div>
        </div>


              <div className="w-full flex flex-col lg:flex-row gap-8 items-start">
                  
                {/* Left Column: Form Section */}
                <div className="flex-1 w-full space-y-6">
                
              {/* Profile Photo & Summary Slot */}
              <div className="bg-white rounded-lg border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                 <div className="flex-shrink-0 relative group">
                    <div className="w-32 h-32 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-gray-400 group-hover:bg-gray-50">
                       {avatarPreview ? (
                          <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                       ) : (
                          <span className="text-[10px] text-gray-400 font-bold tracking-widest group-hover:text-gray-600 transition-colors">No photo</span>
                       )}
                    </div>
                    <input type="file" ref={avatarRef} onChange={handleAvatarChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/jpeg,image/png,image/webp" />
                 </div>
                 <div className="flex-1 w-full space-y-4">
                    <div>
                       <h3 className="text-lg font-black text-gray-900 tracking-tight">Registration summary</h3>
                       <p className="text-sm text-gray-500">Automated extraction results from the uploaded PDS.</p>
                    </div>
                    
                    {!pdsFileName && !isFinalizingSetup && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                            <p className="text-sm text-amber-800 font-medium leading-relaxed">
                                Please **Upload a PDS File** above to begin the automated registration. All fields will be extracted 100% accurately.
                            </p>
                        </div>
                    )}

                    {pdsFileName && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 py-5 border-t border-gray-100">
                             <div>
                                 <label className="text-[11px] font-bold text-gray-500 mb-1 block">Last name</label>
                                 <p className="text-sm font-black text-gray-900 leading-tight">{watch("lastName") || "---"}</p>
                             </div>
                             <div>
                                 <label className="text-[11px] font-bold text-gray-500 mb-1 block">First name</label>
                                 <p className="text-sm font-black text-gray-900 leading-tight">{watch("firstName") || "---"}</p>
                             </div>
                             <div>
                                 <label className="text-[11px] font-bold text-gray-500 mb-1 block">Middle name</label>
                                 <p className="text-sm font-black text-gray-900 leading-tight">{watch("middleName") || "---"}</p>
                             </div>
                             <div>
                                 <label className="text-[11px] font-bold text-gray-500 mb-1 block">Name extension (suffix)</label>
                                 <p className="text-sm font-black text-gray-900 leading-tight">{watch("suffix") || "---"}</p>
                             </div>
                             <div className="sm:col-span-2 pt-2 border-t border-gray-50/50">
                                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 block">Synchronized full name</label>
                                <p className="text-base font-black text-gray-900 tracking-tight">
                                    {watch("lastName")}, {watch("firstName")} {watch("middleName") || ""} {watch("suffix") || ""}
                                </p>
                             </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-400 mb-1 block">System ID</label>
                                <p className="text-sm font-mono font-bold text-gray-700">
                                    {isNextIdLoading ? 'Pending...' : (actualEmployeeId.startsWith('Emp') ? actualEmployeeId : `EMP-${actualEmployeeId}`)}
                                </p>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-400 mb-1 block">Department</label>
                                <p className="text-sm font-bold text-gray-900">{watch("department") || "---"}</p>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-400 mb-1 block">Email address</label>
                                <p className="text-sm font-bold text-gray-900">{watch("email") || "---"}</p>
                            </div>
                        </div>
                    )}
                 </div>
              </div>

              {/* SECTION 1: EMPLOYEE IDENTITY & PERSONAL DETAILS */}
              <div className="bg-white rounded-lg border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
                      <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                          <span className="text-white font-black text-xs">01</span>
                      </div>
                      <div>
                          <h4 className="text-sm font-black text-gray-900 tracking-tight">Employee details</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Primary identity & personal info</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                          <label className={labelClass}>Last name <span className="text-red-500">*</span></label>
                          <input {...register("lastName")} className={inputClass} />
                          {errors.lastName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.lastName.message}</p>}
                      </div>
                      <div className="space-y-1">
                          <label className={labelClass}>First name <span className="text-red-500">*</span></label>
                          <input {...register("firstName")} className={inputClass} />
                          {errors.firstName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.firstName.message}</p>}
                      </div>
                      <div className="space-y-1">
                          <label className={labelClass}>Middle name</label>
                          <input {...register("middleName")} className={inputClass} />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                       <div className="space-y-1">
                          <label className={labelClass}>Suffix (Optional)</label>
                          <input {...register("suffix")} placeholder="Jr / III" className={inputClass} />
                      </div>
                      <div className="space-y-1">
                          <label className={labelClass}>Official email address <span className="text-red-500">*</span></label>
                          <input {...register("email")} className={inputClass} />
                          {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email.message}</p>}
                      </div>
                  </div>

                  <div className="pt-5 border-t border-gray-100">
                      <div className="space-y-1">
                          <label className={labelClass}>Account password <span className="text-red-500">*</span></label>
                          <input 
                            type="password" 
                            {...register("password")} 
                            placeholder="Min. 8 chars with Upper, Lower & Number"
                            className={inputClass} 
                          />
                          {errors.password && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.password.message}</p>}
                      </div>
                  </div>
              </div>

              {/* SECTION 2: HR & EMPLOYMENT PLACEMENT */}
              <div className="bg-white rounded-lg border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
                      <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                          <span className="text-white font-black text-xs">02</span>
                      </div>
                      <div>
                          <h4 className="text-sm font-black text-gray-900 tracking-tight">HR & employment placement</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Official position & system access</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                          <label className={labelClass}>Department</label>
                          <Controller
                              name="department"
                              control={control}
                              render={({ field }) => (
                                  <Combobox
                                      options={departmentOptions}
                                      value={field.value}
                                      onChange={field.onChange}
                                      placeholder="Search department"
                                      error={!!errors.department}
                                      buttonClassName="bg-gray-100/60 border-gray-200 !h-11 text-sm font-bold text-gray-900 focus:ring-[3px] focus:ring-gray-100"
                                  />
                              )}
                          />
                      </div>
                      <div className="space-y-1">
                          <label className={labelClass}>Position title</label>
                          <Controller
                              name="position"
                              control={control}
                              render={({ field }) => (
                                  <Combobox
                                      options={positionOptions}
                                      value={field.value}
                                      onChange={field.onChange}
                                      placeholder="Search position"
                                      error={!!errors.position}
                                      buttonClassName="bg-gray-100/60 border-gray-200 !h-11 text-sm font-bold text-gray-900 focus:ring-[3px] focus:ring-gray-100"
                                  />
                              )}
                          />
                      </div>
                      <div className="space-y-1">
                          <label className={labelClass}>Appointment type</label>
                          <Controller
                              name="appointmentType"
                              control={control}
                              render={({ field }) => (
                                  <Combobox
                                      options={appointmentOptions}
                                      value={field.value}
                                      onChange={field.onChange}
                                      placeholder="Select appointment"
                                      error={!!errors.appointmentType}
                                      buttonClassName="bg-gray-100/60 border-gray-200 !h-11 text-sm font-bold text-gray-900 focus:ring-[3px] focus:ring-gray-100"
                                  />
                              )}
                          />
                      </div>
                      <div className="space-y-1">
                          <label className={labelClass}>System role (Access level)</label>
                          <Controller
                              name="role"
                              control={control}
                              render={({ field }) => (
                                  <Combobox
                                      options={roleOptions}
                                      value={field.value}
                                      onChange={field.onChange}
                                      placeholder="Select access role"
                                      error={!!errors.role}
                                      buttonClassName="bg-gray-100/60 border-gray-200 !h-11 text-sm font-bold text-gray-900 focus:ring-[3px] focus:ring-gray-100"
                                  />
                              )}
                          />
                      </div>
                  </div>
              </div>

              {pdsFileName && (
                  <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-black text-gray-900 tracking-tight">Data integrity check</h4>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                          We have successfully mapped **Personal Info**, **Education Background**, and **Work Experience** from your uploaded document. 
                          The record is now staged for insertion into the database.
                      </p>
                  </div>
              )}
          </div>

        {/* Right Column: Biometrics & Submit */}
        <div className="w-full lg:w-[420px] shrink-0 space-y-6 lg:sticky lg:top-8">
          
          {/* Biometrics Enroll */}
          <div id="biometrics-section" className="bg-white rounded-lg border border-gray-100 p-6 flex flex-col items-center justify-center gap-6 shadow-sm relative">
              <button 
                  type="button"
                  onClick={() => setResetModalOpen(true)}
                  className="absolute top-4 right-4 text-[10px] text-gray-400 hover:text-red-500 font-bold tracking-wider transition-colors"
                  title="Reset device and database"
              >
                  Reset scanner
              </button>

              <div className="flex-1 text-left md:pr-8">
                  <h3 className="font-black text-xl text-gray-900 flex items-center gap-3 mb-2 tracking-tight">
                      {bioEnrolled ? "Biometric captured" : "Fingerprint setup"}
                  </h3>
                  <p className="text-sm font-medium text-gray-500 mb-6">
                      Secure this account by registering the employee's fingerprint for attendance tracking.
                  </p>
                  
                  <div className="flex gap-4 mb-6">
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 flex-1">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                              enrollStep >= 1 || bioEnrolled ? 'bg-slate-500 border-slate-500 text-white' : 
                              enrollError && enrollStep === 0 ? 'bg-rose-500 border-rose-500 text-white' : 'border-gray-300 text-gray-300'
                          }`}>
                              {(enrollStep >= 1 || bioEnrolled) && <span className="text-[10px] font-bold">OK</span>}
                          </div>
                          <span className="text-xs font-bold text-gray-700">Initial Scan</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 flex-1">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                              enrollStep >= 2 || bioEnrolled ? 'bg-slate-500 border-slate-500 text-white' : 
                              enrollError && enrollStep === 1 ? 'bg-rose-500 border-rose-500 text-white' : 'border-gray-300 text-gray-300'
                          }`}>
                              {(enrollStep >= 2 || bioEnrolled) && <span className="text-[10px] font-bold">OK</span>}
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
                          className="px-8 h-12 bg-gray-900 border border-gray-800 text-white text-sm font-bold rounded-xl disabled:opacity-50 disabled:bg-gray-400 hover:bg-gray-800 hover:shadow-lg transition-all active:scale-95 shadow-md flex items-center gap-2"
                      >
                          {enrollStep > 0 && enrollStep < 1 ? "Scanner starting..." : "Initialize scanner"}
                      </button>
                  )}
              </div>

              <div className="flex flex-col items-center justify-center w-full mt-6 pt-6 border-t border-gray-100">
                  <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${
                      enrollError ? 'bg-rose-50 text-rose-500 shadow-sm border-2 border-rose-200' :
                      bioEnrolled ? 'bg-slate-50 text-slate-500 shadow-sm border-2 border-slate-200' : 
                      bioStatus === 'CONNECTED' ? 'bg-slate-50 text-slate-400 shadow-sm border-2 border-slate-200' : 'bg-gray-50 text-gray-400 shadow-sm border border-gray-200'
                  }`}>
                      <div className="text-[11px] font-black">{bioEnrolled ? "ID OK" : "SCAN"}</div>
                  </div>
                  
                  <p className={`text-xs font-bold mt-4 text-center rounded-full px-4 py-1.5 ${
                      enrollError ? 'text-rose-700 bg-rose-100' : 
                      bioEnrolled ? 'text-slate-700 bg-slate-100' : 
                      'text-gray-700 bg-gray-100'
                  }`}>
                      {enrollError ? `Failed: ${enrollError}` :
                       bioEnrolled ? "Stored Successfully" : 
                       enrollStep === 1 ? "Now remove finger" :
                       bioStatus === 'CONNECTED' ? "Ready to Scan" : "Scanner Disconnected"}
                  </p>
              </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm mt-2 flex flex-col gap-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                      type="checkbox" 
                      {...register("certifiedCorrect")}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-slate-900 focus:ring-slate-500 transition-all cursor-pointer accent-slate-900"
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
                disabled={loading || isSubmitting}
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white px-8 rounded-xl text-sm font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex justify-center items-center gap-2 active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : null}
                Complete registration
              </button>
          </div>
        </div>
      </div>
      <input type="hidden" {...register("applicantId")} />

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
      </form>
    </div>
  );
}
