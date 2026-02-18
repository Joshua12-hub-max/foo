import { Mail, Phone, MapPin, MessageCircle, Clock, Send, ShieldCheck, Zap } from 'lucide-react';
import PublicLayout from '@components/Public/PublicLayout';
import { useChatStore } from '@/stores/chatStore';
import { motion } from 'framer-motion';
import mapVisual from '@/assets/meycauayan-map.png';
import contactHero from '@/assets/contact-hero.png';

const Contact = () => {
  const openChat = useChatStore((state) => state.openChat);

  return (
    <PublicLayout>
        {/* Background Decorative Elements - Master Balance */}
        <div className="absolute top-0 left-0 right-0 h-[600px] -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-green-500/5 rounded-full blur-[100px] mix-blend-multiply opacity-10"></div>
            <div className="absolute bottom-0 right-[-5%] w-[300px] h-[300px] bg-slate-200/20 rounded-full blur-[100px] mix-blend-multiply opacity-10"></div>
        </div>

      <div className="max-w-6xl mx-auto px-6 pt-4 md:pt-8 pb-16">
        {/* Header - Compact 100% Balance with Conceptual Visual */}
        <div className="flex flex-col lg:flex-row items-center gap-10 mb-12">
            <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-white/5 text-white text-[9px] font-black tracking-[0.2em] mb-4 uppercase">
                    Contact HR
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-950 mb-4 tracking-tighter leading-none">
                  Get in <span className="text-green-600">Touch</span>
                </h1>
                <p className="text-slate-500 text-sm md:text-base font-semibold max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Connect with our human resources team for inquiries regarding job openings and applications. We prioritize every message.
                </p>
            </div>
            
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

        {/* Master 3-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            {[
                {
                    icon: <Mail className="text-green-600" size={20} />,
                    label: "Email Us",
                    value: "hr@lgu-meycauayan.gov.ph",
                    desc: "Send us an email anytime."
                },
                {
                    icon: <Phone className="text-green-600" size={20} />,
                    label: "Call Us",
                    value: "(044) 123-4567",
                    desc: "Direct HR office line."
                },
                {
                    icon: <MapPin className="text-green-600" size={20} />,
                    label: "Visit Us",
                    value: "Meycauayan City Hall",
                    desc: "Brgy. Saluysoy, MacArthur Highway, City of Meycauayan, Bulacan",
                    image: mapVisual
                }
            ].map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium hover:shadow-premium-hover transition-all duration-500 group overflow-hidden flex flex-col">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500 group-hover:text-white transition-all duration-500">
                        {item.icon}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">{item.label}</p>
                    <p className="text-[15px] font-bold text-slate-950 mb-1 tracking-tight">{item.value}</p>
                    <p className="text-[11px] font-semibold text-slate-400 mb-4">{item.desc}</p>
                    
                    {item.image && (
                        <div className="mt-auto h-32 -mx-6 -mb-6 bg-slate-50 overflow-hidden group-hover:h-40 transition-all duration-700 relative">
                           <img 
                                src={item.image} 
                                alt="Map Location" 
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
                        </div>
                    )}
                </div>
            ))}
        </div>

        {/* Live Chat CTA - Premium Design Integration */}
        <div className="bg-slate-950 rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
            {/* Subtle Patterns */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-[60px] -ml-24 -mb-24"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left space-y-3">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-green-400 font-bold text-[10px] tracking-[0.2em] uppercase">
                        <Zap size={14} fill="currentColor" />
                        Quick Response
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter leading-none">
                        Live Support
                    </h2>
                    <p className="text-white/40 text-sm md:text-base font-semibold max-w-md">
                        Chat directly with our team for real-time assistance and support.
                    </p>
                </div>
                
                <div className="flex flex-col items-center gap-4">
                    <button 
                        onClick={openChat}
                        className="group bg-white text-slate-950 px-8 py-4 rounded-xl font-black text-[14px] tracking-tight transition-all shadow-xl shadow-green-500/10 flex items-center gap-3 active:scale-95 hover:bg-green-500 hover:text-white"
                    >
                        <MessageCircle size={18} className="transition-transform group-hover:rotate-12" />
                        Chat Now
                    </button>
                    <div className="flex items-center gap-2 text-white/30 text-[10px] font-bold tracking-widest uppercase">
                        <ShieldCheck size={12} />
                        Secured Chat
                    </div>
                </div>
            </div>
        </div>

        {/* Operating Hours - Master Footer Note */}
        <div className="mt-12 text-center text-slate-400 text-[11px] font-bold flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 uppercase tracking-widest">
            <div className="flex items-center gap-2">
                <Clock size={12} className="opacity-40" />
                Mon - Fri: 08:00 - 17:00
            </div>
            <div className="hidden md:block w-1 h-1 bg-slate-200 rounded-full"></div>
            <div className="flex items-center gap-2">
                Response Target: <span className="text-green-600 font-black">{'<'} 30 Minutes</span>
            </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Contact;
