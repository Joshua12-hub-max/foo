import { useState } from 'react';
import { Search, MapPin, Clock, ChevronRight, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicLayout from '@components/Public/PublicLayout';
import SEO from '@/components/Global/SEO';
import { motion } from 'framer-motion';
import { usePublicJobs } from '@/features/Recruitment/hooks/usePublicJobs';

const Jobs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { filteredJobs, isLoading } = usePublicJobs(searchTerm);

  return (
    <PublicLayout>
      <SEO
        title="Job Openings"
        description="Explore career opportunities at the City of Meycauayan. Join our dedicated team of public servants."
      />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 border-b border-gray-200 py-24 overflow-hidden">
        {/* Blue Smoke Grid Background - Small Squares */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e9_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e9_1px,transparent_1px)] bg-[size:16px_16px] smoke-grid"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf8_1px,transparent_1px),linear-gradient(to_bottom,#38bdf8_1px,transparent_1px)] bg-[size:24px_24px] smoke-grid-secondary"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/50 to-white/85"></div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-700 mb-8"
            >
              <Briefcase size={16} className="text-accent" />
              Open Positions
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-7xl font-bold text-[var(--zed-text-dark)] leading-tight mb-8"
              style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
            >
              Explore opportunities
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl text-gray-700 leading-relaxed mb-10 font-medium"
              style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
            >
              Join the City of Meycauayan team. Browse positions across all departments.
            </motion.p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-3 bg-white p-2 rounded-[var(--radius-md)] border border-[var(--zed-border-light)] shadow-[var(--zed-shadow-xl)] max-w-2xl mx-auto"
            >
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Search by title, department, or keyword..."
                  className="w-full pl-12 pr-4 py-4 bg-transparent text-[var(--zed-text-dark)] placeholder:text-gray-400 focus:outline-none text-lg font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="px-8 py-4 bg-[var(--zed-accent)] hover:bg-[var(--zed-accent-hover)] text-white rounded-[var(--radius-sm)] font-bold text-lg transition-all active:scale-95 shadow-lg">
                Search
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-6">
          {/* Results count */}
          {!isLoading && filteredJobs.length > 0 && (
            <div className="mb-8 text-lg text-[var(--zed-text-muted)] font-medium">
              Found <span className="font-bold text-[var(--zed-text-dark)]">{filteredJobs.length}</span> {filteredJobs.length === 1 ? 'position' : 'positions'}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-40 bg-slate-100 rounded-2xl animate-pulse"
                ></div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-[var(--zed-bg-surface)] rounded-[var(--radius-md)] border border-[var(--zed-border-light)] p-20 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-white border border-[var(--zed-border-light)] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={24} className="text-gray-400" />
                </div>
                <h3 className="text-3xl font-bold text-[var(--zed-text-dark)] mb-4">
                  No positions found
                </h3>
                <p className="text-lg text-[var(--zed-text-muted)] mb-8 font-medium">
                  We couldn't find any positions matching your search criteria.
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-8 py-4 bg-[var(--zed-bg-dark)] hover:bg-black text-white rounded-[var(--radius-sm)] font-bold text-lg transition-all active:scale-95"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job, index) => (
                <Link
                  key={job.id}
                  to={`/careers/job/${job.id}`}
                  className="block group"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-[var(--zed-bg-light)] hover:bg-[var(--zed-bg-surface)] border border-[var(--zed-border-light)] hover:border-accent rounded-[var(--radius-sm)] p-8 transition-all duration-300 shadow-[var(--zed-shadow-sm)] hover:shadow-[var(--zed-shadow-lg)]"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1 space-y-5">
                        <div>
                          <h3 className="text-2xl md:text-3xl font-bold text-[var(--zed-text-dark)] mb-3 leading-snug">
                            {job.title}
                          </h3>
                          <span className="inline-block px-4 py-2 bg-accent/10 text-accent rounded-[var(--radius-sm)] text-base font-bold">
                            {job.department}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-5 text-base text-[var(--zed-text-muted)]">
                          <div className="flex items-center gap-2">
                            <MapPin size={18} className="text-accent" />
                            <span className="font-medium">{job.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={18} className="text-accent" />
                            <span className="font-medium">{job.employmentType}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-accent font-bold transition-all group-hover:translate-x-1">
                        <span className="text-lg">View Details</span>
                        <ChevronRight size={22} />
                      </div>
                    </div>
                  </motion.div>
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
