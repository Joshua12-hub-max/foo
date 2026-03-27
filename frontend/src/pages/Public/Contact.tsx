import { Mail, Phone, MapPin, MessageCircle, Clock, Send, ShieldCheck, Zap, User, Loader2 } from 'lucide-react';
import PublicLayout from '@components/Public/PublicLayout';
import { useChatStore } from '@/stores/chatStore';
import { motion, AnimatePresence } from 'framer-motion';
import { inquiryApi } from '@/api/inquiryApi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inquirySchema, InquiryInput } from '@/schemas/inquiry';
import { toast } from 'react-hot-toast';
import mapVisual from '@/assets/meycauayan-map.png';
import contactHero from '@/assets/contact-hero.png';
import SEO from '@/components/Global/SEO';

const Contact = () => {
  const openChat = useChatStore((state) => state.openChat);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
        firstName: '',
        lastName: '',
        email: '',
        message: '',
        hpField: ''
    }
  });

  const onSubmit = async (data: InquiryInput) => {
    try {
      const res = await inquiryApi.submit(data);
      if (res.data.success) {
        toast.success(res.data.message || 'Inquiry sent successfully!');
        reset();
      }
    } catch (error: unknown) {
      console.error(error);
      let serverMsg = 'Failed to send inquiry. Please try again.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        serverMsg = axiosError.response?.data?.message || serverMsg;
      }
      
      toast.error(serverMsg);
    }
  };

  const FieldError = ({ name }: { name: keyof InquiryInput }) => {
    const error = errors[name];
    if (!error) return null;
    return (
      <motion.p 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[10px] font-bold text-red-500 mt-1 ml-1"
      >
        {error.message}
      </motion.p>
    );
  };

  return (
    <PublicLayout>
      <SEO 
        title="Contact Us"
        description="Get in touch with the City of Meycauayan HR team. We are here to assist with your inquiries."
      />
        {/* Background Decorative Elements - Master Balance */}
        <div className="absolute top-0 left-0 right-0 h-[600px] -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-green-500/5 rounded-full blur-[100px] mix-blend-screen opacity-10"></div>
            <div className="absolute bottom-0 right-[-5%] w-[300px] h-[300px] bg-green-900/5 rounded-full blur-[100px] mix-blend-screen opacity-10"></div>
        </div>

      <div className="max-w-6xl mx-auto px-6 pt-4 md:pt-8 pb-16">
        {/* Header - Compact 100% Balance with Conceptual Visual */}
        <div className="flex flex-col lg:flex-row items-center gap-10 mb-12">
            <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex-1 text-center lg:text-left"
            >
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-green-50 text-green-600 border border-green-100 text-[10px] font-bold tracking-tight mb-4 shadow-sm"
                  >
                    Contact us
                  </motion.div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter leading-none">
                    Let's Build the <span className="text-green-600">Future</span> Together
                </h1>
                <p className="text-slate-400 text-sm md:text-base font-semibold max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Connect with our human resources team for inquiries regarding job openings and applications. We prioritize every message.
                </p>
            </motion.div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden lg:block w-64 h-64 relative group"
            >
                <div className="absolute inset-0 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-colors duration-700"></div>
                <img 
                    src={contactHero} 
                    alt="Communication Support" 
                    className="w-full h-full object-contain relative z-10 transition-transform duration-700 group-hover:scale-110" 
                />
            </motion.div>
        </div>

        {/* Master Info & Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
            
            {/* Info Cards Column */}
            <div className="lg:col-span-2 space-y-5">
                {[
                    {
                        icon: <Mail className="text-green-500" size={20} />,
                        label: "Email Us",
                        value: "hr@lgu-meycauayan.gov.ph",
                        desc: "Send us an email anytime."
                    },
                    {
                        icon: <Phone className="text-green-500" size={20} />,
                        label: "Call Us",
                        value: "(044) 123-4567",
                        desc: "Direct Human Resource office line."
                    },
                    {
                        icon: <MapPin className="text-green-500" size={20} />,
                        label: "Visit Us",
                        value: "Meycauayan City Hall",
                        desc: "Brgy. Saluysoy, MacArthur Highway, City of Meycauayan, Bulacan",
                        image: mapVisual
                    }
                ].map((item, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-premium hover:shadow-premium-hover transition-all duration-500 group overflow-hidden flex flex-col"
                    >
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-white/5 rounded-lg flex-shrink-0 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all duration-500">
                                {item.icon}
                            </div>
                            <div className="flex-1">
                                <span className="text-[10px] font-bold text-green-600 tracking-tight block mb-1">How to reach us</span>
                                <p className="text-[14px] font-bold text-slate-900 mb-0.5 tracking-tight">{item.value}</p>
                                <p className="text-[10px] font-semibold text-slate-500">{item.desc}</p>
                            </div>
                        </div>
                        
                        {item.image && (
                            <div className="mt-4 h-24 -mx-5 -mb-5 bg-slate-50 overflow-hidden group-hover:h-32 transition-all duration-700 relative">
                            <img 
                                    src={item.image} 
                                    alt="Map Location" 
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-200/40 to-transparent"></div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Inquiry Form Column */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-3 bg-white p-8 rounded-3xl border border-slate-200 shadow-premium"
            >
                <div className="mb-8">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-green-600 rounded-full"></span>
                        Send a Message
                    </h2>
                    <p className="text-slate-500 text-[11px] font-bold">Have a specific question? Fill out the form below and our team will get back to you.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                            <div className="relative">
                                <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input 
                                    {...register('firstName')}
                                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 ${errors.firstName ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-200 focus:border-green-600'}`}
                                    placeholder="John"
                                />
                            </div>
                            <FieldError name="firstName" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                            <div className="relative">
                                <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input 
                                    {...register('lastName')}
                                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 ${errors.lastName ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-200 focus:border-green-600'}`}
                                    placeholder="Doe"
                                />
                            </div>
                            <FieldError name="lastName" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative">
                            <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input 
                                {...register('email')}
                                className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 ${errors.email ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-200 focus:border-green-600'}`}
                                placeholder="john.doe@example.com"
                            />
                        </div>
                        <FieldError name="email" />
                    </div>

                    {/* Honeypot field - Hidden from users */}
                    <input type="text" {...register('hpField')} className="hidden" tabIndex={-1} autoComplete="off" />

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message</label>
                        <textarea 
                            {...register('message')}
                            rows={4}
                            className={`w-full px-4 py-3 bg-[#131314] border rounded-xl text-sm font-bold text-white outline-none transition-all placeholder:text-slate-700 resize-none ${errors.message ? 'border-red-500 ring-2 ring-red-500/10' : 'border-[#444746] focus:border-green-500'}`}
                            placeholder="How can we help you?"
                        ></textarea>
                        <FieldError name="message" />
                    </div>

                    <button 
                        id="contact-submit-button"
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-black text-sm tracking-tight transition-all shadow-xl shadow-green-900/10 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {isSubmitting ? 'Sending...' : 'Submit Inquiry'}
                    </button>
                </form>
            </motion.div>
        </div>

        {/* Live Chat CTA - Premium Design Integration */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-12 relative overflow-hidden shadow-2xl border border-slate-200"
        >
            {/* Subtle Patterns */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] -mr-32 -mt-32"
            ></motion.div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-[60px] -ml-24 -mb-24"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left space-y-3">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-green-600 font-bold text-[10px] tracking-tight">
                        <Zap size={14} fill="currentColor" />
                        Quick response
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none">
                        Live Support
                    </h2>
                    <p className="text-slate-500 text-sm md:text-base font-semibold max-w-md">
                        Chat directly with our team for real-time assistance and support.
                    </p>
                </div>
                
                <div className="flex flex-col items-center gap-4">
                    <motion.button 
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={openChat}
                        className="group bg-slate-900 text-white px-8 py-4 rounded-xl font-black text-[14px] tracking-tight transition-all shadow-xl shadow-slate-200 flex items-center gap-3 hover:bg-black"
                    >
                        <MessageCircle size={18} className="transition-transform group-hover:rotate-12" />
                        Chat Now
                    </motion.button>
                    <div className="flex items-center gap-2 text-white/30 text-[10px] font-bold tracking-tight">
                        <ShieldCheck size={12} />
                        Secure chat
                    </div>
                </div>
            </div>
        </motion.div>

        {/* Operating Hours - Master Footer Note */}
        <div className="mt-12 text-center text-slate-500 text-[11px] font-bold flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 tracking-tight">
            <div className="flex items-center gap-2">
                <Clock size={12} className="opacity-40" />
                Mon - Fri: 08:00 - 17:00
            </div>
            <div className="hidden md:block w-1 h-1 bg-slate-200 rounded-full"></div>
            <div className="flex items-center gap-2">
                Response Target: <span className="text-green-500 font-black">{'<'} 30 Minutes</span>
            </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Contact;
