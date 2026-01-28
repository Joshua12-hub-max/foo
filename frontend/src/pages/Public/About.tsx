import PublicLayout from '@components/Public/PublicLayout';
import { Target, Eye, Users, Shield, TrendingUp, Award, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import missionImg from '@/assets/about-mission.png';
import visionImg from '@/assets/about-vision.png';

const About = () => {
  return (
    <PublicLayout>
      <div className="flex-1 w-full bg-[#FDFDFD] relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 right-0 h-[500px] -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-slate-100 rounded-full blur-[120px] opacity-50"></div>
            <div className="absolute top-[20%] left-[-5%] w-[300px] h-[300px] bg-green-50 rounded-full blur-[100px] opacity-30"></div>
        </div>

        <main className="max-w-5xl mx-auto px-6 pt-12 pb-20 relative z-10">
            {/* Header Section - Compact Balance */}
            <div className="text-center mb-16">
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-white/5 text-white text-[9px] font-black tracking-[0.2em] mb-6 uppercase"
                  >
                     Mandate & Mission
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black text-slate-950 mb-6 tracking-tighter leading-none">
                     Our Core <span className="text-green-600">Mission</span>
                  </h1>
                  <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto font-semibold leading-relaxed">
                     To uphold the highest standards of human resource management in the City Government of Meycauayan, fostering a workforce that is professional, integrity-driven, and dedicated to public service.
                  </p>
            </div>
         
            {/* Bento Grid layout for Mission/Vision - Master Balance */}
            <div className="grid md:grid-cols-2 gap-6 mb-16">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-slate-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl group border border-white/5"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-green-500/20 transition-colors duration-700"></div>
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-8 border border-white/10 group-hover:border-green-500/50 transition-colors">
                            <Target size={24} className="text-green-400" />
                        </div>
                        <h2 className="text-2xl font-black mb-4 tracking-tight text-white">Our Mission</h2>
                        <p className="text-white/50 leading-relaxed text-[15px] font-semibold mb-6">
                            To provide efficient, transparent, and accessible public service. We value integrity and excellence in all our administrative protocols and employee relations.
                        </p>
                        
                        <div className="mt-auto h-40 -mx-10 -mb-10 bg-white/5 overflow-hidden group-hover:h-48 transition-all duration-700 relative">
                           <img 
                                src={missionImg} 
                                alt="Mission Visual" 
                                className="w-full h-full object-cover opacity-40 group-hover:opacity-80 group-hover:scale-110 transition-all duration-700 mix-blend-luminosity hover:mix-blend-normal" 
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: 0.1 }}
                     className="bg-white rounded-[2.5rem] p-10 text-slate-950 relative overflow-hidden border border-slate-100 shadow-premium group"
                >
                     <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -ml-16 -mb-16 group-hover:bg-green-50 transition-colors duration-700"></div>
                     <div className="relative z-10 h-full flex flex-col">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-8 border border-slate-100 group-hover:border-green-500/20 transition-colors">
                            <Eye size={24} className="text-green-600" />
                        </div>
                        <h2 className="text-2xl font-black mb-4 tracking-tight text-slate-950">Our Vision</h2>
                        <p className="text-slate-500 leading-relaxed text-[15px] font-semibold mb-6">
                           To be a model Local Government Unit that empowers its citizens through innovative and sustainable public service programs and high-performance workforce.
                        </p>

                        <div className="mt-auto h-40 -mx-10 -mb-10 bg-slate-50 overflow-hidden group-hover:h-48 transition-all duration-700 relative">
                           <img 
                                src={visionImg} 
                                alt="Vision Visual" 
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent"></div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Why Work With Us - Premium Grid */}
            <div className="space-y-10">
                <div className="flex items-center gap-6">
                    <div className="h-px flex-1 bg-slate-100"></div>
                    <h2 className="text-2xl font-black text-slate-950 tracking-tight">Core Competencies</h2>
                    <div className="h-px flex-1 bg-slate-100"></div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { title: "Community Impact", desc: "Make a tangible difference in the lives of your neighbors.", icon: <Users size={18} /> },
                        { title: "Secure Benefits", desc: "Government-standard compensation and tenure safety.", icon: <Shield size={18} /> },
                        { title: "Career Growth", desc: "Continuous opportunities for training and promotion.", icon: <TrendingUp size={18} /> },
                        { title: "Civic Honor", desc: "Pride in serving the people of Meycauayan City.", icon: <Award size={18} /> }
                    ].map((item, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-premium hover:border-slate-200 transition-all duration-300 group"
                        >
                            <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center mb-4 text-slate-400 group-hover:bg-green-500 group-hover:text-white transition-all duration-500">
                                {item.icon}
                            </div>
                            <h3 className="font-black text-[14px] text-slate-950 mb-2 tracking-tight">{item.title}</h3>
                            <p className="text-slate-500 leading-normal text-[12px] font-semibold">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="mt-20 p-1 bg-slate-100 rounded-3xl">
                <div className="bg-white rounded-[1.4rem] p-8 text-center border border-slate-200/50">
                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mb-4">Public Service Integrity</p>
                    <div className="flex items-center justify-center gap-2 text-slate-950 font-black text-lg tracking-tight">
                        <CheckCircle size={20} className="text-green-600" />
                        Join our Dedicated Team of Public Servants
                    </div>
                </div>
            </div>
        </main>
      </div>
    </PublicLayout>
  );
};

export default About;
