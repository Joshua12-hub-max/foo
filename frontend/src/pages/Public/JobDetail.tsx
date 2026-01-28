import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle, Upload, MapPin, Clock, Calendar, DollarSign, ChevronRight, Mail, Phone, Send } from 'lucide-react';
import { useToastStore } from '@/stores';
import PublicLayout from '@components/Public/PublicLayout';
import { jobApplicationSchema, JobApplicationSchema } from '@/schemas/recruitment';
import { usePublicJobDetail, useJobApplication } from '@/features/Recruitment/hooks/usePublicJobs';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch Job using custom hook
  const { data: job, isLoading, error } = usePublicJobDetail(id);

  // Form
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<JobApplicationSchema>({
    resolver: zodResolver(jobApplicationSchema)
  });

  // Mutation using custom hook
  const mutation = useJobApplication(
    () => {
      setSuccess(true);
      window.scrollTo(0, 0);
    },
    (err: Error) => {
        console.error(err.message);
        showToast("Failed to submit application. Please try again.", "error");
    }
  );

  const onSubmit = (data: JobApplicationSchema) => {
    if (id) {
        mutation.mutate({ id, data });
    }
  };

  const scrollToForm = () => {
     setShowForm(true);
     setTimeout(() => {
         document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
     }, 100);
  };

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

  if (job) {
    document.title = `${job.title} - Careers`;
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#FDFDFD] font-sans text-slate-950 pb-12 pt-8 md:pt-12">

        <div className="max-w-6xl mx-auto px-6">
            <button 
              onClick={() => navigate('/careers/jobs')} 
              className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-cyan-800 hover:text-slate-950 transition-all mb-8 group uppercase"
            >
                <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
                Back to Listings
            </button>

           <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
               {/* Main Content - Master Precision */}
               <div className="lg:col-span-3">
                   <div className="mb-8">
                       <span className="inline-block px-3.5 py-1 bg-slate-950 text-white rounded-lg text-[10px] font-black tracking-[0.2em] mb-4 shadow-lg uppercase">
                           {job.department}
                       </span>
                       <h1 className="text-3xl md:text-5xl font-black text-slate-950 mb-6 tracking-tight leading-[1.1]">
                         {job.title}
                       </h1>
                       
                       <div className="flex flex-wrap gap-x-8 gap-y-3">
                           <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px]">
                             <MapPin size={14} className="opacity-30" />
                             <span className="tracking-tight">{job.location}</span>
                           </div>
                           <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px]">
                             <Clock size={14} className="opacity-30" />
                             <span className="tracking-tight">{job.employment_type}</span>
                           </div>
                           <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px]">
                             <Calendar size={14} className="opacity-30" />
                             <span className="tracking-tight">Posted {formatDate(job.created_at || job.posted_at)}</span>
                           </div>
                       </div>
                   </div>

                   <hr className="border-slate-100 my-8" />

                   <div className="space-y-10">
                       <section>
                           <h3 className="text-xl font-black text-slate-950 mb-4 tracking-tight flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                                Mission Overview
                           </h3>
                           <div className="text-[15px] text-slate-500 font-semibold leading-relaxed whitespace-pre-wrap max-w-3xl">
                                {job.job_description}
                           </div>
                       </section>

                       <section>
                           <h3 className="text-xl font-black text-slate-950 mb-4 tracking-tight flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-slate-950 rounded-full"></span>
                                Core Requirements
                           </h3>
                           <div className="text-[15px] text-slate-500 font-semibold leading-relaxed whitespace-pre-wrap max-w-3xl">
                                {job.requirements}
                           </div>
                       </section>
                   </div>
               </div>

               {/* Sidebar - Compact Master Utility */}
               <div className="lg:col-span-1">
                   <div className="sticky top-28 bg-white p-6 rounded-2xl border border-slate-100 shadow-premium">
                       <div className="mb-6 text-center">
                           <h3 className="text-lg font-black text-slate-950 mb-2 tracking-tight">Join the Force</h3>
                           <p className="text-slate-400 text-[11px] font-bold leading-relaxed">
                               Integrate your skills with the City of Meycauayan.
                           </p>
                       </div>
                       
                       {!success && !showForm && (
                           <button 
                               onClick={scrollToForm}
                               className="w-full bg-slate-950 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-xl text-[13px] tracking-tight border border-white/5 active:scale-95 hover:bg-green-600"
                           >
                               Apply Protocol
                           </button>
                       )}
                       
                       {success && (
                           <div className="text-center py-4 bg-green-50 rounded-xl border border-green-100">
                               <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-3">
                                   <CheckCircle size={18} />
                               </div>
                               <h3 className="text-green-950 font-black mb-1 tracking-tight text-sm">Success</h3>
                               <p className="text-green-700/60 text-[10px] font-bold uppercase tracking-widest">Awaiting review.</p>
                           </div>
                       )}

                        <div className="mt-8 pt-6 border-t border-slate-50 space-y-4">
                           <div className="flex items-center gap-3 text-slate-400">
                               <Mail size={14} className="opacity-50" />
                               <span className="text-[11px] font-bold truncate">hr@lgu-meycauayan.gov.ph</span>
                           </div>
                           <div className="flex items-center gap-3 text-slate-400">
                               <Phone size={14} className="opacity-50" />
                               <span className="text-[11px] font-bold">(044) 123-4567</span>
                           </div>
                        </div>
                   </div>
               </div>
           </div>
           
           {/* Application Form - 100% Balanced Master Design */}
           {showForm && !success && (
               <div id="application-form" className="mt-16 pt-16 border-t border-slate-100 max-w-3xl mx-auto">
                    <div className="bg-white p-6 md:p-10 rounded-2xl border border-slate-100 shadow-premium-hover">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                            <div className="text-left">
                                <h3 className="text-2xl font-black text-slate-950 tracking-tight">Submission Interface</h3>
                                <p className="text-slate-400 font-bold text-[10px] tracking-[0.1em] uppercase mt-1">Role Protocol: <span className="text-green-600">{job.title}</span></p>
                            </div>
                            <div className="hidden md:block">
                                <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                                    Step 01/01
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 tracking-[0.15em] ml-1 uppercase">First Name</label>
                                    <input type="text" {...register('first_name')}
                                    className={`w-full px-4 py-3 bg-slate-50 border ${errors.first_name ? 'border-red-500' : 'border-slate-100'} rounded-xl focus:bg-white focus:border-slate-950 outline-none transition-all font-semibold text-[14px]`} placeholder="Enter Name" />
                                    {errors.first_name && <p className="text-red-500 text-[9px] font-bold mt-1 ml-1">{errors.first_name.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 tracking-[0.15em] ml-1 uppercase">Last Name</label>
                                    <input type="text" {...register('last_name')}
                                    className={`w-full px-4 py-3 bg-slate-50 border ${errors.last_name ? 'border-red-500' : 'border-slate-100'} rounded-xl focus:bg-white focus:border-slate-950 outline-none transition-all font-semibold text-[14px]`} placeholder="Enter Surname" />
                                    {errors.last_name && <p className="text-red-500 text-[9px] font-bold mt-1 ml-1">{errors.last_name.message}</p>}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 tracking-[0.15em] ml-1 uppercase">Email Address</label>
                                    <input type="email" {...register('email')}
                                    className={`w-full px-4 py-3 bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-100'} rounded-xl focus:bg-white focus:border-slate-950 outline-none transition-all font-semibold text-[14px]`} placeholder="email@address.com" />
                                    {errors.email && <p className="text-red-500 text-[9px] font-bold mt-1 ml-1">{errors.email.message}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 tracking-[0.15em] ml-1 uppercase">Contact Link</label>
                                    <input type="tel" {...register('phone_number')}
                                    className={`w-full px-4 py-3 bg-slate-50 border ${errors.phone_number ? 'border-red-500' : 'border-slate-100'} rounded-xl focus:bg-white focus:border-slate-950 outline-none transition-all font-semibold text-[14px]`} placeholder="Enter Phone" />
                                    {errors.phone_number && <p className="text-red-500 text-[9px] font-bold mt-1 ml-1">{errors.phone_number.message}</p>}
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 tracking-[0.15em] ml-1 uppercase">Residential Address</label>
                                <input type="text" {...register('address')}
                                className={`w-full px-4 py-3 bg-slate-50 border ${errors.address ? 'border-red-500' : 'border-slate-100'} rounded-xl focus:bg-white focus:border-slate-950 outline-none transition-all font-semibold text-[14px]`} placeholder="Street, City, Province" />
                                {errors.address && <p className="text-red-500 text-[9px] font-bold mt-1 ml-1">{errors.address.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 tracking-[0.15em] ml-1 uppercase">Academic Protocol</label>
                                <textarea {...register('education')}
                                rows={2}
                                className={`w-full px-4 py-3 bg-slate-50 border ${errors.education ? 'border-red-500' : 'border-slate-100'} rounded-xl focus:bg-white focus:border-slate-950 outline-none transition-all resize-none font-semibold text-[14px]`} placeholder="Degree / Institution..." />
                                {errors.education && <p className="text-red-500 text-[9px] font-bold mt-1 ml-1">{errors.education.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 tracking-[0.15em] ml-1 uppercase">Professional Log</label>
                                <textarea {...register('experience')}
                                rows={3}
                                className={`w-full px-4 py-3 bg-slate-50 border ${errors.experience ? 'border-red-500' : 'border-slate-100'} rounded-xl focus:bg-white focus:border-slate-950 outline-none transition-all resize-none font-semibold text-[14px]`} placeholder="Previous Roles / Responsibilities..." />
                                {errors.experience && <p className="text-red-500 text-[9px] font-bold mt-1 ml-1">{errors.experience.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 tracking-[0.15em] ml-1 uppercase">Competency Matrix (Skills)</label>
                                <textarea {...register('skills')}
                                rows={2}
                                className={`w-full px-4 py-3 bg-slate-50 border ${errors.skills ? 'border-red-500' : 'border-slate-100'} rounded-xl focus:bg-white focus:border-slate-950 outline-none transition-all resize-none font-semibold text-[14px]`} placeholder="List your key skills..." />
                                {errors.skills && <p className="text-red-500 text-[9px] font-bold mt-1 ml-1">{errors.skills.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 tracking-[0.15em] ml-1 uppercase">Document Transmission (CV)</label>
                                <div className="border-2 border-dashed border-slate-100 rounded-xl p-5 text-center bg-slate-50 cursor-pointer relative overflow-hidden transition-all hover:bg-white hover:border-slate-200">
                                    <input type="file" accept=".pdf,.doc,.docx" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={e => setValue('resume', e.target.files?.[0])} />
                                    
                                    <div className="flex items-center justify-center gap-3">
                                        <Upload size={16} className="text-slate-300" />
                                        <div className="text-left">
                                            {watch('resume') ? (
                                                <p className="text-green-600 font-bold text-[12px]">{watch('resume')?.name}</p>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <p className="text-slate-900 font-bold text-[13px] leading-none mb-1">Execute Upload</p>
                                                    <p className="text-slate-400 text-[10px] font-semibold">PDF / DOC / DOCX</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-6 border-t border-slate-100 mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowForm(false)} 
                                    className="w-full sm:w-auto order-2 sm:order-1 px-6 py-2.5 text-slate-400 hover:text-red-600 font-bold tracking-tight text-[14px] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className="w-full sm:w-auto order-1 sm:order-2 bg-slate-950 text-white font-bold px-8 py-3 rounded-xl shadow-premium hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2.5 text-[14px] tracking-tight border border-white/5"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            Transmitting...
                                        </span>
                                    ) : (
                                        <>
                                            <span>Submit Application</span>
                                            <Send size={16} className="opacity-50" />
                                        </>
                                    )}
                                </button>
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
