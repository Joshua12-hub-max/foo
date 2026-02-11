import React, { useEffect, useState } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { jobSchema, JobSchema } from '@/schemas/jobSchema';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contractual', 'Job Order'];
const JOB_STATUSES = ['Open', 'Closed', 'On Hold'];

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  initialData?: any; // Using any for flexibility with legacy data, but will cast to Schema
  onSubmit: (data: JobSchema | FormData) => void;
  saving: boolean;
}

const JobFormModal: React.FC<JobFormModalProps> = ({ 
  isOpen, 
  onClose, 
  isEditing, 
  initialData, 
  onSubmit, 
  saving 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<JobSchema>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      department: '',
      location: '',
      employment_type: 'Full-time',
      status: 'Open',
      salary_range: '',
      application_email: '',
      job_description: '',
      requirements: '',

    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
            title: initialData.title || '',
            department: initialData.department || '',
            location: initialData.location || '',
            employment_type: initialData.employment_type || 'Full-time',
            status: initialData.status || 'Open',
            salary_range: initialData.salary_range || '',
            application_email: initialData.application_email || '',
            job_description: initialData.job_description || '',
            requirements: initialData.requirements || '',

        } as JobSchema);
      } else {
        reset({
            title: '',
            department: '',
            location: '',
            employment_type: 'Full-time',
            status: 'Open',
            salary_range: '',
            application_email: '',
            job_description: '',
            requirements: '',

        });
      }
    }
  }, [isOpen, initialData, reset]);

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
        
        
        <form onSubmit={handleSubmit((data) => {
          if (selectedFile) {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
              if (value !== null && value !== undefined) {
                 formData.append(key, value as string);
              }
            });
            formData.append('file', selectedFile);
            onSubmit(formData);
          } else {
            onSubmit(data);
          }
        })} className="p-6 space-y-5 overflow-y-auto">
          {/* File Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Qualification Document (Upload)</label>
            <div className="flex items-center gap-2">
              <label 
                  htmlFor="file-upload" 
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors w-full justify-center"
              >
                  <Upload size={16} />
                  {selectedFile ? selectedFile.name : "Choose File (PDF/Word)"}
              </label>
              <input 
                  id="file-upload"
                  type="file" 
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
              />
              {selectedFile && (
                <button 
                  type="button" 
                  onClick={() => setSelectedFile(null)} 
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                  title="Remove file"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {initialData?.attachment_path && !selectedFile && (
                <p className="text-xs text-green-600 mt-1 ml-1 flex items-center gap-1">
                    Existing file attached (Upload new to replace)
                </p>
            )}
          </div>

          {/* Job Title */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Job Title <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="e.g. Software Engineer"
              className={`w-full border ${errors.title ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50`}
              {...register('title')}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1 ml-1">{errors.title.message}</p>}
          </div>

          {/* Department & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Department <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="e.g. IT Department"
                className={`w-full border ${errors.department ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50`}
                {...register('department')}
              />
              {errors.department && <p className="text-red-500 text-xs mt-1 ml-1">{errors.department.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Location <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="e.g. Main Office"
                className={`w-full border ${errors.location ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50`}
                {...register('location')}
              />
               {errors.location && <p className="text-red-500 text-xs mt-1 ml-1">{errors.location.message}</p>}
            </div>
          </div>

          {/* Employment Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Employment Type</label>
              <select 
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50 cursor-pointer"
                {...register('employment_type')}
              >
                {EMPLOYMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
               {errors.employment_type && <p className="text-red-500 text-xs mt-1 ml-1">{errors.employment_type.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Status</label>
              <select 
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50 cursor-pointer"
                {...register('status')}
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
                placeholder="e.g. ₱25,000 - ₱35,000"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50"
                {...register('salary_range')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Application Email <span className="text-red-500">*</span></label>
              <input 
                type="email" 
                placeholder="e.g. hr@company.com"
                className={`w-full border ${errors.application_email ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50`}
                {...register('application_email')}
              />
              {errors.application_email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.application_email.message}</p>}
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Job Description <span className="text-red-500">*</span></label>
            <textarea 
              rows={4}
              placeholder="Describe the role and responsibilities..."
              className={`w-full border ${errors.job_description ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all resize-none bg-gray-50`}
              {...register('job_description')}
            />
            {errors.job_description && <p className="text-red-500 text-xs mt-1 ml-1">{errors.job_description.message}</p>}
          </div>




          {/* Requirements */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Requirements</label>
            <textarea 
              rows={3}
              placeholder="List qualifications and requirements..."
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all resize-none bg-gray-50"
              {...register('requirements')}
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
              onClick={handleSubmit((data) => {
                if (selectedFile) {
                  const formData = new FormData();
                  // Append all form fields
                  Object.keys(data).forEach(key => {
                    const value = (data as any)[key];
                    if (value !== undefined && value !== null) {
                        formData.append(key, value);
                    }
                  });
                  // Append file
                  formData.append('file', selectedFile);
                  onSubmit(formData);
                } else {
                  onSubmit(data);
                }
              })} 
              className="px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
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
