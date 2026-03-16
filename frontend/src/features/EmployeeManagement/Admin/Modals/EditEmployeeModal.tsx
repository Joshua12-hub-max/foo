import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { X, ChevronUp, ChevronDown, FileText, Loader, Sparkles, Clock, Loader2 } from 'lucide-react';
import { plantillaApi } from '@/api/plantillaApi';
import { employeeApi } from '@/api/employeeApi';
import { scheduleApi, ShiftTemplateData } from '@/api/scheduleApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores';
import { UpdateEmployeeSchema, UpdateEmployeeInput } from '@/schemas/employeeSchema';
import { formatHour12 } from '@/components/Custom/CalendarComponents/shared/utils/eventUtils';
import {
  ROLE_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  APPOINTMENT_TYPE_OPTIONS,
  GENDER_OPTIONS,
  CIVIL_STATUS_OPTIONS,
  BLOOD_TYPE_OPTIONS,
  NATIONALITY_OPTIONS,
  ELIGIBILITY_TYPE_OPTIONS
} from '../constants/employeeConstants';

interface Department {
  id: number;
  name: string;
}

import { Position } from '@/api/plantillaApi';
import { EmployeeDetailed } from '@/types/employee';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: EmployeeDetailed;
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
    employment: true,
    schedule: true
  });
  const [vacantPositions, setVacantPositions] = useState<Position[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplateData[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<UpdateEmployeeInput>({
    resolver: zodResolver(UpdateEmployeeSchema),
    defaultValues: {}
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateEmployeeInput) => {
        if (!employee?.id) throw new Error("No employee ID");
        return await employeeApi.updateEmployee(employee.id, data);
    },
    onSuccess: (res) => {
        if (res.success) {
            showToast('Employee updated successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['employee', employee?.id] });
            if (onSuccess) onSuccess();
            onClose();
        } else {
            showToast(res.message || 'Failed to update employee', 'error');
        }
    },
    onError: (error: Error | { response?: { data?: { message?: string } } }) => {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        console.error('Failed to update employee', err);
        showToast(err.response?.data?.message || err.message || 'Failed to update employee', 'error');
    }
  });

  useEffect(() => {
    if (isOpen && employee) {
      loadPlantillaOptions();
      fetchTemplates();
      // Reset form with employee data
      reset({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        department: employee.department || '',
        role: employee.role || 'Employee',
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
        yearsOfExperience: employee.yearsOfExperience ? Number(employee.yearsOfExperience) : 0,
        // Schedule fields
        startTime: employee.startTime || '',
        endTime: employee.endTime || '',
        // IDs
        departmentId: employee.departmentId,
        positionId: employee.positionId
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
              salaryGrade: Number(employee.salaryGrade || 0), // number
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

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await scheduleApi.getShiftTemplates();
      if (response.success) {
        setTemplates(response.templates || []);
      }
    } catch (err) {
      console.error('Failed to fetch shift templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    if (!templateId) return;
    const template = templates.find(t => String(t.id) === templateId);
    if (template) {
      // Input type="time" expects HH:mm or HH:mm:ss
      setValue('startTime', template.startTime, { shouldValidate: true });
      setValue('endTime', template.endTime, { shouldValidate: true });
    }
  };

  const handlePlantillaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemNo = e.target.value;
    setValue('itemNumber', itemNo);
    if (itemNo) {
      const position = vacantPositions.find(p => p.itemNumber === itemNo);
      if (position) {
        setValue('positionTitle', position.positionTitle);
        setValue('positionId', position.id);
        setValue('salaryGrade', Number(position.salaryGrade));
        setValue('stepIncrement', position.stepIncrement || 1);
        if (position.department) {
             setValue('department', position.department);
             const dept = departments.find(d => d.name === position.department);
             if (dept) setValue('departmentId', dept.id);
        }
      }
    } else {
        setValue('positionId', null);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl my-8 border border-gray-100 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Update Employee</h2>
            <p className="text-xs text-gray-500 mt-0.5">ID: {employee.employeeId || 'N/A'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto bg-gray-50/30">
          
          {/* CORE IDENTITY (Always Visible) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">First Name</label>
              <input 
                {...register('firstName')}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Last Name</label>
              <input 
                {...register('lastName')}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Email Address</label>
            <input 
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">System Role</label>
              <select 
                {...register('role')}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-sm font-semibold appearance-none"
              >
                {ROLE_OPTIONS.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Work Status</label>
              <select 
                {...register('employmentStatus')}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-sm font-semibold appearance-none"
              >
                {EMPLOYMENT_STATUS_OPTIONS.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </div>
          </div>

          {/* COLLAPSIBLE SECTIONS */}

          {/* Work Schedule */}
          <CollapsibleSection title="WORK SCHEDULE & SHIFTS" isOpen={openSections.schedule} onToggle={() => toggleSection('schedule')}>
             <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-blue-600" />
                    <p className="text-[10px] text-blue-600 font-bold uppercase">Quick Shift Template</p>
                </div>
                <div className="relative">
                    <select 
                    onChange={handleTemplateChange}
                    disabled={loadingTemplates}
                    className="w-full px-2 py-1.5 bg-white border border-blue-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm disabled:opacity-50 appearance-none"
                    >
                    <option value="">{loadingTemplates ? 'Loading templates...' : '(Select a shift template...)'}</option>
                    {!loadingTemplates && templates.length === 0 && <option value="" disabled>No templates found</option>}
                    {templates.map(temp => (
                        <option key={temp.id} value={temp.id}>
                        {temp.name} ({temp.startTime.substring(0,5)} - {temp.endTime.substring(0,5)})
                        </option>
                    ))}
                    </select>
                    {loadingTemplates && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <Loader2 size={12} className="animate-spin text-blue-400" />
                        </div>
                    )}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-1">
                      <Clock size={10} /> Shift Start
                  </label>
                  <input 
                    type="time"
                    step="1"
                    {...register('startTime')}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-gray-900 font-mono" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-1">
                      <Clock size={10} /> Shift End
                  </label>
                  <input 
                    type="time"
                    step="1"
                    {...register('endTime')}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-gray-900 font-mono" 
                  />
                </div>
             </div>
             <p className="text-[9px] text-gray-400 mt-1 italic italic">Setting the shift here defines the employee's default daily work hours for attendance tracking.</p>
          </CollapsibleSection>
          
          {/* Employment Linkage */}
          <CollapsibleSection title="EMPLOYMENT & PLANTILLA" isOpen={openSections.employment} onToggle={() => toggleSection('employment')}>
             <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-2">
                <p className="text-[9px] text-amber-600 font-bold uppercase mb-1">Plantilla Item</p>
                <select 
                  onChange={handlePlantillaChange}
                  value={watch('itemNumber') || ''}
                  className="w-full px-2 py-1.5 bg-white border border-amber-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-sm"
                >
                  <option value="">(Not Linked to Plantilla)</option>
                  {vacantPositions.map(pos => (
                    <option key={pos.id} value={pos.itemNumber}>
                      {pos.itemNumber} - {pos.positionTitle} (SG {pos.salaryGrade})
                    </option>
                  ))}
                </select>
             </div>

             <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">Department</label>
                  <select 
                    {...register('department')}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-gray-900"
                  >
                    <option value="">Select</option>
                    {departments.map(dept => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">Position Title</label>
                  <input {...register('positionTitle')} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-gray-900" />
                </div>
             </div>

             <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">SG</label>
                  <input type="number" {...register('salaryGrade', { valueAsNumber: true })} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-gray-900" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">Step</label>
                  <input type="number" {...register('stepIncrement', { valueAsNumber: true })} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-gray-900" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">Type</label>
                  <select {...register('appointmentType')} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-gray-900 appearance-none">
                    {APPOINTMENT_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
             </div>
          </CollapsibleSection>

          {/* Personal Info */}
          <CollapsibleSection title="PERSONAL DETAILS" isOpen={openSections.personal} onToggle={() => toggleSection('personal')}>
             <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">Birth Date</label>
                  <input type="date" {...register('birthDate')} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">Sex</label>
                  <select {...register('gender')} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none">
                    <option value="">Select</option>
                    {GENDER_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">Civil Status</label>
                  <select {...register('civilStatus')} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none">
                    <option value="">Select</option>
                    {CIVIL_STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">Nationality</label>
                  <select {...register('nationality')} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none">
                    {NATIONALITY_OPTIONS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                </div>
             </div>
             <div>
                <label className="text-[9px] font-bold text-gray-500 uppercase">Mobile Number</label>
                <input {...register('phoneNumber')} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none" placeholder="09xx-xxx-xxxx" />
             </div>
             <div>
                <label className="text-[9px] font-bold text-gray-500 uppercase">Address</label>
                <textarea {...register('address')} rows={2} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none resize-none" />
             </div>
          </CollapsibleSection>

          {/* Eligibility */}
          <CollapsibleSection title="ELIGIBILITY & EDUCATION" isOpen={openSections.eligibility} onToggle={() => toggleSection('eligibility')}>
             <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">Eligibility Type</label>
                  <select {...register('eligibilityType')} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none">
                    {ELIGIBILITY_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">License/Reg No.</label>
                  <input {...register('eligibilityNumber')} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none" />
                </div>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">Eligibility Date</label>
                  <input type="date" {...register('eligibilityDate')} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">Exp. (Years)</label>
                  <input type="number" {...register('yearsOfExperience', { valueAsNumber: true })} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none" />
                </div>
             </div>
             <div>
                <label className="text-[9px] font-bold text-gray-500 uppercase">Highest Education</label>
                <input {...register('educationalBackground')} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none" placeholder="e.g. Master of Arts in Public Admin" />
             </div>
          </CollapsibleSection>

          {/* Gov't IDs */}
          <CollapsibleSection title="GOVERNMENT IDENTIFICATION" isOpen={openSections.government} onToggle={() => toggleSection('government')}>
             <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">GSIS BP No.</label>
                  <input {...register('gsisNumber')} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">PhilHealth No.</label>
                  <input {...register('philhealthNumber')} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none" />
                </div>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">Pag-IBIG No.</label>
                  <input {...register('pagibigNumber')} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">TIN No.</label>
                  <input {...register('tinNumber')} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none" />
                </div>
             </div>
          </CollapsibleSection>

        </form>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSubmit(handleFormSubmit)}
            disabled={updateMutation.isPending}
            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {updateMutation.isPending && <Loader className="animate-spin" size={16} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
