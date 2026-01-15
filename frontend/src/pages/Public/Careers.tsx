import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, Clock, Filter, AlertCircle } from 'lucide-react';
import { recruitmentApi } from '@api/recruitmentApi';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '@components/Public/PublicLayout';
import { motion } from 'framer-motion';
import { Job } from '@/types';

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await recruitmentApi.getJobs({ public_view: true });
        if (res.data.success) {
          setJobs(res.data.jobs);
        }
      } catch (err) {
        console.error("Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, []);

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    j.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PublicLayout>
      <div className="bg-slate-900 text-white py-16 px-6 relative overflow-hidden">
          {/* Abstract Background pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-slate-900 to-slate-900"></div>
          
          <div className="max-w-4xl mx-auto relative z-10 text-center">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-5xl font-bold mb-6 tracking-tight"
              >
                  Find Your Next Role
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-slate-400 text-lg mb-8 max-w-xl mx-auto"
              >
                  Browse open positions and join a team dedicated to serving the community.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative max-w-2xl mx-auto"
              >
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search for job titles, departments..." 
                    className="w-full pl-14 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder:text-gray-400 focus:outline-none focus:bg-white/20 focus:border-white/30 transition-all shadow-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
              </motion.div>
          </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 -mt-8 relative z-20">
          <div className="space-y-4">
            {loading ? (
                 <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
                    ))}
                 </div>
            ) : filteredJobs.length === 0 ? (
              <div className="py-24 text-center max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">No open positions found</h3>
                <p className="text-slate-500 text-lg">We couldn't find any jobs matching your search.</p>
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="mt-6 text-blue-600 font-semibold hover:text-blue-800 hover:underline transition-colors"
                    >
                        Clear search filters
                    </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredJobs.map((job, index) => (
                  <motion.div 
                    key={job.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/careers/job/${job.id}`)}
                    className="group bg-white border border-slate-200 p-6 md:p-8 rounded-2xl cursor-pointer shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 relative overflow-hidden"
                  >
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                         <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                                    {job.title}
                                </h3>
                                <div className="text-sm font-medium text-slate-500 mt-1">{job.department}</div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold border border-slate-200 group-hover:bg-white group-hover:border-slate-300 transition-colors">
                                    <MapPin size={12} /> {job.location || 'City Hall'}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold border border-slate-200 group-hover:bg-white group-hover:border-slate-300 transition-colors">
                                    <Clock size={12} /> {job.employment_type || 'Full Time'}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold border border-slate-200 group-hover:bg-white group-hover:border-slate-300 transition-colors">
                                    <Briefcase size={12} /> {job.salary_range}
                                </span>
                            </div>
                         </div>

                         <div className="md:self-center shrink-0">
                            <span className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-100 text-slate-900 font-bold text-sm group-hover:bg-slate-900 group-hover:text-white transition-all">
                                View Details
                            </span>
                         </div>
                     </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
      </div>
    </PublicLayout>
  );
};

export default Jobs;
