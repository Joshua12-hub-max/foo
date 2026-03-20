import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Briefcase, Calendar, Shield, Building } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Combobox from '@/components/Custom/Combobox';
import { EmployeeModalSchema, EmployeeModalInput } from '@/schemas/employeeSchema';
// @ts-ignore
import { fetchDepartments } from '@api/departmentApi';

interface Department {
  id: number;
  name: string;
}

interface InitialData {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  department?: string;
  jobTitle?: string;
  employmentStatus?: string;
  dateHired?: string;
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
    control,
    formState: { errors },
  } = useForm<EmployeeModalInput>({
    resolver: zodResolver(EmployeeModalSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'Employee',
      department: '',
      jobTitle: '',
      employmentStatus: 'Active',
      dateHired: '',
    },
  });

  useEffect(() => {
    const loadDepts = async () => {
      try {
        const data = await fetchDepartments();
        if (data.success) setDepartments(data.departments || []);
      } catch (err) {
        // Error handled silently
      }
    };
    if (isOpen) loadDepts();
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      reset({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        role: (initialData.role as 'Administrator' | 'Human Resource' | 'Employee') || 'Employee',
        department: initialData.department || '',
        jobTitle: initialData.jobTitle || '',
        employmentStatus: (initialData.employmentStatus as 'Active' | 'Inactive' | 'Terminated' | 'Resigned') || 'Active',
        dateHired: initialData.dateHired ? initialData.dateHired.split('T')[0] : '',
        password: '',
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'Employee',
        department: '',
        jobTitle: '',
        employmentStatus: 'Active',
        dateHired: '',
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

          <form onSubmit={handleSubmit((data) => onFormSubmit(data as EmployeeModalInput))} className="p-6 space-y-6">
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
                      {...register('firstName')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                    />
                  </div>
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      {...register('lastName')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                    />
                  </div>
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
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
                  <div className="relative z-[60]">
                    <Building className="absolute left-3 top-2.5 text-gray-400 z-10" size={18} />
                    <Controller
                      name="department"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={[
                            { value: '', label: 'Select Department' },
                            ...departments.map(dept => ({ value: dept.name, label: dept.name }))
                          ]}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select Department"
                          buttonClassName="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none h-[42px] font-bold"
                        />
                      )}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      {...register('jobTitle')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <div className="relative z-[60]">
                    <Shield className="absolute left-3 top-2.5 text-gray-400 z-10" size={18} />
                    <Controller
                      name="role"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={[
                            { value: 'Employee', label: 'Employee' },
                            { value: 'Human Resource', label: 'Human Resource' },
                            { value: 'Administrator', label: 'Administrator' }
                          ]}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select Role"
                          buttonClassName="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none h-[42px] font-bold"
                        />
                      )}
                    />
                  </div>
                  {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
                </div>
                <div className="relative z-[60]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Controller
                    name="employmentStatus"
                    control={control}
                    render={({ field }) => (
                      <Combobox
                        options={[
                          { value: 'Active', label: 'Active' },
                          { value: 'Inactive', label: 'Inactive' },
                          { value: 'Terminated', label: 'Terminated' },
                          { value: 'Resigned', label: 'Resigned' }
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select Status"
                        buttonClassName="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-white font-bold h-[42px]"
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Hired</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      type="date"
                      {...register('dateHired')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
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
