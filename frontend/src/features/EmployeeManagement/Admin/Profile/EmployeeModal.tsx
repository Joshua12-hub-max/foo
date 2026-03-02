import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Briefcase, Calendar, Shield, Building } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmployeeModalSchema, EmployeeModalInput } from '@/schemas/employeeSchema';
// @ts-ignore
import { fetchDepartments } from '@api/departmentApi';

interface Department {
  id: number;
  name: string;
}

interface InitialData {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  department?: string;
  job_title?: string;
  employment_status?: string;
  employment_type?: string;
  date_hired?: string;
  contract_end_date?: string;
  regularization_date?: string;
}

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeModalInput) => void;
  initialData?: InitialData;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [departments, setDepartments] = useState<Department[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeModalInput>({
    resolver: zodResolver(EmployeeModalSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'employee',
      department: '',
      job_title: '',
      employment_status: 'Active',
      employment_type: 'Probationary',
      date_hired: '',
      contract_end_date: '',
      regularization_date: '',
    },
  });

  useEffect(() => {
    const loadDepts = async () => {
      try {
        const data = await fetchDepartments();
        if (data.success) setDepartments((data.departments as Department[]) || []);
      } catch (err) {
        // Error handled silently
      }
    };
    if (isOpen) loadDepts();
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      reset({
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        email: initialData.email || '',
        role: (initialData.role as 'admin' | 'Human Resource' | 'employee') || 'employee',
        department: initialData.department || '',
        job_title: initialData.job_title || '',
        employment_status: (initialData.employment_status as 'Active' | 'Inactive' | 'Terminated' | 'Resigned') || 'Active',
        employment_type: (initialData.employment_type as 'Regular' | 'Probationary' | 'Job Order' | 'Contractual') || 'Probationary',
        date_hired: initialData.date_hired ? initialData.date_hired.split('T')[0] : '',
        contract_end_date: initialData.contract_end_date ? initialData.contract_end_date.split('T')[0] : '',
        regularization_date: initialData.regularization_date ? initialData.regularization_date.split('T')[0] : '',
        password: '',
      });
    } else {
      reset({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        job_title: '',
        employment_status: 'Active',
        date_hired: '',
      });
    }
  }, [initialData, isOpen, reset]);

  const onFormSubmit = (data: EmployeeModalInput) => {
    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold text-gray-800">
              {initialData ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      {...register('first_name')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                    />
                  </div>
                  {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      {...register('last_name')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                    />
                  </div>
                  {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {!initialData && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    {...register('password')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                    placeholder="Initial password"
                  />
                </div>
              )}
            </div>

            {/* Job Info */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Job Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <select
                      {...register('department')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none appearance-none bg-white"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position Title</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      {...register('job_title')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <select
                      {...register('role')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none appearance-none bg-white"
                    >
                      <option value="employee">Employee</option>
                      <option value="Human Resource">Human Resource</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    {...register('employment_status')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Resigned">Resigned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Hired</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      type="date"
                      {...register('date_hired')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Employment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                      <select
                        {...register('employment_type')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-white"
                      >
                        <option value="Regular">Regular</option>
                        <option value="Probationary">Probationary</option>
                        <option value="Job Order">Job Order</option>
                        <option value="Contractual">Contractual</option>
                      </select>
                    </div>
                    
                    {/* Conditional Dates */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Contract End</label>
                          <input
                            type="date"
                            {...register('contract_end_date')}
                            className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 outline-none"
                            placeholder="For JO/Contract"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Regularization</label>
                          <input
                            type="date"
                            {...register('regularization_date')}
                            className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 outline-none"
                            placeholder="For Probationary"
                          />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-white bg-gray-900 hover:bg-gray-800 rounded-lg hover:shadow-lg transition-all font-medium"
              >
                {initialData ? 'Save Changes' : 'Create Employee'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EmployeeModal;
