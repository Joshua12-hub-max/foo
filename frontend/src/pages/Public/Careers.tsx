import React, { useState } from 'react';
import { Search, MapPin, Briefcase, Clock, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '@components/Public/PublicLayout';
import { motion } from 'framer-motion';
import { usePublicJobs } from '@/features/Recruitment/hooks/usePublicJobs';
import heroVisual from '@/assets/career-hero.png';

const Jobs = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { filteredJobs, isLoading } = usePublicJobs(searchTerm);

  return (
    <PublicLayout>
      {/* Hero Section - Refined for Master Design */}
      <div className="bg-slate-950 text-white pt-16 pb-20 px-6 relative overflow-hidden">
          {/* Conceptual Visual Background - Master Balance */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block opacity-20 pointer-events-none">
              <img 
                  src={heroVisual} 
                  alt="" 
                  className="w-full h-full object-cover mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-950/50 to-slate-950"></div>
          </div>

          <div className="max-w-6xl mx-auto relative z-10 flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-black tracking-[0.2em] mb-5 uppercase"
                  >
                    Available Roles
                  </div>
                  <h1 
                    className="text-4xl md:text-6xl font-black mb-6 tracking-tighter leading-none"
                  >
                      Find Your Next <br/> <span className="text-green-400">Great Opportunity</span>
                  </h1>
                  <p 
                    className="text-white/40 text-base md:text-lg font-semibold mb-10 max-w-xl mx-auto lg:mx-0 leading-normal"
                  >
                      Integrated recruitment protocol for the City of Meycauayan. <br className="hidden md:block" /> Browse open positions across all departments.
                  </p>
                  
                  <div 
                    className="relative max-w-lg mx-auto lg:mx-0 group"
                  >
                    <div className="absolute inset-y-0 left-5 flex items-center text-white/30 group-focus-within:text-green-400 transition-colors">
                        <Search size={20} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search roles or departments..." 
                        className="w-full pl-14 pr-7 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:bg-white/10 focus:border-green-400/30 transition-all shadow-2xl font-semibold text-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
              </div>

              {/* Decorative Visual Card - Master Balance */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden lg:block w-[400px] h-[300px] rounded-[2.5rem] overflow-hidden border border-white/10 relative group shadow-2xl"
              >
                  <img 
                      src={heroVisual} 
                      alt="Career Growth" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-8 right-8">
                      <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Career Propulsion</p>
                      <p className="text-sm font-bold text-white tracking-tight">Advance your professional journey with the City of Meycauayan</p>
                  </div>
              </motion.div>
          </div>
          
          {/* Subtle Glow */}
          <div className="absolute bottom-[-50%] left-[-20%] w-[400px] h-[400px] bg-green-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 -mt-6 relative z-20">
          <div className="space-y-3.5">
            {isLoading ? (
                 <div className="space-y-3.5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-28 bg-white rounded-2xl border border-slate-50 animate-pulse"></div>
                    ))}
                 </div>
            ) : filteredJobs.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-premium">
                <h3 className="text-2xl font-black text-slate-950 mb-2 tracking-tight">Zero Matches</h3>
                <p className="text-slate-400 text-sm font-semibold">No open positions matching your search parameters.</p>
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="mt-6 px-6 py-2.5 bg-slate-950 text-white rounded-xl font-bold text-[11px] tracking-tight hover:bg-slate-900 transition-all active:scale-95"
                    >
                         Reset Filters
                    </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3.5">
                {filteredJobs.map((job) => (
                  <Link 
                    key={job.id} 
                    to={`/careers/job/${job.id}`}
                    className="group bg-white border border-slate-100 p-5 md:px-8 md:py-6 rounded-2xl shadow-premium hover:shadow-premium-hover hover:border-green-100 transition-all duration-500 relative overflow-hidden block"
                  >
                     <div
                        className="flex flex-col md:flex-row md:items-center justify-between gap-5"
                     >
                         <div className="space-y-3 flex-1">
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold text-slate-950 group-hover:text-green-600 transition-colors tracking-tight leading-none mb-1.5">
                                    {job.title}
                                </h3>
                                <div className="text-[10px] font-bold text-slate-400 tracking-[0.1em] flex items-center gap-2 uppercase">
                                    {job.department}
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-100 group-hover:bg-white group-hover:border-green-50 transition-colors">
                                    <MapPin size={12} className="opacity-40" />
                                    {job.location}
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-100 group-hover:bg-white group-hover:border-green-50 transition-colors">
                                    <Clock size={12} className="opacity-40" />
                                    {job.employment_type}
                                </div>
                            </div>
                         </div>

                         <div className="md:self-center shrink-0">
                            <span className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-slate-950 text-white font-bold text-[13px] tracking-tight group-hover:bg-green-600 transition-all shadow-lg active:scale-95">
                                View Role
                                <ChevronRight size={16} className="opacity-50 transition-transform group-hover:translate-x-0.5" />
                            </span>
                         </div>
                     </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
      </div>
    </PublicLayout>
  );
};

export default Jobs;
