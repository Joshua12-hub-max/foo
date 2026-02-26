import React from 'react';
import { X } from 'lucide-react';
import { JobFormData } from '@/types';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contractual', 'Job Order'];
const JOB_STATUSES = ['Open', 'Closed', 'On Hold'];

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  formData: JobFormData;
  handleFormChange: (field: keyof JobFormData, value: JobFormData[keyof JobFormData]) => void;
  handleSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

const JobFormModal: React.FC<JobFormModalProps> = ({ 
  isOpen, 
  onClose, 
  isEditing, 
  formData, 
  handleFormChange, 
  handleSubmit, 
  saving 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Clean Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? 'Edit Job Posting' : 'Create New Job'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Job Title */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Job Title <span className="text-red-500"></span></label>
            <input 
              type="text" 
              required
              placeholder=""
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50"
              value={formData.title || ''}
              onChange={e => handleFormChange('title', e.target.value)}
            />
          </div>

          {/* Department & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Department <span className="text-red-500"></span></label>
              <input 
                type="text" 
                required
                placeholder=""
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50"
                value={formData.department || ''}
                onChange={e => handleFormChange('department', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Location <span className="text-red-500"></span></label>
              <input 
                type="text" 
                required
                placeholder=""
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50"
                value={formData.location || ''}
                onChange={e => handleFormChange('location', e.target.value)}
              />
            </div>
          </div>

          {/* Employment Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Employment Type</label>
              <select 
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50 cursor-pointer"
                value={formData.employment_type || 'Full-time'}
                onChange={e => handleFormChange('employment_type', e.target.value)}
              >
                {EMPLOYMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Status</label>
              <select 
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50 cursor-pointer"
                value={formData.status || 'Open'}
                onChange={e => handleFormChange('status', e.target.value)}
              >
                {JOB_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Salary & Application Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Salary Range</label>
              <input 
                type="text" 
                placeholder=""
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50"
                value={formData.salary_range || ''}
                onChange={e => handleFormChange('salary_range', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Application Email <span className="text-red-500">*</span></label>
              <input 
                type="email" 
                required
                placeholder=""
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50"
                value={formData.application_email || ''}
                onChange={e => handleFormChange('application_email', e.target.value)}
              />
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Job Description <span className="text-red-500">*</span></label>
            <textarea 
              required
              rows={4}
              placeholder=""
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all resize-none bg-gray-50"
              value={formData.job_description || ''}
              onChange={e => handleFormChange('job_description', e.target.value)}
            />
          </div>


          {/* Qualification Requirements */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1 border-b border-gray-100 pb-1">Qualification Requirements</h3>
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Office Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. CITY HUMAN RESOURCE..."
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50"
                      value={formData.office_name || ''}
                      onChange={e => handleFormChange('office_name', e.target.value)}
                    />
                  </div>
                   <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Submission Address</label>
                    <input 
                      type="text" 
                      placeholder="e.g. ATTY. HENRY R. VILLARICA..."
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50"
                      value={formData.submission_address || ''}
                      onChange={e => handleFormChange('submission_address', e.target.value)}
                    />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Education</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Bachelor's Degree..."
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50"
                    value={formData.education || ''}
                    onChange={e => handleFormChange('education', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Experience</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 1 year of relevant experience..."
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50"
                    value={formData.experience || ''}
                    onChange={e => handleFormChange('experience', e.target.value)}
                  />
                </div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Training</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 4 hours of relevant training..."
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50"
                    value={formData.training || ''}
                    onChange={e => handleFormChange('training', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Eligibility</label>
                  <input 
                    type="text" 
                    placeholder="e.g. CS Professional..."
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50"
                    value={formData.eligibility || ''}
                    onChange={e => handleFormChange('eligibility', e.target.value)}
                  />
                </div>
              </div>
               
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Other Qualifications</label>
                  <input 
                    type="text" 
                    placeholder=""
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50"
                    value={formData.other_qualifications || ''}
                    onChange={e => handleFormChange('other_qualifications', e.target.value)}
                  />
                </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Requirements</label>
            <textarea 
              rows={3}
              placeholder=""
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all resize-none bg-gray-50"
              value={formData.requirements || ''}
              onChange={e => handleFormChange('requirements', e.target.value)}
            />
          </div>
        </form>

        {/* Footer buttons */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3 z-10">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit} 
              className="px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                isEditing ? 'Save Changes' : 'Create Job'
              )}
            </button>
         </div>
      </div>
    </div>
  );
};

export default JobFormModal;
