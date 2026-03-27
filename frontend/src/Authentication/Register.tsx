import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Fingerprint, Upload, CheckCircle2, AlertCircle, Loader2, Check, X, Facebook, Twitter, Linkedin, GraduationCap, Briefcase, Plus, Trash2 } from "lucide-react";
import AuthLayout from "@components/Custom/Auth/AuthLayout";
import Combobox from "@/components/Custom/Combobox";
import ConfirmationModal from '../components/CustomUI/ConfirmationModal';
import EmailVerificationModal from './EmailVerificationModal';
import { PhilippineAddressSelector } from '@components/Custom/Shared/PhilippineAddressSelector';
import type { Region, Province, CityMunicipality, PhilAddressLibrary } from '@/types/ph-address';
import { useBiometricDevice } from "@/hooks/useBiometricDevice";
import { useForm, SubmitHandler, useFieldArray, Path, get, FieldError as RHFFieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema } from "@/schemas/authSchema";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { useRegisterMutation } from "@/hooks/useAuthQueries";
import { useDepartmentsQuery, usePositionsQuery, useNextEmployeeIdQuery, useHiredApplicantSearch, useEmailUniquenessQuery, useGovtIdUniquenessQuery } from "@/hooks/useCommonQueries";
import { useDebounce } from "@/hooks/useDebounce";
import { ID_REGEX } from "@/schemas/idValidation";
import { useAuth } from "@/hooks/useAuth";
import { HiredApplicant } from "@/types/recruitment_applicant";
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import ph from 'phil-reg-prov-mun-brgy';
import { GENDER_OPTIONS, CIVIL_STATUS_OPTIONS, BLOOD_TYPE_OPTIONS, PDS_EDUCATION_LEVELS } from "@/constants/referenceData";
import axios from "axios";
import SEO from "@/components/Global/SEO";

// Locally defined to avoid symbol-mismatch errors with zodResolver while maintaining 100% type safety
export type RegisterFormValues = z.input<typeof RegisterSchema>;

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

// Using library directly without unsafe assertions to comply with strict linting
// ph is accessed as needed in the component logic below

type PdsEducationLevelsType = typeof PDS_EDUCATION_LEVELS[number];

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 100% Type-safe narrowing for navigation state without unsafe assertions
  const state = location.state as Record<string, unknown> | null;
  const hasSetupData = (s: unknown): s is LocationState => {
    return !!s && typeof s === 'object' && 'setupData' in s;
  };
  const setupData = hasSetupData(state) ? (state as LocationState).setupData : undefined;
  
  const registerMutation = useRegisterMutation();
  const loading = registerMutation.isPending;
  const [searchParams] = useSearchParams();
  
  const { user, checkAuth } = useAuth();
  
  // Robust Detection: Use both URL mode and user's profile status
  const isFinalizingSetup = searchParams.get('mode') === 'finalize-setup' || user?.profileStatus === 'Initial';

  const { 
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    mode: "onBlur",
    defaultValues: {
      employeeId: "",
      firstName: "",
      lastName: "",
      middleName: "",
      suffix: "",
      email: "",
      password: "",
      religion: "",
      education: {
        Elementary: { school: "", course: "", from: "", to: "", units: "", yearGrad: "", honors: "" },
        Secondary: { school: "", course: "", from: "", to: "", units: "", yearGrad: "", honors: "" },
        Vocational: { school: "", course: "", from: "", to: "", units: "", yearGrad: "", honors: "" },
        College: { school: "", course: "", from: "", to: "", units: "", yearGrad: "", honors: "" },
        Graduate: { school: "", course: "", from: "", to: "", units: "", yearGrad: "", honors: "" },
      },
      yearsOfExperience: "",
      highestDegree: "",
      experience: "",
      skills: "",
      eligibilities: [],
      
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
      nationality: "Filipino",
      bloodType: "",
      heightM: "",
      weightKg: "",
      dutyType: "Standard",
      appointmentType: "Permanent",
      startTime: "08:00",
      endTime: "17:00",
      gsisNumber: "",
      pagibigNumber: "",
      philhealthNumber: "",
      umidNumber: "",
      philsysId: "",
      tinNumber: "",
      educationalBackground: "",
      schoolName: "",
      course: "",
      yearGraduated: "",
      eligibilityType: "",
      eligibilityNumber: "",
      eligibilityDate: "",
      isOldEmployee: false,
      citizenshipType: "Filipino",
      dualCountry: "",
      govtIdType: "",
      govtIdNo: "",
      govtIdIssuance: "",
      agencyEmployeeNo: "",
      workExperiences: [],
      trainings: [],
    }
  });



  const { fields: _trainingFields, append: _appendTraining, remove: _removeTraining } = useFieldArray({
    control,
    name: "trainings"
  });

  const { fields: _eligibilityFields, append: _appendEligibility, remove: _removeEligibility } = useFieldArray({
    control,
    name: "eligibilities"
  });

  const { fields: workExpFields, append: appendWorkExp, remove: removeWorkExp } = useFieldArray({
    control,
    name: "workExperiences"
  });

  // REMOVED: Automatically adding empty rows as it conflicts with z.string().min(1) requirements
  // user must manually click "Add" to prevent validation errors on empty sections.

  const isOldEmployee = watch("isOldEmployee");

  useEffect(() => {
    const dutiesParam = searchParams.get('duties');
    const deptParam = searchParams.get('dept');
    const typeParam = searchParams.get('type');
    
    if (dutiesParam === 'Standard' || dutiesParam === 'Irregular') {
      setValue("dutyType", dutiesParam);
    }
    if (deptParam) {
      setValue("department", deptParam);
    }
    if (typeParam === 'old') {
      setValue("isOldEmployee", true);
    }
  }, [searchParams, setValue]);

  useEffect(() => {
    register("department");
    register("position");
  }, [register]);

  const { data: departments = [] } = useDepartmentsQuery();
  const { data: positions = [] } = usePositionsQuery();

  useEffect(() => {
    if (isFinalizingSetup && user) {
      setValue("firstName", user.firstName || "");
      setValue("lastName", user.lastName || "");
      setValue("middleName", user.middleName || "");
      setValue("suffix", user.suffix || "");
      setValue("email", user.email || ""); // Ensure email is filled if available
      setValue("department", user.department || "");
      setValue("employeeId", user.employeeId || "");
      
      if (user.jobTitle) {
          // If the job title is already in the Title (ItemNumber) format, use it
          if (user.jobTitle.includes('(') && user.jobTitle.includes(')')) {
              setValue("position", user.jobTitle);
          } else {
              // Try to find a match in the positions list to get the full Title (ItemNumber) string
              const matchedPos = positions.find(p => p.positionTitle === user.jobTitle);
              if (matchedPos) {
                  setValue("position", `${matchedPos.positionTitle} (${matchedPos.itemNumber})`);
              } else {
                  setValue("position", user.jobTitle);
              }
          }
      }

      setValue("dutyType", user.dutyType || "Standard");

      // Type-safe assignment for appointmentType without assertion
      const appType = user.appointmentType;
      if (appType && typeof appType === 'string') {
          const validTypes = ['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary', 'Contract of Service', 'JO', 'COS'];
          if (validTypes.includes(appType)) {
              setValue("appointmentType", appType);
          }
      }
      
      const userRole = user.role;
      if (userRole === 'Administrator' || userRole === 'Human Resource' || userRole === 'Employee') {
          setValue("role", userRole);
      }

      toast.success("Initial account verified! Please complete your PDS and Biometrics.");
    }
  }, [isFinalizingSetup, user, setValue, positions]);

  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [enrollStep, setEnrollStep] = useState(0);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showPreFillModal, setShowPreFillModal] = useState(false);
  const [matchedApplicant, setMatchedApplicant] = useState<HiredApplicant | null>(null);
  const [hasAutomaticallyChecked, setHasAutomaticallyChecked] = useState(false);

  const selectedDeptName = watch("department");
  const selectedDeptId = departments.find(d => d.name === selectedDeptName)?.id;

  // Track if address is pre-filled as a raw string from Applicant record
  const [isAddressPrefilled, setIsAddressPrefilled] = useState(false);
  const [prefilledAddress, setPrefilledAddress] = useState("");
  const [prefilledPermanentAddress, setPrefilledPermanentAddress] = useState("");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bioEnrolled, setBioEnrolled] = useState(false);
  
  const { data: nextIdData } = useNextEmployeeIdQuery();
  const actualEmployeeId = nextIdData || "";

  const [enrollError, setEnrollError] = useState<string | null>(null);

  const enrollStepRef = useRef<number>(enrollStep);
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
      const setupRole = setupData.role;
      if (setupRole === "Administrator" || setupRole === "Human Resource" || setupRole === "Employee") {
        setValue("role", setupRole);
      } else {
        setValue("role", "Employee");
      }
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

  const debouncedEmail = useDebounce(watch("email"), 500);
  const debouncedGsis = useDebounce(watch("gsisNumber"), 500);
  const debouncedPagibig = useDebounce(watch("pagibigNumber"), 500);
  const debouncedPhilhealth = useDebounce(watch("philhealthNumber"), 500);
  const debouncedUmid = useDebounce(watch("umidNumber"), 500);
  const debouncedPhilsys = useDebounce(watch("philsysId"), 500);
  const debouncedTin = useDebounce(watch("tinNumber"), 500);
  // const debouncedAgencyEmployeeNo = useDebounce(watch("agencyEmployeeNo"), 500); // Removed as unused
  // const debouncedEligibilityNo = useDebounce(watch("eligibilityNumber"), 500); // Removed as unused

  const { data: emailConflict } = useEmailUniquenessQuery(debouncedEmail, !!debouncedEmail && !isSubmitting);
  const isEmailTaken = emailConflict?.isUnique === false;

  const { data: idConflicts } = useGovtIdUniquenessQuery({
    gsisNumber: debouncedGsis || undefined,
    pagibigNumber: debouncedPagibig || undefined,
    philhealthNumber: debouncedPhilhealth || undefined,
    umidNumber: debouncedUmid || undefined,
    philsysId: debouncedPhilsys || undefined,
    tinNumber: debouncedTin || undefined,
    // agencyEmployeeNo: debouncedAgencyEmployeeNo || undefined, // Removed as unused
    // eligibilityNumber: debouncedEligibilityNo || undefined // Removed as unused
  }, (
    (debouncedGsis?.length || 0) > 2 ||
    (debouncedPagibig?.length || 0) > 2 ||
    (debouncedPhilhealth?.length || 0) > 2 ||
    (debouncedUmid?.length || 0) > 2 ||
    (debouncedPhilsys?.length || 0) > 2 ||
    (debouncedTin?.length || 0) > 2
    // (debouncedAgencyEmployeeNo?.length || 0) > 2 || // Removed as unused
    // (debouncedEligibilityNo?.length || 0) > 2 // Removed as unused
  ) && !isSubmitting);

  const isIdTakenMap = idConflicts?.conflicts || {};


  const isMeycauayan = watch("isMeycauayan") === "true";
  const firstName = watch("firstName");
  const lastName = watch("lastName");
   // Watch for dynamic address preview
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
  const avatarRef = useRef<HTMLInputElement>(null);

  /* // Removed as unused
  const extractName = <T extends Record<string, unknown>, K extends keyof T>(arr: T[], key: K, val: string): string => {
      const found = arr.find((x) => String(x[key]) === val);
      if (found && typeof found === 'object' && 'name' in found && typeof found.name === 'string') {
          return found.name;
      }
      return '';
  };
  */

  const formatAddr = (reg: string, prov: string, city: string, brgy: string, house: string, subd: string, street: string) => {
      const phLib = ph as PhilAddressLibrary;
      const rName = (phLib.regions as Region[]).find((x: Region) => x.reg_code === reg)?.name || '';
      const pName = (phLib.provinces as Province[]).find((x: Province) => x.prov_code === prov)?.name || '';
      const cName = (phLib.city_mun as CityMunicipality[]).find((x: CityMunicipality) => x.mun_code === city)?.name || '';
      const bName = brgy; // Barangay values are stored as their name
      return [house, subd, street, bName, cName, pName, rName].filter(Boolean).join(', ');
  };

  // Real-time residential address
  useEffect(() => {
      if (prefilledAddress || (isFinalizingSetup && user?.address)) {
          if (!watch("barangay")) setValue("barangay", "Prefilled"); // Bypass Zod Validation
          return;
      }
      const addr = formatAddr(resRegion||'', resProvince||'', resCity||'', resBarangay||'', resHouse||'', resSubd||'', resStreet||'');
      if (addr) {
          setValue("address", addr);
          setValue("residentialAddress", addr);
      }
      if (resBarangay) {
          setValue("barangay", resBarangay);
      } else {
          setValue("barangay", "");
      }
  }, [resRegion, resProvince, resCity, resBarangay, resHouse, resSubd, resStreet, setValue, prefilledAddress, isFinalizingSetup, user]);

  // Real-time permanent address
  useEffect(() => {
      if (prefilledPermanentAddress || (isFinalizingSetup && user?.permanentAddress)) {
          return;
      }
      const addr = formatAddr(permRegion||'', permProvince||'', permCity||'', permBarangay||'', permHouse||'', permSubd||'', permStreet||'');
      if (addr) {
          setValue("permanentAddress", addr);
      }
  }, [permRegion, permProvince, permCity, permBarangay, permHouse, permSubd, permStreet, setValue, prefilledPermanentAddress, isFinalizingSetup, user]);

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
    
    // Mapping function to handle EducationLevel normalization
    const mapEduLevel = (level: string | null): PdsEducationLevelsType | "" => {
      if (!level) return "";
      const normalized = level.trim();
      const match = PDS_EDUCATION_LEVELS.find(l => l.toLowerCase() === normalized.toLowerCase());
      if (match) return match as PdsEducationLevelsType;
      
      // Fallback mappings for common PDS variants
      if (normalized.includes("Elementary")) return "Elementary";
      if (normalized.includes("Secondary") || normalized.includes("High School")) return "Secondary";
      if (normalized.includes("Vocational")) return "Vocational";
      if (normalized.includes("College")) return "College";
      if (normalized.includes("Graduate")) return "Graduate Studies";
      
      return "";
    };

    interface LocalEducationLevel {
      school?: string;
      yearGrad?: string;
      course?: string;
      from?: string;
      to?: string;
      units?: string;
      honors?: string;
    }

    interface LocalEducationBackground {
      Elementary?: LocalEducationLevel;
      Secondary?: LocalEducationLevel;
      Vocational?: LocalEducationLevel;
      College?: LocalEducationLevel;
      Graduate?: LocalEducationLevel;
    }

    setValue("firstName", matchedApplicant.firstName);
    setValue("lastName", matchedApplicant.lastName);
    setValue("middleName", matchedApplicant.middleName || "");
    setValue("suffix", matchedApplicant.suffix || "");
    setValue("email", matchedApplicant.email);
    setValue("mobileNo", matchedApplicant.phoneNumber || "");
    
    if (matchedApplicant.birthDate) {
        setValue("birthDate", matchedApplicant.birthDate.split('T')[0]);
    }
    
    setValue("placeOfBirth", matchedApplicant.birthPlace || "");
    setValue("gender", (matchedApplicant.sex as "Male" | "Female" | "") || "");
    setValue("civilStatus", (matchedApplicant.civilStatus as RegisterFormValues["civilStatus"]) || "");
    setValue("heightM", matchedApplicant.height || "");
    setValue("weightKg", matchedApplicant.weight || "");
    setValue("bloodType", matchedApplicant.bloodType || "");

    // 100% DATA PERSISTENCE: Added missing PDS identity fields
    if (matchedApplicant.citizenship) setValue("nationality", matchedApplicant.citizenship);
    if (matchedApplicant.citizenshipType) setValue("citizenshipType", matchedApplicant.citizenshipType);
    if (matchedApplicant.dualCountry) setValue("dualCountry", matchedApplicant.dualCountry);
    
    // Identifiers
    setValue("gsisNumber", matchedApplicant.gsisNumber || "");
    setValue("pagibigNumber", matchedApplicant.pagibigNumber || "");
    setValue("philhealthNumber", matchedApplicant.philhealthNumber || "");
    setValue("umidNumber", matchedApplicant.umidNumber || "");
    setValue("philsysId", matchedApplicant.philsysId || "");
    setValue("tinNumber", matchedApplicant.tinNumber || "");
    
    // 100% DATA PROPAGATION: Education & Experience Multi-Level Parsing
    if (matchedApplicant.educationalBackground) {
        try {
            // Check if it's a JSON object string from the new recruitment portal
            if (matchedApplicant.educationalBackground.startsWith('{')) {
                const eduData = JSON.parse(matchedApplicant.educationalBackground) as LocalEducationBackground;
                
                const levels: (keyof LocalEducationBackground)[] = ['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate'];
                
                levels.forEach(level => {
                    const data = eduData[level];
                    if (data) {
                        if (data.school) setValue(`education.${level}.school`, data.school);
                        if (data.course) setValue(`education.${level}.course`, data.course);
                        if (data.yearGrad) setValue(`education.${level}.yearGrad`, data.yearGrad);
                        if (data.from) setValue(`education.${level}.from`, data.from);
                        if (data.to) setValue(`education.${level}.to`, data.to);
                        if (data.units) setValue(`education.${level}.units`, data.units);
                        if (data.honors) setValue(`education.${level}.honors`, data.honors);
                    }
                });
            } else {
                // Fallback: Use legacy single-string mapping
                const eduLevel = mapEduLevel(matchedApplicant.educationalBackground);
                if (eduLevel) {
                    const levelKey = (eduLevel === 'Graduate Studies' ? 'Graduate' : eduLevel) as 'Elementary' | 'Secondary' | 'Vocational' | 'College' | 'Graduate';
                    setValue(`education.${levelKey}.school`, matchedApplicant.schoolName || "");
                    setValue(`education.${levelKey}.course`, matchedApplicant.course || "");
                    setValue(`education.${levelKey}.yearGrad`, matchedApplicant.yearGraduated || "");
                }
            }
        } catch (err: unknown) {
            console.error("Failed to parse educational background during pre-fill", err);
        }
    }

    setValue("yearsOfExperience", matchedApplicant.totalExperienceYears !== null ? String(matchedApplicant.totalExperienceYears) : "0");
    setValue("experience", matchedApplicant.experience || "");
    
    // Parse structured experience if available in JSON
    if (matchedApplicant.experience && matchedApplicant.experience.startsWith('[')) {
        try {
            type RawExperience = {
                positionTitle?: string;
                companyName?: string;
                dateFrom?: string;
                dateTo?: string;
                monthlySalary?: string;
                appointmentStatus?: string;
                isGovernment?: boolean | string;
            };
            const expData = JSON.parse(matchedApplicant.experience) as RawExperience[];
            if (Array.isArray(expData) && expData.length > 0) {
                setValue("workExperiences", expData.map(e => ({
                    positionTitle: e.positionTitle || "",
                    companyName: e.companyName || "",
                    dateFrom: e.dateFrom || "",
                    dateTo: e.dateTo || "",
                    monthlySalary: e.monthlySalary || "",
                    appointmentStatus: e.appointmentStatus || "",
                    isGovernment: e.isGovernment === true || e.isGovernment === 'true'
                })));
            }
        } catch (err: unknown) {
            console.error("Failed to parse work experience during pre-fill", err);
        }
    }
    
    setValue("skills", matchedApplicant.skills || "");
    
    // Eligibility
    if (matchedApplicant.eligibilityType || matchedApplicant.eligibility) {
        setValue("eligibilities", [{
            name: matchedApplicant.eligibilityType || matchedApplicant.eligibility || "",
            licenseNo: matchedApplicant.licenseNo || "",
            examDate: matchedApplicant.eligibilityDate ? matchedApplicant.eligibilityDate.split('T')[0] : null,
            rating: matchedApplicant.eligibilityRating || "",
            examPlace: matchedApplicant.eligibilityPlace || "",
            licenseValidUntil: null
        }]);
    }

    // Work Experience
    if (matchedApplicant.experience) {
        // Option to pre-populate work experiences if available in structured format
        // For now, we ensure the summary is set.
    }

    // Trainings
    if (matchedApplicant.training) {
        try {
        type RawTraining = { 
            title?: string; 
            trainingTitle?: string; 
            dateFrom?: string; 
            dateTo?: string; 
            inclusiveDates?: string;
            hoursNumber?: string | number;
            hours?: string | number;
            typeOfLd?: string;
            type?: string;
            conductedBy?: string;
            sponsoredBy?: string;
        };
        const trainingData = JSON.parse(matchedApplicant.training) as RawTraining[];
        if (Array.isArray(trainingData)) {
            setValue("trainings", trainingData.map((t) => ({
                title: String(t.title || t.trainingTitle || ""),
                dateFrom: String(t.dateFrom || (typeof t.inclusiveDates === 'string' ? t.inclusiveDates.split(' to ')[0] : "") || ""),
                dateTo: String(t.dateTo || (typeof t.inclusiveDates === 'string' ? t.inclusiveDates.split(' to ')[1] : "") || ""),
                hoursNumber: String(t.hoursNumber || t.hours || ""),
                typeOfLd: String(t.typeOfLd || t.type || ""),
                conductedBy: String(t.conductedBy || t.sponsoredBy || "")
            })));
        }
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error('JSON parsing failed');
            console.error("Failed to parse training data during pre-fill", error);
        }
    }

    // Social Links
    if (matchedApplicant.facebookUrl) setValue("facebookUrl", matchedApplicant.facebookUrl);
    if (matchedApplicant.linkedinUrl) setValue("linkedinUrl", matchedApplicant.linkedinUrl);
    if (matchedApplicant.twitterHandle) setValue("twitterHandle", matchedApplicant.twitterHandle);

    // Home Address mapping
    setValue("isMeycauayan", matchedApplicant.isMeycauayanResident ? "true" : "false");
    if (matchedApplicant.address) {
        setIsAddressPrefilled(true);
        setPrefilledAddress(matchedApplicant.address);
    }
    setValue("resRegion", matchedApplicant.resRegion || "");
    setValue("resProvince", matchedApplicant.resProvince || "");
    setValue("resCity", matchedApplicant.resCity || "");
    setValue("resBarangay", matchedApplicant.resBarangay || "");
    setValue("resHouseBlockLot", matchedApplicant.resHouseBlockLot || "");
    setValue("resStreet", matchedApplicant.resStreet || "");
    setValue("resSubdivision", matchedApplicant.resSubdivision || "");
    setValue("residentialZipCode", matchedApplicant.zipCode || "");

    // Permanent Address mapping
    if (matchedApplicant.permanentAddress) {
        setPrefilledPermanentAddress(matchedApplicant.permanentAddress);
    }
    setValue("permRegion", matchedApplicant.permRegion || "");
    setValue("permProvince", matchedApplicant.permProvince || "");
    setValue("permCity", matchedApplicant.permCity || "");
    setValue("permBarangay", matchedApplicant.permBarangay || "");
    setValue("permHouseBlockLot", matchedApplicant.permHouseBlockLot || "");
    setValue("permStreet", matchedApplicant.permStreet || "");
    setValue("permSubdivision", matchedApplicant.permSubdivision || "");
    setValue("permanentZipCode", matchedApplicant.permanentZipCode || "");

    // PDS Certifications
    setValue("govtIdType", matchedApplicant.govtIdType || "");
    setValue("govtIdNo", matchedApplicant.govtIdNo || "");
    setValue("govtIdIssuance", matchedApplicant.govtIdIssuance || "");

    // Emergency Contact
    setValue("emergencyContact", matchedApplicant.emergencyContact || "");
    setValue("emergencyContactNumber", matchedApplicant.emergencyContactNumber || "");

    // Photo
    if (matchedApplicant.photoUrl) {
        setAvatarPreview(matchedApplicant.photoUrl);
    }

    // Applicant data linking
    setValue("applicantId", matchedApplicant.id);
    if (matchedApplicant.hiredDate) {
        setValue("applicantHiredDate", matchedApplicant.hiredDate.split('T')[0]);
    }
    if (matchedApplicant.photoPath) {
        setValue("applicantPhotoPath", matchedApplicant.photoPath);
    }

    setShowPreFillModal(false);
    toast.success("Form pre-filled from application record.");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      setValue("avatar", file);
    }
  };

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data: RegisterFormValues) => {
    if (!bioEnrolled) {
        toast.error("Please enroll your fingerprint first!");
        document.getElementById('biometrics-section')?.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    const formData = new FormData();
    
    // Set current date as date accomplished
    data.dateAccomplished = new Date().toISOString().split('T')[0];
    
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

    // Append fields
    (Object.keys(data) as Array<keyof RegisterFormValues>).forEach((key) => {
        const value = data[key];
        if (!ignoreKeys.includes(key as string) && value !== undefined && value !== null) {
            if (Array.isArray(value) || (typeof value === 'object' && !(value instanceof File))) {
                // FIXED: 100% Precision - Stringify objects/arrays to prevent [object Object] corruption
                formData.append(key, JSON.stringify(value));
            } else if (!(value instanceof File)) {
                formData.append(key, String(value));
            }
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
      const response = await registerMutation.mutateAsync({ 
        data: formData, 
        mode: isFinalizingSetup ? 'finalize-setup' : undefined 
      });

      // Use the requiresVerification flag from backend to determine next step
      // This ensures all employees must verify, even in finalize-setup mode (Initial profile)
      if (response.data.data.requiresVerification) {
          toast.success("Registration Successful! Please verify your email.");
          setVerificationEmail(data.email);
          setIsVerifyModalOpen(true);
      } else {
          toast.success("Profile permanently saved! Redirecting to your dashboard...");
          // Sync auth state to get full permissions (for Admin/HR who might skip verification in finalize mode)
          await checkAuth();

          // 100% FIXED: Redirect to Admin Dashboard since Admin/HR already access the portal
          if (isFinalizingSetup && (user?.role === 'Administrator' || user?.role === 'Human Resource')) {
              navigate("/admin-dashboard");
          } else {
              navigate("/employee-dashboard");
          }
      }    } catch (error) {
      console.error(error);
      let msg = "Registration failed";
      
      if (axios.isAxiosError(error)) {
          const resData = error.response?.data as { 
              message?: string; 
              code?: string; 
              errors?: Array<{ path: string[]; message: string }> | Record<string, string>
          } | undefined;

          if (resData?.message) msg = resData.message;

          if (resData?.code === 'DUPLICATE_NAME') {
              setShowDuplicateModal(true);
              return;
          }

          if (resData?.code === 'ACCOUNT_LOCKED') {
              msg = resData.message || "Account is temporarily locked.";
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
              msg = resData.errors.map(err => {
                  if (typeof err === 'string') return err;
                  return err.message || JSON.stringify(err);
              }).join(' | ');
          }
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

  
  const getInputClass = (name: keyof RegisterFormValues) => {
    return `w-full bg-white border ${errors[name] || (isIdTakenMap[name as keyof typeof isIdTakenMap]) || (name === "email" && isEmailTaken) ? "border-red-500 ring-1 ring-red-500/20" : "border-gray-200 focus:border-green-600 focus:ring-4 focus:ring-green-600/10"} rounded-[12px] py-2.5 pl-10 text-sm transition-all duration-300 outline-none`;
  };

  const FieldError = ({ name }: { name: Path<RegisterFormValues> }) => {
    const error = get(errors, name) as RHFFieldError | undefined;
    if (!error) return null;
    return (
      <p className="text-[10px] text-red-600 font-bold mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
        {error.message || ""}
      </p>
    );
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

  const cardClass = "bg-white p-5 rounded-[15px] border border-gray-100 shadow-sm space-y-4 mb-6 relative overflow-hidden";
  const cardHeaderClass = "text-sm font-bold text-gray-800 tracking-wide uppercase border-b border-gray-100 pb-2 mb-3 flex items-center gap-2";

  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Complete your Employee Record profile"
      maxWidth="max-w-2xl"
    >
      <SEO 
        title="Employee Registration"
        description="Join the City Government of Meycauayan. Create your employee account and start your public service journey."
      />
      <div className="absolute top-4 right-4 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 shadow-sm flex items-center gap-2">
         <span className="relative flex h-2 w-2">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
           <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
         </span>
         Employee ID: {actualEmployeeId}
      </div>

      <form onSubmit={handleSubmit(onSubmit, (errors) => {
          console.error("Form Validation Errors:", errors);
          const firstErrorField = (Object.keys(errors) as Array<Path<RegisterFormValues>>)[0];
          const firstError = get(errors, firstErrorField) as RHFFieldError | undefined;
          
          if (firstError) {
              const errorMessage = firstError.message || "Invalid field";
              toast.error(`Form Error: [${String(firstErrorField)}] ${errorMessage}`);
              
              // Scroll to the first error field for better UX
              const errorElement = document.getElementsByName(String(firstErrorField))[0] || 
                                 document.querySelector(`[name="${String(firstErrorField)}"]`);
              if (errorElement) {
                  errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
          } else {
              toast.error("Please fill in all required fields correctly.");
          }
      })} className="space-y-2 mt-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        
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
              <label className={`text-xs font-semibold ${errors.email || isEmailTaken ? 'text-red-500' : 'text-gray-600'} ml-1`}>Email Address <span className="text-red-500">*</span></label>
              <div className="relative">
              <input 
              {...register("email")} 
              type="email" 
              autoComplete="email" 
              className={`${getInputClass("email")} !pl-3 ${setupData ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
              placeholder="" 
              readOnly={!!setupData}
              />
              </div>
              <FieldError name="email" />
                {!errors.email && isEmailTaken && <p className="text-red-500 text-[11px] font-bold ml-1 animate-pulse">This email already exists in the system</p>}
               </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 ml-1">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    {...register("password")} 
                    type="password" 
                    autoComplete="new-password" 
                    className={`${getInputClass("password")} !pl-3 ${(setupData || isFinalizingSetup) ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    placeholder={isFinalizingSetup ? "••••••••" : ""} 
                    readOnly={!!setupData || isFinalizingSetup}
                  />                </div>
                <FieldError name="password" />
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
                    <input {...register("lastName")} autoComplete="family-name" className={`${getInputClass("lastName")} !pl-3`} placeholder="" />
                </div>
                <FieldError name="lastName" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 ml-1">First Name <span className="text-red-500">*</span></label>
                <div className="relative">
                    <input {...register("firstName")} autoComplete="given-name" className={`${getInputClass("firstName")} !pl-3`} placeholder="" />
                </div>
                <FieldError name="firstName" />
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Middle Name</label>
                 <div className="relative">
                    <input {...register("middleName")} autoComplete="additional-name" className={`${getInputClass("middleName")} !pl-3`} placeholder="" />
                 </div>
                 <FieldError name="middleName" />
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Suffix</label>
                 <div className="relative">
                    <input {...register("suffix")} autoComplete="honorific-suffix" className={`${getInputClass("suffix")} !pl-3`} placeholder="" />
                 </div>
                 <FieldError name="suffix" />
              </div>
           </div>

           <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                 <label className={`text-xs font-semibold ml-1 ${errors.birthDate ? 'text-red-500' : 'text-gray-600'}`}>Birth Date</label>
                 <div className="relative">
                    <input 
                       type="date" 
                       {...register("birthDate")} 
                       className={getInputClass("birthDate")} 
                    />
                 </div>
                 <FieldError name="birthDate" />
              </div>
              
              <div className="space-y-1 col-span-2 md:col-span-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Place of Birth</label>
                 <div className="relative">
                    <input {...register("placeOfBirth")} className={`${getInputClass("placeOfBirth")} !pl-3`} placeholder="" />
                 </div>
                 <FieldError name="placeOfBirth" />
              </div>

              <div className="space-y-1">
                 <label className={`text-xs font-semibold ml-1 ${errors.gender ? 'text-red-500' : 'text-gray-600'}`}>Gender</label>
                 <Combobox
                   options={GENDER_OPTIONS}
                   value={watch("gender") || ""}
                   onChange={(val: string) => setValue("gender", (val === "Male" || val === "Female" || val === "") ? val : "", { shouldValidate: true })}
                   placeholder="Select..."
                   error={!!errors.gender}
                   buttonClassName={`pl-3 ${errors.gender ? '!border-red-500 ring-1 ring-red-500/20' : ''}`}
                 />
                 <FieldError name="gender" />
              </div>

              <div className="space-y-1">
                 <label className={`text-xs font-semibold ml-1 ${errors.civilStatus ? 'text-red-500' : 'text-gray-600'}`}>Civil Status</label>
                 <Combobox
                   options={CIVIL_STATUS_OPTIONS}
                   value={watch("civilStatus") || ""}
                   onChange={(val: string) => setValue("civilStatus", (val === "Single" || val === "Married" || val === "Widowed" || val === "Separated" || val === "Annulled" || val === "") ? val : "", { shouldValidate: true })}
                   placeholder="Select..."
                   error={!!errors.civilStatus}
                   buttonClassName={`pl-3 ${errors.civilStatus ? '!border-red-500 ring-1 ring-red-500/20' : ''}`}
                 />
                 <FieldError name="civilStatus" />
              </div>

              <div className="space-y-1">
                 <label className={`text-xs font-semibold ml-1 ${errors.nationality ? 'text-red-500' : 'text-gray-600'}`}>Nationality</label>
                 <input {...register("nationality")} className={`${getInputClass("nationality")} !pl-3`} placeholder="" />
                 <FieldError name="nationality" />
              </div>

              <div className="space-y-1">
                 <label className={`text-xs font-semibold ml-1 ${errors.religion ? 'text-red-500' : 'text-gray-600'}`}>Religion</label>
                 <input {...register("religion")} className={`${getInputClass("religion")} !pl-3`} placeholder="e.g. Catholic" />
                 <FieldError name="religion" />
              </div>

              <div className="space-y-1">
                 <label className={`text-xs font-semibold ml-1 ${errors.bloodType ? 'text-red-500' : 'text-gray-600'}`}>Blood Type</label>
                 <Combobox
                   options={BLOOD_TYPE_OPTIONS}
                   value={watch("bloodType") || ""}
                   onChange={(val) => setValue("bloodType", val, { shouldValidate: true })}
                   placeholder="Select..."
                   buttonClassName={`pl-3 ${errors.bloodType ? '!border-red-500 ring-1 ring-red-500/20' : ''}`}
                 />
                 <FieldError name="bloodType" />
              </div>

              <div className="space-y-1">
                 <label className={`text-xs font-semibold ml-1 ${errors.heightM ? 'text-red-500' : 'text-gray-600'}`}>Height (m)</label>
                 <input type="number" step="0.01" {...register("heightM")} className={`${getInputClass("heightM")} !pl-3`} placeholder="" />
                 <FieldError name="heightM" />
              </div>

              <div className="space-y-1">
                 <label className={`text-xs font-semibold ml-1 ${errors.weightKg ? 'text-red-500' : 'text-gray-600'}`}>Weight (kg)</label>
                 <input type="number" step="0.1" {...register("weightKg")} className={`${getInputClass("weightKg")} !pl-3`} placeholder="" />
                 <FieldError name="weightKg" />
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
                    <input {...register("mobileNo")} className={`${getInputClass("mobileNo")} !pl-3`} placeholder="" />
                 </div>
                 <FieldError name="mobileNo" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Telephone Number</label>
                 <div className="relative">
                    <input {...register("telephoneNo")} className={`${getInputClass("telephoneNo")} !pl-3`} placeholder="" />
                 </div>
                 <FieldError name="telephoneNo" />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-red-50/30 rounded-[10px] border border-red-50">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-red-500 ml-1 flex items-center gap-1">Emergency Contact Person</label>
                 <input 
                    {...register("emergencyContact")} 
                    className={`${getInputClass("emergencyContact")} !pl-3`} 
                    placeholder="Full Name" 
                  />
                  <FieldError name="emergencyContact" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-red-500 ml-1">Emergency Phone Number</label>
                 <input 
                    {...register("emergencyContactNumber")} 
                    className={`${getInputClass("emergencyContactNumber")} !pl-3`} 
                    placeholder="09XX XXX XXXX" 
                  />
                  <FieldError name="emergencyContactNumber" />
              </div>
           </div>
        </div>

         {/* Government Identification */}
         <div className={cardClass}>
         <h4 className={cardHeaderClass}>Government Identification</h4>
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
         <div className="space-y-1">
         <label className={`text-xs font-semibold ml-1 ${errors.gsisNumber || isIdTakenMap.gsisNumber || (!!watch("gsisNumber") && !ID_REGEX.GSIS.test(watch("gsisNumber")!.replace(/\s+/g, ''))) ? 'text-red-500' : (watch("dutyType") === "Standard" ? 'text-red-500' : 'text-gray-600')}`}>
         GSIS ID No. {watch("dutyType") === "Standard" && "*"}
         </label>
         <input 
         {...register("gsisNumber")} 
         className={`${getInputClass("gsisNumber")} !pl-3`} 
         placeholder="" 
         />
         <FieldError name="gsisNumber" />
            {!errors.gsisNumber && isIdTakenMap.gsisNumber && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 animate-pulse">This ID already exists in the system</p>}
            {!errors.gsisNumber && !isIdTakenMap.gsisNumber && !!watch("gsisNumber") && !ID_REGEX.GSIS.test(watch("gsisNumber")!.replace(/\s+/g, '')) && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">Invalid GSIS format</p>}
         </div>
         <div className="space-y-1">
         <label className={`text-xs font-semibold ml-1 ${errors.pagibigNumber || isIdTakenMap.pagibigNumber || (!!watch("pagibigNumber") && !ID_REGEX.PAGIBIG.test(watch("pagibigNumber")!.replace(/\s+/g, ''))) ? 'text-red-500' : (watch("dutyType") === "Standard" ? 'text-red-500' : 'text-gray-600')}`}>
           PAG-IBIG No. {watch("dutyType") === "Standard" && "*"}
         </label>
         <input 
         {...register("pagibigNumber")} 
         className={`${getInputClass("pagibigNumber")} !pl-3`} 
           placeholder="" 
         />
            <FieldError name="pagibigNumber" />
            {!errors.pagibigNumber && isIdTakenMap.pagibigNumber && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 animate-pulse">This ID already exists in the system</p>}
            {!errors.pagibigNumber && !isIdTakenMap.pagibigNumber && !!watch("pagibigNumber") && !ID_REGEX.PAGIBIG.test(watch("pagibigNumber")!.replace(/\s+/g, '')) && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">Invalid Pag-IBIG format</p>}
         </div>
         <div className="space-y-1">
         <label className={`text-xs font-semibold ml-1 ${errors.philhealthNumber || isIdTakenMap.philhealthNumber || (!!watch("philhealthNumber") && !ID_REGEX.PHILHEALTH.test(watch("philhealthNumber")!.replace(/\s+/g, ''))) ? 'text-red-500' : (watch("dutyType") === "Standard" ? 'text-red-500' : 'text-gray-600')}`}>
           PhilHealth No. {watch("dutyType") === "Standard" && "*"}
         </label>
         <input 
         {...register("philhealthNumber")} 
           className={`${getInputClass("philhealthNumber")} !pl-3`} 
           placeholder="" 
            />
            <FieldError name="philhealthNumber" />
         {!errors.philhealthNumber && isIdTakenMap.philhealthNumber && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 animate-pulse">This ID already exists in the system</p>}
         {!errors.philhealthNumber && !isIdTakenMap.philhealthNumber && !!watch("philhealthNumber") && !ID_REGEX.PHILHEALTH.test(watch("philhealthNumber")!.replace(/\s+/g, '')) && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">Invalid PhilHealth format</p>}
         </div>
         <div className="space-y-1">
         <label className={`text-xs font-semibold ml-1 ${errors.umidNumber || isIdTakenMap.umidNumber || (!!watch("umidNumber") && !ID_REGEX.UMID.test(watch("umidNumber")!.replace(/\s+/g, ''))) ? 'text-red-500' : 'text-gray-600'}`}>UMID Number</label>
         <input 
           {...register("umidNumber")} 
           className={`${getInputClass("umidNumber")} !pl-3`} 
              placeholder="" 
            />
         <FieldError name="umidNumber" />
         {!errors.umidNumber && isIdTakenMap.umidNumber && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 animate-pulse">This ID already exists in the system</p>}
         {!errors.umidNumber && !isIdTakenMap.umidNumber && !!watch("umidNumber") && !ID_REGEX.UMID.test(watch("umidNumber")!.replace(/\s+/g, '')) && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">Invalid UMID format</p>}
         </div>
         <div className="space-y-1">
         <label className={`text-xs font-semibold ml-1 ${errors.philsysId || isIdTakenMap.philsysId || (!!watch("philsysId") && !ID_REGEX.PHILSYS.test(watch("philsysId")!.replace(/\s+/g, ''))) ? 'text-red-500' : 'text-gray-600'}`}>PHILSYS ID</label>
         <input 
           {...register("philsysId")} 
              className={`${getInputClass("philsysId")} !pl-3`} 
              placeholder="" 
         />
         <FieldError name="philsysId" />
         {!errors.philsysId && isIdTakenMap.philsysId && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 animate-pulse">This ID already exists in the system</p>}
         {!errors.philsysId && !isIdTakenMap.philsysId && !!watch("philsysId") && !ID_REGEX.PHILSYS.test(watch("philsysId")!.replace(/\s+/g, '')) && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">Invalid PhilSys ID format</p>}
         </div>
         <div className="space-y-1">
         <label className={`text-xs font-semibold ml-1 ${errors.tinNumber || isIdTakenMap.tinNumber || (!!watch("tinNumber") && !ID_REGEX.TIN.test(watch("tinNumber")!.replace(/\s+/g, ''))) ? 'text-red-500' : (watch("dutyType") === "Standard" ? 'text-red-500' : 'text-gray-600')}`}>
         TIN No. {watch("dutyType") === "Standard" && "*"}
         </label>
         <input 
              {...register("tinNumber")} 
              className={`${getInputClass("tinNumber")} !pl-3`} 
           placeholder="" 
         />
            <FieldError name="tinNumber" />
               {!errors.tinNumber && isIdTakenMap.tinNumber && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 animate-pulse">This ID already exists in the system</p>}
               {!errors.tinNumber && !isIdTakenMap.tinNumber && !!watch("tinNumber") && !ID_REGEX.TIN.test(watch("tinNumber")!.replace(/\s+/g, '')) && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">Invalid TIN format</p>}
               </div>
                <div className="space-y-1">
                   <label className={`text-xs font-semibold ml-1 ${errors.agencyEmployeeNo || isIdTakenMap.agencyEmployeeNo ? 'text-red-500' : 'text-gray-600'}`}>Agency Employee No.</label>
                   <input 
                     {...register("agencyEmployeeNo")} 
                     className={`${getInputClass("agencyEmployeeNo")} !pl-3`} 
                     placeholder="" 
                   />
                   <FieldError name="agencyEmployeeNo" />
                   {!errors.agencyEmployeeNo && isIdTakenMap.agencyEmployeeNo && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 animate-pulse">This ID already exists in the system</p>}
                </div>
             </div>
          </div>



        {/* Educational Background */}
        <div className={cardClass}>
           <h4 className={cardHeaderClass}><GraduationCap size={16} className="text-gray-400" /> Educational Background</h4>
           <div className="space-y-6">
              <EducationLevelSection level="Elementary" label="Elementary" />
              <EducationLevelSection level="Secondary" label="Secondary" />
              <EducationLevelSection level="Vocational" label="Vocational / Trade Course" />
              <EducationLevelSection level="College" label="College" />
              <EducationLevelSection level="Graduate" label="Graduate Studies" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Highest Degree / Level Attained</label>
                    <input {...register("highestDegree")} className={inputClass} placeholder="e.g. Master's Degree" />
                    <FieldError name="highestDegree" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cumulative Years of Experience <span className="text-red-500">*</span></label>
                    <input type="number" step="0.5" {...register("yearsOfExperience")} className={inputClass} placeholder="e.g. 3.5" />
                    <FieldError name="yearsOfExperience" />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 ml-1 italic tracking-tight underline decoration-blue-200 underline-offset-4">Experience Summary <span className="text-red-500">*</span></label>
                    <textarea {...register("experience")} className={`${inputClass} !pl-3 min-h-[80px] resize-y`} placeholder="Briefly summarize your professional journey..." />
                    <FieldError name="experience" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 ml-1 italic tracking-tight">Additional relevant skills or certifications <span className="text-red-500">*</span></label>
                    <textarea {...register("skills")} className={`${inputClass} !pl-3 min-h-[80px] resize-y`} placeholder="e.g. Six Sigma, TESDA Cert" />
                    <FieldError name="skills" />
                 </div>
              </div>
           </div>
        </div>

        {/* Work Experience */}
        <div className={cardClass}>
           <div className="flex justify-between items-center mb-4">
              <h4 className={cardHeaderClass}><Briefcase size={16} className="text-gray-400" /> Work Experience</h4>
              <button 
                 type="button" 
                 onClick={() => appendWorkExp({ 
                    dateFrom: "", dateTo: "", positionTitle: "", companyName: "", 
                    monthlySalary: "", salaryGrade: "", appointmentStatus: "", isGovernment: false 
                 })}
                 className="text-[10px] bg-gray-900 text-white px-3 py-1.5 rounded-md font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors flex items-center gap-1"
              >
                 <Plus size={12} /> Add Work Experience
              </button>
           </div>
           
           <div className="space-y-4">
              {workExpFields.map((field, index) => (
                 <div key={field.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/30 relative group shadow-sm animate-in fade-in zoom-in duration-200">
                    <button 
                       type="button" 
                       onClick={() => removeWorkExp(index)}
                       className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                       <Trash2 size={16} />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                       <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Inclusive Date From</label>
                             <input type="date" {...register(`workExperiences.${index}.dateFrom` as Path<RegisterFormValues>)} className={inputClass} />
                             <FieldError name={`workExperiences.${index}.dateFrom` as Path<RegisterFormValues>} />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Inclusive Date To</label>
                             <input type="date" {...register(`workExperiences.${index}.dateTo` as Path<RegisterFormValues>)} className={inputClass} />
                             <FieldError name={`workExperiences.${index}.dateTo` as Path<RegisterFormValues>} />
                          </div>
                       </div>
                       
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Position Title</label>
                          <input {...register(`workExperiences.${index}.positionTitle` as Path<RegisterFormValues>)} className={inputClass} placeholder="Write in full" />
                          <FieldError name={`workExperiences.${index}.positionTitle` as Path<RegisterFormValues>} />
                       </div>
                       
                       <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Department / Agency / Office / Company</label>
                          <input {...register(`workExperiences.${index}.companyName` as Path<RegisterFormValues>)} className={inputClass} placeholder="Write in full" />
                          <FieldError name={`workExperiences.${index}.companyName` as Path<RegisterFormValues>} />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Monthly Salary</label>
                             <input {...register(`workExperiences.${index}.monthlySalary` as Path<RegisterFormValues>)} className={inputClass} placeholder="P 0.00" />
                             <FieldError name={`workExperiences.${index}.monthlySalary` as Path<RegisterFormValues>} />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Salary Grade</label>
                             <input {...register(`workExperiences.${index}.salaryGrade` as Path<RegisterFormValues>)} className={inputClass} placeholder="e.g. 11-1" />
                             <FieldError name={`workExperiences.${index}.salaryGrade` as Path<RegisterFormValues>} />
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Status of Appointment</label>
                             <input {...register(`workExperiences.${index}.appointmentStatus` as Path<RegisterFormValues>)} className={inputClass} placeholder="e.g. Permanent" />
                             <FieldError name={`workExperiences.${index}.appointmentStatus` as Path<RegisterFormValues>} />
                          </div>
                          <div className="flex items-center gap-2 mt-6">
                             <input type="checkbox" {...register(`workExperiences.${index}.isGovernment` as Path<RegisterFormValues>)} className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                             <label className="text-[10px] font-bold text-gray-500 uppercase cursor-pointer">Gov't Service?</label>
                             <FieldError name={`workExperiences.${index}.isGovernment` as Path<RegisterFormValues>} />
                          </div>
                       </div>
                    </div>
                 </div>
              ))}
              {workExpFields.length === 0 && (
                 <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/20">
                    <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-widest italic">No work experience records added</p>
                 </div>
              )}
           </div>
        </div>

        {/* Employment Record */}
        <div className={cardClass}>
           <h4 className={cardHeaderClass}>Employment Details</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                   <label className={`text-xs font-semibold ml-1 mb-1 block ${errors.department ? 'text-red-500' : 'text-gray-600'}`}>
                       Department / Office {setupData && <span className="text-[10px] text-gray-400 font-normal ml-1">(Locked)</span>}
                   </label>
                   <Combobox
                       options={departments.map((d) => ({ value: d.name, label: d.name }))}
                       value={watch("department") || ""}
                       onChange={(val) => setValue("department", val)}
                       placeholder="Select department..."
                       error={!!errors.department}
                       buttonClassName={`pl-3 ${setupData || isOldEmployee ? 'bg-gray-100 cursor-not-allowed opacity-80' : ''} ${errors.department ? '!border-red-500 ring-1 ring-red-500/20' : ''}`}
                       disabled={!!setupData || isOldEmployee}
                   />
                   <FieldError name="department" />
               </div>
               <div>
                   <label className={`text-xs font-semibold ml-1 mb-1 block ${errors.position ? 'text-red-500' : 'text-gray-600'}`}>
                       Plantilla Position {setupData && <span className="text-[10px] text-gray-400 font-normal ml-1">(Locked)</span>}
                   </label>
                   <Combobox
                       options={positions
                           .filter((p) => !selectedDeptId || p.departmentId === selectedDeptId)
                           .map((p) => ({ value: `${p.positionTitle} (${p.itemNumber})`, label: `${p.positionTitle} (${p.itemNumber})` }))}
                       value={watch("position") || ""}
                       onChange={(val) => setValue("position", val)}
                       placeholder="Select position..."
                       error={!!errors.position}
                       buttonClassName={`pl-3 ${setupData ? 'bg-gray-100 cursor-not-allowed opacity-80' : ''} ${errors.position ? '!border-red-500 ring-1 ring-red-500/20' : ''}`}
                       disabled={!!setupData}
                   />
                   <FieldError name="position" />
               </div>
               {!isOldEmployee && (
                  <>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 ml-1 mb-1 block">Type of Duties</label>
                        <Combobox<"Standard" | "Irregular">
                          options={[
                            { value: "Standard", label: "Standard" },
                            { value: "Irregular", label: "Irregular" }
                          ]}
                          value={watch("dutyType") || "Standard"}
                          onChange={(val) => setValue("dutyType", val, { shouldValidate: true })}
                          placeholder="Select duties..."
                          buttonClassName="!pl-3 text-gray-700"
                          disabled={isOldEmployee}
                        />
                        <FieldError name="dutyType" />
                    </div>
                   <div>
                        <label className="text-xs font-semibold text-gray-600 ml-1 mb-1 block">Appointment Type</label>
                        <Combobox<'Permanent' | 'Contractual' | 'Casual' | 'Job Order' | 'Coterminous' | 'Temporary' | 'Contract of Service' | 'JO' | 'COS' | ''>
                            options={[
                              { value: "Permanent", label: "Permanent" },
                              { value: "Contractual", label: "Contractual" },
                              { value: "Casual", label: "Casual" },
                              { value: "Job Order", label: "Job Order" },
                              { value: "Coterminous", label: "Coterminous" },
                              { value: "Temporary", label: "Temporary" },
                              { value: "Contract of Service", label: "Contract of Service" }
                            ]}
                            value={watch("appointmentType") || ""}
                            onChange={(val) => setValue("appointmentType", val, { shouldValidate: true })}
                            placeholder="Select type..."
                            buttonClassName="bg-gray-50 font-bold !pl-3"
                            disabled={isOldEmployee}
                          />
                        <FieldError name="appointmentType" />
                    </div>
                  </>
               )}
            </div>
            {isOldEmployee && <p className="text-xs text-center font-bold text-red-500 p-2 bg-red-50 rounded-lg mt-4">Employee is OLD</p>}
        </div>

        {/* Social Accounts */}
        <div className={cardClass}>
           <h4 className={cardHeaderClass}><Linkedin size={16} className="text-gray-400" /> Social Links</h4>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Facebook</label>
                 <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#1877F2]" size={15} />
                    <input {...register("facebookUrl")} className={getInputClass("facebookUrl")} placeholder="" />
                 </div>
                 <FieldError name="facebookUrl" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">LinkedIn</label>
                 <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0A66C2]" size={15} />
                    <input {...register("linkedinUrl")} className={getInputClass("linkedinUrl")} placeholder="" />
                 </div>
                 <FieldError name="linkedinUrl" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-600 ml-1">Twitter (X)</label>
                 <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800" size={15} />
                    <input {...register("twitterHandle")} className={getInputClass("twitterHandle")} placeholder="" />
                 </div>
                 <FieldError name="twitterHandle" />
              </div>
           </div>
        </div>

         {/* Section X: Government Issued ID */}
         <div className={cardClass}>
            <h4 className={cardHeaderClass}>Section X: Government Issued ID</h4>
            <p className="text-[10px] text-gray-500 mb-4 italic">(Government Issued ID, i.e. Passport, GSIS, SSS, PRC, Driver's License, etc.)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 ml-1">ID Type / License Name</label>
                  <input {...register("govtIdType")} className={`${inputClass} !pl-3`} placeholder="e.g. Driver's License" />
                  <FieldError name="govtIdType" />
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 ml-1">ID / License No.</label>
                  <input {...register("govtIdNo")} className={`${inputClass} !pl-3`} placeholder="e.g. N01-23-456789" />
                  <FieldError name="govtIdNo" />
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 ml-1">Date/Place of Issuance</label>
                  <input {...register("govtIdIssuance")} className={`${inputClass} !pl-3`} placeholder="e.g. 2024-01-01 / Manila" />
                  <FieldError name="govtIdIssuance" />
               </div>
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
                        className={inputClass} 
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
                        {...register("certifiedCorrect")}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 transition-all cursor-pointer"
                    />
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">
                            I hereby certify that the information provided is true and correct. I authorize the CHRMO to collect and process my biometric data and personal information in accordance with the <a href="https://www.officialgazette.gov.ph/2012/08/15/republic-act-no-10173/" target="_blank" rel="noopener noreferrer" className="font-bold text-green-700 hover:underline">Data Privacy Act of 2012</a>.
                        </span>
                        <FieldError name="certifiedCorrect" />
                    </div>
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

      <EmailVerificationModal
        isOpen={isVerifyModalOpen}
        email={verificationEmail}
      />

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
