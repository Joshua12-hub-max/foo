import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, ChevronRight, Fingerprint, ShieldCheck,
  Briefcase, Send, Mail, Plus, Minus, UserSquare2, Upload, Info, FileText, FileCheck, CheckCircle2, Download
} from 'lucide-react';
import { useToastStore } from '@/stores';
import PublicLayout from '@components/Public/PublicLayout';
import { jobApplicationSchema, JobApplicationSchema, PublicJob, createDynamicJobApplicationSchema, EDUCATION_LEVELS } from '@/schemas/recruitment';
import { usePublicJobDetail, useJobApplication } from '@/features/Recruitment/hooks/usePublicJobs';
import { PhilippineAddressSelector } from '@/components/Custom/Shared/PhilippineAddressSelector';
import ph from 'phil-reg-prov-mun-brgy';
import { Region, Province, CityMunicipality } from '@/types/ph-address';

const SlideToApply = ({ onVerify, isVerified }: { onVerify: () => void, isVerified: boolean }) => (
    <div className="relative w-full">
        {!isVerified ? (
            <div className="relative h-16 bg-slate-100 rounded-2xl border border-slate-200 p-1.5 flex items-center overflow-hidden">
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

const FormSection = ({ title, subtitle, children, icon, action }: { title: React.ReactNode, subtitle: string, children: React.ReactNode, icon?: React.ReactNode, action?: React.ReactNode }) => (
    <div className="relative z-10 py-6 first:pt-0 border-b border-gray-100 last:border-0">
        <div className="mb-5 flex items-center justify-between">
            <div>
                <h3 className="text-base font-bold text-slate-700 tracking-tight flex items-center gap-2">
                    {title}
                </h3>
            </div>
            <div className="flex items-center gap-3">
                {action}
            </div>
        </div>
        <div className="grid grid-cols-1 gap-y-4">
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
    const [startTime, setStartTime] = useState<number | null>(null);

    // Fetch Job using custom hook
    const { data: job, isLoading, error } = usePublicJobDetail(id);
    const jobData = job as PublicJob | undefined;
    const isCSCJob = ['Permanent', 'Temporary', 'Probationary'].includes(jobData?.employmentType || '');

    const isPermanent = jobData?.employmentType === 'Permanent';
    const requireIds = !!(isPermanent || jobData?.requireGovernmentIds);
    const requireCsc = !!(isPermanent || jobData?.requireCivilService || (jobData?.eligibility && jobData.eligibility !== 'None required'));
    const requireEdu = !!(isPermanent || jobData?.requireEducationExperience || (jobData?.education && jobData.education !== 'None required'));
    const requireExp = !!(isPermanent || jobData?.requireEducationExperience || (jobData?.experience && jobData.experience !== 'None required'));
    const requireTraining = !!(jobData?.training && jobData.training !== 'None required');

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
            jobData?.training || undefined,
            jobData?.eligibility || undefined
        );
    }, [jobData?.employmentType, requireIds, requireCsc, requireEdu, requireExp, jobData?.education, jobData?.experience, jobData?.training, jobData?.eligibility]);

    // Form
    const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<JobApplicationSchema>({
        resolver: zodResolver(dynamicSchema) as Resolver<JobApplicationSchema>,
        defaultValues: {
            hpField: '',
            websiteUrl: '',
            sex: 'Male',
            civilStatus: 'Single',
            bloodType: 'none',
            eligibilityType: 'none',
            isMeycauayanResident: false,
            photoPreview: '',
            resCity: '',
            resBrgy: '',
            educationalBackground: '',
            schoolName: '',
            yearGraduated: '',
            course: '',
            experience: '',
            skills: '',
            totalExperienceYears: '',
            totalTrainingHours: '',
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            address: '',
            zipCode: '',
            birthDate: '',
            birthPlace: ''
        }
    });

    const isMeycauayanResident = watch('isMeycauayanResident');
    const photoPreview = watch('photoPreview');


    // Watch address selector fields for real-time address building
    const resRegion = watch('resRegion');
    const resProvince = watch('resProvince');
    const resCity = watch('resCity');
    const resBrgy = watch('resBrgy');
    const resHouse = watch('resHouseBlockLot');
    const resSubd = watch('resSubdivision');
    const resStreet = watch('resStreet');
    const residentialZip = watch('residentialZipCode');
    const permRegion = watch('permRegion');
    const permProvince = watch('permProvince');
    const permCity = watch('permCity');
    const permBrgy = watch('permBrgy');
    const permHouse = watch('permHouseBlockLot');
    const permSubd = watch('permSubdivision');
    const permStreet = watch('permStreet');
    const permanentZip = watch('permanentZipCode');

    // Helper to format names to Normal/Title Case
    const formatName = (name: string) => {
      if (!name) return '';
      if (name.toUpperCase() === 'NATIONAL CAPITAL REGION [NCR]') return 'National Capital Region (NCR)';
      if (name.toUpperCase() === 'NCR') return 'NCR';
      return name.toLowerCase().split(' ').map(word => {
          if (word === 'of') return 'of';
          return word.charAt(0).toUpperCase() + word.slice(1);
      }).join(' ');
    };

    // Build full address string from selector codes → names (real-time)
    const buildAddress = (reg: string, prov: string, city: string, brgy: string, house: string, subd: string, street: string): string => {
      const rName = (ph.regions as Region[]).find(r => r.reg_code === reg)?.name || '';
      const pName = (ph.provinces as Province[]).find(p => p.prov_code === prov)?.name || '';
      const cName = (ph.city_mun as CityMunicipality[]).find(c => c.mun_code === city)?.name || '';
      return [house, subd, street, formatName(brgy), formatName(cName), formatName(pName), formatName(rName)].filter(Boolean).join(', ');
    };

    // Real-time residential address → `address` + `zip_code`
    useEffect(() => {
      const addr = buildAddress(resRegion || '', resProvince || '', resCity || '', resBrgy || '', resHouse || '', resSubd || '', resStreet || '');
      if (addr) setValue('address', addr, { shouldValidate: true });
      if (residentialZip) setValue('zipCode', residentialZip, { shouldValidate: true });
    }, [resRegion, resProvince, resCity, resBrgy, resHouse, resSubd, resStreet, residentialZip, setValue]);

    // Real-time permanent address → `permanentAddress` + `permanent_zip_code`
    useEffect(() => {
      const addr = buildAddress(permRegion || '', permProvince || '', permCity || '', permBrgy || '', permHouse || '', permSubd || '', permStreet || '');
      if (addr) setValue('permanentAddress', addr);
      if (permanentZip) setValue('permanentZipCode', permanentZip);
    }, [permRegion, permProvince, permCity, permBrgy, permHouse, permSubd, permStreet, permanentZip, setValue]);

  // Mutation using custom hook
  const mutation = useJobApplication(
    () => {
      setSuccess(true);
      window.scrollTo(0, 0);
    },
    (err: Error) => {
        const axiosErr = err as Error & { response?: { data?: { message?: string; error?: string; errors?: Record<string, string[]> } } };
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

  const onSubmit = async (data: JobApplicationSchema) => {
    if (!id) return;

    // 100% Verification - Submission Timer (Min 30s)
    const now = Date.now();
    if (startTime && now - startTime < 30000) {
        showToast("Please review the form carefully. Protocol requires at least 30s for review.", "warning");
        return;
    }

    // 100% Verification - Slide to Apply
    if (!isVerified) {
        showToast("Please complete the identity verification slider.", "error");
        return;
    }

    // 100% Verification - File Integrity
    const resumeFile = watch('resume');
    if (resumeFile instanceof File) {
        const isValid = await verifyFileHeader(resumeFile);
        if (!isValid) {
            showToast("Invalid resume file integrity. Please upload a real PDF or Word document.", "error");
            return;
        }
    }

    // Final data alignment for backend schema requirements
    const finalData: JobApplicationSchema = {
        ...data,
        hToken: `v-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`
    };

    // Make sure we pass the explicitly separated fields from the form over to the API 
    if (data.resRegion !== undefined) finalData.resRegion = data.resRegion;
    if (data.resProvince !== undefined) finalData.resProvince = data.resProvince;
    if (data.resCity !== undefined) finalData.resCity = data.resCity;
    if (data.resBrgy !== undefined) finalData.resBrgy = data.resBrgy;
    if (data.resHouseBlockLot !== undefined) finalData.resHouseBlockLot = data.resHouseBlockLot;
    if (data.resSubdivision !== undefined) finalData.resSubdivision = data.resSubdivision;
    if (data.resStreet !== undefined) finalData.resStreet = data.resStreet;

    if (data.permRegion !== undefined) finalData.permRegion = data.permRegion;
    if (data.permProvince !== undefined) finalData.permProvince = data.permProvince;
    if (data.permCity !== undefined) finalData.permCity = data.permCity;
    if (data.permBrgy !== undefined) finalData.permBrgy = data.permBrgy;
    if (data.permHouseBlockLot !== undefined) finalData.permHouseBlockLot = data.permHouseBlockLot;
    if (data.permSubdivision !== undefined) finalData.permSubdivision = data.permSubdivision;
    if (data.permStreet !== undefined) finalData.permStreet = data.permStreet;

    mutation.mutate({ id, data: finalData });
  };

  // Show validation errors when form fails to submit
  const onFormError = (fieldErrors: Record<string, { message?: string }>) => {
    console.error('Form validation errors:', fieldErrors);
    const firstKey = Object.keys(fieldErrors)[0];
    const firstError = fieldErrors[firstKey];
    const label = firstKey.replace(/_/g, ' ');
    showToast(
      firstError?.message || `Please fill in: ${label}`,
      'error'
    );
    // Scroll to the first error field
    const el = document.querySelector(`[name="${firstKey}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Start the anti-bot timer on mount
  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  // Update document title when job loads
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
      <div className="min-h-screen bg-[#131314] font-sans text-white pb-12 pt-8 md:pt-12">

        <div className="max-w-6xl mx-auto px-6">
            <button 
              onClick={() => navigate('/careers/jobs')} 
              className="flex items-center gap-2 text-[10px] font-bold tracking-tight text-green-500 hover:text-white transition-all mb-8 group"
            >
                <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
                Back to listings
            </button>

           <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
               {/* Main Content - Master Precision */}
               <div className="lg:col-span-3">
                   <div className="mb-8">
                       <span className="inline-block px-3.5 py-1 bg-white/5 text-green-500 border border-white/5 rounded-lg text-[10px] font-bold tracking-tight mb-4 shadow-lg">
                           {job.department}
                       </span>
                       <h1 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight leading-[1.1]">
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
                             <div className="text-blue-400 font-bold text-[11px]">
                               <span className="tracking-tight">Duty: {job.dutyType}</span>
                             </div>
                           )}
                           <div className="text-slate-400 font-bold text-[11px]">
                             <span className="tracking-tight">Posted {formatDate(job.createdAt || job.postedAt)}</span>
                           </div>
                       </div>
                   </div>

                   <hr className="border-[#444746] my-8" />

                   <div className="space-y-10">
                       <section>
                           <h3 className="text-xl font-black text-white mb-4 tracking-tight flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                                About the job
                           </h3>
                           <div className="text-[15px] text-slate-400 font-semibold leading-relaxed whitespace-pre-wrap max-w-3xl">
                                {job.jobDescription}
                           </div>
                       </section>

                       <section>
                           <h3 className="text-xl font-black text-white mb-4 tracking-tight flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                                Requirements
                           </h3>
                           
                           {/* Display structured requirements first */}
                           {(job.education || job.experience || job.training || job.eligibility || job.otherQualifications) ? (
                             <div className="grid grid-cols-1 gap-4 max-w-3xl">
                               {job.education && (
                                 <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                   <div className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">Education</div>
                                   <div className="text-[14px] text-slate-300 font-semibold">{job.education}</div>
                                 </div>
                               )}
                               {job.experience && (
                                 <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                   <div className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">Experience</div>
                                   <div className="text-[14px] text-slate-300 font-semibold">{job.experience}</div>
                                 </div>
                               )}
                               {job.training && (
                                 <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                   <div className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">Training</div>
                                   <div className="text-[14px] text-slate-300 font-semibold">{job.training}</div>
                                 </div>
                               )}
                               {job.eligibility && (
                                 <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                   <div className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">Eligibility</div>
                                   <div className="text-[14px] text-slate-300 font-semibold">{job.eligibility}</div>
                                 </div>
                               )}
                               {job.otherQualifications && (
                                 <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                   <div className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">Other Qualifications</div>
                                   <div className="text-[14px] text-slate-300 font-semibold whitespace-pre-wrap">{job.otherQualifications}</div>
                                 </div>
                               )}
                             </div>
                           ) : (
                             // Fallback to legacy requirements text if structured fields are empty
                             <div className="text-[15px] text-slate-400 font-semibold leading-relaxed whitespace-pre-wrap max-w-3xl">
                                  {job.requirements || 'No specific requirements listed.'}
                             </div>
                           )}
                       </section>
                   </div>
               </div>

               {/* Sidebar - Quick Info - Stacks on mobile */}
            <div className="w-full lg:w-80 space-y-6 order-1 lg:order-2">
              <div className="bg-[#1e1e1f] rounded-3xl p-8 border border-[#444746] sticky top-28 shadow-2xl">
                       <div className="mb-6 text-center">
                           <p className="text-slate-500 text-[11px] font-bold leading-relaxed">
                                Join the City Government of Meycauayan.
                           </p>
                       </div>
                       
                       {/* Qualification Document block */}
                       {job.attachmentPath && (
                           <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                             <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                                  <FileText size={18} />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-blue-400 font-bold text-sm mb-1">Qualification Document</h4>
                                  <p className="text-blue-400/70 text-[10px] leading-tight mb-3">Download the required document format provided by HR.</p>
                                  <a 
                                    href={`http://localhost:5000${job.attachmentPath}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] active:scale-[0.98]"
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

                         <div className="mt-8 pt-6 border-t border-[#444746] space-y-4">
                            <div className="text-slate-500">
                                <span className="text-[11px] font-bold truncate">hr@lgu-meycauayan.gov.ph</span>
                            </div>
                            <div className="text-slate-500">
                                <span className="text-[11px] font-bold">(044) 123-4567</span>
                            </div>
                         </div>
                   </div>
               </div>
           </div>
           
            {/* Success Full-Screen Guard (Visual Excellence) */}
            <AnimatePresence>
                {success && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md"
                    >
                        <div className="bg-slate-900 p-12 rounded-[3rem] shadow-2xl max-w-lg w-full text-center border border-white/5 relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Application sent</h2>
                                <p className="text-slate-400 font-bold text-sm leading-relaxed mb-10 max-w-xs mx-auto">
                                    Your application has been successfully submitted to the Human Resource office for review.

                                </p>
                                <button 
                                    onClick={() => navigate('/careers')}
                                    className="bg-white text-slate-950 font-black px-10 py-4 rounded-2xl border border-gray-300 shadow-sm transition-all active:scale-95 text-xs tracking-tight"
                                >
                                    Go back to careers
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
           
             {/* Application Form - Simple Gray Aesthetic */}
            {!success && (
                <div id="application-form" className="mt-12 sm:mt-20 max-w-4xl mx-auto px-4 sm:px-0">
                    <div className="bg-white border border-gray-300 overflow-hidden rounded-none shadow-none text-slate-900 font-sans">
                        <form onSubmit={handleSubmit(onSubmit, onFormError)} className="p-6 sm:p-12 space-y-0 relative">
                        {/* Anti-bot fields (hidden) */}
                        <div className="hidden" aria-hidden="true" style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px', zIndex: -1 }}>
                            <input type="text" {...register('hpField')} tabIndex={-1} autoComplete="off" />
                            <input type="url" {...register('websiteUrl')} tabIndex={-1} autoComplete="off" />
                        </div>

                        {/* Form Header */}
                        <div className="mb-12 border-b border-gray-100 pb-8">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Application Form</h2>
                            <p className="text-[11px] font-bold text-slate-500 tracking-tight mt-1">Please provide accurate personal and professional information.</p>
                        </div>

                        {/* Personal Identification Section */}
                        <FormSection 
                            title="Personal Details" 
                            subtitle="Core identity profile" 
                            action={
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-lg border border-gray-100 text-slate-500 cursor-pointer rounded-sm">
                                    <span className="text-[11px] font-bold tracking-tight">Identity Info</span>
                                    <Fingerprint size={14} className="opacity-50" />
                                </div>
                            }
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-2">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Last name <span className="text-red-500">*</span></label>
                                        <input type="text" {...register('lastName')} className={`w-full px-3 py-2 bg-white border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md outline-none font-medium text-sm text-slate-700`} placeholder="Last name" />
                                        {errors.lastName && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.lastName.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">First name <span className="text-red-500">*</span></label>
                                        <input type="text" {...register('firstName')} className={`w-full px-3 py-2 bg-white border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md outline-none font-medium text-sm text-slate-700`} placeholder="First name" />
                                        {errors.firstName && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.firstName.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Middle name</label>
                                        <input type="text" {...register('middleName')} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md outline-none font-medium text-sm text-slate-700" placeholder="Middle name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Suffix</label>
                                        <input type="text" {...register('suffix')} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md outline-none font-medium text-sm text-slate-700" placeholder="e.g. Jr., III" />
                                    </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Birth date <span className="text-red-500">*</span></label>
                                    <input type="date" {...register('birthDate')} className={`w-full px-3 py-2 bg-white border border-gray-300 ${errors.birthDate ? 'border-red-500' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`} />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Place of birth <span className="text-red-500">*</span></label>
                                    <input type="text" {...register('birthPlace')} className={`w-full px-3 py-2 bg-white border border-gray-300 ${errors.birthPlace ? 'border-red-500' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`} placeholder="City/municipality, province" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-6 gap-y-4 gap-x-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Gender <span className="text-red-500">*</span></label>
                                    <select {...register('sex')} className={`w-full px-3 py-2 bg-white border ${errors.sex ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`}>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Civil status <span className="text-red-500">*</span></label>
                                    <select {...register('civilStatus')} className={`w-full px-3 py-2 bg-white border ${errors.civilStatus ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`}>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Widowed">Widowed</option>
                                        <option value="Separated">Separated</option>
                                        <option value="Annulled">Annulled</option>
                                    </select>
                                </div>
                                
                                {/* Adjustable Height */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Height (m)</label>
                                    <div className="relative flex items-center group">
                                        <button 
                                            type="button"
                                            onClick={() => setValue('height', Math.max(0, (Number(watch('height')) || 0) - 0.01).toFixed(2))}
                                            className="absolute left-1 p-1.5 hover:bg-slate-50 rounded-md text-slate-400 hover:text-green-600 transition-all"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <input 
                                            type="text" 
                                            {...register('height')} 
                                            className="w-full px-8 py-2 bg-white border border-gray-300 rounded-md outline-none font-bold text-sm text-slate-700 text-center" 
                                            placeholder="0.00"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setValue('height', ((Number(watch('height')) || 0) + 0.01).toFixed(2))}
                                            className="absolute right-1 p-1.5 hover:bg-slate-50 rounded-md text-slate-400 hover:text-green-600 transition-all"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Adjustable Weight */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Weight (kg)</label>
                                    <div className="relative flex items-center group">
                                        <button 
                                            type="button"
                                            onClick={() => setValue('weight', Math.max(0, (Number(watch('weight')) || 0) - 1))}
                                            className="absolute left-1 p-1.5 hover:bg-slate-50 rounded-md text-slate-400 hover:text-green-600 transition-all"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <input 
                                            type="text" 
                                            {...register('weight')} 
                                            className="w-full px-8 py-2 bg-white border border-gray-300 rounded-md outline-none font-bold text-sm text-slate-700 text-center" 
                                            placeholder="0"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setValue('weight', (Number(watch('weight')) || 0) + 1)}
                                            className="absolute right-1 p-1.5 hover:bg-slate-50 rounded-md text-slate-400 hover:text-green-600 transition-all"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Blood type</label>
                                    <select {...register('bloodType')} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md outline-none font-medium text-sm text-slate-700">
                                        <option value="none">Select Type</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Nationality</label>
                                    <input 
                                        type="text" 
                                        {...register('nationality')} 
                                        className={`w-full px-3 py-2 bg-white border border-gray-300 ${errors.nationality ? 'border-red-500' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`} 
                                        placeholder="Filipino" 
                                    />
                                    {errors.nationality && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.nationality.message as string}</p>}
                                </div>
                            </div>
                        </FormSection>

                        {/* Residency & Contact Section - Synced with Registration */}
                        <FormSection 
                            title="Residency & Contact" 
                            subtitle="Contact and address info" 
                            action={
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-lg border border-gray-100 text-slate-500 cursor-pointer rounded-sm">
                                    <span className="text-[11px] font-bold tracking-tight">Contact Info</span>
                                    <Mail size={14} className="opacity-50" />
                                </div>
                            }
                        >
                            <div className="bg-gray-50/50 p-4 border border-gray-300 rounded-md mb-2">
                                <label className="text-[11px] font-bold text-slate-500 block mb-3 ml-0.5 uppercase tracking-wider">Are you a resident of Meycauayan?</label>
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2.5 text-sm font-bold text-slate-700 cursor-pointer group">
                                        <input 
                                            type="radio" 
                                            checked={isMeycauayanResident === true}
                                            onChange={() => setValue('isMeycauayanResident', true)}
                                            className="w-4 h-4 accent-green-600 cursor-pointer" 
                                        /> 
                                        <span className="group-hover:text-green-600 transition-colors">Yes, I am a resident</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 text-sm font-bold text-slate-700 cursor-pointer group">
                                        <input 
                                            type="radio" 
                                            checked={isMeycauayanResident === false}
                                            onChange={() => setValue('isMeycauayanResident', false)}
                                            className="w-4 h-4 accent-green-600 cursor-pointer" 
                                        /> 
                                        <span className="group-hover:text-green-600 transition-colors">No, I am from elsewhere</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-4 ml-0.5">Residential Address</h4>
                                    <PhilippineAddressSelector 
                                        prefix="res"
                                        register={register}
                                        watch={watch}
                                        setValue={setValue}
                                        errors={errors}
                                        isMeycauayanOnly={isMeycauayanResident}
                                        inputClass="w-full px-3 py-2 bg-white border border-gray-300 border-gray-200 rounded-md outline-none font-medium text-sm text-slate-700"
                                    />
                                </div>

                                <div className="pt-6 border-t border-gray-50">
                                    <h4 className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-4 ml-0.5">Permanent Address</h4>
                                    <PhilippineAddressSelector 
                                        prefix="perm"
                                        register={register}
                                        watch={watch}
                                        setValue={setValue}
                                        errors={errors}
                                        inputClass="w-full px-3 py-2 bg-white border border-gray-300 border-gray-200 rounded-md outline-none font-medium text-sm text-slate-700"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Email address <span className="text-red-500">*</span></label>
                                    <input type="email" {...register('email')} className={`w-full px-3 py-2 bg-white border border-gray-300 ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`} placeholder="email@address.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Contact number <span className="text-red-500">*</span></label>
                                    <input type="text" {...register('phoneNumber')} className={`w-full px-3 py-2 bg-white border border-gray-300 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`} placeholder="+63 9XX XXX XXXX" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 mt-6 border-t border-gray-100">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5 uppercase tracking-widest text-green-700">Emergency Contact Person <span className="text-red-500">*</span></label>
                                    <input type="text" {...register('emergencyContact')} className={`w-full px-3 py-2 bg-white border border-gray-300 ${errors.emergencyContact ? 'border-red-500' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`} placeholder="Full Name" />
                                    {errors.emergencyContact && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.emergencyContact.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5 uppercase tracking-widest text-green-700">Emergency Contact No. <span className="text-red-500">*</span></label>
                                    <input type="text" {...register('emergencyContactNumber')} className={`w-full px-3 py-2 bg-white border border-gray-300 ${errors.emergencyContactNumber ? 'border-red-500' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`} placeholder="+63 9XX XXX XXXX" />
                                    {errors.emergencyContactNumber && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.emergencyContactNumber.message}</p>}
                                </div>
                            </div>
                        </FormSection>

                        {/* Government Identification Section */}
                        <FormSection 
                            title={<span>Government Records {requireIds && <span className="text-red-500 ml-1.5">*</span>}</span>} 
                            subtitle="Your identification details" 
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">GSIS Number {requireIds && <span className="text-red-500 ml-1">*</span>}</label>
                                    <input type="text" {...register('gsisNumber')} className={`w-full px-3 py-2 bg-white border ${errors.gsisNumber ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`} placeholder={requireIds ? "Required" : "Optional"} />
                                    {errors.gsisNumber && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.gsisNumber.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Pag-IBIG Number {requireIds && <span className="text-red-500 ml-1">*</span>}</label>
                                    <input type="text" {...register('pagibigNumber')} className={`w-full px-3 py-2 bg-white border ${errors.pagibigNumber ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`} placeholder={requireIds ? "Required" : "Optional"} />
                                    {errors.pagibigNumber && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.pagibigNumber.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">PhilHealth Number {requireIds && <span className="text-red-500 ml-1">*</span>}</label>
                                    <input type="text" {...register('philhealthNumber')} className={`w-full px-3 py-2 bg-white border ${errors.philhealthNumber ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`} placeholder={requireIds ? "Required" : "Optional"} />
                                    {errors.philhealthNumber && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.philhealthNumber.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">UMID Number {requireIds && <span className="text-red-500 ml-1">*</span>}</label>
                                    <input type="text" {...register('umidNumber')} className={`w-full px-3 py-2 bg-white border ${errors.umidNumber ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`} placeholder={requireIds ? "Required" : "Optional"} />
                                    {errors.umidNumber && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.umidNumber.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">PhilSys ID (National ID) {requireIds && <span className="text-red-500 ml-1">*</span>}</label>
                                    <input type="text" {...register('philsysId')} className={`w-full px-3 py-2 bg-white border ${errors.philsysId ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`} placeholder={requireIds ? "Required" : "Optional"} />
                                    {errors.philsysId && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.philsysId.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">TIN Number {requireIds && <span className="text-red-500 ml-1">*</span>}</label>
                                    <input type="text" {...register('tinNumber')} className={`w-full px-3 py-2 bg-white border ${errors.tinNumber ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`} placeholder={requireIds ? "Required" : "Optional"} />
                                    {errors.tinNumber && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.tinNumber.message}</p>}
                                </div>
                            </div>
                        </FormSection>

                        {/* Educational Background Section - Matches Registration Form Design */}
                        <FormSection 
                            title="Educational Background" 
                            subtitle="Your academic qualifications" 
                        >
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Highest Degree/Level Attained {requireEdu && <span className="text-red-500">*</span>}</label>
                                    <select 
                                        {...register('educationalBackground')} 
                                        className={`w-full px-3 py-2 bg-white border border-gray-300 ${errors.educationalBackground ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`}
                                    >
                                        <option value="">Select highest education attained</option>
                                        {EDUCATION_LEVELS.map((level) => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                    {errors.educationalBackground && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.educationalBackground.message}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">School / University Name {requireEdu && <span className="text-red-500">*</span>}</label>
                                        <input 
                                            {...register('schoolName')} 
                                            className={`w-full px-3 py-2 bg-white border border-gray-300 ${errors.schoolName ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`}
                                            placeholder="e.g. Bulacan State University"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Year Graduated {requireEdu && <span className="text-red-500">*</span>}</label>
                                        <input 
                                            {...register('yearGraduated')} 
                                            className={`w-full px-3 py-2 bg-white border border-gray-300 ${errors.yearGraduated ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`}
                                            placeholder="e.g. 2020"
                                        />
                                    </div>
                                </div>

                                {watch('educationalBackground') && !["Elementary School Graduate", "High School Graduate", "Senior High School Graduate"].includes(watch('educationalBackground') || "") && (
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Course / Degree {requireEdu && <span className="text-red-500">*</span>}</label>
                                        <input 
                                            {...register('course')} 
                                            className={`w-full px-3 py-2 bg-white border border-gray-300 ${errors.course ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`}
                                            placeholder="e.g. BS in Information Technology"
                                        />
                                    </div>
                                )}
                            </div>
                        </FormSection>

                        {/* Professional Qualifications Section */}
                        <FormSection 
                            title="Professional Qualifications" 
                            subtitle="Your eligibility and experience" 
                        >
                            <div className="grid grid-cols-1 gap-8">
                                <div className="p-8 bg-gray-50/50 rounded-md border border-gray-300">
                                    <h4 className="text-[11px] font-bold text-slate-500 tracking-widest mb-6 uppercase flex items-center justify-between">
                                        Eligibility & Certifications (CSC, Board, NBI, etc.) 
                                        {requireCsc && <span className="text-red-500 font-black px-2 py-0.5 bg-red-50 rounded-md border border-red-100">* REQUIRED</span>}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-500 tracking-tight">Eligibility Name / Title {requireCsc && <span className="text-red-500 ml-1">*</span>}</label>
                                            <input type="text" {...register('eligibility')} className="w-full px-3 py-2 bg-white border border-gray-300 border-gray-200 rounded-lg focus:border-green-600 outline-none text-sm font-medium text-slate-700 placeholder:text-slate-300 shadow-sm" placeholder="e.g. CSR Prof, CPA, Driver's License" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-500 tracking-tight">Eligibility Category {requireCsc && <span className="text-red-500 ml-1">*</span>}</label>
                                            <select {...register('eligibilityType')} className="w-full px-3 py-2 bg-white border border-gray-300 border-gray-200 rounded-lg focus:border-green-600 outline-none text-sm font-medium text-slate-700 shadow-sm">
                                                <option value="none">Not Applicable / None</option>
                                                <optgroup label="Government (CSC/RA)">
                                                    <option value="csc_prof">Career Service (Professional)</option>
                                                    <option value="csc_sub">Career Service (Sub-Professional)</option>
                                                    <option value="ra_1080">Board / Bar (RA 1080)</option>
                                                    <option value="special_laws">Special Laws (CES/CSEE)</option>
                                                </optgroup>
                                                <optgroup label="Licenses & Clearances">
                                                    <option value="drivers_license">Driver's License</option>
                                                    <option value="tesda">Skill / TESDA Certificate</option>
                                                    <option value="nbi_clearance">NBI Clearance</option>
                                                    <option value="others">Other Eligibility / Certification</option>
                                                </optgroup>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-500 tracking-tight">Rating (If Applicable)</label>
                                            <input type="text" {...register('eligibilityRating')} className="w-full px-3 py-2 bg-white border border-gray-300 border-gray-200 rounded-lg focus:border-green-600 outline-none text-sm font-medium text-slate-700 placeholder:text-slate-300 shadow-sm" placeholder="e.g. 85.50%" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-500 tracking-tight">Date of Release / Validity {requireCsc && <span className="text-red-500 ml-1">*</span>}</label>
                                            <input type="date" {...register('eligibilityDate')} className="w-full px-3 py-2 bg-white border border-gray-300 border-gray-200 rounded-lg focus:border-green-600 outline-none text-sm font-medium text-slate-700 shadow-sm" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-500 tracking-tight">Place of Examination / Issue {requireCsc && <span className="text-red-500 ml-1">*</span>}</label>
                                            <input type="text" {...register('eligibilityPlace')} className="w-full px-3 py-2 bg-white border border-gray-300 border-gray-200 rounded-lg focus:border-green-600 outline-none text-sm font-medium text-slate-700 placeholder:text-slate-300 shadow-sm" placeholder="City or Region" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-500 tracking-tight">License / ID Number {requireCsc && <span className="text-red-500 ml-1">*</span>}</label>
                                            <input type="text" {...register('licenseNo')} className="w-full px-3 py-2 bg-white border border-gray-300 border-gray-200 rounded-lg focus:border-green-600 outline-none text-sm font-medium text-slate-700 placeholder:text-slate-300 shadow-sm" placeholder="ID or License Number" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Work Experience Log {requireExp && <span className="text-red-500">*</span>}</label>
                                    <textarea {...register('experience')} rows={3} className={`w-full px-3 py-2 bg-white border border-gray-300 ${errors.experience ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`} placeholder={requireExp ? "List roles and responsibilities... (Required)" : "List roles and responsibilities..."} />
                                    {errors.experience && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.experience.message}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Core Competencies {requireExp && <span className="text-red-500">*</span>}</label>
                                        <textarea {...register('skills')} rows={2} className={`w-full px-3 py-2 bg-white border border-gray-300 ${errors.skills ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`} placeholder={requireExp ? "List key skills... (Required)" : "List key skills..."} />
                                        {errors.skills && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.skills.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Total Exp. (Years) {requireExp && <span className="text-red-500">*</span>}</label>
                                        <input type="number" step="0.1" min="0" {...register('totalExperienceYears')} className={`w-full px-3 py-2 bg-white border border-gray-300 ${errors.totalExperienceYears ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`} placeholder="Value" />
                                        {errors.totalExperienceYears && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.totalExperienceYears.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Total Training (Hrs) {requireTraining && <span className="text-red-500">*</span>}</label>
                                        <input type="number" step="1" min="0" {...register('totalTrainingHours')} className={`w-full px-3 py-2 bg-white border border-gray-300 ${errors.totalTrainingHours ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-md outline-none font-medium text-sm text-slate-700`} placeholder="Hours" />
                                        {errors.totalTrainingHours && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.totalTrainingHours.message}</p>}
                                    </div>
                                </div>
                            </div>
                        </FormSection>

                        {/* Documentation Section */}
                        <FormSection 
                            title="Resume and Files" 
                            subtitle="Upload your documents" 
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Photo Upload */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">2x2 ID Photo <span className="text-red-500">*</span></label>
                                    <div className="border border-gray-200 rounded-md p-6 text-center bg-gray-50/30 cursor-pointer relative overflow-hidden group h-full">
                                        <input type="file" accept=".jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const isValid = await verifyFileHeader(file);
                                                if (!isValid) {
                                                    showToast("Invalid photo integrity. Please upload a real image.", "error");
                                                    e.target.value = '';
                                                    return;
                                                }
                                                setValue('photo', file);
                                            }
                                        }} />
                                        <div className="flex flex-col items-center justify-center gap-3 h-full">
                                            <div className="w-10 h-10 bg-white rounded-lg border border-gray-100 flex items-center justify-center shadow-sm group-hover:bg-green-600 transition-colors">
                                                <UserSquare2 size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                                            </div>
                                            <div>
                                                <p className="text-slate-900 font-bold text-[11px] truncate max-w-[150px]">{watch('photo') ? (watch('photo') as File).name : "Upload Photo"}</p>
                                                <p className="text-red-500 text-[9px] font-bold tracking-widest mt-1 uppercase">Required JPG/PNG</p>
                                            </div>
                                        </div>
                                    </div>
                                    {errors.photo && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.photo.message || "Photo is required"}</p>}
                                </div>

                                {/* Resume Upload */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Resume / CV <span className="text-red-500">*</span></label>
                                    <div className="border border-gray-200 rounded-md p-6 text-center bg-gray-50/30 cursor-pointer relative overflow-hidden group h-full">
                                        <input type="file" accept=".pdf,.doc,.docx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const isValid = await verifyFileHeader(file);
                                                if (!isValid) {
                                                    showToast("Invalid file integrity. Please upload a real PDF or Word document.", "error");
                                                    e.target.value = '';
                                                    return;
                                                }
                                                setValue('resume', file);
                                            }
                                        }} />
                                        <div className="flex flex-col items-center justify-center gap-3 h-full">
                                            <div className="w-10 h-10 bg-white rounded-lg border border-gray-100 flex items-center justify-center shadow-sm group-hover:bg-green-600 transition-colors">
                                                <Briefcase size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                                            </div>
                                            <div>
                                                <p className="text-slate-900 font-bold text-[11px] truncate max-w-[150px]">{watch('resume') ? (watch('resume') as File).name : "Select Resume"}</p>
                                                <p className="text-red-500 text-[9px] font-bold tracking-widest mt-1 uppercase">Required PDF/DOCX</p>
                                            </div>
                                        </div>
                                    </div>
                                    {errors.resume && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">Resume is required</p>}
                                </div>

                                {/* Eligibility Certificate */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 tracking-tight ml-0.5">Eligibility Cert.</label>
                                    <div className="border border-gray-200 rounded-md p-6 text-center bg-gray-50/30 cursor-pointer relative overflow-hidden group h-full">
                                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setValue('eligibilityCert', file);
                                            }
                                        }} />
                                        <div className="flex flex-col items-center justify-center gap-3 h-full">
                                            <div className="w-10 h-10 bg-white rounded-lg border border-gray-100 flex items-center justify-center shadow-sm group-hover:bg-green-600 transition-colors">
                                                <ShieldCheck size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                                            </div>
                                            <div>
                                                <p className="text-slate-900 font-bold text-[11px] truncate max-w-[150px]">{watch('eligibilityCert') ? (watch('eligibilityCert') as File).name : "Select Cert"}</p>
                                                <p className={`text-[9px] font-bold tracking-widest mt-1 uppercase ${requireCsc ? 'text-red-500' : 'text-slate-400'}`}>{requireCsc ? 'Required PDF' : 'Optional'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {errors.eligibilityCert && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.eligibilityCert.message as string}</p>}
                                </div>
                            </div>
                        </FormSection>

                        {/* Submission Protocol Footer */}
                        <div className="mt-4 px-6 py-10 bg-gray-50/30 border-t border-gray-100">
                            <div className="flex flex-col gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <ShieldCheck size={14} className="text-green-600" />
                                        <span className="text-[11px] font-bold text-slate-950 tracking-tight">Final verification</span>
                                    </div>
                                    <p className="text-[11px] font-semibold text-slate-500 leading-relaxed max-w-xl">
                                        By sliding the verification toggle, I certify that all information provided is accurate and I authorize the Human Resource Management Office to verify my credentials.
                                    </p>
                                </div>
                                <div className="w-full">
                                    <SlideToApply onVerify={() => setIsVerified(true)} isVerified={isVerified} />
                                </div>
                            </div>
                            
                            <div className="mt-10 pt-10 border-t border-gray-200/50 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tracking-widest">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        Transmission encryption active
                                    </div>
                                </div>
    
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting || mutation.isPending}
                                    className={`w-full md:w-auto px-12 py-3 rounded-xl font-bold text-sm tracking-tight transition-all flex items-center justify-center gap-3 active:scale-95 border border-gray-300 shadow-sm ${
                                        isVerified 
                                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-900/10 cursor-pointer' 
                                            : 'bg-gray-200 text-slate-500 cursor-not-allowed shadow-none'
                                    }`}
                                >
                                    {(isSubmitting || mutation.isPending) ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Encrypting...
                                        </>
                                    ) : (
                                        <>
                                            Submit application
                                            <Send size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default JobDetail;
