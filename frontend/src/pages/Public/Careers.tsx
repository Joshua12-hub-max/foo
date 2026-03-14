import { useState } from 'react';
import { Search, MapPin, Clock, ChevronRight } from 'lucide-react';
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
      <div className="bg-[#131314] text-white pt-10 sm:pt-16 pb-12 sm:pb-20 px-4 sm:px-6 relative overflow-hidden">
          {/* Conceptual Visual Background - Master Balance */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block opacity-20 pointer-events-none">
              <img 
                  src={heroVisual} 
                  alt="" 
                  className="w-full h-full object-cover mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#131314]/50 to-[#131314]"></div>
          </div>

          <div className="max-w-6xl mx-auto relative z-10 flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-[10px] font-bold tracking-tight mb-6"
                  >
                    Available Roles
                  </motion.div>
                  <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-[0.85]">
                      Find Your Next <br/> <span className="text-green-500">Great Opportunity</span>
                  </h1>
                  <p 
                    className="text-white/40 text-base md:text-lg font-semibold mb-10 max-w-xl mx-auto lg:mx-0 leading-normal"
                  >
                      Official recruitment portal for the City of Meycauayan. <br className="hidden md:block" /> Browse open positions across all departments.
                  </p>
                  
                  <div 
                    className="relative group max-w-3xl"
                  >
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-green-500 transition-colors">
                        <Search size={20} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search roles or departments..." 
                        className="w-full pl-14 pr-7 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:bg-white/10 focus:border-green-500/30 transition-all shadow-2xl font-semibold text-base"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131314]/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-8 right-8">
                      <p className="text-[10px] font-bold text-green-500 tracking-tight mb-1">Career Growth</p>
                      <p className="text-sm font-bold text-white tracking-tight">Advance your professional journey with the City of Meycauayan</p>
                  </div>
              </motion.div>
          </div>
          
          {/* Subtle Glow */}
          <div className="absolute bottom-[-50%] left-[-20%] w-[400px] h-[400px] bg-green-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 -mt-6 relative z-20">
          <div className="space-y-3.5">
            {isLoading ? (
                 <div className="space-y-3.5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-28 bg-white/5 rounded-2xl border border-white/5 animate-pulse"></div>
                    ))}
                 </div>
            ) : filteredJobs.length === 0 ? (
              <div className="py-16 text-center bg-[#1e1e1f] rounded-2xl border border-[#444746] shadow-premium">
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Zero Matches</h3>
                <p className="text-slate-500 text-sm font-semibold">No open positions matching your search parameters.</p>
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="mt-6 px-6 py-2.5 bg-[#131314] text-white rounded-xl font-bold text-[11px] tracking-tight hover:bg-[#1e1e1f] transition-all active:scale-95 border border-[#444746]"
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
                    className="group bg-[#1e1e1f] border border-[#444746] p-5 sm:px-8 sm:py-6 rounded-2xl shadow-premium hover:shadow-premium-hover hover:border-green-800/50 transition-all duration-500 relative overflow-hidden block"
                  >
                     <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-green-500/10 transition-colors duration-500"></div>
                     
                     <div
                        className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
                     >
                         <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-green-500 transition-colors tracking-tight leading-none">
                                    {job.title}
                                </h3>
                                <span className="px-2.5 py-0.5 bg-green-500/10 text-green-500 rounded text-[10px] font-bold tracking-tight border border-green-500/10">
                                  {job.department}
                                </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-slate-400 rounded-lg text-[10px] font-bold border border-white/5 group-hover:bg-white/10 group-hover:border-green-800/20 transition-colors">
                                    <MapPin size={12} className="opacity-40" />
                                    {job.location}
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-slate-400 rounded-lg text-[10px] font-bold border border-white/5 group-hover:bg-white/10 group-hover:border-green-800/20 transition-colors">
                                    <Clock size={12} className="opacity-40" />
                                    {job.employmentType}
                                </div>
                            </div>
                         </div>

                         <div className="md:self-center shrink-0">
                            <span className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-white text-slate-950 font-bold text-[13px] tracking-tight group-hover:bg-green-500 group-hover:text-white transition-all shadow-lg active:scale-95">
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
