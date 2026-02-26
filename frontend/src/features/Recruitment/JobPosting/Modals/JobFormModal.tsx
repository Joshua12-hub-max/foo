import React, { useEffect, useState } from 'react';
import { X, Loader2, Upload, ChevronDown } from 'lucide-react';
import { fetchDepartments } from '@/api/departmentApi';
import { Department } from '@/types/org';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { jobSchema, JobSchema } from '@/schemas/jobSchema';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contractual', 'Job Order'];
const JOB_STATUSES = ['Open', 'Closed', 'On Hold'];

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  initialData?: Partial<JobSchema>;
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
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<JobSchema>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      department: '',
      location: '',
      status: 'Open',
      application_email: '',
      job_description: '',
      requirements: '',
      require_civil_service: false,
      require_government_ids: false,
      require_education_experience: false,
    }
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');
  
  // Watch fields
  const currentDept = watch('department');
  const currentEmploymentType = watch('employment_type');
  const isPermanent = currentEmploymentType === 'Permanent';

  // Auto-lock toggles if Permanent is selected
  useEffect(() => {
    if (isPermanent) {
      setValue('require_civil_service', true, { shouldValidate: true });
      setValue('require_government_ids', true, { shouldValidate: true });
      setValue('require_education_experience', true, { shouldValidate: true });
    }
  }, [isPermanent, setValue]);

  // Derived state for filtered departments
  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(deptSearch.toLowerCase())
  );

  useEffect(() => {
    // Sync local search state with form value when it changes externally (e.g. edit mode)
    if (currentDept) setDeptSearch(currentDept);
  }, [currentDept]);

  useEffect(() => {
    const loadDepartments = async () => {
        const response = await fetchDepartments();
        if (response.success && response.departments) {
            setDepartments(response.departments);
        }
    };
    if (isOpen) {
        loadDepartments();
        setIsDeptOpen(false); // Reset dropdown state on open
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          title: initialData.title || '',
          department: initialData.department || '',
          location: initialData.location || '',
          employment_type: initialData.employment_type || 'Full-time',
          status: initialData.status || 'Open',
          application_email: initialData.application_email || '',
          job_description: initialData.job_description || '',
          requirements: initialData.requirements || '',
          attachment_path: initialData.attachment_path || null,
          require_civil_service: initialData.require_civil_service || false,
          require_government_ids: initialData.require_government_ids || false,
          require_education_experience: initialData.require_education_experience || false,
        });
      } else {
        reset({
          title: '',
          department: '',
          location: '',
          employment_type: 'Full-time',
          status: 'Open',
          application_email: '',
          job_description: '',
          requirements: '',
          attachment_path: null,
          require_civil_service: false,
          require_government_ids: false,
          require_education_experience: false,
        });
      }
      setSelectedFile(null);
    }
  }, [isOpen, initialData, reset]);

  const handleFormSubmit = (data: JobSchema) => {
    if (selectedFile) {
      const formData = new FormData();
      
      // Explicitly append known fields from schema
      const fields: (keyof JobSchema)[] = [
        'title', 'department', 'location', 'employment_type', 
        'status', 'application_email', 'job_description', 'requirements',
        'require_civil_service', 'require_government_ids', 'require_education_experience'
      ];

      fields.forEach(field => {
        const value = data[field];
        if (value !== undefined && value !== null) {
          formData.append(field, String(value));
        }
      });
      
      formData.append('file', selectedFile);
      onSubmit(formData);
    } else {
      onSubmit(data);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? 'Edit Job Posting' : 'Create New Job'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        
        <form id="job-form" onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
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

            {/* Department (Moved Up) */}
            <div className="relative group z-20">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Department <span className="text-red-500">*</span></label>
                
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search or Select Department..."
                    className={`w-full border ${errors.department ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50`}
                    {...register('department', {
                        onChange: (e) => {
                            setDeptSearch(e.target.value);
                            setIsDeptOpen(true);
                        }
                    })}
                    onFocus={() => setIsDeptOpen(true)}
                    autoComplete="off"
                  />
                  
                  {/* Dropdown Indicator */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown size={14} />
                  </div>

                  {/* Dropdown List */}
                  {isDeptOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                        {filteredDepartments.length > 0 ? (
                            filteredDepartments.map((dept, index) => (
                                <button
                                    key={dept.id}
                                    type="button"
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center group/item"
                                    onClick={() => {
                                        setValue('department', dept.name, { shouldValidate: true });
                                        setDeptSearch(dept.name);
                                        setIsDeptOpen(false);
                                    }}
                                >
                                    <span className="text-gray-400 font-mono mr-3 text-xs">#{index + 1}</span>
                                    <span className="font-medium text-gray-700 group-hover/item:text-gray-900">{dept.name}</span>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-xs text-gray-500 text-center">
                                No departments found. 
                                <br />
                                <span className="opacity-70">Type to create new validity check later...</span>
                            </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Overlay to close when clicking outside */}
                {isDeptOpen && (
                    <div className="fixed inset-0 z-40" onClick={() => setIsDeptOpen(false)} />
                )}

                {errors.department && <p className="text-red-500 text-xs mt-1 ml-1">{errors.department.message}</p>}
            </div>

            {/* Job Title & Location (Swapped Positions) */}
            <div className="grid grid-cols-2 gap-4">
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

            {/* Application Requirements Settings */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Application Requirements</h3>
                <p className="text-xs text-gray-500 mt-0.5">Toggle which documents are mandatory for applicants to submit.</p>
                {isPermanent && (
                  <p className="text-xs text-blue-600 mt-1.5 font-medium bg-blue-50 py-1.5 px-2.5 rounded border border-blue-100 italic inline-block inline-flex items-center gap-1.5">
                    For Permanent positions, all credentials are required by law.
                  </p>
                )}
              </div>
              
              <div className="space-y-3 pt-1">
                <label className={`flex items-start gap-3 p-3 rounded-lg border ${isPermanent ? 'bg-gray-100/50 border-gray-200 opacity-80' : 'bg-white border-gray-200 hover:border-gray-300 cursor-pointer'} transition-colors`}>
                  <div className="flex h-5 items-center">
                    <input
                      type="checkbox"
                      className={`h-4 w-4 rounded border-gray-300 ${isPermanent ? 'text-gray-500 cursor-not-allowed' : 'text-blue-600 cursor-pointer'} focus:ring-blue-600`}
                      {...register('require_education_experience')}
                      disabled={isPermanent}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800">Professional Qualifications</span>
                    <span className="text-xs text-gray-500 mt-0.5">Requires Education, Skills, and Experience entries</span>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-lg border ${isPermanent ? 'bg-gray-100/50 border-gray-200 opacity-80' : 'bg-white border-gray-200 hover:border-gray-300 cursor-pointer'} transition-colors`}>
                  <div className="flex h-5 items-center">
                    <input
                      type="checkbox"
                      className={`h-4 w-4 rounded border-gray-300 ${isPermanent ? 'text-gray-500 cursor-not-allowed' : 'text-blue-600 cursor-pointer'} focus:ring-blue-600`}
                      {...register('require_government_ids')}
                      disabled={isPermanent}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800">Government Records</span>
                    <span className="text-xs text-gray-500 mt-0.5">Mandate the submission of GSIS, Pag-IBIG, TIN, PhilHealth, PhilSys</span>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-lg border ${isPermanent ? 'bg-gray-100/50 border-gray-200 opacity-80' : 'bg-white border-gray-200 hover:border-gray-300 cursor-pointer'} transition-colors`}>
                  <div className="flex h-5 items-center">
                    <input
                      type="checkbox"
                      className={`h-4 w-4 rounded border-gray-300 ${isPermanent ? 'text-gray-500 cursor-not-allowed' : 'text-blue-600 cursor-pointer'} focus:ring-blue-600`}
                      {...register('require_civil_service')}
                      disabled={isPermanent}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800">Civil Service Eligibility</span>
                    <span className="text-xs text-gray-500 mt-0.5">Requires CSC Certificate, Board/Bar rating, and PDF upload</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Application Email */}
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
          </div>
        </form>

        {/* Footer */}
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
              form="job-form"
              type="submit"
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
