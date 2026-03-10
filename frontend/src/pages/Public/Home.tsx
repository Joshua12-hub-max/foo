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

const Home = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
        {/* Background Decorative Elements - Refined for Balance */}
        <div className="absolute top-0 left-0 right-0 h-[800px] -z-10 overflow-hidden pointer-events-none bg-[#131314]">
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
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold tracking-tight mb-4"
                    >
                        Careers and Jobs
                    </motion.div>
                
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white leading-[0.92] lg:max-w-lg"
                    >
                      Public Service <span className="text-green-500">Excellence</span>
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
                        className="mt-5 text-lg text-slate-400 max-w-md leading-relaxed font-semibold"
                    >
                      Forge your professional legacy with the City Government of Meycauayan. Integrity, transparency, and innovation.
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex flex-col sm:flex-row items-center gap-4 pt-6"
                    >
                        <button 
                            onClick={() => navigate('/careers/jobs')}
                        className="w-full sm:w-auto bg-[#1e1e1f] text-white px-7 py-3 rounded-xl font-bold text-[13px] tracking-tight transition-all shadow-xl shadow-slate-950/10 flex items-center justify-center gap-2.5 active:scale-95 border border-[#444746] hover:bg-[#131314] hover:shadow-green-500/5"
                        >
                            Explore Vacancies
                            <ArrowRight size={16} />
                        </button>
                         <button 
                            onClick={() => navigate('/careers/about')}
                            className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-[13px] tracking-tight text-white transition-all bg-white/5 border border-white/10 hover:border-green-500/50 shadow-sm active:scale-95"
                        >
                            About CHRMO
                        </button>
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
                <div className="relative rounded-2xl p-2 bg-[#1e1e1f] border border-[#444746] shadow-premium flex flex-col">
                    <div className="overflow-hidden rounded-xl relative group">
                        <img 
                            src={cityHallImg} 
                            alt="Meycauayan City Hall" 
                            className="w-full h-full object-cover aspect-[16/10] transition-transform duration-1000 group-hover:scale-110"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#131314]/80 to-transparent opacity-60"></div>
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
            <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-32 bg-gradient-to-r from-[#131314] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-32 bg-gradient-to-l from-[#131314] to-transparent z-10 pointer-events-none"></div>

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
                        className="group relative bg-[#1e1e1f] rounded-2xl border border-[#444746] shadow-premium overflow-hidden flex flex-col w-full"
                    >
                        <div className="p-6">
                            <h3 className="text-lg font-black mb-2 text-white tracking-tight">{feature.title}</h3>
                            <p className="text-slate-400 text-[12px] leading-relaxed font-semibold">{feature.desc}</p>
                        </div>
                        <div className="h-24 bg-[#131314] overflow-hidden relative">
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
                        className="group relative bg-[#1e1e1f] rounded-2xl border border-[#444746] shadow-premium hover:shadow-premium-hover hover:border-green-500/30 transition-all duration-500 overflow-hidden flex flex-col w-[350px] mx-3 shrink-0"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-green-500/10 transition-colors duration-500"></div>
                        <div className="p-6">
                            <h3 className="text-xl font-black mb-2 text-white tracking-tight">{feature.title}</h3>
                            <p className="text-slate-400 text-[13px] leading-relaxed font-semibold line-clamp-2">{feature.desc}</p>
                        </div>
                        
                        <div className="mt-auto h-32 bg-[#131314] overflow-hidden relative group-hover:h-36 transition-all duration-700">
                            <img 
                                src={feature.image} 
                                alt={feature.title} 
                                className="w-full h-full object-cover opacity-40 group-hover:opacity-80 group-hover:scale-110 transition-all duration-700"
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
