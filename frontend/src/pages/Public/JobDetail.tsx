import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShieldCheck, Download,
  Briefcase, Send, FileText, CheckCircle2, Upload, MapPin
} from 'lucide-react';
import { useToastStore } from '@/stores';
import PublicLayout from '@components/Public/PublicLayout';
import SEO from "@/components/Global/SEO";
import { jobApplicationSchema, JobApplicationSchema } from '@/schemas/recruitment';
import { usePublicJobDetail, useJobApplication } from '@/features/Recruitment/hooks/usePublicJobs';

const JobDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const showToast = useToastStore((state) => state.showToast);

    // UI State
    const [success, setSuccess] = useState(false);
    const [resumeName, setResumeName] = useState<string | null>(null);
    const [photoName, setPhotoName] = useState<string | null>(null);
    const [eligibilityName, setEligibilityName] = useState<string | null>(null);

    // Fetch Job
    const { data: job, isLoading, error } = usePublicJobDetail(id);

    // Simplified Form Logic
    const { 
        register, 
        handleSubmit, 
        setValue, 
        trigger,
        formState: { errors, isSubmitting: isFormLoading } 
    } = useForm<Partial<JobApplicationSchema>>({
        resolver: zodResolver(jobApplicationSchema) as any,
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            hToken: `v-${Math.random().toString(36).substring(2, 10)}`,
            hpField: '',
            websiteUrl: '',
            jobId: id,
            dutyType: 'Standard',
            isMeycauayanResident: false,
            phoneNumber: ''
        }
    });

    const mutation = useJobApplication(
        (response: any) => {
            const data = response.data;
            if (data?.requiresVerification) {
                navigate('/verify-applicant', { 
                    state: { 
                        email: data.email, 
                        applicantId: data.applicantId 
                    } 
                });
            } else {
                setSuccess(true);
                window.scrollTo(0, 0);
            }
        },
        (err: any) => {
            const serverMsg = err.response?.data?.message || "Failed to submit application.";
            showToast(serverMsg, "error");
        }
    );

    const onSubmit = (data: any) => {
        if (!id) return;
        mutation.mutate({ id, data });
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Recently';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    if (isLoading) return (
        <div className="min-h-[80vh] flex items-center justify-center bg-slate-50">
            <div className="animate-spin w-8 h-8 border-[3px] border-slate-200 border-t-green-600 rounded-full font-sans"></div>
        </div>
    );

    if (error || !job) return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans">
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Unavailable</h2>
            <p className="text-slate-500 mb-8 font-semibold text-sm">This job record has been archived or is no longer accepting submissions.</p>
            <button onClick={() => navigate('/careers/jobs')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs tracking-widest hover:bg-black transition-all active:scale-95 shadow-sm uppercase">
                Back to Listings
            </button>
        </div>
    );

    return (
        <PublicLayout>
            <SEO title={`${job.title} - Career Opportunity`} description={job.jobDescription} />
            
            <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 pt-10 sm:pt-16 relative overflow-hidden">
                {/* Decorative Elements matching Master Balance */}
                <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block opacity-[0.03] pointer-events-none bg-gradient-to-l from-slate-200 to-transparent"></div>
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none"></div>
                
                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    
                    {/* Header Section */}
                    <button 
                        onClick={() => navigate('/careers/jobs')} 
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-green-600 hover:border-green-200 transition-all mb-12 group rounded-xl shadow-sm hover:shadow active:scale-95 w-fit"
                    >
                        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                        Back to Portal
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-16">
                        
                        {/* Job Details Column */}
                        <div className="lg:col-span-3 space-y-12">
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-green-50/80 text-green-600 border border-green-100 rounded-lg text-[10px] font-extrabold uppercase tracking-widest mb-6 shadow-sm">
                                    {job.department}
                                </span>
                                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.9]">
                                    {job.title}
                                </h1>
                                
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-widest rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                                        <Briefcase size={14} className="text-slate-400" />
                                        {job.employmentType}
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-widest rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                                        <MapPin size={14} className="text-slate-400" />
                                        {job.location}
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-widest rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                                        <Send size={14} className="text-slate-400" />
                                        Posted {formatDate(job.createdAt)}
                                    </div>
                                </div>
                            </motion.div>

                            <hr className="border-slate-200/60" />

                            <div className="space-y-16">
                                <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className="max-w-3xl">
                                    <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-3">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                        Description
                                    </h3>
                                    <div className="text-sm md:text-[15px] text-slate-600 font-semibold leading-loose whitespace-pre-wrap">
                                        {job.jobDescription}
                                    </div>
                                </motion.section>

                                <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }} className="max-w-3xl">
                                    <h3 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-widest flex items-center gap-3">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                        Qualifications
                                    </h3>
                                    
                                    {(job.education || job.experience || job.training || job.eligibility || job.otherQualifications) ? (
                                        <div className="space-y-4">
                                            {job.education && (
                                                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] hover:border-green-200 transition-all duration-300 group">
                                                    <div className="text-[10px] font-black text-slate-400 group-hover:text-green-600 uppercase tracking-[0.2em] mb-2 transition-colors">Education</div>
                                                    <div className="text-sm md:text-base font-bold text-slate-800 leading-tight">{job.education}</div>
                                                </div>
                                            )}
                                            {job.experience && (
                                                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] hover:border-green-200 transition-all duration-300 group">
                                                    <div className="text-[10px] font-black text-slate-400 group-hover:text-green-600 uppercase tracking-[0.2em] mb-2 transition-colors">Experience</div>
                                                    <div className="text-sm md:text-base font-bold text-slate-800 leading-tight">{job.experience}</div>
                                                </div>
                                            )}
                                            {job.training && (
                                                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] hover:border-green-200 transition-all duration-300 group">
                                                    <div className="text-[10px] font-black text-slate-400 group-hover:text-green-600 uppercase tracking-[0.2em] mb-2 transition-colors">Training</div>
                                                    <div className="text-sm md:text-base font-bold text-slate-800 leading-tight">{job.training}</div>
                                                </div>
                                            )}
                                            {job.eligibility && (
                                                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] hover:border-green-200 transition-all duration-300 group">
                                                    <div className="text-[10px] font-black text-slate-400 group-hover:text-green-600 uppercase tracking-[0.2em] mb-2 transition-colors">Eligibility</div>
                                                    <div className="text-sm md:text-base font-bold text-slate-800 leading-tight">{job.eligibility}</div>
                                                </div>
                                            )}
                                            {job.otherQualifications && (
                                                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] hover:border-green-200 transition-all duration-300 group">
                                                    <div className="text-[10px] font-black text-slate-400 group-hover:text-green-600 uppercase tracking-[0.2em] mb-2 transition-colors">Other Qualifications</div>
                                                    <div className="text-sm md:text-base font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">{job.otherQualifications}</div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-sm md:text-[15px] text-slate-600 font-semibold leading-loose whitespace-pre-wrap">
                                            {job.requirements || 'Standard LGU hiring qualifications apply. No special qualifications declared.'}
                                        </div>
                                    )}
                                </motion.section>
                            </div>
                        </div>

                        {/* Quick Actions / Download Sidebar */}
                        <div className="lg:col-span-1">
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="sticky top-28 space-y-6">
                                {job.attachmentPath && (
                                    <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/40 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-green-500/10 transition-colors duration-500 pointer-events-none"></div>
                                        <div className="relative z-10">
                                            <div className="p-4 bg-slate-50 border border-slate-100 text-slate-600 rounded-2xl w-fit mb-6 shadow-sm group-hover:bg-green-50 group-hover:text-green-600 group-hover:border-green-100 transition-colors">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-1.5">Reference Docs</h4>
                                                <p className="text-[11px] text-slate-500 font-bold leading-relaxed">Official qualification matrix for this position.</p>
                                            </div>
                                        </div>
                                        <a 
                                            href={job.attachmentPath} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="relative z-10 flex items-center justify-center gap-2.5 w-full py-3.5 bg-slate-900 text-white text-[11px] font-black rounded-xl hover:bg-black transition-all shadow-lg active:scale-95 uppercase tracking-widest border border-slate-800"
                                        >
                                            <Download size={14} /> Download
                                        </a>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>

                    <hr className="border-slate-200/60 my-24" />

                    {/* Simplified Application Section */}
                    <div className="max-w-4xl mx-auto">
                        <AnimatePresence mode="wait">
                            {success ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className="bg-white border border-slate-200 shadow-2xl shadow-slate-200/50 rounded-[3rem] p-12 md:p-16 text-center space-y-8 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                    <div className="w-24 h-24 bg-green-50 text-green-600 border border-green-100 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm relative z-10">
                                        <CheckCircle2 size={40} className="animate-bounce" style={{ animationDuration: '3s' }} />
                                    </div>
                                    <div className="space-y-4 relative z-10">
                                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Transmission Complete</h2>
                                        <p className="text-slate-600 font-semibold text-base max-w-sm mx-auto">Your application package has been securely queued for HR verification.</p>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/careers/jobs')}
                                        className="relative z-10 px-10 py-4 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg active:scale-95 border border-slate-800 mt-4 mx-auto block"
                                    >
                                        Return to Portal
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.6 }}
                                    className="space-y-12 md:space-y-16"
                                >
                                    <div className="text-center space-y-4">
                                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">Submit Credentials</h2>
                                        <p className="text-[10px] font-black text-green-600 border border-green-200 bg-green-50 px-4 py-1.5 rounded-full inline-block uppercase tracking-[0.4em] shadow-sm">Official Registry Entry</p>
                                    </div>

                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white border border-gray-100 shadow-xl p-6 md:p-8 rounded-2xl relative overflow-hidden">
                                        
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 relative z-10">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">First Name <span className="text-red-500">*</span></label>
                                                <input 
                                                    {...register('firstName')}
                                                    className={`w-full border ${errors.firstName ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-400'} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
                                                    placeholder="e.g. Juan"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Last Name <span className="text-red-500">*</span></label>
                                                <input 
                                                    {...register('lastName')}
                                                    className={`w-full border ${errors.lastName ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-400'} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
                                                    placeholder="e.g. Dela Cruz"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 relative z-10">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Contact Email <span className="text-red-500">*</span></label>
                                                <input 
                                                    {...register('email')}
                                                    className={`w-full border ${errors.email ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-400'} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
                                                    placeholder="juan.delacruz@email.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Contact Number <span className="text-red-500">*</span></label>
                                                <input 
                                                    {...register('phoneNumber')}
                                                    className={`w-full border ${errors.phoneNumber ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-400'} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
                                                    placeholder="0917 123 4567"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            {/* Resume / PDS */}
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Application Form / Resume <span className="text-red-500">*</span></label>
                                                
                                                <div className="relative group">
                                                    <input 
                                                        type="file"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                setValue('resume', file);
                                                                setResumeName(file.name);
                                                                trigger('resume');
                                                            }
                                                        }}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    />
                                                    <div className={`w-full border ${resumeName ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'} rounded-lg px-4 py-3 text-sm flex items-center justify-center gap-2 transition-all ${resumeName ? 'text-blue-600' : 'text-gray-500'} font-semibold shadow-sm`}>
                                                        <Upload size={16} />
                                                        <span>{resumeName || 'Choose File...'}</span>
                                                    </div>
                                                </div>
                                                {errors.resume && <p className="text-[10px] font-bold text-red-500 mt-1.5 ml-1 uppercase">{errors.resume.message as string}</p>}
                                            </div>

                                            {/* Photo */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                                <div className="space-y-2">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">2x2 ID Picture</label>
                                                    
                                                    <div className="relative group">
                                                        <input 
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    setValue('photo', file);
                                                                    setPhotoName(file.name);
                                                                    trigger('photo');
                                                                }
                                                            }}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        />
                                                        <div className={`w-full border ${photoName ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'} rounded-lg px-4 py-3 text-sm flex items-center justify-center gap-2 transition-all ${photoName ? 'text-blue-600' : 'text-gray-500'} font-semibold shadow-sm`}>
                                                            <Upload size={16} />
                                                            <span className="truncate max-w-[150px]">{photoName || 'Choose Image...'}</span>
                                                        </div>
                                                    </div>
                                                    {errors.photo && <p className="text-[10px] font-bold text-red-500 mt-1.5 ml-1 uppercase">{errors.photo.message as string}</p>}
                                                </div>

                                                {/* Eligibility */}
                                                <div className="space-y-2">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Eligibility Certificate</label>
                                                    
                                                    <div className="relative group">
                                                        <input 
                                                            type="file"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    setValue('eligibilityCert', file);
                                                                    setEligibilityName(file.name);
                                                                    trigger('eligibilityCert');
                                                                }
                                                            }}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        />
                                                        <div className={`w-full border ${eligibilityName ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'} rounded-lg px-4 py-3 text-sm flex items-center justify-center gap-2 transition-all ${eligibilityName ? 'text-blue-600' : 'text-gray-500'} font-semibold shadow-sm`}>
                                                            <Upload size={16} />
                                                            <span className="truncate max-w-[150px]">{eligibilityName || 'Choose File...'}</span>
                                                        </div>
                                                    </div>
                                                    {errors.eligibilityCert && <p className="text-[10px] font-bold text-red-500 mt-1.5 ml-1 uppercase">{errors.eligibilityCert.message as string}</p>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 relative z-10">
                                            <div className="flex items-center gap-2 opacity-70">
                                                <ShieldCheck size={14} className="text-gray-500" />
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Protocol Encrypted End-to-End</p>
                                            </div>
                                            
                                            <button 
                                                type="submit"
                                                disabled={mutation.isPending || isFormLoading || !resumeName}
                                                className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 text-white rounded-lg font-bold text-sm tracking-wide hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
                                            >
                                                {mutation.isPending || isFormLoading ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Syncing...
                                                    </>
                                                ) : (
                                                    'Commit Application'
                                                )}
                                            </button>
                                        </div>

                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default JobDetail;
