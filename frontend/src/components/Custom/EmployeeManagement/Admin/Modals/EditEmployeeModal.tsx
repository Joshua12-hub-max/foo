import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { X, ChevronUp, ChevronDown, FileText, Loader } from 'lucide-react';
import Combobox from '@/components/Custom/Combobox';
import { plantillaApi } from '@/api/plantillaApi';
import { employeeApi } from '@/api/employeeApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores';
import { UpdateEmployeeSchema, UpdateEmployeeInput } from '@/schemas/employeeSchema';
import {
  ROLE_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  APPOINTMENT_TYPE_OPTIONS,
  GENDER_OPTIONS,
  CIVIL_STATUS_OPTIONS,
  SALARY_GRADE_OPTIONS,
  BLOOD_TYPE_OPTIONS,
  NATIONALITY_OPTIONS,
  ELIGIBILITY_TYPE_OPTIONS
} from '../constants/employeeConstants';

interface Department {
  id: number;
  name: string;
}

import { Position } from '@/api/plantillaApi';

// Broad interface for incoming employee data
interface Employee extends Record<string, any> {
  id: number | string;
}

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
  departments: Department[];
  onSuccess?: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, isOpen, onToggle, children }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full px-3 py-2 bg-gray-100 flex items-center justify-between text-left hover:bg-gray-200 transition-colors"
    >
      <span className="text-xs font-semibold text-gray-700">{title}</span>
      {isOpen ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
    </button>
    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="p-3 space-y-2 bg-white">{children}</div>
    </div>
  </div>
);

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  onClose,
  employee,
  departments,
  onSuccess
}) => {
  const [openSections, setOpenSections] = useState({
    personal: false,
    government: false,
    eligibility: false,
    socialMedia: false,
    employment: true
  });
  const [vacantPositions, setVacantPositions] = useState<Position[]>([]);
  
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<UpdateEmployeeInput>({
    resolver: zodResolver(UpdateEmployeeSchema),
    defaultValues: {}
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateEmployeeInput) => {
        if (!employee?.id) throw new Error("No employee ID");
        await employeeApi.updateEmployee(employee.id, data);
    },
    onSuccess: () => {
        showToast('Employee updated successfully', 'success');
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        queryClient.invalidateQueries({ queryKey: ['employee', employee?.id] });
        if (onSuccess) onSuccess();
        onClose();
    },
    onError: (error: unknown) => {
        const errMessage = error instanceof Error ? error.message : 'Failed to update employee';
        console.error('Failed to update employee', error);
        showToast(errMessage, 'error');
    }
  });

  useEffect(() => {
    if (isOpen && employee) {
      loadPlantillaOptions();
      // Reset form with employee data
      reset({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        department: employee.department || '',
        role: employee.role || 'employee',
        employmentStatus: employee.employmentStatus || 'Active',
        itemNumber: employee.itemNumber || '',
        positionTitle: employee.positionTitle || employee.jobTitle || '',
        salaryGrade: employee.salaryGrade ? Number(employee.salaryGrade) : undefined,
        stepIncrement: employee.stepIncrement ? Number(employee.stepIncrement) : 1,
        appointmentType: employee.appointmentType || '',
        station: employee.station || '',
        birthDate: employee.birthDate ? new Date(employee.birthDate).toISOString().split('T')[0] : null,
        gender: employee.gender || '',
        civilStatus: employee.civilStatus || '',
        nationality: employee.nationality || 'Filipino',
        phoneNumber: employee.phoneNumber || '',
        permanentAddress: employee.permanentAddress || '',
        gsisNumber: employee.gsisNumber || '',
        philhealthNumber: employee.philhealthNumber || '',
        pagibigNumber: employee.pagibigNumber || '',
        tinNumber: employee.tinNumber || '',
        address: employee.address || '',
        // Plantilla-required eligibility fields
        eligibilityType: employee.eligibilityType || '',
        eligibilityNumber: employee.eligibilityNumber || '',
        eligibilityDate: employee.eligibilityDate ? new Date(employee.eligibilityDate).toISOString().split('T')[0] : null,
        educationalBackground: employee.educationalBackground || '',
        yearsOfExperience: employee.yearsOfExperience || 0,
        // Social Media
        facebookUrl: employee.facebookUrl || '',
        linkedinUrl: employee.linkedinUrl || '',
        twitterHandle: employee.twitterHandle || '',
      });
    }
  }, [isOpen, employee, reset]); 

  const loadPlantillaOptions = async () => {
    try {
      const res = await plantillaApi.getPositions({ isVacant: true });
      let positions: Position[] = res.data.success ? res.data.positions : [];
      if (employee?.itemNumber) {
         const currentPos: Position = {
             id: 0,
             itemNumber: employee.itemNumber,
             positionTitle: employee.positionTitle || '',
             salaryGrade: Number(employee.salaryGrade || 0),
             stepIncrement: employee.stepIncrement || 1,
             department: employee.department || '',
             isVacant: false
         };
         // Add current position if not in list
         if (!positions.find(p => p.itemNumber === employee.itemNumber)) {
             positions = [currentPos, ...positions];
         }
      }
      setVacantPositions(positions);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlantillaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemNo = e.target.value;
    setValue('itemNumber', itemNo);
    if (itemNo) {
      const position = vacantPositions.find(p => p.itemNumber === itemNo);
      if (position) {
        setValue('positionTitle', position.positionTitle);
        setValue('salaryGrade', Number(position.salaryGrade));
        setValue('stepIncrement', position.stepIncrement || 1);
        if (position.department) setValue('department', position.department);
      }
    }
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  if (!isOpen || !employee) return null;

  const handleFormSubmit = (data: UpdateEmployeeInput) => {
      updateMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 z-10">
          <h3 className="text-xl font-bold text-gray-900">Edit Employee</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Required Information */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-600">Required Information</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">First Name <span className="text-red-400">*</span></label>
                <input 
                  {...register('firstName')}
                  className={`w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 ${errors.firstName ? 'border-red-500' : ''}`}
                />
                 {errors.firstName && <p className="text-[10px] text-red-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Last Name <span className="text-red-400">*</span></label>
                <input 
                  {...register('lastName')}
                  className={`w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 ${errors.lastName ? 'border-red-500' : ''}`}
                />
                {errors.lastName && <p className="text-[10px] text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Email Address <span className="text-red-400">*</span></label>
                <input 
                  type="email"
                  {...register('email')}
                  className={`w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className="text-[10px] text-red-500">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="z-50">
                 <label className="text-xs font-semibold text-gray-700 mb-1 block">Department <span className="text-red-400">*</span></label>
                 <Combobox 
                    options={departments.map(d => ({ value: d.name, label: d.name }))}
                    value={watch('department')}
                    onChange={(val) => setValue('department', val, { shouldValidate: true })}
                    placeholder="Select..."
                    error={!!errors.department}
                    buttonClassName="px-2.5 py-1.5 text-sm"
                 />
                 {errors.department && <p className="text-[10px] text-red-500">{errors.department.message}</p>}
              </div>
              <div className="z-50">
                <label className="text-xs font-semibold text-gray-700 mb-1 block">System Role <span className="text-red-400">*</span></label>
                <Combobox 
                   options={ROLE_OPTIONS}
                   value={watch('role')}
                   onChange={(val) => setValue('role', val as UpdateEmployeeInput['role'], { shouldValidate: true })}
                   placeholder="Select role"
                   error={!!errors.role}
                   buttonClassName="px-2.5 py-1.5 text-sm"
                />
                {errors.role && <p className="text-[10px] text-red-500">{errors.role.message}</p>}
              </div>
            </div>

            <div className="z-40">
                 <label className="text-xs font-semibold text-gray-700 mb-1 block">Employment Status</label>
                 <Combobox 
                    options={EMPLOYMENT_STATUS_OPTIONS}
                    value={watch('employmentStatus')}
                    onChange={(val) => setValue('employmentStatus', val)}
                    placeholder="Select status"
                    buttonClassName="px-2.5 py-1.5 text-sm"
                 />
            </div>
          </div>

          {/* Employment Details - Collapsible */}
           <CollapsibleSection title="Employment Details" isOpen={openSections.employment} onToggle={() => toggleSection('employment')}>
             <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 mb-2 z-30 relative">
               <label className="text-xs font-semibold text-gray-800 mb-1 block flex items-center gap-1">
                 <FileText size={12} className="text-gray-500" /> Plantilla Item
               </label>
               <Combobox 
                 options={vacantPositions.map(pos => ({ 
                   value: pos.itemNumber, 
                   label: `${pos.itemNumber} - ${pos.positionTitle} (SG-${pos.salaryGrade})` 
                 }))}
                 value={watch('itemNumber')}
                 onChange={(val) => handlePlantillaChange({ target: { value: val } } as any)}
                 placeholder="Select position..."
                 buttonClassName="px-2.5 py-1.5 text-sm bg-white"
               />
             </div>
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Position Title</label>
                  <input {...register('positionTitle')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
               <div className="z-20">
                 <label className="text-xs font-semibold text-gray-700 mb-1 block">Appointment Type</label>
                 <Combobox 
                    options={APPOINTMENT_TYPE_OPTIONS}
                    value={watch('appointmentType')}
                    onChange={(val) => setValue('appointmentType', val)}
                    placeholder="Select..."
                    buttonClassName="px-2.5 py-1.5 text-sm"
                 />
               </div>
             </div>
             <div className="grid grid-cols-2 gap-2">
                <div className="z-10">
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Salary Grade</label>
                  <Combobox 
                    options={SALARY_GRADE_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                    value={String(watch('salaryGrade') || '')}
                    onChange={(val) => setValue('salaryGrade', Number(val))}
                    placeholder="Select..."
                    buttonClassName="px-2.5 py-1.5 text-sm"
                  />
                </div>
                <div className="z-10">
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Step Increment</label>
                  <Combobox 
                    options={[1, 2, 3, 4, 5, 6, 7, 8].map(s => ({ value: String(s), label: `Step ${s}` }))}
                    value={String(watch('stepIncrement') || 1)}
                    onChange={(val) => setValue('stepIncrement', Number(val))}
                    placeholder="Select..."
                    buttonClassName="px-2.5 py-1.5 text-sm"
                  />
                </div>
              </div>
             <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Station</label>
                <input {...register('station')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
             </div>
           </CollapsibleSection>
 
           {/* Personal Information - Collapsible */}
           <CollapsibleSection title="Personal Information" isOpen={openSections.personal} onToggle={() => toggleSection('personal')}>
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Birth Date</label>
                  <input type="date" {...register('birthDate')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
                <div className="z-10">
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Gender</label>
                  <Combobox 
                    options={GENDER_OPTIONS}
                    value={watch('gender')}
                    onChange={(val) => setValue('gender', val)}
                    placeholder="Select..."
                    buttonClassName="px-2.5 py-1.5 text-sm"
                  />
                </div>
             </div>
             <div className="grid grid-cols-2 gap-2">
                <div className="z-10">
                   <label className="text-xs font-semibold text-gray-700 mb-1 block">Civil Status</label>
                   <Combobox 
                     options={CIVIL_STATUS_OPTIONS}
                     value={watch('civilStatus')}
                     onChange={(val) => setValue('civilStatus', val)}
                     placeholder="Select..."
                     buttonClassName="px-2.5 py-1.5 text-sm"
                   />
                </div>
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Nationality</label>
                  <input type="text" {...register('nationality')} list="nationality-options" className="w-full px-2.5 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
                  <datalist id="nationality-options">
                      {NATIONALITY_OPTIONS.map(opt => (<option key={opt.value} value={String(opt.value)} />))}
                  </datalist>
               </div>
             </div>
              <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Phone Number</label>
                  <input type="tel" {...register('phoneNumber')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
              </div>
              <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Permanent Address</label>
                  <textarea rows={2} {...register('permanentAddress')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200 resize-none" />
              </div>
           </CollapsibleSection>
 
           {/* Government IDs - Collapsible */}
           <CollapsibleSection title="Government IDs" isOpen={openSections.government} onToggle={() => toggleSection('government')}>
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">GSIS Number</label>
                  <input type="text" {...register('gsisNumber')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">PhilHealth</label>
                  <input type="text" {...register('philhealthNumber')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
             </div>
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Pag-IBIG</label>
                  <input type="text" {...register('pagibigNumber')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">TIN</label>
                  <input type="text" {...register('tinNumber')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
             </div>
           </CollapsibleSection>

           {/* Eligibility & Qualifications - Collapsible (Plantilla Required) */}
           <CollapsibleSection title="Eligibility & Qualifications (Plantilla Required)" isOpen={openSections.eligibility} onToggle={() => toggleSection('eligibility')}>
             <div className="grid grid-cols-2 gap-2">
                <div className="z-10">
                   <label className="text-xs font-semibold text-gray-700 mb-1 block">Eligibility Type</label>
                   <Combobox 
                     options={ELIGIBILITY_TYPE_OPTIONS}
                     value={watch('eligibilityType')}
                     onChange={(val) => setValue('eligibilityType', val)}
                     placeholder="Select..."
                     buttonClassName="px-2.5 py-1.5 text-sm"
                   />
                </div>
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Eligibility Number</label>
                  <input type="text" {...register('eligibilityNumber')} placeholder="License/Eligibility No." className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
             </div>
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Eligibility Date</label>
                  <input type="date" {...register('eligibilityDate')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Years of Experience</label>
                  <input type="number" {...register('yearsOfExperience')} min="0" className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
             </div>
             <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Highest Education</label>
                <input type="text" {...register('educationalBackground')} placeholder="e.g., Bachelor of Science in Accountancy" className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
             </div>
           </CollapsibleSection>

           {/* Social Media - Collapsible */}
           <CollapsibleSection title="Social Media" isOpen={openSections.socialMedia} onToggle={() => toggleSection('socialMedia')}>
             <div className="grid grid-cols-1 gap-2">
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Facebook URL</label>
                  <input type="url" {...register('facebookUrl')} placeholder="https://facebook.com/username" className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">LinkedIn URL</label>
                  <input type="url" {...register('linkedinUrl')} placeholder="https://linkedin.com/in/username" className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Twitter/X Handle</label>
                  <input type="text" {...register('twitterHandle')} placeholder="username (without @)" className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
             </div>
           </CollapsibleSection>
        </form>

        {/* Footer Buttons */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 mt-auto">
          <button type="button" onClick={onClose} 
            className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit(handleFormSubmit)} disabled={updateMutation.isPending} 
            className="flex-1 px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg shadow-md hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {updateMutation.isPending && <Loader className="animate-spin" size={16} />}
            {updateMutation.isPending ? 'Updating...' : 'Update Employee'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
