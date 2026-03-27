import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Resolver, useFieldArray, type Path, get, FieldError as RHFFieldError, FieldErrors, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, ChevronRight, ShieldCheck,
  Briefcase,
  FileText,
  Download,
  Minus,
  Mail,
  Send,
  Users,
  UserSquare2,
  Plus,
  Fingerprint,
  PlusCircle,
  Image,
  Award
} from 'lucide-react';
import { useToastStore } from '@/stores';
import PublicLayout from '@components/Public/PublicLayout';
import SEO from "@/components/Global/SEO";
import { createDynamicJobApplicationSchema, JobApplicationInput } from '@/schemas/recruitment';
import { usePublicJobDetail, useJobApplication } from '@/features/Recruitment/hooks/usePublicJobs';
import { PhilippineAddressSelector } from '@/components/Custom/Shared/PhilippineAddressSelector';
import Combobox from '@/components/Custom/Combobox';
import { 
  BLOOD_TYPE_OPTIONS,
  CIVIL_STATUS_OPTIONS,
  ELIGIBILITY_RECRUITMENT_OPTIONS, 
  GENDER_OPTIONS
} from '@/constants/referenceData';
import ph from 'phil-reg-prov-mun-brgy';
import { Region, Province, CityMunicipality, PhilAddressData } from '@/types/ph-address';
import { useEmailUniquenessQuery, useGovtIdUniquenessQuery } from '@/hooks/useCommonQueries';
import { useDebounce } from '@/hooks/useDebounce';
import logo from '@/assets/meycauayan-logo.png';

// Slide to Apply Component (unchanged)
const SlideToApply = ({ onVerify, isVerified }: { onVerify: () => void, isVerified: boolean }) => (
    <div className="relative w-full">
        {!isVerified ? (
            <div className="relative h-16 bg-slate-100 rounded-xl border border-slate-200 p-1.5 flex items-center overflow-hidden">
                <motion.div 
                    drag="x"
                    dragConstraints={{ left: 0, right: 350 }}
                    dragElastic={0.05}
                    dragSnapToOrigin
                    onDragEnd={(_, info) => {
                        if (info.offset.x > 220) {
                            onVerify();
                        }
                    }}
                    whileDrag={{ scale: 1.05 }}
                    className="h-[52px] w-[52px] bg-green-500 rounded-xl flex items-center justify-center text-white cursor-grab active:cursor-grabbing shadow-lg shadow-green-500/20 z-20 select-none"
                >
                    <ChevronRight size={24} />
                </motion.div>
                <p className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-400 tracking-tight pointer-events-none">
                    Slide to finalize &rarr;
                </p>
            </div>
        ) : (
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="h-16 bg-green-500/10 rounded-2xl border border-green-500/20 flex items-center justify-center gap-3 text-green-600"
            >
                <ShieldCheck size={20} />
                <span className="text-xs font-bold tracking-tight">Protocol verified</span>
            </motion.div>
        )}
    </div>
);

const cardClass = "bg-white p-6 md:p-8 rounded-2xl border border-gray-200 space-y-5 mb-6 relative overflow-hidden";
const cardHeaderClass = "text-[11px] font-bold text-gray-700 border-b border-gray-100 pb-3 mb-5 flex items-center gap-3";

const FormSection = ({ title, children, action }: { title: React.ReactNode, children: React.ReactNode, action?: React.ReactNode }) => (
    <div className={cardClass}>
        <div className={cardHeaderClass}>
            <div className="flex items-center gap-2 text-green-600">
                {title}
            </div>
            <div className="ml-auto flex items-center gap-3">
                {action}
            </div>
        </div>
        <div className="grid grid-cols-1 gap-y-3">
            {children}
        </div>
    </div>
);

const JobDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const showToast = useToastStore((state) => state.showToast);

    // UI State
    const [success, setSuccess] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setValue('photo', file, { shouldValidate: true });
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                setPhotoPreview(reader.result);
            }
        };
        reader.readAsDataURL(file);
      }
    };
    const [startTime, setStartTime] = useState<number | null>(null);

    // Fetch Job using custom hook
    const { data: job, isLoading, error } = usePublicJobDetail(id);
    const jobData = job;

    const isPermanent = jobData?.employmentType === 'Permanent';
    const isStandard = jobData?.dutyType === 'Standard';
    const requireIds = !!(isPermanent || isStandard || jobData?.requireGovernmentIds);
    const requireCsc = !!(isPermanent || isStandard || jobData?.requireCivilService || (jobData?.eligibility && jobData.eligibility !== 'None required'));
    const requireEdu = !!(isPermanent || isStandard || jobData?.requireEducationExperience || (jobData?.education && jobData.education !== 'None required'));
    const requireExp = !!(isPermanent || isStandard || jobData?.requireEducationExperience || (jobData?.experience && jobData.experience !== 'None required'));

    // Dynamic Schema based on job requirements
    const dynamicSchema = useMemo(() => {
        return createDynamicJobApplicationSchema(
            jobData?.employmentType,
            requireIds,
            requireCsc,
            requireEdu,
            requireExp,
            jobData?.education || undefined,
            jobData?.experience || undefined,
            jobData?.experience || undefined,
            jobData?.eligibility || undefined,
            jobData?.dutyType || undefined
        );
    }, [jobData?.employmentType, requireIds, requireCsc, requireEdu, requireExp, jobData?.education, jobData?.experience, jobData?.eligibility, jobData?.dutyType]);

    type JobDetailFormValues = JobApplicationInput;

    // Form
    const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, control } = useForm<JobDetailFormValues>({
        resolver: zodResolver(dynamicSchema) as Resolver<JobDetailFormValues>,
        mode: 'onBlur',
        defaultValues: {
            isMeycauayanResident: false,
            hpField: '',
            websiteUrl: '',
            sex: '',
            civilStatus: '',
            bloodType: '',
            dutyType: jobData?.dutyType || 'Standard',
            photoPreview: '',
            resRegion: '',
            resProvince: '',
            resCity: '',
            resBarangay: '',
            resHouseBlockLot: '',
            resSubdivision: '',
            resStreet: '',
            residentialZipCode: '',
            educationalBackground: '',
            education: {
                Elementary: { school: "", course: "", from: "", to: "", units: "", yearGrad: "", honors: "" },
                Secondary: { school: "", course: "", from: "", to: "", units: "", yearGrad: "", honors: "" },
                Vocational: { school: "", course: "", from: "", to: "", units: "", yearGrad: "", honors: "" },
                College: { school: "", course: "", from: "", to: "", units: "", yearGrad: "", honors: "" },
                Graduate: { school: "", course: "", from: "", to: "", units: "", yearGrad: "", honors: "" },
            },
            eligibilities: [],
            workExperiences: [],
            trainings: [],
            skills: '',
            totalExperienceYears: '',
            middleName: '',
            suffix: '',
            email: '',
            phoneNumber: '',
            telephoneNumber: '',
            nationality: 'Filipino',
            height: '',
            weight: '',
            address: '',
            zipCode: '',
            birthDate: '',
            birthPlace: '',
            permRegion: '',
            permProvince: '',
            permCity: '',
            permBarangay: '',
            permHouseBlockLot: '',
            permSubdivision: '',
            permStreet: '',
            permanentZipCode: '',
            facebookUrl: '',
            linkedinUrl: '',
            twitterHandle: '',
            agencyEmployeeNo: '',
            govtIdType: '',
            govtIdNo: '',
            govtIdIssuance: '',
            emergencyContact: '',
            emergencyContactNumber: '',
            hToken: '',
            gsisNumber: '',
            pagibigNumber: '',
            philhealthNumber: '',
            umidNumber: '',
            philsysId: '',
            tinNumber: '',
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

    const isMeycauayanResident = watch('isMeycauayanResident') === true || watch('isMeycauayanResident') === 'true';

    // Watch address selector fields for real-time address building
    const resRegion = watch('resRegion');
    const resProvince = watch('resProvince');
    const resCity = watch('resCity');
    const resBarangay = watch('resBarangay');
    const resHouse = watch('resHouseBlockLot');
    const resSubd = watch('resSubdivision');
    const resStreet = watch('resStreet');
    const residentialZip = watch('residentialZipCode');
    const emailVal = watch('email');

    // Real-time email uniqueness check
    const debouncedEmail = useDebounce(emailVal, 500);
    const { data: emailUniqueness } = useEmailUniquenessQuery(
        debouncedEmail, 
        debouncedEmail?.length > 5 && !isSubmitting
    );
    const isEmailTaken = emailUniqueness?.isUnique === false;

    const tinVal = watch('tinNumber');

    // Real-time Government ID uniqueness check
    const debouncedTin = useDebounce(tinVal, 500);

    const { data: idConflicts } = useGovtIdUniquenessQuery({
        gsisNumber: watch('gsisNumber') || undefined,
        pagibigNumber: watch('pagibigNumber') || undefined,
        philhealthNumber: watch('philhealthNumber') || undefined,
        umidNumber: watch('umidNumber') || undefined,
        philsysId: watch('philsysId') || undefined,
        tinNumber: debouncedTin || undefined
    }, (
        (watch('gsisNumber')?.length || 0) > 2 || 
        (watch('pagibigNumber')?.length || 0) > 2 || 
        (watch('philhealthNumber')?.length || 0) > 2 || 
        (watch('umidNumber')?.length || 0) > 2 || 
        (watch('philsysId')?.length || 0) > 2 || 
        (debouncedTin?.length || 0) > 2
    ) && !isSubmitting);

    const isIdTakenMap: Record<string, string> = idConflicts?.conflicts || {};

    // Helper to format names to Normal/Title Case
    const formatName = (name: string) => {
      if (!name) return '';
      const upper = name.toUpperCase();
      
      const specifics = ['NCR', 'CAR', 'BARMM', 'IV-A', 'IV-B', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'];
      
      return upper.split(' ').map(word => {
        if (!word) return '';
        const cleanWord = word.replace(/^\(|\)$/g, '');
        if (specifics.includes(cleanWord)) return word;
        const lowerWord = word.toLowerCase();
        if (lowerWord === 'of' || lowerWord === 'de' || lowerWord === 'del') return lowerWord;
        if (word.startsWith('(')) {
          return '(' + word.charAt(1).toUpperCase() + word.slice(2).toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }).join(' ');
    };

    const buildAddress = (reg: string, prov: string, city: string, brgy: string, house: string, subd: string, street: string): string => {
      const phData = ph as PhilAddressData;
      const rName = phData.regions.find((r: Region) => r.reg_code === reg)?.name || '';
      const pName = phData.provinces.find((p: Province) => p.prov_code === prov)?.name || '';
      const cName = phData.city_mun.find((c: CityMunicipality) => c.mun_code === city)?.name || '';
      return [house, subd, street, formatName(brgy), formatName(cName), formatName(pName), formatName(rName)].filter(Boolean).join(', ');
    };

    useEffect(() => {
      const addr = buildAddress(resRegion || '', resProvince || '', resCity || '', resBarangay || '', resHouse || '', resSubd || '', resStreet || '');
      if (addr) setValue('address', addr, { shouldValidate: true });
      if (residentialZip) setValue('zipCode', residentialZip, { shouldValidate: true });
    }, [resRegion, resProvince, resCity, resBarangay, resHouse, resSubd, resStreet, residentialZip, setValue]);

    const inputClass = "w-full px-4 py-3 text-sm border-gray-200 rounded-lg bg-white border focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all duration-150 text-gray-800 placeholder:text-gray-400 font-normal";
    const compactInputClass = "w-full px-4 py-3 text-sm border-gray-200 rounded-lg bg-white border focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all duration-150 text-gray-800 placeholder:text-gray-400 font-normal";
    
    const getInputClass = (fieldName: keyof JobDetailFormValues) => {
        const hasError = errors[fieldName] || isIdTakenMap[fieldName as string];
        const base = "w-full px-4 py-3 text-sm border rounded-lg bg-white outline-none transition-all duration-150 font-normal";
        
        if (hasError) {
            return `${base} border-red-400 ring-2 ring-red-400/20 text-red-700 placeholder:text-red-300`;
        }
        
        return `${base} border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20`;
    };

    const FieldError = ({ name }: { name: Path<JobDetailFormValues> }) => {
        const error = get(errors, name) as RHFFieldError | undefined;
        if (!error) return null;
        return <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{error.message || ""}</p>;
    };

    const EducationLevelSection = ({ level, label, icon: iconComponent }: { 
        level: "Elementary" | "Secondary" | "Vocational" | "College" | "Graduate", 
        label: string,
        icon: React.ElementType
    }) => {
        const Icon = iconComponent;
        return (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4 mb-4 group transition-all hover:bg-white hover:border-gray-300">
                <h5 className="text-[11px] font-bold text-gray-500 flex items-center gap-2 border-b border-gray-200 pb-2 mb-1">
                    <Icon size={13} className="text-green-600" /> {label}
                </h5>
            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                    <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">School / University Name</label>
                    <input {...register(`education.${level}.school` as Path<JobDetailFormValues>)} className={compactInputClass} placeholder="Enter school name" />
                    <FieldError name={`education.${level}.school` as Path<JobDetailFormValues>} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 space-y-1">
                        <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Degree / Course</label>
                        <input {...register(`education.${level}.course` as Path<JobDetailFormValues>)} className={compactInputClass} placeholder="e.g. BS in IT" />
                        <FieldError name={`education.${level}.course` as Path<JobDetailFormValues>} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">From (yyyy)</label>
                        <input type="number" {...register(`education.${level}.from` as Path<JobDetailFormValues>)} className={compactInputClass} placeholder="Year" />
                        <FieldError name={`education.${level}.from` as Path<JobDetailFormValues>} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">To (yyyy)</label>
                        <input type="number" {...register(`education.${level}.to` as Path<JobDetailFormValues>)} className={compactInputClass} placeholder="Year" />
                        <FieldError name={`education.${level}.to` as Path<JobDetailFormValues>} />
                    </div>
                </div>
    
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Units Earned</label>
                        <input {...register(`education.${level}.units` as Path<JobDetailFormValues>)} className={compactInputClass} placeholder="If not graduated" />
                        <FieldError name={`education.${level}.units` as Path<JobDetailFormValues>} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Year Graduated</label>
                        <input type="number" {...register(`education.${level}.yearGrad` as Path<JobDetailFormValues>)} className={compactInputClass} placeholder="Year" />
                        <FieldError name={`education.${level}.yearGrad` as Path<JobDetailFormValues>} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Honors Received</label>
                        <input {...register(`education.${level}.honors` as Path<JobDetailFormValues>)} className={compactInputClass} placeholder="e.g. Cum Laude" />
                        <FieldError name={`education.${level}.honors` as Path<JobDetailFormValues>} />
                    </div>
                </div>
            </div>
        </div>
    );
    };

  const mutation = useJobApplication(
    () => {
        setSuccess(true);
        window.scrollTo(0, 0);
    },
      (err: Error) => {
        // Narrow error type for Axel/Server responses
        interface ServerError extends Error {
            response?: {
                data?: {
                    message?: string;
                    error?: string;
                    errors?: Record<string, string[]>;
                };
            };
        }
        const axiosErr = err as ServerError;
        const serverMsg = axiosErr.response?.data?.error || axiosErr.response?.data?.message || err.message;
        const fieldErrors = axiosErr.response?.data?.errors;
        console.error('Application submission error:', serverMsg, fieldErrors);
        showToast(serverMsg || "Failed to submit application. Please try again.", "error");
    }
  );

  const verifyFileHeader = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const arr = new Uint8Array(e.target?.result as ArrayBuffer).subarray(0, 4);
            let header = "";
            for (let i = 0; i < arr.length; i++) {
                header += arr[i].toString(16);
            }
            const isPDF = header === "25504446";
            const isDOCX = header.startsWith("504b");
            const isIMG = header.startsWith("ffd8") || header.startsWith("8950");
            resolve(isPDF || isDOCX || isIMG);
        };
        reader.readAsArrayBuffer(file.slice(0, 4));
    });
  };

  const onSubmit: SubmitHandler<JobDetailFormValues> = async (data) => {
    console.log('[DEBUG] Frontend form data before submission:', JSON.stringify(data, null, 2));
    console.log('[DEBUG] Education data specifically:', JSON.stringify(data.education, null, 2));
    if (!id) return;
    const now = Date.now();
    if (startTime && now - startTime < 30000) {
        showToast("Please review the form carefully. Protocol requires at least 30s for review.", "warning");
        return;
    }
    if (!isVerified) {
        showToast("Please complete the identity verification slider.", "error");
        return;
    }
    const resumeFile = watch('resume');
    if (resumeFile instanceof File) {
        const isValid = await verifyFileHeader(resumeFile);
        if (!isValid) {
            showToast("Invalid resume file integrity. Please upload a real PDF or Word document.", "error");
            return;
        }
    }
    const cleanedData: JobDetailFormValues = {
        ...data,
        eligibilities: data.eligibilities?.filter(e => e.name && e.name.trim().length > 0) || [],
        workExperiences: data.workExperiences?.filter(w => w.companyName && w.companyName.trim().length > 0) || [],
        trainings: data.trainings?.filter(t => t.title && t.title.trim().length > 0) || []
    };

    mutation.mutate({ id, data: cleanedData });
  };

  const onFormError = (fieldErrors: FieldErrors<JobDetailFormValues>) => {
    console.error('Form validation errors:', fieldErrors);
    const firstKey = Object.keys(fieldErrors)[0];
    const firstError = get(fieldErrors, firstKey) as RHFFieldError | undefined;
    const label = firstKey.replace(/_/g, ' ');
    showToast(
      firstError?.message || `Please fill in: ${label}`,
      'error'
    );
    const el = document.querySelector(`[name="${firstKey}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  useEffect(() => {
    if (job) {
      document.title = `${job.title} - Careers`;
    }
    return () => { document.title = 'Careers'; };
  }, [job]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) return (
     <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full"></div>
     </div>
  );

  if (error || !job) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <h2 className="text-xl font-black text-slate-950 mb-2">Unavailable</h2>
        <p className="text-slate-500 mb-6 font-semibold">The job you are looking for is no longer available.</p>
        <button onClick={() => navigate('/careers')} className="text-slate-600 hover:text-slate-950 font-bold underline decoration-slate-200 underline-offset-4">
          Back to Listings
        </button>
    </div>
  );

  return (
    <PublicLayout>
      {job && (
        <SEO 
          title={`${job.title} - Job Opening`}
          description={`Join the City Government of Meycauayan as a ${job.title} in the ${job.department} department. Apply now!`}
        />
      )}
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12 pt-8 md:pt-12">

        <div className="max-w-[70rem] mx-auto px-4 sm:px-6 md:px-8">
            <button 
              onClick={() => navigate('/careers/jobs')} 
              className="flex items-center gap-2 text-[10px] font-bold tracking-tight text-slate-400 hover:text-green-600 transition-all mb-8 group"
            >
                <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
                Back to listings
            </button>

           <div className="w-full">
               <div className="w-full">
                   <div className="mb-8">
                       <span className="inline-block px-3.5 py-1 bg-green-50 text-green-600 border border-green-100 rounded-lg text-[10px] font-bold tracking-tight mb-4 shadow-sm">
                           {job.department}
                       </span>
                       <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
                         {job.title}
                       </h1>
                       
                       <div className="flex flex-wrap gap-x-8 gap-y-3">
                           <div className="text-slate-400 font-bold text-[11px]">
                             <span className="tracking-tight">{job.location}</span>
                           </div>
                           <div className="text-slate-400 font-bold text-[11px]">
                             <span className="tracking-tight">{job.employmentType}</span>
                           </div>
                           {job.dutyType && (
                             <div className="text-green-600 font-bold text-[11px]">
                               <span className="tracking-tight">Duty: {job.dutyType}</span>
                             </div>
                           )}
                           <div className="text-slate-400 font-bold text-[11px]">
                             <span className="tracking-tight">Posted {formatDate(job.createdAt || job.postedAt)}</span>
                           </div>
                       </div>
                   </div>

                   <hr className="border-slate-200 my-8" />

                   <div className="space-y-10">
                       <section>
                           <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-green-600 rounded-full"></span>
                                About the job
                           </h3>
                           <div className="text-[15px] text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap max-w-3xl">
                                {job.jobDescription}
                           </div>
                       </section>

                       <section>
                           <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-green-600 rounded-full"></span>
                                Requirements
                           </h3>
                           
                           {(job.education || job.experience || job.training || job.eligibility || job.otherQualifications) ? (
                             <div className="grid grid-cols-1 gap-6 max-w-3xl">
                               {job.education && (
                                 <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                   <div className="text-[10px] font-bold text-green-600 mb-1">Education</div>
                                   <div className="text-[14px] text-slate-600 font-semibold">{job.education}</div>
                                 </div>
                               )}
                               {job.experience && (
                                 <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                   <div className="text-[10px] font-bold text-green-600 mb-1">Experience</div>
                                   <div className="text-[14px] text-slate-600 font-semibold">{job.experience}</div>
                                 </div>
                               )}
                               {job.training && (
                                 <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                   <div className="text-[10px] font-bold text-green-600 mb-1">Training</div>
                                   <div className="text-[14px] text-slate-600 font-semibold">{job.training}</div>
                                 </div>
                               )}
                               {job.eligibility && (
                                 <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                   <div className="text-[10px] font-bold text-green-600 mb-1">Eligibility</div>
                                   <div className="text-[14px] text-slate-600 font-semibold">{job.eligibility}</div>
                                 </div>
                               )}
                               {job.otherQualifications && (
                                 <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                   <div className="text-[10px] font-bold text-green-600 mb-1">Other Qualifications</div>
                                   <div className="text-[14px] text-slate-600 font-semibold whitespace-pre-wrap">{job.otherQualifications}</div>
                                 </div>
                               )}
                             </div>
                           ) : (
                             <div className="text-[15px] text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap max-w-3xl">
                                  {job.requirements || 'No specific requirements listed.'}
                             </div>
                           )}
                       </section>

                       {/* Application Form */}
                       <hr className="border-slate-200 my-10" />
                       
                       <section id="apply-now" className="bg-white rounded-[2.5rem] p-8 md:p-14 border border-slate-200 shadow-2xl relative overflow-hidden max-w-[72rem] mx-auto w-[calc(100%-3rem)] md:w-full">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
                           
                           <div className="relative z-10 mb-12 flex flex-col items-center text-center">
                               <img src={logo} alt="City of Meycauayan Logo" className="w-20 h-20 mb-6 drop-shadow-sm" />
                               <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                                   City Government of Meycauayan <br className="hidden md:block" /> Application Form
                               </h2>
                           </div>

                           <form onSubmit={handleSubmit(onSubmit, onFormError)} className="relative z-10 space-y-2">
                                 {/* ═══ 1. PERSONAL INFORMATION ═══ */}
                                 <FormSection title={<><UserSquare2 size={16} /> Personal Information</>}>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div className="space-y-1.5">
                                             <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Last Name <span className="text-red-500">*</span></label>
                                             <input {...register('lastName')} className={getInputClass('lastName')} placeholder="" />
                                             <FieldError name="lastName" />
                                         </div>
                                         <div className="space-y-1.5">
                                             <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">First Name <span className="text-red-500">*</span></label>
                                             <input {...register('firstName')} className={getInputClass('firstName')} placeholder="" />
                                             <FieldError name="firstName" />
                                         </div>
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div className="space-y-1.5">
                                             <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Middle Name</label>
                                             <input {...register('middleName')} className={`${getInputClass('middleName')} !pl-3`} placeholder="" />
                                             <FieldError name="middleName" />
                                         </div>
                                         <div className="space-y-1.5">
                                             <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Suffix</label>
                                             <input {...register('suffix')} className={`${getInputClass('suffix')} !pl-3`} placeholder="" />
                                             <FieldError name="suffix" />
                                         </div>
                                     </div>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
                                         <div className="space-y-1.5">
                                             <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Birth Date</label>
                                             <input type="date" {...register('birthDate')} className={getInputClass('birthDate')} />
                                             <FieldError name="birthDate" />
                                         </div>
                                         <div className="space-y-1.5">
                                             <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Place of Birth <span className="text-red-500">*</span></label>
                                             <input {...register('birthPlace')} className={`${getInputClass('birthPlace')} !pl-3`} placeholder="City/Province" />
                                             <FieldError name="birthPlace" />
                                         </div>
                                         <div className="space-y-1.5">
                                             <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Gender <span className="text-red-500">*</span></label>
                                             <Combobox<"Male" | "Female">
                                                 options={GENDER_OPTIONS}
                                                 value={(watch('sex') as "Male" | "Female") || undefined}
                                                 onChange={(val) => setValue('sex', val, { shouldValidate: true })}
                                                 placeholder="Select..."
                                                 buttonClassName={`!pl-3 ${errors.sex ? '!border-red-500 ring-1 ring-red-500/20' : ''}`}
                                             />
                                             <FieldError name="sex" />
                                         </div>
                                     </div>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                         <div className="space-y-1.5">
                                             <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Civil Status <span className="text-red-500">*</span></label>
                                             <Combobox<"Single" | "Married" | "Widowed" | "Separated" | "Annulled">
                                                 options={CIVIL_STATUS_OPTIONS}
                                                 value={(watch('civilStatus') as "Single" | "Married" | "Widowed" | "Separated" | "Annulled") || undefined}
                                                 onChange={(val) => setValue('civilStatus', val, { shouldValidate: true })}
                                                 placeholder="Select..."
                                                 buttonClassName={`!pl-3 ${errors.civilStatus ? '!border-red-500 ring-1 ring-red-500/20' : ''}`}
                                             />
                                             <FieldError name="civilStatus" />
                                         </div>
                                         <div className="space-y-1.5">
                                             <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Nationality</label>
                                             <input {...register('nationality')} className={`${getInputClass('nationality')} !pl-3`} placeholder="Filipino" />
                                             <FieldError name="nationality" />
                                         </div>
                                         <div className="space-y-1.5">
                                             <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Citizenship Type</label>
                                             <div className="flex gap-2">
                                                 <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all cursor-pointer font-bold text-[10px] ${watch("citizenshipType") === "Filipino" ? "bg-green-50 border-green-500 text-green-700 shadow-sm" : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"}`}>
                                                     <input type="radio" value="Filipino" {...register("citizenshipType")} className="hidden" />
                                                     Filipino
                                                 </label>
                                                 <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all cursor-pointer font-bold text-[10px] ${watch("citizenshipType") === "Dual Citizenship" ? "bg-green-50 border-green-500 text-green-700 shadow-sm" : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"}`}>
                                                     <input type="radio" value="Dual Citizenship" {...register("citizenshipType")} className="hidden" />
                                                     Dual Citizenship
                                                 </label>
                                             </div>
                                         </div>
                                         {watch("citizenshipType") === "Dual Citizenship" && (
                                             <div className="space-y-1.5 md:col-span-2">
                                                 <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">If Dual Citizenship, please indicate country</label>
                                                 <input {...register('dualCountry')} className={`${getInputClass('dualCountry')} !pl-3`} placeholder="e.g. USA, Canada" />
                                                 <FieldError name="dualCountry" />
                                             </div>
                                         )}
                                         <div className="space-y-1.5">
                                             <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Blood Type</label>
                                             <Combobox<"A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "none">
                                                 options={BLOOD_TYPE_OPTIONS}
                                                 value={(watch('bloodType') as "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "none") || undefined}
                                                 onChange={(val) => setValue('bloodType', val, { shouldValidate: true })}
                                                 placeholder="Select..."
                                                 buttonClassName="!pl-3"
                                             />
                                         </div>
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                                         <div className="space-y-1.5">
                                             <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Height (m)</label>
                                             <input type="number" step="0.01" {...register('height')} className={`${getInputClass('height')} !pl-3`} placeholder="" />
                                             <FieldError name="height" />
                                         </div>
                                         <div className="space-y-1.5">
                                             <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Weight (kg)</label>
                                             <input type="number" step="0.1" {...register('weight')} className={`${getInputClass('weight')} !pl-3`} placeholder="" />
                                             <FieldError name="weight" />
                                         </div>
                                     </div>
                                 </FormSection>
                                 {/* ═══ 2. CONTACT & ADDRESS ═══ */}
                                 <FormSection title={<><Mail size={16} /> Contact &amp; Address</>}>
                                    <div className="space-y-3 pb-3 border-b border-gray-100">
                                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                            <label className="text-[11px] font-medium text-gray-600 mb-3 block">Are you a resident of Meycauayan? <span className="text-red-500">*</span></label>
                                            <div className="flex gap-3">
                                              <label className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all cursor-pointer font-bold text-sm ${watch("isMeycauayanResident") === "true" ? "bg-green-50 border-green-500 text-green-700 shadow-sm" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"}`}>
                                                <input type="radio" value="true" {...register("isMeycauayanResident")} className="hidden" />
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${watch("isMeycauayanResident") === "true" ? "border-green-500" : "border-slate-300"}`}>
                                                  {watch("isMeycauayanResident") === "true" && <div className="w-2 h-2 rounded-full bg-green-500" />}
                                                </div>
                                                Yes, I am a resident
                                              </label>
                                              <label className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all cursor-pointer font-bold text-sm ${watch("isMeycauayanResident") === "false" ? "bg-slate-50 border-slate-400 text-slate-700 shadow-sm" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"}`}>
                                                <input type="radio" value="false" {...register("isMeycauayanResident")} className="hidden" />
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${watch("isMeycauayanResident") === "false" ? "border-slate-400" : "border-slate-300"}`}>
                                                  {watch("isMeycauayanResident") === "false" && <div className="w-2 h-2 rounded-full bg-slate-400" />}
                                                </div>
                                                No, I am not
                                              </label>
                                            </div>
                                            <FieldError name="isMeycauayanResident" />
                                        </div>

                                        <div className="pb-4 border-b border-gray-100">
                                            <h5 className="text-sm font-bold text-gray-700 mb-2">
                                                {isMeycauayanResident ? 'Residential Address (Meycauayan)' : 'Residential Address'}
                                            </h5>
                                            <PhilippineAddressSelector
                                                prefix="res"
                                                register={register}
                                                watch={watch}
                                                setValue={setValue}
                                                errors={errors}
                                                inputClass={inputClass}
                                                isMeycauayanOnly={watch("isMeycauayanResident") === true || String(watch("isMeycauayanResident")) === 'true'}
                                            />
                                        </div>

                                        <div className="pt-4 border-b border-gray-100 pb-4">
                                            <h5 className="text-sm font-bold text-gray-700 mb-2">Permanent Address</h5>
                                            <PhilippineAddressSelector
                                                prefix="perm"
                                                register={register}
                                                watch={watch}
                                                setValue={setValue}
                                                errors={errors}
                                                inputClass={inputClass}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Mobile Number <span className="text-red-500">*</span></label>
                                                <input {...register('phoneNumber')} className={getInputClass('phoneNumber')} placeholder="09XX XXX XXXX" />
                                                <FieldError name="phoneNumber" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Telephone Number</label>
                                                <input {...register('telephoneNumber')} className={inputClass} placeholder="(044) XXX-XXXX" />
                                                <FieldError name="telephoneNumber" />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Email Address <span className="text-red-500">*</span></label>
                                            <input {...register('email')} className={getInputClass('email')} placeholder="juan@example.com" />
                                            <FieldError name="email" />
                                            {isEmailTaken && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">This email is already registered.</p>}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-3 bg-red-50/30 rounded-[10px] border border-red-50">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-medium text-red-500 ml-0.5 mb-1 flex items-center gap-1">Emergency Contact Person <span className="text-red-500">*</span></label>
                                                <input 
                                                    {...register('emergencyContact')} 
                                                    className={`${getInputClass('emergencyContact')} !pl-3`} 
                                                    placeholder="Full Name" 
                                                />
                                                <FieldError name="emergencyContact" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-medium text-red-500 ml-0.5 mb-1 block">Emergency Phone Number <span className="text-red-500">*</span></label>
                                                <input 
                                                    {...register('emergencyContactNumber')} 
                                                    className={`${getInputClass('emergencyContactNumber')} !pl-3`} 
                                                    placeholder="09XX XXX XXXX" 
                                                />
                                                <FieldError name="emergencyContactNumber" />
                                            </div>
                                        </div>
                                     </div>
                                 </FormSection>

                                 <FormSection title={<><Fingerprint size={16} /> Government Identifiers</>}>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                         <div className="space-y-1.5">
                                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">GSIS ID NO.</label>
                                             <input {...register('gsisNumber')} className={`${getInputClass('gsisNumber')} !pl-3`} placeholder="00-0000000-0" />
                                             <FieldError name="gsisNumber" />
                                             {isIdTakenMap.gsisNumber && <p className="text-red-500 text-[10px] font-bold mt-1">This ID already exists in the system</p>}
                                         </div>
                                         <div className="space-y-1.5">
                                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">PAG-IBIG ID NO.</label>
                                             <input {...register('pagibigNumber')} className={`${getInputClass('pagibigNumber')} !pl-3`} placeholder="0000-0000-0000" />
                                             <FieldError name="pagibigNumber" />
                                             {isIdTakenMap.pagibigNumber && <p className="text-red-500 text-[10px] font-bold mt-1">This ID already exists in the system</p>}
                                         </div>
                                         <div className="space-y-1.5">
                                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">PHILHEALTH NO.</label>
                                             <input {...register('philhealthNumber')} className={`${getInputClass('philhealthNumber')} !pl-3`} placeholder="00-000000000-0" />
                                             <FieldError name="philhealthNumber" />
                                             {isIdTakenMap.philhealthNumber && <p className="text-red-500 text-[10px] font-bold mt-1">This ID already exists in the system</p>}
                                         </div>
                                         <div className="space-y-1.5">
                                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">SSS / UMID NO.</label>
                                             <input {...register('umidNumber')} className={`${getInputClass('umidNumber')} !pl-3`} placeholder="00-0000000-0" />
                                             <FieldError name="umidNumber" />
                                             {isIdTakenMap.umidNumber && <p className="text-red-500 text-[10px] font-bold mt-1">This ID already exists in the system</p>}
                                         </div>
                                         <div className="space-y-1.5">
                                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">TIN NO.</label>
                                             <input {...register('tinNumber')} className={`${getInputClass('tinNumber')} !pl-3`} placeholder="000-000-000-000" />
                                             <FieldError name="tinNumber" />
                                             {isIdTakenMap.tinNumber && <p className="text-red-500 text-[10px] font-bold mt-1">This ID already exists in the system</p>}
                                         </div>
                                         <div className="space-y-1.5">
                                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">PHILSYS ID</label>
                                             <input {...register('philsysId')} className={`${getInputClass('philsysId')} !pl-3`} placeholder="0000-0000-0000-0000" />
                                             <FieldError name="philsysId" />
                                             {isIdTakenMap.philsysId && <p className="text-red-500 text-[10px] font-bold mt-1">This ID already exists in the system</p>}
                                         </div>
                                         <div className="space-y-1.5">
                                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Agency Employee No.</label>
                                             <input {...register('agencyEmployeeNo')} className={`${getInputClass('agencyEmployeeNo')} !pl-3`} />
                                             <FieldError name="agencyEmployeeNo" />
                                             {isIdTakenMap.agencyEmployeeNo && <p className="text-red-500 text-[10px] font-bold mt-1">This ID already exists in the system</p>}
                                         </div>
                                     </div>
                                  </FormSection>

                                 <FormSection title={<><Users size={16} /> Educational Background</>}>
                                    <div className="space-y-6">
                                        <EducationLevelSection level="Elementary" label="Elementary" icon={Briefcase} />
                                        <EducationLevelSection level="Secondary" label="Secondary" icon={Briefcase} />
                                        <EducationLevelSection level="Vocational" label="Vocational / Trade Course" icon={Briefcase} />
                                        <EducationLevelSection level="College" label="College" icon={Briefcase} />
                                        <EducationLevelSection level="Graduate" label="Graduate Studies" icon={Briefcase} />
                                    </div>
                                 </FormSection>

                                 {/* ═══ 4. SOCIAL LINKS ═══ */}
                                 <FormSection title={<><Users size={16} /> Social Links</>}>
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                         <div className="space-y-1.5">
                                             <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Facebook</label>
                                             <input {...register('facebookUrl')} className={inputClass} placeholder="facebook.com/username" />
                                         </div>
                                         <div className="space-y-1.5">
                                             <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">LinkedIn</label>
                                             <input {...register('linkedinUrl')} className={inputClass} placeholder="linkedin.com/in/username" />
                                         </div>
                                         <div className="space-y-1.5">
                                             <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Twitter (X)</label>
                                             <input {...register('twitterHandle')} className={inputClass} placeholder="@handle" />
                                         </div>
                                     </div>
                                 </FormSection>

                                 <FormSection 
                                     title={<><ShieldCheck size={16} /> Civil Service Eligibility</>}
                                     action={
                                         <button 
                                             type="button" 
                                             onClick={() => appendEligibility({ 
                                                 name: "", 
                                                 rating: "", 
                                                 examDate: "", 
                                                 examPlace: "", 
                                                 licenseNo: "", 
                                                 licenseValidUntil: "" 
                                             })}
                                             className="text-[10px] bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-bold hover:bg-green-100 transition-all flex items-center gap-1.5"
                                         >
                                             <Plus size={12} /> Add Record
                                         </button>
                                     }
                                 >
                                     <div className="space-y-4">
                                         {eligibilityFields.map((field, index) => (
                                             <div key={field.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 relative group">
                                                 <button 
                                                     type="button" 
                                                     onClick={() => removeEligibility(index)} 
                                                     className="absolute -top-2 -right-2 bg-white text-red-500 hover:bg-red-50 p-1.5 rounded-full shadow-sm border border-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                                 >
                                                     <Minus size={14} />
                                                 </button>
                                                 
                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                     <div className="space-y-1.5">
                                                         <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Type of Eligibility</label>
                                                         <Combobox<string>
                                                             options={ELIGIBILITY_RECRUITMENT_OPTIONS}
                                                             value={watch(`eligibilities.${index}.name` as Path<JobDetailFormValues>) as string | undefined}
                                                             onChange={(val) => setValue(`eligibilities.${index}.name` as Path<JobDetailFormValues>, val)}
                                                             placeholder="Select or type..."
                                                             buttonClassName="!pl-3"
                                                         />
                                                     </div>
                                                     <div className="space-y-1.5">
                                                         <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Rating (if applicable)</label>
                                                         <input {...register(`eligibilities.${index}.rating` as Path<JobDetailFormValues>)} className={`${inputClass} !pl-3`} placeholder="e.g. 85.00" />
                                                     </div>
                                                 </div>

                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                                                     <div className="space-y-1.5">
                                                         <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Date of Examination / Conferment</label>
                                                         <input type="date" {...register(`eligibilities.${index}.examDate` as Path<JobDetailFormValues>)} className={inputClass} />
                                                     </div>
                                                     <div className="space-y-1.5">
                                                         <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Place of Examination / Conferment</label>
                                                         <input {...register(`eligibilities.${index}.examPlace` as Path<JobDetailFormValues>)} className={`${inputClass} !pl-3`} placeholder="e.g. Manila" />
                                                     </div>
                                                 </div>

                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                                                     <div className="space-y-1.5">
                                                         <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">License Number (if applicable)</label>
                                                         <input {...register(`eligibilities.${index}.licenseNo` as Path<JobDetailFormValues>)} className={`${inputClass} !pl-3`} placeholder="" />
                                                     </div>
                                                     <div className="space-y-1.5">
                                                         <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Date of Validity</label>
                                                         <input type="date" {...register(`eligibilities.${index}.licenseValidUntil` as Path<JobDetailFormValues>)} className={inputClass} />
                                                     </div>
                                                 </div>
                                             </div>
                                         ))}
                                         {eligibilityFields.length === 0 && (
                                             <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                                                 <p className="text-xs font-bold text-gray-400">No eligibility records added</p>
                                                 <button 
                                                     type="button" 
                                                     onClick={() => appendEligibility({ name: "", rating: "", examDate: "", examPlace: "", licenseNo: "", licenseValidUntil: "" })}
                                                     className="mt-2 text-[10px] text-green-600 font-black hover:underline underline-offset-4"
                                                 >
                                                     + Add Record
                                                 </button>
                                             </div>
                                         )}
                                     </div>
                                 </FormSection>

                                 {/* Work Experience - Always visible for PDS alignment */}
                                <FormSection 
                                    title={<><Briefcase size={16} /> Work Experience</>}
                                    action={
                                        <button 
                                            type="button" 
                                            onClick={() => appendWorkExperience({ dateFrom: "", dateTo: "", positionTitle: "", companyName: "", monthlySalary: "", salaryGrade: "", appointmentStatus: "", isGovernment: false })}
                                            className="text-[10px] font-black text-green-600 hover:bg-green-600 hover:text-white flex items-center gap-2 transition-all bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 shadow-sm"
                                        >
                                            <Plus size={12} /> Add Experience
                                        </button>
                                    }
                                >
                                    <div className="space-y-6">
                                         {workExperienceFields.map((field, index) => (
                                             <div key={field.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 relative group">
                                                 <button 
                                                     type="button" 
                                                     onClick={() => removeWorkExperience(index)} 
                                                     className="absolute -top-2 -right-2 bg-white text-red-500 hover:bg-red-50 p-1.5 rounded-full shadow-sm border border-red-50 opacity-0 group-hover:opacity-100 transition-all font-bold"
                                                 >
                                                     <Minus size={14} />
                                                 </button>
                                                 
                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                     <div className="space-y-1.5">
                                                         <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Position Title</label>
                                                         <input {...register(`workExperiences.${index}.positionTitle` as Path<JobDetailFormValues>)} className={`${inputClass} !pl-3`} placeholder="Enter position" />
                                                         <FieldError name={`workExperiences.${index}.positionTitle` as Path<JobDetailFormValues>} />
                                                     </div>
                                                     <div className="space-y-1.5">
                                                         <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Company / Agency name</label>
                                                         <input {...register(`workExperiences.${index}.companyName` as Path<JobDetailFormValues>)} className={`${inputClass} !pl-3`} placeholder="Enter company" />
                                                         <FieldError name={`workExperiences.${index}.companyName` as Path<JobDetailFormValues>} />
                                                     </div>
                                                 </div>

                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                                                     <div className="space-y-1.5">
                                                         <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Inclusive Dates - From</label>
                                                         <input type="date" {...register(`workExperiences.${index}.dateFrom` as Path<JobDetailFormValues>)} className={inputClass} />
                                                     </div>
                                                     <div className="space-y-1.5">
                                                         <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Inclusive Dates - To</label>
                                                         <input type="date" {...register(`workExperiences.${index}.dateTo` as Path<JobDetailFormValues>)} className={inputClass} />
                                                     </div>
                                                 </div>

                                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-3">
                                                     <div className="space-y-1.5">
                                                         <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Monthly Salary</label>
                                                         <input type="number" step="0.01" {...register(`workExperiences.${index}.monthlySalary` as Path<JobDetailFormValues>)} className={`${inputClass} !pl-3`} placeholder="0.00" />
                                                     </div>
                                                     <div className="space-y-1.5">
                                                         <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Salary Grade (if applicable)</label>
                                                         <input {...register(`workExperiences.${index}.salaryGrade` as Path<JobDetailFormValues>)} className={`${inputClass} !pl-3`} placeholder="e.g. SG-12" />
                                                     </div>
                                                     <div className="space-y-1.5">
                                                         <label className="text-[10px) font-bold text-slate-400 ml-1 mb-1 block">Status of Appointment</label>
                                                         <input {...register(`workExperiences.${index}.appointmentStatus` as Path<JobDetailFormValues>)} className={`${inputClass} !pl-3`} placeholder="e.g. Permanent" />
                                                     </div>
                                                 </div>

                                                 <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-white rounded-[10px] border border-gray-100 w-fit">
                                                     <input type="checkbox" {...register(`workExperiences.${index}.isGovernment` as Path<JobDetailFormValues>)} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                                                      <label className="text-[11px] font-medium text-gray-600">Government service?</label>
                                                 </div>
                                             </div>
                                         ))}
                                         {workExperienceFields.length === 0 && (
                                             <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                                                 <p className="text-xs font-bold text-gray-400">No work experience records added</p>
                                                 <button 
                                                     type="button" 
                                                     onClick={() => appendWorkExperience({ dateFrom: "", dateTo: "", positionTitle: "", companyName: "", monthlySalary: "", salaryGrade: "", appointmentStatus: "", isGovernment: false })}
                                                     className="mt-2 text-[10px] text-green-600 font-black hover:underline underline-offset-4"
                                                 >
                                                     + Add Record
                                                 </button>
                                             </div>
                                         )}
                                    </div>
                                </FormSection>

                                {/* Learning & Development / Training Programs */}
                               <FormSection 
                                    title={<><Plus size={16} /> Training Programs</>}
                                    action={
                                        <button 
                                            type="button" 
                                            onClick={() => appendTraining({ title: "", dateFrom: "", dateTo: "", hoursNumber: "", typeOfLd: "", conductedBy: "" })}
                                            className="text-[10px] bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-bold hover:bg-green-100 transition-all flex items-center gap-1.5"
                                        >
                                            <Plus size={12} /> Add Record
                                        </button>
                                    }
                                >
                                    <div className="space-y-4">
                                        {trainingFields.map((field, index) => (
                                            <div key={field.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 relative group">
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeTraining(index)} 
                                                    className="absolute -top-2 -right-2 bg-white text-red-500 hover:bg-50 p-1.5 rounded-full shadow-sm border border-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                
                                                <div className="space-y-1.5 mb-3">
                                                    <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1 block">Title of Learning and Development Interventions / Training Program</label>
                                                    <input {...register(`trainings.${index}.title` as Path<JobDetailFormValues>)} className={`${inputClass} !pl-3`} placeholder="Enter training title" />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Inclusive Dates - From</label>
                                                        <input type="date" {...register(`trainings.${index}.dateFrom` as Path<JobDetailFormValues>)} className={inputClass} />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Inclusive Dates - To</label>
                                                        <input type="date" {...register(`trainings.${index}.dateTo` as Path<JobDetailFormValues>)} className={inputClass} />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-3">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Number of Hours</label>
                                                        <input type="number" {...register(`trainings.${index}.hoursNumber` as Path<JobDetailFormValues>)} className={`${inputClass} !pl-3`} placeholder="" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Type of LD (Managerial/etc)</label>
                                                        <input {...register(`trainings.${index}.typeOfLd` as Path<JobDetailFormValues>)} className={`${inputClass} !pl-3`} placeholder="" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Conducted / Sponsored By</label>
                                                        <input {...register(`trainings.${index}.conductedBy` as Path<JobDetailFormValues>)} className={`${inputClass} !pl-3`} placeholder="" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {trainingFields.length === 0 && (
                                            <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                                                <p className="text-xs font-bold text-gray-400">No training records added</p>
                                                <button 
                                                    type="button" 
                                                    onClick={() => appendTraining({ title: "", dateFrom: "", dateTo: "", hoursNumber: "", typeOfLd: "", conductedBy: "" })}
                                                    className="mt-2 text-[10px] text-green-600 font-black hover:underline underline-offset-4"
                                                >
                                                    + Add Record
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </FormSection>

                                {/* Additional Information */}
                                <FormSection title={<><PlusCircle size={16} /> Additional Information</>}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Cumulative Years of Experience</label>
                                            <input 
                                                type="number" 
                                                step="0.1" 
                                                {...register('totalExperienceYears', { valueAsNumber: true })} 
                                                className={`${inputClass} !pl-3`} 
                                                placeholder="e.g. 5.5" 
                                            />
                                            <FieldError name="totalExperienceYears" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-medium text-gray-600 ml-0.5 mb-1.5 block">Special Skills / Hobbies</label>
                                            <textarea 
                                                {...register('skills')} 
                                                className={`${inputClass} !pl-3`} 
                                                rows={1} 
                                                placeholder="Key competencies/skills..." 
                                            />
                                            <FieldError name="skills" />
                                        </div>
                                    </div>
                                </FormSection>

                                <FormSection title={<><FileText size={16} /> Final Documents</>}>
                                   <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* 1. Resume Upload */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 ml-1 flex items-center justify-between">
                                                Detailed Résumé / PDS
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <div className="group relative">
                                                <input 
                                                   type="file" 
                                                   id="resume-upload"
                                                   accept=".pdf,.doc,.docx"
                                                   onChange={(e) => {
                                                     const file = e.target.files?.[0];
                                                     if (file) setValue('resume', file, { shouldValidate: true });
                                                   }}
                                                   className="hidden"
                                                />
                                                <label 
                                                   htmlFor="resume-upload"
                                                   className="flex flex-col items-center justify-center w-full min-h-[180px] bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[20px] cursor-pointer hover:bg-green-50/30 hover:border-green-300 transition-all group"
                                                >
                                                   <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform mb-3">
                                                     <FileText className="text-gray-400 group-hover:text-green-600" size={20} />
                                                   </div>
                                                   <span className="text-[11px] font-bold text-gray-700 group-hover:text-green-700 text-center px-4 truncate w-full">
                                                     {watch('resume') instanceof File ? (watch('resume') as File).name : "Select Resume"}
                                                   </span>
                                                   <span className="text-[9px] font-bold text-gray-400 mt-1">PDF / DOCX Preferred</span>
                                                </label>
                                            </div>
                                            <FieldError name="resume" />
                                        </div>

                                        {/* 2. Photo Upload */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 ml-1 flex items-center justify-between">
                                                2x2 Photo (White BG)
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <div className="group relative">
                                                <input 
                                                   type="file" 
                                                   id="photo-upload"
                                                   accept="image/*"
                                                   onChange={handlePhotoChange}
                                                   className="hidden"
                                                />
                                                <label 
                                                   htmlFor="photo-upload"
                                                   className="flex flex-col items-center justify-center w-full min-h-[180px] bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[20px] cursor-pointer hover:bg-green-50/30 hover:border-green-300 transition-all group overflow-hidden"
                                                >
                                                   {photoPreview ? (
                                                       <img src={photoPreview} alt="Preview" className="w-full h-[180px] object-cover rounded-[20px] animate-in fade-in" />
                                                   ) : (
                                                       <>
                                                           <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform mb-3">
                                                             <Image className="text-gray-400 group-hover:text-green-600" size={20} />
                                                           </div>
                                                           <span className="text-[11px] font-bold text-gray-700 group-hover:text-green-700">Select 2x2 Photo</span>
                                                           <span className="text-[9px] font-bold text-gray-400 mt-1">JPG / PNG Only</span>
                                                       </>
                                                   )}
                                                </label>
                                            </div>
                                            <FieldError name="photo" />
                                        </div>

                                        {/* 3. Eligibility Certificate */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 ml-1 flex items-center justify-between">
                                                Eligibility Cert.
                                                <span className="text-gray-400">(Optional)</span>
                                            </label>
                                            <div className="group relative">
                                                <input 
                                                   type="file" 
                                                   id="cert-upload"
                                                   accept=".pdf,image/*"
                                                   onChange={(e) => {
                                                     const file = e.target.files?.[0];
                                                     if (file) setValue('eligibilityCert', file, { shouldValidate: true });
                                                   }}
                                                   className="hidden"
                                                />
                                                <label 
                                                   htmlFor="cert-upload"
                                                   className="flex flex-col items-center justify-center w-full min-h-[180px] bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[20px] cursor-pointer hover:bg-green-50/30 hover:border-green-300 transition-all group"
                                                >
                                                   <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform mb-3">
                                                     <Award className="text-gray-400 group-hover:text-green-600" size={20} />
                                                   </div>
                                                   <span className="text-[11px] font-bold text-gray-700 group-hover:text-green-700 text-center px-4 truncate w-full">
                                                     {watch('eligibilityCert') instanceof File ? (watch('eligibilityCert') as File).name : "Select Certificate"}
                                                   </span>
                                                   <span className="text-[9px] font-bold text-gray-400 mt-1">PDF or Clear Photo</span>
                                                </label>
                                            </div>
                                            <FieldError name="eligibilityCert" />
                                        </div>
                                    </div>
                                   </div>
                                 </FormSection>

                               <div className="pt-10 pb-4">
                                   <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
                                      <div className="flex-1">
                                          <h4 className="text-sm font-black text-slate-900 mb-1 tracking-tight">Final verification</h4>
                                          <p className="text-[11px] font-bold text-slate-500 leading-tight">By sliding, you confirm that all data provided is 100% accurate under the Data Privacy Act.</p>
                                      </div>
                                      <div className="w-full md:w-80">
                                          <SlideToApply 
                                            isVerified={isVerified} 
                                            onVerify={() => {
                                                setIsVerified(true);
                                                setValue('hToken', `v-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`, { shouldValidate: true });
                                            }} 
                                          />
                                      </div>
                                   </div>
                               </div>

                               <button 
                                 type="submit" 
                                 disabled={mutation.isPending || !isVerified}
                                 className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl text-sm font-black tracking-tight transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 overflow-hidden group"
                               >
                                  {mutation.isPending ? (
                                    <>
                                      <Loader2 className="animate-spin" size={20} />
                                      <span className="animate-pulse">Encrypting & Sending Application...</span>
                                    </>
                                  ) : (
                                    <>
                                      Submit Application Protocol
                                      <Send size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                    </>
                                  )}
                               </button>
                           </form>
                       </section>
                   </div>
               </div>

            <div className="max-w-lg mx-auto space-y-6 mt-16">
            <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-slate-200 shadow-sm text-center relative overflow-hidden">
            {/* subtle background decoration to match form */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-2xl -mr-16 -mt-16 opacity-50"></div>
            
            <div className="relative z-10">
            <div className="mb-6">
                           <p className="text-slate-500 text-[12px] font-bold leading-relaxed">
                                Join the City Government of Meycauayan.
                           </p>
                       </div>
                       
                       {job.attachmentPath && (
                            <div className="mb-6 bg-green-50 border border-green-100 rounded-2xl p-4">
                              <div className="flex items-start gap-3">
                                 <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                   <FileText size={18} />
                                 </div>
                                 <div className="flex-1">
                                   <h4 className="text-green-700 font-bold text-sm mb-1">Qualification Document</h4>
                                   <p className="text-green-700/60 text-[10px] leading-tight mb-3">Download the required document format provided by HR.</p>
                                   <a 
                                     href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${job.attachmentPath}`} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     className="inline-flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-black text-white text-[12px] font-bold rounded-xl transition-all shadow-lg shadow-slate-200 active:scale-[0.98]"
                                   >
                                     <Download size={14} /> Download File
                                   </a>
                                 </div>
                              </div>
                            </div>
                        )}
                       
                        {success && (
                            <div className="text-center py-6 bg-green-50/50 rounded-2xl border border-green-100 flex flex-col items-center justify-center gap-3">
                                <div>
                                    <h3 className="text-green-950 font-black tracking-tight text-sm leading-tight">Application received</h3>
                                    <p className="text-green-700/60 text-[9px] font-bold tracking-tight mt-1">We will review your application</p>
                                </div>
                            </div>
                        )}

                         <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                         <div className="text-slate-500 flex items-center gap-2">
                         <span className="text-[12px] font-bold text-slate-700">hr@lgu-meycauayan.gov.ph</span>
                         </div>
                         <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                         <div className="text-slate-500 flex items-center gap-2">
                             <span className="text-[12px] font-bold text-slate-700">(044) 123-4567</span>
                            </div>
                               </div>
                             </div>
                            </div>
                            </div>
                            </div>
                            
             <AnimatePresence>
                 {success && (
                     <motion.div 
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md"
                     >
                         <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-lg w-full text-center border border-slate-200 relative overflow-hidden">
                             <div className="relative z-10">
                                 <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Application sent</h2>
                                 <p className="text-slate-500 font-bold text-sm leading-relaxed mb-10 max-w-xs mx-auto">
                                     Your application has been successfully submitted to the Human Resource office for review.
                                 </p>
                                 <button 
                                     onClick={() => navigate('/careers')}
                                     className="bg-slate-900 text-white font-black px-10 py-4 rounded-2xl border border-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95 text-xs tracking-tight hover:bg-black"
                                 >
                                     Go back to careers
                                 </button>
                             </div>
                         </div>
                     </motion.div>
                 )}
             </AnimatePresence>
        </div>
      </div>
    </PublicLayout>
  );
};

export default JobDetail;
