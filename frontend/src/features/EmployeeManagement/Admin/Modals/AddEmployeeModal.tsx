import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { X, User, Briefcase, Mail, Phone, Calendar, Shield, CreditCard, MapPin, Building, FileText, Loader } from 'lucide-react';
import { plantillaApi } from '@/api/plantillaApi';
import { employeeApi } from '@/api/employeeApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores';
import { CreateEmployeeSchema, CreateEmployeeInput } from '@/schemas/employeeSchema';
import { ApiError } from '@/types';
import {
  ROLE_OPTIONS,
  APPOINTMENT_TYPE_OPTIONS,
  GENDER_OPTIONS,
  CIVIL_STATUS_OPTIONS
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
      nationality: 'Filipino',
      employmentStatus: 'Active',
      employmentType: 'Probationary',
      isRegular: false,
      departmentId: null,
      positionId: null
    }
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async (data: CreateEmployeeInput) => {
        return await employeeApi.addEmployee(data);
    },
    onSuccess: (res) => {
        if (res.success) {
            showToast('Employee added successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            reset();
            onClose();
            if (onSuccess) onSuccess();
        } else {
            showToast(res.message || 'Failed to add employee', 'error');
        }
    },
    onError: (error: unknown) => {
        const err = error as ApiError;
        console.error('Failed to add employee', err);
        showToast(err.response?.data?.message || err.message || 'Failed to add employee', 'error');
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
    } catch (err: unknown) {
      const error = err as ApiError;
      console.error("Failed to load plantilla", error);
    }
  };

  const handlePlantillaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemNo = e.target.value;
    setValue('itemNumber', itemNo);
    
    if (itemNo) {
      const position = vacantPositions.find(p => p.itemNumber === itemNo);
      if (position) {
        setValue('positionTitle', position.positionTitle || '');
        setValue('positionId', position.id);
        const sg = parserSalaryGrade(position.salaryGrade);
        if (sg !== undefined) setValue('salaryGrade', sg);
        setValue('stepIncrement', position.stepIncrement || 1);
        if (position.department) {
             setValue('department', position.department);
             // Try to find dept id
             const dept = departments.find(d => d.name === position.department);
             if (dept) setValue('departmentId', dept.id);
        }
      }
    } else {
        setValue('positionId', null);
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
                  placeholder="juan@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                  <Shield size={14} className="text-gray-400" /> System Role *
                </label>
                <select 
                  {...register('role')}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm appearance-none"
                >
                  {ROLE_OPTIONS.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Security Note</p>
                <p className="text-xs text-blue-800">A default password will be generated. The employee must change it upon first login.</p>
              </div>
            </>
          )}

          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <Calendar size={14} className="text-gray-400" /> Birth Date
                  </label>
                  <input 
                    type="date"
                    {...register('birthDate')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <User size={14} className="text-gray-400" /> Sex
                  </label>
                  <select 
                    {...register('gender')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm"
                  >
                    <option value="">Select</option>
                    {GENDER_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Civil Status</label>
                  <select 
                    {...register('civilStatus')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm"
                  >
                    <option value="">Select</option>
                    {CIVIL_STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Nationality</label>
                  <input 
                    {...register('nationality')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                  <Phone size={14} className="text-gray-400" /> Mobile Number
                </label>
                <input 
                  {...register('phoneNumber')}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm"
                  placeholder="09xx-xxx-xxxx"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" /> Current Address
                </label>
                <textarea 
                  {...register('address')}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm resize-none"
                />
              </div>
            </>
          )}

          {/* Gov't IDs Tab */}
          {activeTab === 'government' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <CreditCard size={14} className="text-gray-400" /> PhilHealth No.
                  </label>
                  <input 
                    {...register('philhealthNumber')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <CreditCard size={14} className="text-gray-400" /> Pag-IBIG No.
                  </label>
                  <input 
                    {...register('pagibigNumber')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <CreditCard size={14} className="text-gray-400" /> TIN No.
                  </label>
                  <input 
                    {...register('tinNumber')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <CreditCard size={14} className="text-gray-400" /> GSIS BP No.
                  </label>
                  <input 
                    {...register('gsisNumber')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {/* Employment Tab */}
          {activeTab === 'employment' && (
            <>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-4">
                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Briefcase size={12} /> Plantilla Linkage
                </p>
                <select 
                  onChange={handlePlantillaChange}
                  value={watch('itemNumber') || ''}
                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-sm"
                >
                  <option value="">Select Vacant Plantilla Item (Optional)</option>
                  {vacantPositions.map(pos => (
                    <option key={pos.id} value={pos.itemNumber}>
                      {pos.itemNumber} - {pos.positionTitle} (SG {pos.salaryGrade})
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-amber-700 mt-2 italic">Linking to Plantilla automatically fills position, SG, and department details.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <Building size={14} className="text-gray-400" /> Department *
                  </label>
                  <select 
                    {...register('department')}
                    className={`w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm ${errors.department ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <Briefcase size={14} className="text-gray-400" /> Position Title
                  </label>
                  <input 
                    {...register('positionTitle')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Appointment Type</label>
                  <select 
                    {...register('appointmentType')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm"
                  >
                    <option value="">Select</option>
                    {APPOINTMENT_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Employment Type</label>
                  <select 
                    {...register('employmentType')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm"
                  >
                    <option value="Probationary">Probationary</option>
                    <option value="Regular">Regular</option>
                    <option value="Job Order">Job Order</option>
                    <option value="Contractual">Contractual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <Calendar size={14} className="text-gray-400" /> Date Hired
                  </label>
                  <input 
                    type="date"
                    {...register('dateHired')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <FileText size={14} className="text-gray-400" /> Employee ID
                  </label>
                  <input 
                    {...register('employeeId')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm"
                    placeholder="Leave blank for auto"
                  />
                </div>
              </div>
            </>
          )}

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
            disabled={addEmployeeMutation.isPending}
            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {addEmployeeMutation.isPending && <Loader className="animate-spin" size={16} />}
            Onboard Member
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
