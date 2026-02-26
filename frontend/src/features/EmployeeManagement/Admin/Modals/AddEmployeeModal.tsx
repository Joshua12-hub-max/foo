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
      first_name: '',
      last_name: '',
      email: '',
      department: '',
      role: 'employee',
      step_increment: 1,
      nationality: 'Filipino',
      department_id: null,
      position_id: null
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
      const res = await plantillaApi.getPositions({ is_vacant: true });
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
    setValue('item_number', itemNo);
    
    if (itemNo) {
      const position = vacantPositions.find(p => p.item_number === itemNo);
      if (position) {
        setValue('position_title', position.position_title || '');
        setValue('position_id', position.id);
        const sg = parserSalaryGrade(position.salary_grade);
        if (sg !== undefined) setValue('salary_grade', sg);
        setValue('step_increment', position.step_increment || 1);
        if (position.department) {
             setValue('department', position.department);
             // Try to find dept id
             const dept = departments.find(d => d.name === position.department);
             if (dept) setValue('department_id', dept.id);
        }
      }
    } else {
        setValue('position_id', null);
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
                    {...register('first_name')}
                    className={`w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm ${errors.first_name ? 'border-red-500' : ''}`}
                    placeholder="e.g. Juan"
                  />
                  {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <User size={14} className="text-gray-400" /> Last Name *
                  </label>
                  <input 
                    {...register('last_name')}
                    className={`w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm ${errors.last_name ? 'border-red-500' : ''}`}
                    placeholder="e.g. Dela Cruz"
                  />
                   {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
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
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <Building size={14} className="text-gray-400" /> Department *
                  </label>
                  <select 
                     {...register('department')}
                     onChange={(e) => {
                         const val = e.target.value;
                         setValue('department', val);
                         const dept = departments.find(d => d.name === val);
                         if (dept) setValue('department_id', dept.id);
                     }}
                    className={`w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm ${errors.department ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select...</option>
                    {departments.map(d => (<option key={d.id} value={d.name}>{d.name}</option>))}
                  </select>
                   {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <Shield size={14} className="text-gray-400" /> System Role *
                  </label>
                  <select 
                     {...register('role')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                   {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
                </div>
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
                    {...register('birth_date')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Gender</label>
                  <select 
                    {...register('gender')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                  >
                    <option value="">Select...</option>
                    {GENDER_OPTIONS.map((option: { value: string; label: string }) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Civil Status</label>
                  <select 
                    {...register('civil_status')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                  >
                    <option value="">Select...</option>
                    {CIVIL_STATUS_OPTIONS.map((option: { value: string; label: string }) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Nationality</label>
                  <input 
                    type="text" 
                    {...register('nationality')}
                    placeholder="Filipino"
                    className="w-full px-3 py-2 xmlns:bg-[#F8F9FA] border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                  <Phone size={14} className="text-gray-400" /> Phone Number
                </label>
                <input 
                  type="tel" 
                  {...register('phone_number')}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Emergency Contact Person</label>
                  <input 
                    {...register('emergency_contact')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Emergency Phone</label>
                  <input 
                    {...register('emergency_contact_number')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                    placeholder="09XXXXXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Educational Background</label>
                <textarea 
                  {...register('educational_background')}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm resize-none" 
                  rows={2}
                  placeholder="Degree, School, Year Graduated"
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
                    {...register('gsis_number')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                    placeholder="GSIS ID"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">PhilHealth Number</label>
                  <input 
                    type="text" 
                    {...register('philhealth_number')}
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
                    {...register('pagibig_number')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                    placeholder="XXXX-XXXX-XXXX"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">TIN</label>
                  <input 
                    type="text" 
                    {...register('tin_number')}
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
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                <label className="text-sm font-semibold text-gray-800 mb-1 block flex items-center gap-1">
                  <FileText size={14} className="text-gray-500" /> Select Plantilla Item (Optional)
                </label>
                <select 
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 text-sm" 
                   {...register('item_number')}
                   onChange={handlePlantillaChange}
                >
                  <option value="">Select available position...</option>
                  {vacantPositions.map(pos => (
                    <option key={pos.id} value={pos.item_number}>
                      {pos.item_number} - {pos.position_title} (SG-{pos.salary_grade})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
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
                    {...register('position_title')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                    placeholder="e.g. Administrative Officer III"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Appointment Type</label>
                  <select 
                     {...register('appointment_type')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                  >
                    <option value="">Select...</option>
                    {APPOINTMENT_TYPE_OPTIONS.map((option: { value: string; label: string }) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Salary Grade</label>
                  <select 
                     {...register('salary_grade')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                  >
                    <option value="">Select...</option>
                    {SALARY_GRADE_OPTIONS.map((option: { value: string; label: string }) => (
                      <option key={option.value} value={Number(option.value)}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Step Increment</label>
                  <select 
                     {...register('step_increment')}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm" 
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(step => (
                      <option key={step} value={step}>Step {step}</option>
                    ))}
                  </select>
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
