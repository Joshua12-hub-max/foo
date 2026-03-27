import { useNavigate } from 'react-router-dom';
import PublicLayout from '@components/Public/PublicLayout';
import { ArrowRight, Search, UserCheck, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import cityHallImg from '../../assets/meycauayan-building.png';
import heroGlow from '../../assets/home-hero-glow.png';
import deptImg from '../../assets/home-dept.png';
import registryImg from '../../assets/home-registry.png';
import submissionImg from '../../assets/home-submission.png';
import Marquee from '@components/Public/Marquee';
import SEO from '@/components/Global/SEO';

const Home = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO 
        title="Official Portal"
        description="Welcome to the CHRMO Mey Portal - City Government of Meycauayan. Empowering our citizens through innovative public service."
      />
        {/* Background Decorative Elements - Refined for Balance */}
        <div className="absolute top-0 left-0 right-0 h-[800px] -z-10 overflow-hidden pointer-events-none bg-slate-50">
            <div className="absolute inset-0 opacity-10 mix-blend-overlay">
                <img src={heroGlow} alt="" className="w-full h-full object-cover" />
            </div>
            <motion.div 
                animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3],
                    x: [0, 20, 0],
                    y: [0, -20, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none"
            ></motion.div>
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2],
                    x: [0, -30, 0],
                    y: [0, 30, 0]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-green-500/5 rounded-full blur-[100px] pointer-events-none"
            ></motion.div>
        </div>

      <div className="max-w-7xl mx-auto px-6 pt-6 md:pt-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-12">
            {/* Text Content */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-left space-y-5 relative"
            >
                <div>
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-green-50 text-green-600 border border-green-100 text-[10px] font-bold tracking-tight mb-4 shadow-sm"
                    >
                        Careers and Jobs
                    </motion.div>
                
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-slate-900 leading-[0.92] lg:max-w-lg"
                    >
                      Public Service <span className="text-green-600">Excellence</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-tight"
                    >
                        Active Opportunities
                    </motion.p>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-5 text-lg text-slate-600 max-w-lg leading-relaxed font-semibold mb-10"
                    >
                      CHRMO Mey is the official recruitment portal of the City Government of Meycauayan. Start your journey in public service with us today.
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="pt-6"
                    >
                        <div className="flex flex-col sm:flex-row items-stretch gap-3 max-w-lg bg-white p-2 rounded-2xl border border-slate-200 shadow-xl focus-within:border-green-500/30 transition-all">
                            <div className="flex-1 relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors">
                                    <Search size={18} />
                                </div>
                                <input 
                                    id="home-job-search"
                                    type="text" 
                                    placeholder="Search for roles..." 
                                    className="w-full pl-12 pr-4 py-3 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none font-semibold text-base"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') navigate('/careers/jobs');
                                    }}
                                />
                            </div>
                            <button 
                                id="home-search-button"
                                onClick={() => navigate('/careers/jobs')}
                                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-sm tracking-tight hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-200"
                            >
                                Search
                            </button>
                        </div>
                        <div className="flex gap-4 mt-6">
                             <button 
                                id="home-about-link"
                                onClick={() => navigate('/careers/about')}
                                className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-green-600 transition-colors"
                            >
                                About CHRMO
                            </button>
                            <span className="text-slate-200">|</span>
                             <button 
                                id="home-contact-link"
                                onClick={() => navigate('/careers/contact')}
                                className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-green-600 transition-colors"
                            >
                                Contact Support
                            </button>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Hero Image Section - Tighter & More Balanced */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                className="relative hidden lg:block"
            >
                <div className="absolute inset-0 bg-green-500/10 rounded-2xl transform rotate-1 scale-[1.01] blur-xl opacity-50"></div>
                <div className="relative rounded-2xl p-2 bg-white border border-slate-200 shadow-premium flex flex-col">
                    <div className="overflow-hidden rounded-xl relative group">
                        <img 
                            src={cityHallImg} 
                            alt="Meycauayan City Hall" 
                            className="w-full h-full object-cover aspect-[16/10] transition-transform duration-1000 group-hover:scale-110"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60"></div>
                        <div className="absolute bottom-5 left-5">
                             <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="text-white"
                            >
                                <p className="font-black text-lg tracking-tight leading-none">Meycauayan City Hall</p>
                                <p className="text-[9px] font-bold text-green-400 tracking-tight mt-1.5 opacity-90">Center of administration</p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>

        {/* Features stats - Infinite Marquee */}
        <div className="relative mt-8">
            {/* Edge Fades for Premium Look */}
            <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>

            <div className="flex flex-col md:hidden gap-4">
                {[
                    { 
                        title: "Department Filter", 
                        desc: "Easily find job openings across different city departments that match your skills.",
                        image: deptImg
                    },
                    { 
                        title: "Career Registry", 
                        desc: "A digital registry used by HR to track and coordinate future opportunities for all applicants.",
                        image: registryImg
                    },
                    { 
                        title: "Online Submission", 
                        desc: "Submit your application directly to the Human Resource office instantly and skip the paperwork.",
                        image: submissionImg
                    }
                ].map((feature, i) => (
                    <div 
                        key={i}
                        className="group relative bg-white rounded-2xl border border-slate-200 shadow-premium overflow-hidden flex flex-col w-full"
                    >
                        <div className="p-6">
                            <h3 className="text-lg font-black mb-2 text-slate-900 tracking-tight">{feature.title}</h3>
                            <p className="text-slate-600 text-[12px] leading-relaxed font-semibold">{feature.desc}</p>
                        </div>
                        <div className="h-24 bg-slate-50 overflow-hidden relative">
                            <img 
                                src={feature.image} 
                                alt={feature.title} 
                                className="w-full h-full object-cover opacity-60"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <Marquee speed={30} className="py-4 hidden md:flex">
                {[
                    { 
                        title: "Department Filter", 
                        desc: "Easily find job openings across different city departments that match your skills.",
                        image: deptImg
                    },
                    { 
                        title: "Career Registry", 
                        desc: "A digital registry used by HR to track and coordinate future opportunities for all applicants.",
                        image: registryImg
                    },
                    { 
                        title: "Online Submission", 
                        desc: "Submit your application directly to the Human Resource office instantly and skip the paperwork.",
                        image: submissionImg
                    }
                ].map((feature, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-green-500/30 transition-all duration-500 overflow-hidden flex flex-col w-[350px] mx-3 shrink-0"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-green-500/10 transition-colors duration-500"></div>
                        <div className="p-6">
                            <h3 className="text-lg font-black mb-1 text-slate-900 tracking-tight">{feature.title}</h3>
                            <p className="text-slate-500 text-[12px] leading-relaxed font-semibold line-clamp-2">{feature.desc}</p>
                        </div>
                        
                        <div className="mt-auto h-28 bg-slate-50 overflow-hidden relative group-hover:h-32 transition-all duration-700">
                            <img 
                                src={feature.image} 
                                alt={feature.title} 
                                className="w-full h-full object-cover opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1 w-0 bg-green-500 transition-all duration-700 group-hover:w-full"></div>
                        </div>
                    </motion.div>
                ))}
            </Marquee>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Home;
