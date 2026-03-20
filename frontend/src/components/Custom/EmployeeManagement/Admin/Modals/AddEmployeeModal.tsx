import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { X, User, Briefcase, Mail, Phone, Calendar, Shield, CreditCard, MapPin, Building, FileText, Loader } from 'lucide-react';
import Combobox from '@/components/Custom/Combobox';
import { plantillaApi } from '@/api/plantillaApi';
import { employeeApi } from '@/api/employeeApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores';
import { CreateEmployeeSchema, CreateEmployeeInput } from '@/schemas/employeeSchema';
import {
  ROLE_OPTIONS,
  APPOINTMENT_TYPE_OPTIONS,
  GENDER_OPTIONS,
  CIVIL_STATUS_OPTIONS,
  SALARY_GRADE_OPTIONS
} from '../constants/employeeConstants';

interface Department {
  id: number;
  name: string;
}

import { Position } from '@/api/plantillaApi';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  onSuccess?: () => void;
}

interface TabItem {
  id: string;
  label: string;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  departments,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [vacantPositions, setVacantPositions] = useState<Position[]>([]);
  
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm<CreateEmployeeInput>({
    resolver: zodResolver(CreateEmployeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      department: '',
      role: 'Employee',
      stepIncrement: 1,
      nationality: 'Filipino'
    }
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async (data: CreateEmployeeInput) => {
        await employeeApi.addEmployee(data);
    },
    onSuccess: () => {
        showToast('Employee added successfully', 'success');
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        reset();
        onClose();
        if (onSuccess) onSuccess();
    },
    onError: (error: unknown) => {
        const errMessage = error instanceof Error ? error.message : 'Failed to add employee';
        console.error('Failed to add employee', error);
        showToast(errMessage, 'error');
    }
  });

  useEffect(() => {
    if (isOpen) {
      loadVacantPositions();
      reset(); // Reset form when opening
    }
  }, [isOpen, reset]);

  const loadVacantPositions = async () => {
    try {
      const res = await plantillaApi.getPositions({ isVacant: true });
      if (res.data.success) {
        setVacantPositions(res.data.positions);
      }
    } catch (err) {
      console.error("Failed to load plantilla", err);
    }
  };

  const handlePlantillaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemNo = e.target.value;
    setValue('itemNumber', itemNo);
    
    if (itemNo) {
      const position = vacantPositions.find(p => p.itemNumber === itemNo);
      if (position) {
        setValue('positionTitle', position.positionTitle || '');
        const sg = parserSalaryGrade(position.salaryGrade);
        if (sg !== undefined) setValue('salaryGrade', sg);
        setValue('stepIncrement', position.stepIncrement || 1);
        if (position.department) setValue('department', position.department);
      }
    }
  };

  const parserSalaryGrade = (sg: string | number | undefined): number | undefined => {
      if(sg === undefined || sg === null) return undefined;
      const num = Number(sg);
      return isNaN(num) ? undefined : num;
  }

  if (!isOpen) return null;

  const tabs: TabItem[] = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'personal', label: 'Personal' },
    { id: 'government', label: 'Gov\'t IDs' },
    { id: 'employment', label: 'Employment' }
  ];

  const handleFormSubmit = (data: CreateEmployeeInput) => {
    addEmployeeMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl my-8 border border-gray-100 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Add New Employee</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'text-gray-900 border-b-2 border-gray-900 font-bold' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <User size={14} className="text-gray-400" /> First Name *
                  </label>
                  <input 
                    {...register('firstName')}
                    className={`w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm ${errors.firstName ? 'border-red-500' : ''}`}
                    placeholder="e.g. Juan"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <User size={14} className="text-gray-400" /> Last Name *
                  </label>
                  <input 
                    {...register('lastName')}
                    className={`w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm ${errors.lastName ? 'border-red-500' : ''}`}
                    placeholder="e.g. Dela Cruz"
                  />
                   {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                  <Mail size={14} className="text-gray-400" /> Email Address *
                </label>
                <input 
                  type="email" 
                  {...register('email')}
                  className={`w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="e.g. juan@agency.gov.ph"
                />
                 {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="z-50">
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <Building size={14} className="text-gray-400" /> Department *
                  </label>
                  <Combobox 
                    options={departments.map(d => ({ value: d.name, label: d.name }))}
                    value={watch('department')}
                    onChange={(val) => setValue('department', val, { shouldValidate: true })}
                    placeholder="Select..."
                    error={!!errors.department}
                  />
                   {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
                </div>
                <div className="z-50">
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <Shield size={14} className="text-gray-400" /> System Role *
                  </label>
                  <Combobox 
                    options={ROLE_OPTIONS}
                    value={watch('role')}
                    onChange={(val) => setValue('role', val as CreateEmployeeInput['role'], { shouldValidate: true })}
                    placeholder="Select role"
                    error={!!errors.role}
                  />
                   {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
                </div>
              </div>
            </>
          )}

          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="z-40">
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <Calendar size={14} className="text-gray-400" /> Birth Date
                  </label>
                  <input 
                    type="date" 
                    {...register('birthDate')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                  />
                </div>
                <div className="z-40">
                  <label className="text-sm text-gray-600 mb-1 block">Gender</label>
                  <Combobox 
                    options={GENDER_OPTIONS}
                    value={watch('gender')}
                    onChange={(val) => setValue('gender', val)}
                    placeholder="Select..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="z-30">
                  <label className="text-sm text-gray-600 mb-1 block">Civil Status</label>
                  <Combobox 
                    options={CIVIL_STATUS_OPTIONS}
                    value={watch('civilStatus')}
                    onChange={(val) => setValue('civilStatus', val)}
                    placeholder="Select..."
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Nationality</label>
                  <input 
                    type="text" 
                    {...register('nationality')}
                    placeholder="Filipino"
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                  <Phone size={14} className="text-gray-400" /> Phone Number
                </label>
                <input 
                  type="tel" 
                  {...register('phoneNumber')}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                  placeholder="e.g. 09171234567"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" /> Present Address
                </label>
                <textarea 
                  {...register('address')}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm resize-none" 
                  rows={2}
                  placeholder="House/Unit No., Street, Barangay, City/Municipality"
                />
              </div>
            </>
          )}

          {/* Government IDs Tab */}
          {activeTab === 'government' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <CreditCard size={14} className="text-gray-400" /> GSIS Number
                  </label>
                  <input 
                    type="text" 
                    {...register('gsisNumber')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                    placeholder="GSIS ID"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">PhilHealth Number</label>
                  <input 
                    type="text" 
                    {...register('philhealthNumber')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                    placeholder="XX-XXXXXXXXX-X"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Pag-IBIG Number</label>
                  <input 
                    type="text" 
                    {...register('pagibigNumber')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                    placeholder="XXXX-XXXX-XXXX"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">TIN</label>
                  <input 
                    type="text" 
                    {...register('tinNumber')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                    placeholder="XXX-XXX-XXX-XXX"
                  />
                </div>
              </div>
            </>
          )}

          {/* Employment Details Tab */}
          {activeTab === 'employment' && (
            <>
              {/* Plantilla Selection */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 z-40 relative">
                <label className="text-sm font-semibold text-gray-800 mb-1.5 block flex items-center gap-1">
                  <FileText size={14} className="text-gray-500" /> Select Plantilla Item (Optional)
                </label>
                <Combobox 
                  options={vacantPositions.map(pos => ({ 
                    value: pos.itemNumber, 
                    label: `${pos.itemNumber} - ${pos.positionTitle} (SG-${pos.salaryGrade})` 
                  }))}
                  value={watch('itemNumber')}
                  onChange={(val) => handlePlantillaChange({ target: { value: val } } as any)}
                  placeholder="Select available position..."
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Selecting a position will auto-fill Title, Salary Grade, and Department.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <Briefcase size={14} className="text-gray-400" /> Position Title
                  </label>
                  <input 
                    type="text" 
                    {...register('positionTitle')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                    placeholder="e.g. Administrative Officer III"
                  />
                </div>
                <div className="z-30">
                  <label className="text-sm text-gray-600 mb-1 block">Appointment Type</label>
                  <Combobox 
                    options={APPOINTMENT_TYPE_OPTIONS}
                    value={watch('appointmentType')}
                    onChange={(val) => setValue('appointmentType', val as any)}
                    placeholder="Select..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="z-20">
                  <label className="text-sm text-gray-600 mb-1 block">Salary Grade</label>
                  <Combobox 
                    options={SALARY_GRADE_OPTIONS.map(opt => ({ value: String(opt.value.replace('SG-', '')), label: opt.label }))}
                    value={String(watch('salaryGrade') || '')}
                    onChange={(val) => setValue('salaryGrade', Number(val))}
                    placeholder="Select..."
                  />
                </div>
                <div className="z-20">
                  <label className="text-sm text-gray-600 mb-1 block">Step Increment</label>
                  <Combobox 
                    options={[1, 2, 3, 4, 5, 6, 7, 8].map(step => ({ value: String(step), label: `Step ${step}` }))}
                    value={String(watch('stepIncrement') || 1)}
                    onChange={(val) => setValue('stepIncrement', Number(val))}
                    placeholder="Select..."
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Station/Assignment</label>
                <input 
                  type="text" 
                  {...register('station')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                  placeholder="e.g. Main Office - Manila"
                />
              </div>
            </>
          )}

          {/* Footer Buttons */}
          <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={addEmployeeMutation.isPending} 
              className="flex-1 px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg shadow-md hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {addEmployeeMutation.isPending && <Loader className="animate-spin" size={16} />}
              {addEmployeeMutation.isPending ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
