import React, { useState, useEffect } from 'react';
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
import PersonalInfoSection from './JobApplicationForm/sections/PersonalInfoSection';
import ContactSection from './JobApplicationForm/sections/ContactSection';
import AddressSection from './JobApplicationForm/sections/AddressSection';
import GovernmentIDSection from './JobApplicationForm/sections/GovernmentIDSection';
import EducationSection from './JobApplicationForm/sections/EducationSection';
import ExperienceSection from './JobApplicationForm/sections/ExperienceSection';
import EligibilitySection from './JobApplicationForm/sections/EligibilitySection';
import TrainingSection from './JobApplicationForm/sections/TrainingSection';
import FileUploadSection from './JobApplicationForm/sections/FileUploadSection';
import ReviewSection from './JobApplicationForm/sections/ReviewSection';

const JobDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const showToast = useToastStore((state) => state.showToast);

    // UI State
    const [success, setSuccess] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Fetch Job
    const { data: job, isLoading, error } = usePublicJobDetail(id);

    // Form Logic with Complete PDS Fields
    const {
        register,
        handleSubmit,
        setValue,
        trigger,
        control,
        watch,
        formState: { errors, isSubmitting: isFormLoading }
    } = useForm<Partial<JobApplicationSchema>>({
        resolver: zodResolver(jobApplicationSchema) as any,
        defaultValues: {
            // Basic Info
            firstName: '', lastName: '', middleName: '', suffix: '',
            email: '', phoneNumber: '', telephoneNumber: '',
            hToken: `v-${Math.random().toString(36).substring(2, 10)}`,
            hpField: '', websiteUrl: '',
            jobId: id,
            dutyType: job?.dutyType || 'Standard',
            isMeycauayanResident: false,

            // Personal Info
            birthDate: '',
            birthPlace: '',
            sex: '' as 'Male' | 'Female',
            civilStatus: '' as 'Single' | 'Married' | 'Widowed' | 'Separated' | 'Annulled',
            height: '', weight: '', bloodType: '',
            nationality: 'Filipino',
            citizenshipType: '',
            dualCountry: '',

            // Address
            resRegion: '', resProvince: '', resCity: '', resBarangay: '',
            resStreet: '', resHouseBlockLot: '', resSubdivision: '', zipCode: '',
            permRegion: '', permProvince: '', permCity: '', permBarangay: '',
            permStreet: '', permHouseBlockLot: '', permSubdivision: '', permanentZipCode: '',

            // Emergency Contact
            emergencyContact: '',
            emergencyContactNumber: '',

            // Government IDs
            gsisNumber: '', pagibigNumber: '', philhealthNumber: '',
            umidNumber: '', philsysId: '', tinNumber: '',
            agencyEmployeeNo: '',
            govtIdType: '', govtIdNo: '', govtIdIssuance: '',

            // Social Links
            facebookUrl: '', linkedinUrl: '', twitterHandle: '',

            // Education
            education: {
                Elementary: { school: '', course: '', from: '', to: '', units: '', yearGrad: '', honors: '' },
                Secondary: { school: '', course: '', from: '', to: '', units: '', yearGrad: '', honors: '' },
                Vocational: { school: '', course: '', from: '', to: '', units: '', yearGrad: '', honors: '' },
                College: { school: '', course: '', from: '', to: '', units: '', yearGrad: '', honors: '' },
                Graduate: { school: '', course: '', from: '', to: '', units: '', yearGrad: '', honors: '' }
            },

            // Arrays
            eligibilities: [],
            workExperiences: [],
            trainings: [],

            // Skills
            skills: '',
            totalExperienceYears: 0,
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
            console.error('[JobDetail] Application submission failed:', err);

            const errorData = err.response?.data;

            if (errorData?.errors && typeof errorData.errors === 'object') {
                // Show validation errors
                const fieldErrors = errorData.errors;
                const errorCount = Object.keys(fieldErrors).length;

                showToast(
                    errorData.hint || `${errorCount} field(s) need attention. Please review the form.`,
                    'error'
                );

                // Log individual field errors to console for debugging
                console.table(fieldErrors);

                // Scroll to first error field
                const firstErrorField = Object.keys(fieldErrors)[0];
                if (firstErrorField) {
                    const element = document.querySelector(`[name="${firstErrorField}"]`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

            } else if (err.response?.status === 409) {
                showToast(errorData?.message || 'Duplicate application detected.', 'error');

            } else if (err.response?.status === 400) {
                showToast(errorData?.message || 'Invalid application data. Please review your entries.', 'error');

            } else {
                showToast('Submission failed. Please check your internet connection and try again.', 'error');
            }
        }
    );

    const onSubmit = async (data: any) => {
        if (!id) return;

        console.log('=== FORM SUBMISSION DEBUG ===');
        console.log('1. Raw form data:', data);
        console.log('2. Job duty type:', job?.dutyType);

        // Comprehensive validation diagnostics
        const missingFields: string[] = [];
        const validationIssues: Record<string, string> = {};

        // Check required personal info
        if (!data.firstName) missingFields.push('firstName');
        if (!data.lastName) missingFields.push('lastName');
        if (!data.birthDate) missingFields.push('birthDate');
        if (!data.birthPlace) missingFields.push('birthPlace');
        if (!data.sex) missingFields.push('sex');
        if (!data.civilStatus) missingFields.push('civilStatus');

        // Check required contact
        if (!data.email) missingFields.push('email');
        if (!data.phoneNumber) missingFields.push('phoneNumber');
        if (!data.emergencyContact) missingFields.push('emergencyContact');
        if (!data.emergencyContactNumber) missingFields.push('emergencyContactNumber');

        // Check required address
        if (!data.resCity) missingFields.push('resCity');
        if (!data.resBarangay) missingFields.push('resBarangay');

        // Check required resume
        if (!data.resume || !(data.resume instanceof File)) {
            missingFields.push('resume');
            validationIssues['resume'] = 'Resume file is required';
        }

        // Check if Standard duty type requires additional fields
        if (job?.dutyType === 'Standard') {
            if (!data.gsisNumber) missingFields.push('gsisNumber');
            if (!data.pagibigNumber) missingFields.push('pagibigNumber');
            if (!data.philhealthNumber) missingFields.push('philhealthNumber');
            if (!data.umidNumber) missingFields.push('umidNumber');
            if (!data.philsysId) missingFields.push('philsysId');
            if (!data.tinNumber) missingFields.push('tinNumber');

            // Check education
            const hasEducation = data.education && Object.values(data.education).some(
                (level: any) => level?.school && level.school.trim().length > 0
            );
            if (!hasEducation) {
                missingFields.push('education');
                validationIssues['education'] = 'At least one education level required';
            }

            // Check work experience
            if (!data.workExperiences || data.workExperiences.length === 0) {
                missingFields.push('workExperiences');
                validationIssues['workExperiences'] = 'At least one work experience required';
            }

            // Check eligibility
            if (!data.eligibilities || data.eligibilities.length === 0) {
                missingFields.push('eligibilities');
                validationIssues['eligibilities'] = 'At least one eligibility required';
            }

            // Check eligibility certificate
            if (!data.eligibilityCert || !(data.eligibilityCert instanceof File)) {
                missingFields.push('eligibilityCert');
                validationIssues['eligibilityCert'] = 'Eligibility certificate required for Standard jobs';
            }
        }

        console.log('3. Validation Check:');
        console.log('   - Missing fields:', missingFields);
        console.log('   - Validation issues:', validationIssues);
        console.log('   - Frontend errors:', errors);

        // Show detailed error if validation fails
        if (missingFields.length > 0 || Object.keys(validationIssues).length > 0) {
            console.error('❌ VALIDATION FAILED');
            console.error('Missing fields:', missingFields);
            console.error('Validation issues:', validationIssues);

            const allErrors = [
                ...missingFields.map(field => `Missing: ${field}`),
                ...Object.entries(validationIssues).map(([field, msg]) => `${field}: ${msg}`)
            ];

            setValidationErrors(allErrors);

            const errorMsg = missingFields.length <= 5
                ? `Missing required fields: ${missingFields.join(', ')}`
                : `${missingFields.length} required fields are missing. Please complete all sections.`;

            showToast(errorMsg, 'error');

            // Scroll to top to see error summary
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Clear validation errors if all checks pass
        setValidationErrors([]);

        console.log('✅ Validation passed! Submitting...');
        console.log('4. Data being sent:', {
            personal: { firstName: data.firstName, lastName: data.lastName, sex: data.sex, civilStatus: data.civilStatus },
            contact: { email: data.email, phoneNumber: data.phoneNumber },
            address: { resCity: data.resCity, resBarangay: data.resBarangay },
            files: {
                resume: data.resume?.name,
                photo: data.photo?.name,
                cert: data.eligibilityCert?.name
            }
        });
        console.log('=== END DEBUG ===');

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

{(() => {
                                        // Determine steps based on job duty type
                                        const baseSteps = [
                                            { id: 1, title: "Personal Information", component: PersonalInfoSection },
                                            { id: 2, title: "Contact Details", component: ContactSection },
                                            { id: 3, title: "Address", component: AddressSection },
                                        ];

                                        // Add conditional steps for Standard duty jobs
                                        if (job?.dutyType === 'Standard') {
                                            baseSteps.push(
                                                { id: 4, title: "Government IDs", component: GovernmentIDSection },
                                                { id: 5, title: "Education", component: EducationSection },
                                                { id: 6, title: "Work Experience", component: ExperienceSection },
                                                { id: 7, title: "Eligibility & Certifications", component: EligibilitySection }
                                            );
                                        }

                                        // Optional training (for all jobs)
                                        baseSteps.push({ id: baseSteps.length + 1, title: "Training & Development", component: TrainingSection });

                                        // File uploads and review (for all jobs)
                                        baseSteps.push(
                                            { id: baseSteps.length + 1, title: "File Uploads", component: FileUploadSection },
                                            { id: baseSteps.length + 1, title: "Review & Submit", component: ReviewSection }
                                        );

                                        // Renumber IDs
                                        const allSteps = baseSteps.map((step, idx) => ({ ...step, id: idx + 1 }));

                                        return (
                                            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 bg-white border border-gray-100 shadow-xl p-6 md:p-8 rounded-2xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                                                {/* Validation Error Summary */}
                                                {validationErrors.length > 0 && (
                                                    <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 relative z-10">
                                                        <div className="flex items-start gap-3">
                                                            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <div className="flex-1">
                                                                <h4 className="text-sm font-black text-red-900 uppercase tracking-wider mb-3">
                                                                    Please Complete Required Fields ({validationErrors.length})
                                                                </h4>
                                                                <ul className="space-y-2">
                                                                    {validationErrors.map((error, idx) => (
                                                                        <li key={idx} className="text-xs font-semibold text-red-700 flex items-start gap-2">
                                                                            <span className="text-red-500">•</span>
                                                                            <span>{error}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setValidationErrors([])}
                                                                className="text-red-600 hover:text-red-800 text-xs font-bold"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Step Progress Indicator */}
                                                <div className="mb-8 relative z-10">
                                                    <div className="flex items-center justify-between overflow-x-auto pb-4">
                                                        {allSteps.map((step, idx) => (
                                                            <div key={step.id} className="flex items-center min-w-fit">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`
                                                                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                                                        ${currentStep === step.id ? 'bg-green-600 text-white ring-4 ring-green-100' :
                                                                            currentStep > step.id ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
                                                                    `}>
                                                                        {currentStep > step.id ? '✓' : step.id}
                                                                    </div>
                                                                    <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 text-center max-w-[80px] ${
                                                                        currentStep === step.id ? 'text-green-600' : 'text-gray-500'
                                                                    }`}>
                                                                        {step.title}
                                                                    </span>
                                                                </div>
                                                                {idx < allSteps.length - 1 && (
                                                                    <div className={`w-8 md:w-16 h-1 mx-2 transition-all ${
                                                                        currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                                                                    }`}></div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Current Step Component */}
                                                <div className="relative z-10 min-h-[400px]">
                                                    {React.createElement(allSteps[currentStep - 1].component, {
                                                        register,
                                                        errors,
                                                        setValue,
                                                        watch,
                                                        control,
                                                        setCurrentStep
                                                    })}
                                                </div>

                                                {/* Navigation Buttons */}
                                                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 relative z-10">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCurrentStep(prev => Math.max(1, prev - 1));
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        disabled={currentStep === 1}
                                                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        Previous
                                                    </button>

                                                    <div className="text-center">
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                            Step {currentStep} of {allSteps.length}
                                                        </p>
                                                    </div>

                                                    {currentStep < allSteps.length ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCurrentStep(prev => prev + 1);
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            }}
                                                            className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-all shadow-md"
                                                        >
                                                            Next
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="submit"
                                                            disabled={mutation.isPending || isFormLoading}
                                                            className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                                                        >
                                                            {mutation.isPending || isFormLoading ? (
                                                                <>
                                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                    Submitting...
                                                                </>
                                                            ) : (
                                                                'Submit Application'
                                                            )}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Loading Overlay */}
                                                {(mutation.isPending || isFormLoading) && (
                                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                                        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center space-y-4">
                                                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
                                                            <p className="text-lg font-bold text-gray-700">Submitting your application...</p>
                                                            <p className="text-sm text-gray-500">Please wait while we process your information</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </form>
                                        );
                                    })()}
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
