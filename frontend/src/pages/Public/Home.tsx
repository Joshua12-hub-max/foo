import { useNavigate } from 'react-router-dom';
import PublicLayout from '@components/Public/PublicLayout';
import { ArrowRight, Search, UserCheck, Send } from 'lucide-react';
import cityHallImg from '../../assets/meycauayan-building.png';
import heroGlow from '../../assets/home-hero-glow.png';
import deptImg from '../../assets/home-dept.png';
import registryImg from '../../assets/home-registry.png';
import submissionImg from '../../assets/home-submission.png';
import { motion } from 'framer-motion';

const Home = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
        {/* Background Decorative Elements - Refined for Balance */}
        <div className="absolute top-0 left-0 right-0 h-[800px] -z-10 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 opacity-10 mix-blend-overlay">
                <img src={heroGlow} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-green-400/5 rounded-full blur-[100px] mix-blend-multiply opacity-10"></div>
            <div className="absolute top-[5%] left-[-5%] w-[400px] h-[400px] bg-slate-200/20 rounded-full blur-[100px] mix-blend-multiply opacity-10"></div>
        </div>

      <div className="max-w-7xl mx-auto px-6 pt-6 md:pt-10 pb-12">
        <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
            {/* Text Content */}
            <div className="text-left space-y-5 relative">
                <div>
                    <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-lg bg-slate-900 border border-white/5 text-white text-[9px] font-black tracking-[0.2em] mb-5 shadow-xl">
                        RECRUITMENT TERMINAL
                    </div>
                
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-950 leading-[0.92] lg:max-w-lg">
                      Public Service <span className="text-green-600">Excellence</span>
                    </h1>
                    <p className="mt-5 text-lg text-slate-500 max-w-md leading-relaxed font-semibold">
                      Forge your professional legacy with the City Government of Meycauayan. Integrity, transparency, and innovation.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
                        <button 
                            onClick={() => navigate('/careers/jobs')}
                        className="w-full sm:w-auto bg-slate-950 text-white px-7 py-3 rounded-xl font-bold text-[13px] tracking-tight transition-all shadow-xl shadow-slate-950/10 flex items-center justify-center gap-2.5 active:scale-95 border border-white/5"
                        >
                            Explore Vacancies
                            <ArrowRight size={16} />
                        </button>
                        <button 
                            onClick={() => navigate('/careers/about')}
                            className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-[13px] tracking-tight text-slate-950 transition-all bg-white border border-slate-100 hover:border-slate-950 shadow-sm shadow-slate-200/40"
                        >
                            About CHRMO
                        </button>
                    </div>
                </div>
            </div>

            {/* Hero Image Section - Tighter & More Balanced */}
            <div className="relative hidden lg:block">
                <div className="absolute inset-0 bg-slate-900/5 rounded-2xl transform rotate-1 scale-[1.01] blur-xl opacity-50"></div>
                <div className="relative rounded-2xl p-2 bg-white border border-slate-100 shadow-premium flex flex-col">
                    <div className="overflow-hidden rounded-xl relative group">
                        <img 
                            src={cityHallImg} 
                            alt="Meycauayan City Hall" 
                            className="w-full h-full object-cover aspect-[16/10] transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/80 to-transparent opacity-60"></div>
                        <div className="absolute bottom-5 left-5">
                            <div className="text-white">
                                <p className="font-black text-lg tracking-tight leading-none">Meycauayan City Hall</p>
                                <p className="text-[9px] font-bold text-green-400 tracking-[0.2em] mt-1.5 opacity-90 uppercase">Center of Administration</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Features stats - Master Precision */}
        <div className="grid md:grid-cols-3 gap-5">
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
                    desc: "Submit your application directly to the HR office instantly and skip the paperwork.",
                    image: submissionImg
                }
            ].map((feature, i) => (
                <div 
                    key={i}
                    className="group relative bg-white rounded-2xl border border-slate-100 shadow-premium hover:shadow-premium-hover transition-all duration-500 overflow-hidden flex flex-col"
                >
                    <div className="p-6">
                        <h3 className="text-xl font-black mb-2 text-slate-950 tracking-tight">{feature.title}</h3>
                        <p className="text-slate-500 text-[13px] leading-relaxed font-semibold">{feature.desc}</p>
                    </div>
                    
                    <div className="mt-auto h-32 bg-slate-50 overflow-hidden relative group-hover:h-36 transition-all duration-700">
                        <img 
                            src={feature.image} 
                            alt={feature.title} 
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1 w-0 bg-green-500 transition-all duration-700 group-hover:w-full"></div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </PublicLayout>
  );
};

export default Home;
