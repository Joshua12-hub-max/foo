import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, MapPin, Edit, Trash2, Eye, X, Calendar, DollarSign, Clock, Share2, ExternalLink } from 'lucide-react';
import { recruitmentApi } from '../../api/recruitmentApi';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contractual', 'Job Order'];
const JOB_STATUSES = ['Open', 'Closed', 'On Hold'];

const JobPosting = () => {
  // State management
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: 'Main Office',
    employment_type: 'Full-time',
    salary_range: '',
    job_description: '',
    requirements: '',
    status: 'Open'
  });

  // Load jobs on mount
  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const response = await recruitmentApi.getJobs();
      if (response.data.success) {
        setJobs(response.data.jobs);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError('Failed to load job postings');
    } finally {
      setLoading(false);
    }
  };

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchTerm, statusFilter]);

  // Handlers
  const handleOpenCreate = useCallback(() => {
    setIsEditing(false);
    setSelectedJob(null);
    setFormData({
      title: '',
      department: '',
      location: 'Main Office',
      employment_type: 'Full-time',
      salary_range: '',
      job_description: '',
      requirements: '',
      status: 'Open'
    });
    setIsFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((job) => {
    setIsEditing(true);
    setSelectedJob(job);
    setFormData({
      title: job.title,
      department: job.department,
      location: job.location || 'Main Office',
      employment_type: job.employment_type || 'Full-time',
      salary_range: job.salary_range || '',
      job_description: job.job_description || '',
      requirements: job.requirements || '',
      status: job.status
    });
    setIsFormOpen(true);
  }, []);

  const handleOpenView = useCallback((job) => {
    setSelectedJob(job);
    setIsViewOpen(true);
  }, []);

  const handleOpenDelete = useCallback((job) => {
    setSelectedJob(job);
    setIsDeleteOpen(true);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (isEditing && selectedJob) {
        // Update existing job
        await recruitmentApi.updateJob(selectedJob.id, formData);
      } else {
        // Create new job
        await recruitmentApi.createJob(formData);
      }
      
      setIsFormOpen(false);
      loadJobs(); // Refresh the list
    } catch (err) {
      console.error('Failed to save job:', err);
      alert(err.response?.data?.message || 'Failed to save job posting');
    } finally {
      setSaving(false);
    }
  }, [isEditing, selectedJob, formData]);

  const handleDelete = useCallback(async () => {
    if (!selectedJob) return;
    
    setSaving(true);
    try {
      await recruitmentApi.deleteJob(selectedJob.id);
      setIsDeleteOpen(false);
      setSelectedJob(null);
      loadJobs(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete job:', err);
      alert('Failed to delete job posting');
    } finally {
      setSaving(false);
    }
  }, [selectedJob]);

  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-700';
      case 'Closed': return 'bg-red-100 text-red-700';
      case 'On Hold': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Job Posting
          </h2>
          <p className="text-sm text-gray-600 mt-1">Create and manage job postings</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-gray-200 text-gray-800 border border-gray-200 font-medium px-4 py-2 rounded-lg text-sm shadow-md hover:bg-gray-300 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Create a Job
        </button>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search by title or department..." 
            className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          {JOB_STATUSES.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            Loading job postings...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-200 shadow-md text-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Job Title</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Salary Range</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Created Date</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Posted Date</th>
                  <th className="px-6 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.length > 0 ? filteredJobs.map(job => (
                  <tr key={job.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap font-medium">{job.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{job.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{job.employment_type || 'Full-time'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{job.salary_range || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(job.created_at)}</td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {job.posted_at ? (
                        <span className="text-green-600 font-medium">{formatDate(job.posted_at)}</span>
                      ) : (
                        <span className="text-gray-400 italic">Not posted</span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      <button 
                        onClick={() => handleOpenView(job)}
                        className="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(job)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleOpenDelete(job)}
                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedJob(job);
                          setIsShareOpen(true);
                        }}
                        className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 transition"
                        title="Post a Job"
                      >
                        <Share2 size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500">
                      No job postings found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gray-200 shadow-md px-6 py-3 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditing ? 'Edit Job Posting' : 'Create a New Job'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-red-800 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-4 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Job Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Software Engineer"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent focus:outline-none transition-all"
                    value={formData.title}
                    onChange={e => handleFormChange('title', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. IT Department"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent focus:outline-none transition-all"
                      value={formData.department}
                      onChange={e => handleFormChange('department', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Main Office"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent focus:outline-none transition-all"
                      value={formData.location}
                      onChange={e => handleFormChange('location', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Employment Type</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent focus:outline-none transition-all"
                      value={formData.employment_type}
                      onChange={e => handleFormChange('employment_type', e.target.value)}
                    >
                      {EMPLOYMENT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent focus:outline-none transition-all"
                      value={formData.status}
                      onChange={e => handleFormChange('status', e.target.value)}
                    >
                      {JOB_STATUSES.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Salary Range</label>
                  <input 
                    type="text" 
                    placeholder="e.g. ₱25,000 - ₱35,000"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent focus:outline-none transition-all"
                    value={formData.salary_range}
                    onChange={e => handleFormChange('salary_range', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Job Description</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Describe the role and responsibilities..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent focus:outline-none transition-all resize-none"
                    value={formData.job_description}
                    onChange={e => handleFormChange('job_description', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Requirements</label>
                  <textarea 
                    rows={3}
                    placeholder="List qualifications and requirements..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent focus:outline-none transition-all resize-none"
                    value={formData.requirements}
                    onChange={e => handleFormChange('requirements', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-3 py-1.5 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 hover:text-red-800 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-3 py-1.5 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:text-green-800 transition-all disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Job')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewOpen && selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gray-200 shadow-md px-6 py-3 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Job Details</h2>
              <button onClick={() => setIsViewOpen(false)} className="text-gray-400 hover:text-red-800 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{selectedJob.title}</h3>
                  <p className="text-sm text-blue-600 font-medium">{selectedJob.department}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(selectedJob.status)}`}>
                  {selectedJob.status}
                </span>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} />
                    <span>{selectedJob.location || 'Main Office'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} />
                    <span>{selectedJob.employment_type || 'Full-time'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign size={16} />
                    <span>{selectedJob.salary_range || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} />
                    <span>Posted: {formatDate(selectedJob.created_at)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Job Description</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedJob.job_description}</p>
              </div>

              {selectedJob.requirements && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Requirements</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedJob.requirements}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button 
                  onClick={() => {
                    setIsViewOpen(false);
                    handleOpenEdit(selectedJob);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit size={16} /> Edit Job
                </button>
                <button 
                  onClick={() => setIsViewOpen(false)}
                  className="flex-1 px-3 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-gray-200 shadow-md px-6 py-3 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Confirm Delete</h2>
              <button onClick={() => setIsDeleteOpen(false)} className="text-gray-400 hover:text-red-800 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete the job posting <strong>"{selectedJob.title}"</strong>? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsDeleteOpen(false)}
                  className="flex-1 px-3 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 px-3 py-2 bg-red-500 text-white font-medium rounded-lg shadow-md hover:bg-red-600 transition-colors disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post a Job / Share Modal */}
      {isShareOpen && selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-200 shadow-md px-6 py-3 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Post a Job</h2>
              <button onClick={() => setIsShareOpen(false)} className="text-gray-400 hover:text-red-800 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-2">
                Share <strong>"{selectedJob.title}"</strong> to job platforms:
              </p>
              <p className="text-xs text-gray-400 italic mb-4 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                💡 You will be redirected to each platform where you can post using your currently logged-in account.
              </p>

              <div className="space-y-3">
                {/* LinkedIn */}
                <button 
                  onClick={async () => {
                    const jobUrl = `${window.location.origin}/careers/job/${selectedJob.id}`;
                    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`;
                    window.open(shareUrl, '_blank', 'width=600,height=500');
                    try {
                      await recruitmentApi.markAsPosted(selectedJob.id, 'linkedin');
                      loadJobs();
                    } catch (err) {
                      console.error('Failed to mark as posted:', err);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#0A66C2] text-white rounded-lg hover:bg-[#004182] transition-colors"
                >
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                    <span className="text-[#0A66C2] font-bold text-sm">in</span>
                  </div>
                  <span className="font-medium">Post to LinkedIn</span>
                  <ExternalLink size={16} className="ml-auto" />
                </button>

                {/* Indeed */}
                <button 
                  onClick={async () => {
                    const indeedUrl = 'https://employers.indeed.com/p/post-job';
                    window.open(indeedUrl, '_blank');
                    try {
                      await recruitmentApi.markAsPosted(selectedJob.id, 'indeed');
                      loadJobs();
                    } catch (err) {
                      console.error('Failed to mark as posted:', err);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#2164f3] text-white rounded-lg hover:bg-[#1a4fc2] transition-colors"
                >
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                    <span className="text-[#2164f3] font-bold text-xs">indeed</span>
                  </div>
                  <span className="font-medium">Post to Indeed</span>
                  <ExternalLink size={16} className="ml-auto" />
                </button>

                {/* JobStreet */}
                <button 
                  onClick={async () => {
                    const jobStreetUrl = 'https://www.jobstreet.com.ph/en/cms/employer/';
                    window.open(jobStreetUrl, '_blank');
                    try {
                      await recruitmentApi.markAsPosted(selectedJob.id, 'jobstreet');
                      loadJobs();
                    } catch (err) {
                      console.error('Failed to mark as posted:', err);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#0D47A1] text-white rounded-lg hover:bg-[#093075] transition-colors"
                >
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                    <span className="text-[#0D47A1] font-bold text-xs">JS</span>
                  </div>
                  <span className="font-medium">Post to JobStreet</span>
                  <ExternalLink size={16} className="ml-auto" />
                </button>

                {/* Facebook */}
                <button 
                  onClick={async () => {
                    const jobUrl = `${window.location.origin}/careers/job/${selectedJob.id}`;
                    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobUrl)}`;
                    window.open(shareUrl, '_blank', 'width=600,height=500');
                    try {
                      await recruitmentApi.markAsPosted(selectedJob.id, 'facebook');
                      loadJobs();
                    } catch (err) {
                      console.error('Failed to mark as posted:', err);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#0d65d9] transition-colors"
                >
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                    <span className="text-[#1877F2] font-bold text-sm">f</span>
                  </div>
                  <span className="font-medium">Post to Facebook</span>
                  <ExternalLink size={16} className="ml-auto" />
                </button>
              </div>

              <div className="mt-4 pt-4 border-t">
                <button 
                  onClick={() => setIsShareOpen(false)}
                  className="w-full px-3 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPosting;
