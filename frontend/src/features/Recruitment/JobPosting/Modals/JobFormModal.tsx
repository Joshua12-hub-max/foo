import React, { useEffect, useState } from 'react';
import { X, Loader2, Upload, ChevronDown } from 'lucide-react';
import { fetchDepartments } from '@/api/departmentApi';
import { Department } from '@/types/org';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { jobSchema, JobSchema } from '@/schemas/jobSchema';
import { Job, JobStatus, EmploymentType } from '@/types';
import Combobox from '@/components/Custom/Combobox';

const EMPLOYMENT_TYPES = [
  'Full-time', 
  'Part-time', 
  'Contractual', 
  'Job Order', 
  'Coterminous', 
  'Temporary', 
  'Probationary', 
  'Casual', 
  'Permanent'
];
const JOB_STATUSES = ['Open', 'Closed', 'On Hold'];

const EMPLOYMENT_TYPE_OPTIONS = EMPLOYMENT_TYPES.map(type => ({ value: type, label: type }));
const JOB_STATUS_OPTIONS = JOB_STATUSES.map(status => ({ value: status, label: status }));

const DUTY_TYPE_OPTIONS = [
  { value: 'Standard', label: 'Standard' },
  { value: 'Irregular', label: 'Irregular' }
];

const EDUCATION_OPTIONS = [
  { value: 'None required', label: 'None required' },
  { value: 'Elementary Graduate', label: 'Elementary Graduate' },
  { value: 'High School Graduate', label: 'High School Graduate' },
  { value: 'Senior High School Graduate', label: 'Senior High School Graduate' },
  { value: 'College Graduate', label: 'College Graduate' },
  { value: "Master's Degree", label: "Master's Degree" },
  { value: 'Doctorate Degree', label: 'Doctorate Degree' },
  { value: 'Vocational/Technical', label: 'Vocational/Technical' }
];

const EXPERIENCE_OPTIONS = [
  { value: 'None required', label: 'None required' },
  { value: '6 months relevant experience', label: '6 months relevant experience' },
  { value: '1 year relevant experience', label: '1 year relevant experience' },
  { value: '2 years relevant experience', label: '2 years relevant experience' },
  { value: '3 years relevant experience', label: '3 years relevant experience' },
  { value: '4 years relevant experience', label: '4 years relevant experience' },
  { value: '5+ years relevant experience', label: '5+ years relevant experience' }
];

const TRAINING_OPTIONS = [
  { value: 'None required', label: 'None required' },
  { value: '4 hours relevant training', label: '4 hours relevant training' },
  { value: '8 hours relevant training', label: '8 hours relevant training' },
  { value: '16 hours relevant training', label: '16 hours relevant training' },
  { value: '24 hours relevant training', label: '24 hours relevant training' },
  { value: '40 hours relevant training', label: '40 hours relevant training' }
];

const ELIGIBILITY_OPTIONS = [
  { value: 'None required', label: 'None required' },
  { value: 'Career Service (Professional)', label: 'Career Service (Professional)' },
  { value: 'Career Service (Sub-Professional)', label: 'Career Service (Sub-Professional)' },
  { value: 'Board/Bar RA 1080', label: 'Board/Bar RA 1080' },
  { value: 'Special Laws (CES/CSEE)', label: 'Special Laws (CES/CSEE)' },
  { value: "Driver's License", label: "Driver's License" },
  { value: 'TESDA', label: 'TESDA' },
  { value: 'NBI Clearance', label: 'NBI Clearance' }
];

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
      employmentType: 'Full-time',
      dutyType: 'Standard',
      status: 'Open',
      applicationEmail: '',
      jobDescription: '',
      requirements: '',
      education: '',
      experience: '',
      training: '',
      eligibility: '',
      otherQualifications: '',
      requireCivilService: false,
      requireGovernmentIds: false,
      requireEducationExperience: false,
    }
    });
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Watch fields
  const currentDept = watch('department');
  const currentEmploymentType = watch('employmentType');
  const isPermanent = currentEmploymentType === 'Permanent';
  
  const currentDutyType = watch('dutyType') || 'Standard';
  const currentStatus = watch('status') || 'Open';
  
  const currentEducation = watch('education') || '';
  const currentExperience = watch('experience') || '';
  const currentTraining = watch('training') || '';
  const currentEligibility = watch('eligibility') || '';

  // Options derived from state
  const departmentOptions = departments.map(d => ({ value: d.name, label: d.name }));

  useEffect(() => {
    if (isPermanent) {
      setValue('requireCivilService', true, { shouldValidate: true });
      setValue('requireGovernmentIds', true, { shouldValidate: true });
      setValue('requireEducationExperience', true, { shouldValidate: true });
    }
  }, [isPermanent, setValue]);

  useEffect(() => {
    const loadDepartments = async () => {
        const response = await fetchDepartments();
        if (response.success && response.departments) {
            setDepartments(response.departments);
        }
    };
    if (isOpen) {
        loadDepartments();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          title: initialData.title || '',
          department: initialData.department || '',
          location: initialData.location || '',
          employmentType: initialData.employmentType || 'Full-time',
          dutyType: initialData.dutyType || 'Standard',
          status: initialData.status || 'Open',
          applicationEmail: initialData.applicationEmail || '',
          jobDescription: initialData.jobDescription || '',
          requirements: initialData.requirements || '',
          education: initialData.education || '',
          experience: initialData.experience || '',
          training: initialData.training || '',
          eligibility: initialData.eligibility || '',
          otherQualifications: initialData.otherQualifications || '',
          attachmentPath: initialData.attachmentPath || null,
          requireCivilService: initialData.requireCivilService || false,
          requireGovernmentIds: initialData.requireGovernmentIds || false,
          requireEducationExperience: initialData.requireEducationExperience || false,
        });
      } else {
        reset({
          title: '',
          department: '',
          location: '',
          employmentType: 'Full-time',
          dutyType: 'Standard',
          status: 'Open',
          applicationEmail: '',
          jobDescription: '',
          requirements: '',
          education: '',
          experience: '',
          training: '',
          eligibility: '',
          otherQualifications: '',
          attachmentPath: null,
          requireCivilService: false,
          requireGovernmentIds: false,
          requireEducationExperience: false,
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
        'title', 'department', 'location', 'employmentType', 'dutyType',
        'status', 'applicationEmail', 'jobDescription', 'requirements',
        'education', 'experience', 'training', 'eligibility', 'otherQualifications',
        'requireCivilService', 'requireGovernmentIds', 'requireEducationExperience'
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
                {initialData?.attachmentPath && !selectedFile && (
                  <p className="text-xs text-green-600 mt-1 ml-1 flex items-center gap-1">
                      Existing file attached (Upload new to replace)
                  </p>
                )}
            </div>

            <div className="relative group z-50">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Department <span className="text-red-500">*</span></label>
                <Combobox
                    options={departmentOptions}
                    value={currentDept}
                    onChange={(val) => setValue('department', val, { shouldValidate: true })}
                    placeholder="Search or Select Department..."
                    className="w-full"
                    buttonClassName="px-4 text-sm"
                    error={!!errors.department}
                />
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

            {/* Duty Type, Employment Type & Status */}
            <div className="grid grid-cols-1 gap-4">
              <div className="z-40">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Duty Type</label>
                <Combobox
                    options={DUTY_TYPE_OPTIONS}
                    value={currentDutyType}
                    onChange={(val) => setValue('dutyType', val as 'Standard' | 'Irregular', { shouldValidate: true })}
                    placeholder="Select Duty Type"
                    className="w-full"
                    buttonClassName="px-4 text-sm"
                    error={!!errors.dutyType}
                />
                {errors.dutyType && <p className="text-red-500 text-xs mt-1 ml-1">{errors.dutyType.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="z-30">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Employment Type</label>
                <Combobox
                    options={EMPLOYMENT_TYPE_OPTIONS}
                    value={currentEmploymentType}
                    onChange={(val) => setValue('employmentType', val as EmploymentType, { shouldValidate: true })}
                    placeholder="Select Employment Type"
                    className="w-full"
                    buttonClassName="px-4 text-sm"
                    error={!!errors.employmentType}
                />
                 {errors.employmentType && <p className="text-red-500 text-xs mt-1 ml-1">{errors.employmentType.message}</p>}
              </div>
              <div className="z-30">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Status</label>
                <Combobox
                    options={JOB_STATUS_OPTIONS}
                    value={currentStatus}
                    onChange={(val) => setValue('status', val as JobStatus, { shouldValidate: true })}
                    placeholder="Select Status"
                    className="w-full"
                    buttonClassName="px-4 text-sm"
                    error={!!errors.status}
                />
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
                      {...register('requireEducationExperience')}
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
                      {...register('requireGovernmentIds')}
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
                      {...register('requireCivilService')}
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
                className={`w-full border ${errors.applicationEmail ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50`}
                {...register('applicationEmail')}
              />
              {errors.applicationEmail && <p className="text-red-500 text-xs mt-1 ml-1">{errors.applicationEmail.message}</p>}
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Job Description <span className="text-red-500">*</span></label>
              <textarea 
                rows={4}
                placeholder="Describe the role and responsibilities..."
                className={`w-full border ${errors.jobDescription ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all resize-none bg-gray-50`}
                {...register('jobDescription')}
              />
              {errors.jobDescription && <p className="text-red-500 text-xs mt-1 ml-1">{errors.jobDescription.message}</p>}
            </div>

            {/* Requirements (Structured) */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="block text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">Qualifications & Requirements</h3>
              
              <div className="z-20">
                 <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">Education</label>
                 <Combobox
                    options={EDUCATION_OPTIONS}
                    value={currentEducation}
                    onChange={(val) => setValue('education', val, { shouldValidate: true })}
                    placeholder="Select Education Requirement"
                    className="w-full"
                    buttonClassName="px-4 text-sm"
                    error={!!errors.education}
                 />
                 {errors.education && <p className="text-red-500 text-xs mt-1 ml-1">{errors.education.message}</p>}
              </div>

              <div className="z-20">
                 <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">Experience</label>
                 <Combobox
                    options={EXPERIENCE_OPTIONS}
                    value={currentExperience}
                    onChange={(val) => setValue('experience', val, { shouldValidate: true })}
                    placeholder="Select Experience Requirement"
                    className="w-full"
                    buttonClassName="px-4 text-sm"
                    error={!!errors.experience}
                 />
                 {errors.experience && <p className="text-red-500 text-xs mt-1 ml-1">{errors.experience.message}</p>}
              </div>

              <div className="z-10">
                 <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">Training</label>
                 <Combobox
                    options={TRAINING_OPTIONS}
                    value={currentTraining}
                    onChange={(val) => setValue('training', val, { shouldValidate: true })}
                    placeholder="Select Training Requirement"
                    className="w-full"
                    buttonClassName="px-4 text-sm"
                    error={!!errors.training}
                 />
                 {errors.training && <p className="text-red-500 text-xs mt-1 ml-1">{errors.training.message}</p>}
              </div>

              <div className="z-10">
                 <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">Eligibility</label>
                 <Combobox
                    options={ELIGIBILITY_OPTIONS}
                    value={currentEligibility}
                    onChange={(val) => setValue('eligibility', val, { shouldValidate: true })}
                    placeholder="Select Eligibility Requirement"
                    className="w-full"
                    buttonClassName="px-4 text-sm"
                    error={!!errors.eligibility}
                 />
                 {errors.eligibility && <p className="text-red-500 text-xs mt-1 ml-1">{errors.eligibility.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">Other Qualifications</label>
                <textarea 
                  rows={2}
                  placeholder="Any additional requirements or specific skills..."
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all resize-none bg-gray-50"
                  {...register('otherQualifications')}
                />
              </div>

              <div className="hidden">
                 {/* Preserved for backwards compatibility or raw text storage if needed */}
                <textarea {...register('requirements')} />
              </div>
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
