import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fetchDepartments } from '@/api/departmentApi';
import { X, Fingerprint, Info, ChevronDown } from 'lucide-react';
import { EnrollmentSchema, EnrollmentFormData } from '../../schemas/biometricsSchema';
import { useStartEnrollment } from '../../Monitor/hooks/useBiometricsQuery';
import toast from 'react-hot-toast';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Department {
  id: number;
  name: string;
}

/**
 * This modal captures employee info for FINGERPRINT ENROLLMENT ONLY.
 * It does NOT create an account. The employee must register separately
 * via the public Register page to create their account and verify email.
 */
const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const startEnrollment = useStartEnrollment();
  
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isValid } 
  } = useForm<EnrollmentFormData>({
    resolver: zodResolver(EnrollmentSchema),
    mode: 'onChange',
    defaultValues: {
      employeeId: '',
      name: '',
      department: ''
    }
  });

  // Fetch departments when modal opens
  useEffect(() => {
    const loadDepartments = async () => {
      if (!isOpen) return;
      
      setLoadingDepartments(true);
      try {
        const response = await fetchDepartments();
        if (response.success && response.departments) {
          setDepartments(response.departments);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      } finally {
        setLoadingDepartments(false);
      }
    };

    loadDepartments();
  }, [isOpen]);

  // Reset form when closed/opened
  useEffect(() => {
    if (isOpen) {
        reset();
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = (data: EnrollmentFormData) => {
    startEnrollment.mutate(data, {
      onSuccess: (res) => {
        toast.success(res.message, { duration: 4000, icon: '👍' });
        // Optional: Show a more persistent distinct UI for "Place Finger Now"
        // But for now, toast is good feedback + the UI feedback in monitor
        
        // Wait a moment then close
        setTimeout(() => {
            onSuccess();
            onClose();
        }, 1500);
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || "Failed to start enrollment. Check device connection.";
        toast.error(msg);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-gray-200 animate-in fade-in zoom-in duration-200">
        <div className="bg-gray-100 px-6 py-4 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-800">
              Enroll New Fingerprint
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-red-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Info Banner */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> This only enrolls the fingerprint. The employee must register 
              separately on the <strong>Register page</strong> using the same Employee ID to create their account.
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Employee ID <span className="text-red-500">*</span>
            </label>
            <input 
              {...register('employeeId')}
              className={`w-full px-4 py-3 bg-gray-50 border-2 ${errors.employeeId ? 'border-red-300 focus:border-red-500' : 'border-gray-100 focus:border-gray-300'} rounded-xl text-gray-800 text-sm focus:outline-none transition-all`}
              placeholder="e.g. IT-001"
            />
            {errors.employeeId && (
                <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.employeeId.message}</p>
            )}
            <p className="text-[10px] text-gray-400 mt-1">Employee will use this ID when registering</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Full Name (for reference)
            </label>
            <input 
              {...register('name')}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-gray-300 transition-all"
              placeholder="e.g. Juan Dela Cruz"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Department (for reference)
            </label>
            <div className="relative">
              <select
                {...register('department')}
                disabled={loadingDepartments}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-gray-300 transition-all appearance-none cursor-pointer"
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                {loadingDepartments ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" disabled={startEnrollment.isPending || !isValid}
              className="flex-1 px-4 py-3 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {startEnrollment.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  <span>Start Enrollment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
