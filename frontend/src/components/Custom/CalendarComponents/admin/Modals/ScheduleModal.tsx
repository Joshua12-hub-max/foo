import { Clock, X, User, Sparkles, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchEmployees } from "../../../../../api/employeeApi";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scheduleSchema, ScheduleSchema } from '@/schemas/calendar';
import { formatFullName } from '@/utils/nameUtils';
import { scheduleApi, ShiftTemplateData } from "@/api/scheduleApi";
import { formatHour12 } from "../../shared/utils/eventUtils";

interface EmployeeOption {
  id: number | string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}

interface ScheduleModalProps {
  show: boolean;
  onClose: () => void;
  onCreate: (data: ScheduleSchema) => void;
  hours?: string[];
}

export default function ScheduleModal({ show, onClose, onCreate, hours = [] }: ScheduleModalProps) {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplateData[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      employeeId: '',
      title: '',
      startDate: '',
      endDate: '',
      startTime: '9:00 AM',
      endTime: '5:00 PM',
      repeat: 'none',
      description: ''
    }
  });

  useEffect(() => {
    if (show) {
      reset({
          employeeId: '',
          title: '',
          startDate: '',
          endDate: '',
          startTime: '9:00 AM',
          endTime: '5:00 PM',
          repeat: 'none',
          description: ''
      }); // Reset form when modal opens
      
      const loadData = async () => {
        setLoadingTemplates(true);
        try {
          // Load templates independently
          try {
            const templateData = await scheduleApi.getShiftTemplates();
            if (templateData && templateData.templates) {
                setTemplates(templateData.templates);
            }
          } catch (tErr) {
            console.error('Failed to load shift templates:', tErr);
          }

          // Load employees independently
          try {
            const empData = await fetchEmployees();
            setEmployees(empData.employees || []);
          } catch (eErr) {
            console.error('Failed to load employees:', eErr);
          }
        } finally {
          setLoadingTemplates(false);
        }
      };
      loadData();
    }
  }, [show, reset]);

  const handleTemplateChange = (templateId: string) => {
    if (!templateId) return;
    const template = templates.find(t => String(t.id) === templateId);
    if (template) {
      setValue('startTime', formatHour12(template.startTime), { shouldValidate: true });
      setValue('endTime', formatHour12(template.endTime), { shouldValidate: true });
      if (!watch('title')) {
        setValue('title', template.name);
      }
    }
  };
  
  const onSubmit = (data: ScheduleSchema) => {
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
                
                {/* Shift Template Selection */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Quick Shift Template
                    </label>
                    <div className="relative">
                        <select
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        disabled={loadingTemplates}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm bg-white disabled:bg-gray-50 disabled:cursor-not-allowed appearance-none"
                        >
                        <option value="">{loadingTemplates ? 'Loading templates...' : 'Select a template for quick fill...'}</option>
                        {!loadingTemplates && templates.length === 0 && <option value="" disabled>No templates found</option>}
                        {templates.map((temp) => (
                            <option key={temp.id} value={temp.id}>
                            {temp.name} ({formatHour12(temp.startTime)} - {formatHour12(temp.endTime)})
                            </option>
                        ))}
                        </select>
                        {loadingTemplates && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Employee Selection */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Select Employee
                    </label>
                    <select
                    {...register('employeeId')}
                    className={`w-full px-4 py-2 border ${errors.employeeId ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm bg-white`}
                    >
                    <option value="">Select an employee...</option>
                    {employees.map((emp) => (
                        <option key={emp.id} value={emp.employeeId}>
                        {formatFullName(emp.lastName, emp.firstName)} ({emp.employeeId})
                        </option>
                    ))}
                    </select>
                    {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId.message as string}</p>}
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
                        {...register('startDate')}
                        className={`w-full px-4 py-2 border ${errors.startDate ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm`}
                    />
                    {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message as string}</p>}
                    </div>

                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        End Date
                    </label>
                    <input
                        type="date"
                        {...register('endDate')}
                        className={`w-full px-4 py-2 border ${errors.endDate ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm`}
                    />
                     {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message as string}</p>}
                    </div>
                </div>

                {/* Times - Grid Layout */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Start Time
                    </label>
                    <select
                        {...register('startTime')}
                        className={`w-full px-4 py-2 border ${errors.startTime ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm bg-white`}
                    >
                        {hours.map((hour) => (
                          <option key={hour} value={hour}>{hour}</option>
                        ))}
                    </select>
                     {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime.message as string}</p>}
                    </div>

                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> End Time
                    </label>
                    <select
                        {...register('endTime')}
                        className={`w-full px-4 py-2 border ${errors.endTime ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm bg-white`}
                    >
                        {hours.map((hour) => (
                          <option key={hour} value={hour}>{hour}</option>
                        ))}
                    </select>
                     {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime.message as string}</p>}
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
