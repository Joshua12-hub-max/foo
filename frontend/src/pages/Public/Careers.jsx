import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, ArrowRight } from 'lucide-react';
import { recruitmentApi } from '@api/recruitmentApi';
import { useNavigate } from 'react-router-dom';

const Careers = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
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
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
          <p className="text-lg text-blue-100 mb-8">Build your career with us. Explore opportunities below.</p>
          
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search for job titles or departments..." 
              className="w-full pl-12 pr-6 py-4 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 shadow-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Job List */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        {loading ? (
          <div className="text-center py-12">Loading opportunities...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No open positions at the moment. Please check back later.</div>
        ) : (
          <div className="grid gap-6">
            {filteredJobs.map(job => (
              <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{job.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                    <span className="flex items-center gap-1"><Briefcase size={14} /> {job.department}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">{job.salary_range}</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/careers/job/${job.id}`)}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  View Details <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Careers;
