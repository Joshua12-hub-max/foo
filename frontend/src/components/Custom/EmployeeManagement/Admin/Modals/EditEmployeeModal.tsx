import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, ChevronUp, ChevronDown, FileText, Loader } from 'lucide-react';
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

interface Position {
  id: number | string;
  item_number: string;
  position_title: string;
  salary_grade: string;
  step_increment?: number;
  department?: string;
}

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

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<UpdateEmployeeInput>({
    resolver: zodResolver(UpdateEmployeeSchema) as any,
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
    onError: (error: any) => {
        console.error('Failed to update employee', error);
        showToast(error.message || 'Failed to update employee', 'error');
    }
  });

  useEffect(() => {
    if (isOpen && employee) {
      loadPlantillaOptions();
      // Reset form with employee data
      reset({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        department: employee.department || '',
        role: employee.role || 'employee',
        employment_status: employee.employment_status || 'Active',
        item_number: employee.item_number || '',
        position_title: employee.position_title || employee.job_title || '',
        salary_grade: employee.salary_grade ? Number(employee.salary_grade) : undefined,
        step_increment: employee.step_increment ? Number(employee.step_increment) : 1,
        appointment_type: employee.appointment_type || '',
        station: employee.station || '',
        birth_date: employee.birth_date ? new Date(employee.birth_date).toISOString().split('T')[0] : null,
        gender: employee.gender || '',
        civil_status: employee.civil_status || '',
        nationality: employee.nationality || 'Filipino',
        phone_number: employee.phone_number || '',
        permanent_address: employee.permanent_address || '',
        gsis_number: employee.gsis_number || '',
        philhealth_number: employee.philhealth_number || '',
        pagibig_number: employee.pagibig_number || '',
        tin_number: employee.tin_number || '',
        address: employee.address || '',
        // Plantilla-required eligibility fields
        eligibility_type: employee.eligibility_type || '',
        eligibility_number: employee.eligibility_number || '',
        eligibility_date: employee.eligibility_date ? new Date(employee.eligibility_date).toISOString().split('T')[0] : null,
        highest_education: employee.highest_education || '',
        years_of_experience: employee.years_of_experience || 0,
        // Social Media
        facebook_url: employee.facebook_url || '',
        linkedin_url: employee.linkedin_url || '',
        twitter_handle: employee.twitter_handle || '',
      });
    }
  }, [isOpen, employee, reset]); 

  const loadPlantillaOptions = async () => {
    try {
      const res = await plantillaApi.getPositions({ is_vacant: true });
      let positions: Position[] = res.data.success ? res.data.positions : [];
      if (employee?.item_number) {
         const currentPos: Position = {
             id: 'current',
             item_number: employee.item_number,
             position_title: employee.position_title || '',
             salary_grade: String(employee.salary_grade || ''),
             step_increment: employee.step_increment,
             department: employee.department
         };
         // Add current position if not in list
         if (!positions.find(p => p.item_number === employee.item_number)) {
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
    setValue('item_number', itemNo);
    if (itemNo) {
      const position = vacantPositions.find(p => p.item_number === itemNo);
      if (position) {
        setValue('position_title', position.position_title);
        setValue('salary_grade', Number(position.salary_grade));
        setValue('step_increment', position.step_increment || 1);
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
                  {...register('first_name')}
                  className={`w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 ${errors.first_name ? 'border-red-500' : ''}`}
                />
                 {errors.first_name && <p className="text-[10px] text-red-500">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Last Name <span className="text-red-400">*</span></label>
                <input 
                  {...register('last_name')}
                  className={`w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 ${errors.last_name ? 'border-red-500' : ''}`}
                />
                {errors.last_name && <p className="text-[10px] text-red-500">{errors.last_name.message}</p>}
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
              <div>
                 <label className="text-xs font-semibold text-gray-700 mb-1 block">Department <span className="text-red-400">*</span></label>
                 <select 
                    {...register('department')}
                    className={`w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 ${errors.department ? 'border-red-500' : ''}`}
                 >
                    <option value="">Select...</option>
                    {departments.map(d => (<option key={d.id} value={d.name}>{d.name}</option>))}
                 </select>
                 {errors.department && <p className="text-[10px] text-red-500">{errors.department.message}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">System Role <span className="text-red-400">*</span></label>
                <select 
                   {...register('role')}
                   className={`w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200 ${errors.role ? 'border-red-500' : ''}`}
                >
                    {ROLE_OPTIONS.map(opt => (<option key={opt.value} value={opt.value as any}>{opt.label}</option>))}
                </select>
                {errors.role && <p className="text-[10px] text-red-500">{errors.role.message}</p>}
              </div>
            </div>

            <div>
                 <label className="text-xs font-semibold text-gray-700 mb-1 block">Employment Status</label>
                 <select 
                    {...register('employment_status')}
                    className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200"
                 >
                    {EMPLOYMENT_STATUS_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                 </select>
            </div>
          </div>

          {/* Employment Details - Collapsible */}
           <CollapsibleSection title="Employment Details" isOpen={openSections.employment} onToggle={() => toggleSection('employment')}>
             <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 mb-2">
               <label className="text-xs font-semibold text-gray-800 mb-1 block flex items-center gap-1">
                 <FileText size={12} className="text-gray-500" /> Plantilla Item
               </label>
               <select 
                 className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-100 bg-white" 
                 {...register('item_number')}
                 onChange={handlePlantillaChange}
               >
                 <option value="">Select position...</option>
                 {vacantPositions.map(pos => (
                   <option key={pos.id} value={pos.item_number}>
                     {pos.item_number} - {pos.position_title} (SG-{pos.salary_grade})
                   </option>
                 ))}
               </select>
             </div>
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Position Title</label>
                  <input {...register('position_title')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
               <div>
                 <label className="text-xs font-semibold text-gray-700 mb-1 block">Appointment Type</label>
                 <select {...register('appointment_type')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200">
                    <option value="">Select...</option>
                    {APPOINTMENT_TYPE_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                 </select>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-2">
               <div>
                 <label className="text-xs font-semibold text-gray-700 mb-1 block">Salary Grade</label>
                 <select {...register('salary_grade')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200">
                    <option value="">Select...</option>
                    {SALARY_GRADE_OPTIONS.map(opt => (<option key={opt.value} value={Number(opt.value)}>{opt.label}</option>))}
                 </select>
               </div>
               <div>
                 <label className="text-xs font-semibold text-gray-700 mb-1 block">Step Increment</label>
                 <select {...register('step_increment')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (<option key={s} value={s}>Step {s}</option>))}
                 </select>
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
                  <input type="date" {...register('birth_date')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
               <div>
                 <label className="text-xs font-semibold text-gray-700 mb-1 block">Gender</label>
                 <select {...register('gender')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200">
                    <option value="">Select...</option>
                    {GENDER_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                 </select>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Civil Status</label>
                  <select {...register('civil_status')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200">
                     <option value="">Select...</option>
                     {CIVIL_STATUS_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
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
                  <input type="tel" {...register('phone_number')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
              </div>
              <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Permanent Address</label>
                  <textarea rows={2} {...register('permanent_address')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200 resize-none" />
              </div>
           </CollapsibleSection>
 
           {/* Government IDs - Collapsible */}
           <CollapsibleSection title="Government IDs" isOpen={openSections.government} onToggle={() => toggleSection('government')}>
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">GSIS Number</label>
                  <input type="text" {...register('gsis_number')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">PhilHealth</label>
                  <input type="text" {...register('philhealth_number')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
             </div>
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Pag-IBIG</label>
                  <input type="text" {...register('pagibig_number')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">TIN</label>
                  <input type="text" {...register('tin_number')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
             </div>
           </CollapsibleSection>

           {/* Eligibility & Qualifications - Collapsible (Plantilla Required) */}
           <CollapsibleSection title="Eligibility & Qualifications (Plantilla Required)" isOpen={openSections.eligibility} onToggle={() => toggleSection('eligibility')}>
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Eligibility Type</label>
                  <select {...register('eligibility_type')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200">
                     <option value="">Select...</option>
                     {ELIGIBILITY_TYPE_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
               </div>
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Eligibility Number</label>
                  <input type="text" {...register('eligibility_number')} placeholder="License/Eligibility No." className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
             </div>
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Eligibility Date</label>
                  <input type="date" {...register('eligibility_date')} className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Years of Experience</label>
                  <input type="number" {...register('years_of_experience')} min="0" className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
             </div>
             <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Highest Education</label>
                <input type="text" {...register('highest_education')} placeholder="e.g., Bachelor of Science in Accountancy" className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
             </div>
           </CollapsibleSection>

           {/* Social Media - Collapsible */}
           <CollapsibleSection title="Social Media" isOpen={openSections.socialMedia} onToggle={() => toggleSection('socialMedia')}>
             <div className="grid grid-cols-1 gap-2">
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Facebook URL</label>
                  <input type="url" {...register('facebook_url')} placeholder="https://facebook.com/username" className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">LinkedIn URL</label>
                  <input type="url" {...register('linkedin_url')} placeholder="https://linkedin.com/in/username" className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
               </div>
               <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Twitter/X Handle</label>
                  <input type="text" {...register('twitter_handle')} placeholder="username (without @)" className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" />
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
