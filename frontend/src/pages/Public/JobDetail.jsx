import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recruitmentApi } from '../../api/recruitmentApi';
import { MapPin, Briefcase, DollarSign, ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Application Form State
  const [applying, setApplying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    resume: null
  });

  useEffect(() => {
    const loadJob = async () => {
      try {
        const res = await recruitmentApi.getJob(id);
        if (res.data.success) {
          setJob(res.data.job);
          // Set document title for basic SEO
          document.title = `${res.data.job.title} - Careers`;
        } else {
          setError("Job not found");
        }
      } catch (err) {
        setError("Failed to load job details");
      } finally {
        setLoading(false);
      }
    };
    loadJob();
  }, [id]);

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    
    try {
      const data = new FormData();
      data.append('job_id', id);
      data.append('first_name', formData.first_name);
      data.append('last_name', formData.last_name);
      data.append('email', formData.email);
      data.append('phone_number', formData.phone_number);
      data.append('resume', formData.resume);

      await recruitmentApi.applyJob(data);
      setSuccess(true);
      window.scrollTo(0, 0);
    } catch (err) {
      alert("Failed to submit application. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (error || !job) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || "Job not found"}</div>;

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">Thank you for applying for the <strong>{job.title}</strong> position. We will review your application and get back to you soon.</p>
          <button 
            onClick={() => navigate('/careers')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full"
          >
            Browse More Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-12">
      {/* Header Image / Color */}
      <div className="h-48 bg-gradient-to-r from-blue-900 to-indigo-800"></div>
      
      <div className="max-w-4xl mx-auto px-6 -mt-20">
        <button 
          onClick={() => navigate('/careers')}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} /> Back to Careers
        </button>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>
            <div className="flex flex-wrap gap-6 text-gray-600">
              <div className="flex items-center gap-2">
                <Briefcase size={18} className="text-blue-600" />
                <span>{job.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-red-500" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-green-600" />
                <span>{job.salary_range}</span>
              </div>
            </div>
          </div>

          <div className="p-8 grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-8">
              <section>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Job Description</h3>
                <div className="prose text-gray-600 whitespace-pre-wrap">
                  {job.job_description}
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Requirements</h3>
                <div className="prose text-gray-600 whitespace-pre-wrap">
                  {job.requirements}
                </div>
              </section>
            </div>

            {/* Application Form */}
            <div className="md:col-span-1">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 sticky top-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Apply Now</h3>
                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input 
                      type="text" required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.first_name}
                      onChange={e => setFormData({...formData, first_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input 
                      type="text" required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.last_name}
                      onChange={e => setFormData({...formData, last_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input 
                      type="email" required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input 
                      type="tel" required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.phone_number}
                      onChange={e => setFormData({...formData, phone_number: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resume (PDF) *</label>
                    <div className="relative">
                      <input 
                        type="file" required
                        accept=".pdf,.doc,.docx"
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                        onChange={e => setFormData({...formData, resume: e.target.files[0]})}
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={applying}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md disabled:opacity-70 mt-2"
                  >
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
