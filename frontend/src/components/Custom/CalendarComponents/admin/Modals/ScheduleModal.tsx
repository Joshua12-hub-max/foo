import { Clock, X, User } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchEmployees } from "../../../../../api/employeeApi";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scheduleSchema } from '@/schemas/calendar';

interface ScheduleModalProps {
  show: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
  hours?: string[];
}

export default function ScheduleModal({ show, onClose, onCreate, hours = [] }: ScheduleModalProps) {
  const [employees, setEmployees] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      employee_id: '',
      title: '',
      start_date: '',
      end_date: '',
      start_time: '9:00 AM',
      end_time: '5:00 PM',
      repeat: 'none',
      description: ''
    }
  });

  useEffect(() => {
    if (show) {
      reset({
          employee_id: '',
          title: '',
          start_date: '',
          end_date: '',
          start_time: '9:00 AM',
          end_time: '5:00 PM',
          repeat: 'none',
          description: ''
      }); // Reset form when modal opens
      const loadEmployees = async () => {
        try {
          const data = await fetchEmployees();
          setEmployees(data.employees || []);
        } catch (err) {
          console.error(err);
        }
      };
      loadEmployees();
    }
  }, [show, reset]);
  
  const onSubmit = (data: any) => {
      // Map RHF data to expected keys if necessary, or just pass data
      // API expects: employee_id, title, start_date, end_date, start_time, end_time, repeat (snake_case in backend, mostly matched here)
      // Schema uses start_date, our RHF uses start_date.
      onCreate(data);
  };

  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      {/* Modal Card */}
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 shrink-0 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Create Employee Schedule</h2>
            <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                aria-label="Close modal"
            >
                <X className="w-5 h-5" />
            </button>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto">
            <div className="space-y-3">
                
                {/* Employee Selection */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Select Employee
                    </label>
                    <select
                    {...register('employee_id')}
                    className={`w-full px-4 py-2 border ${errors.employee_id ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm bg-white`}
                    >
                    <option value="">Select an employee...</option>
                    {employees.map((emp) => (
                        <option key={emp.id} value={emp.employee_id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_id})
                        </option>
                    ))}
                    </select>
                    {errors.employee_id && <p className="text-red-500 text-xs mt-1">{errors.employee_id.message as string}</p>}
                </div>

                {/* Title and Repeat - Grid Layout */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Schedule Title
                    </label>
                    <input
                        type="text"
                        {...register('title')}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm"
                        placeholder="e.g., Morning Shift"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Repeat
                    </label>
                    <select
                        {...register('repeat')}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm bg-white"
                    >
                        <option value="none">Does not repeat</option>
                        <option value="daily">Daily (Mon-Fri)</option>
                        <option value="weekly">Weekly</option>
                    </select>
                    </div>
                </div>

                {/* Dates - Grid Layout */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Start Date
                    </label>
                    <input
                        type="date"
                        {...register('start_date')}
                        className={`w-full px-4 py-2 border ${errors.start_date ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm`}
                    />
                    {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date.message as string}</p>}
                    </div>

                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        End Date
                    </label>
                    <input
                        type="date"
                        {...register('end_date')}
                        className={`w-full px-4 py-2 border ${errors.end_date ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm`}
                    />
                     {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date.message as string}</p>}
                    </div>
                </div>

                {/* Times - Grid Layout */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Start Time
                    </label>
                    <select
                        {...register('start_time')}
                        className={`w-full px-4 py-2 border ${errors.start_time ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm bg-white`}
                    >
                        {hours.map((hour) => (
                          <option key={hour} value={hour}>{hour}</option>
                        ))}
                    </select>
                     {errors.start_time && <p className="text-red-500 text-xs mt-1">{errors.start_time.message as string}</p>}
                    </div>

                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> End Time
                    </label>
                    <select
                        {...register('end_time')}
                        className={`w-full px-4 py-2 border ${errors.end_time ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm bg-white`}
                    >
                        {hours.map((hour) => (
                          <option key={hour} value={hour}>{hour}</option>
                        ))}
                    </select>
                     {errors.end_time && <p className="text-red-500 text-xs mt-1">{errors.end_time.message as string}</p>}
                    </div>    
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Description
                    </label>
                    <textarea
                    {...register('description')}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm resize-none"
                    placeholder="Add description (optional)"
                    />
                </div>
            </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
            <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
            >
                Cancel
            </button>

            <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 disabled:opacity-50"
            >
                Create Schedule
            </button>
            </div>
        </form>
      </div>
    </div>
  );
}
