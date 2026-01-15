import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recruitmentApi } from '@api/recruitmentApi';
import { ArrowLeft, CheckCircle, Upload, MapPin, Clock, Calendar, DollarSign, ChevronRight } from 'lucide-react';
import { useToastStore } from '@/stores';
import PublicLayout from '@components/Public/PublicLayout';
import { jobApplicationSchema, JobApplicationSchema } from '@/schemas/recruitment';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch Job
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const res = await recruitmentApi.getJob(id);
      if (res.data.success) {
         document.title = `${res.data.job.title} - Careers`;
         return res.data.job;
      }
      throw new Error("Job not found");
    },
    enabled: !!id,
    retry: 1
  });

  // Form
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<JobApplicationSchema>({
    resolver: zodResolver(jobApplicationSchema)
  });

  // Mutation
  const mutation = useMutation({
    mutationFn: async (data: JobApplicationSchema) => {
       const formData = new FormData();
       formData.append('job_id', id || '');
       Object.keys(data).forEach(key => {
          if (data[key] !== null) formData.append(key, data[key]);
       });
       return await recruitmentApi.applyJob(formData);
    },
    onSuccess: () => {
      setSuccess(true);
      window.scrollTo(0, 0);
    },
    onError: () => {
      showToast("Failed to submit application. Please try again.", "error");
    }
  });

  const onSubmit = (data: JobApplicationSchema) => {
    mutation.mutate(data);
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
        <div className="animate-spin w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full"></div>
     </div>
  );

  if (error || !job) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Unavailable</h2>
        <button onClick={() => navigate('/careers')} className="text-slate-600 hover:text-slate-900 underline">
          Back to listings
        </button>
    </div>
  );

  return (
    <PublicLayout>
      <div className="min-h-screen bg-white font-sans text-slate-900 pb-20 pt-24 lg:pt-32">

        
        {/* ... (Hero and Grid remain same) */}
        <div className="max-w-7xl mx-auto px-6">
           <button 
             onClick={() => navigate('/careers/jobs')} 
             className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-12 group"
           >
               <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to listings
           </button>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
               {/* Main Content */}
               <div className="lg:col-span-2">
                   <div className="mb-10">
                       <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold tracking-wide uppercase mb-6">
                           {job.department}
                       </span>
                       <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
                         {job.title}
                       </h1>
                       
                       <div className="flex flex-wrap gap-x-8 gap-y-4 text-slate-500 text-sm font-medium">
                           <div className="flex items-center gap-2">
                             <MapPin size={16} />
                             <span>{job.location || 'Meycauayan City Hall'}</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <Clock size={16} />
                             <span>{job.employment_type || 'Full Time'}</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <DollarSign size={16} />
                             <span>{job.salary_range || 'Competitive'}</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <Calendar size={16} />
                             <span>Posted {formatDate(job.created_at || job.posted_at)}</span>
                           </div>
                       </div>
                   </div>

                   <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-relaxed">
                       <h3 className="text-xl font-bold text-slate-900 mb-4 mt-8">About the Role</h3>
                       <div className="whitespace-pre-wrap">{job.job_description}</div>

                       <h3 className="text-xl font-bold text-slate-900 mb-4 mt-12">Requirements</h3>
                       <div className="whitespace-pre-wrap">{job.requirements}</div>
                   </div>
               </div>

               {/* Sidebar - Simple CTA */}
               <div className="space-y-8">
                   <div className="sticky top-32 bg-slate-50 p-8 rounded-2xl border border-slate-100">
                       <div className="mb-8">
                           <h3 className="text-lg font-bold text-slate-900 mb-2">Interested?</h3>
                           <p className="text-slate-500 text-sm leading-relaxed">
                               If this role sounds like a good fit, we'd love to hear from you. Apply now to start your journey with us.
                           </p>
                       </div>
                       
                       {!success && !showForm && (
                           <button 
                               onClick={scrollToForm}
                               className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
                           >
                               Apply Using Portal <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                           </button>
                       )}
                       
                       {success && (
                           <div className="text-center py-4">
                               <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                   <CheckCircle size={24} />
                               </div>
                               <h3 className="text-slate-900 font-bold mb-1">Sent!</h3>
                               <p className="text-slate-500 text-sm">We'll be in touch soon.</p>
                           </div>
                       )}

                        <div className="mt-8 pt-8 border-t border-slate-200">
                           <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-4">Questions?</p>
                           <a href="mailto:hr@meycauayan.gov.ph" className="text-slate-900 font-semibold hover:underline">
                              capstone682@gmail.com
                           </a>
                        </div>
                   </div>
               </div>
           </div>
           
           {/* Simple Form Section */}
           {showForm && !success && (
               <div id="application-form" className="mt-24 pt-24 border-t border-slate-100 max-w-3xl mx-auto">
                   <div className="text-center mb-12">
                       <h3 className="text-2xl font-bold text-slate-900 mb-2">Application Form</h3>
                       <p className="text-slate-500">Applying for {job.title}</p>
                   </div>

                   <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                               <div className="space-y-2">
                                   <label className="text-sm font-semibold text-slate-900">First Name</label>
                                   <input type="text" {...register('first_name')}
                                   className={`w-full px-4 py-3 bg-white border ${errors.first_name ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all`} />
                                   {errors.first_name && <p className="text-red-500 text-xs">{errors.first_name.message}</p>}
                               </div>
                               <div className="space-y-2">
                                   <label className="text-sm font-semibold text-slate-900">Last Name</label>
                                   <input type="text" {...register('last_name')}
                                   className={`w-full px-4 py-3 bg-white border ${errors.last_name ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all`} />
                                   {errors.last_name && <p className="text-red-500 text-xs">{errors.last_name.message}</p>}
                               </div>
                           </div>
                           
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                               <div className="space-y-2">
                                   <label className="text-sm font-semibold text-slate-900">Email Address</label>
                                   <input type="email" {...register('email')}
                                   className={`w-full px-4 py-3 bg-white border ${errors.email ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all`} />
                                   {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                               </div>

                               <div className="space-y-2">
                                   <label className="text-sm font-semibold text-slate-900">Phone Number</label>
                                   <input type="tel" {...register('phone_number')}
                                   className={`w-full px-4 py-3 bg-white border ${errors.phone_number ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all`} />
                                   {errors.phone_number && <p className="text-red-500 text-xs">{errors.phone_number.message}</p>}
                               </div>
                           </div>
                           
                           <div className="space-y-2">
                               <label className="text-sm font-semibold text-slate-900">Address</label>
                               <input type="text" {...register('address')}
                               className={`w-full px-4 py-3 bg-white border ${errors.address ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all`} />
                               {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
                           </div>

                           <div className="space-y-2">
                               <label className="text-sm font-semibold text-slate-900">Education</label>
                               <textarea {...register('education')}
                               rows={3}
                               className={`w-full px-4 py-3 bg-white border ${errors.education ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all`} />
                               {errors.education && <p className="text-red-500 text-xs">{errors.education.message}</p>}
                           </div>

                           <div className="space-y-2">
                               <label className="text-sm font-semibold text-slate-900">Work Experience</label>
                               <textarea {...register('experience')}
                               rows={4}
                               className={`w-full px-4 py-3 bg-white border ${errors.experience ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all`} />
                               {errors.experience && <p className="text-red-500 text-xs">{errors.experience.message}</p>}
                           </div>

                           <div className="space-y-2">
                               <label className="text-sm font-semibold text-slate-900">Skills</label>
                               <textarea {...register('skills')}
                               rows={3}
                               className={`w-full px-4 py-3 bg-white border ${errors.skills ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all`} />
                               {errors.skills && <p className="text-red-500 text-xs">{errors.skills.message}</p>}
                           </div>

                           <div className="space-y-2">
                               <label className="text-sm font-semibold text-slate-900">Upload Documents (Resume, ID, etc.)</label>
                               <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors group cursor-pointer relative">
                                   <input type="file" accept=".pdf,.doc,.docx" 
                                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                   onChange={e => setValue('resume', e.target.files?.[0])} />
                                   
                                   <div className="flex flex-col items-center gap-2">
                                       <div className="p-2 bg-slate-100 text-slate-600 rounded-full group-hover:scale-110 transition-transform">
                                           <Upload size={20} />
                                       </div>
                                       <div>
                                           {watch('resume') ? (
                                               <p className="text-blue-600 font-bold text-sm">{watch('resume')?.name}</p>
                                           ) : (
                                               <>
                                                   <p className="text-slate-700 font-medium text-sm">Click to upload or drag and drop</p>
                                                   <p className="text-slate-400 text-xs mt-1">PDF or Word files</p>
                                               </>
                                           )}
                                       </div>
                                   </div>
                               </div>
                           </div>

                           <div className="pt-8 flex gap-4">
                               <button type="submit" disabled={isSubmitting} 
                               className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-3.5 rounded-xl transition-all disabled:opacity-70">
                               {isSubmitting ? 'Sending...' : 'Submit Application'}
                               </button>
                               <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3.5 text-slate-500 hover:text-slate-900 font-semibold transition-colors">
                                   Cancel
                               </button>
                           </div>
                   </form>
               </div>
           )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default JobDetail;
