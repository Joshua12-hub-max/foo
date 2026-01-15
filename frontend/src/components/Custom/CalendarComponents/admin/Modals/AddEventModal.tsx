import { useRef, useEffect, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema, EventSchema } from '@/schemas/calendar';

interface AddEventModalProps {
  show: boolean;
  onClose: () => void;
  onAdd: (data: EventSchema) => void;
  hours: string[];
  departments?: any[];
}

export default function AddEventModal({ show, onClose, onAdd, hours = [], departments = [] }: AddEventModalProps) {
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const deptDropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      date: '',
      start_date: '',
      end_date: '',
      time: '9:00 AM',
      description: '',
      department: ''
    }
  });

  const watchedTime = watch('time');
  const watchedDepartment = watch('department');
  // Sync date fields
  const watchedStartDate = watch('start_date');

  useEffect(() => {
    if (watchedStartDate) {
       setValue('date', watchedStartDate);
       // Optional: Set default end date to start date if empty?
       // setValue('end_date', watchedStartDate); // Only if we want that behavior
    }
  }, [watchedStartDate, setValue]);


  useEffect(() => {
    if (show) {
        reset({
            title: '',
            date: new Date().toISOString().split('T')[0],
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            time: '9:00 AM',
            description: '',
            department: ''
        });
    }
  }, [show, reset]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTimeOpen(false);
      }
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target as Node)) {
        setIsDeptOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onSubmit = (data: EventSchema) => {
    onAdd(data);
  };

  if (!show) return null; 

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full"> 
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 shrink-0 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Add New Event</h2>
            <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
                <X className="w-5 h-5" />
            </button>
            </div>

            {/* Form Content */}
            <div className="p-6 overflow-y-auto">
            <div className="space-y-4">
                {/* Event Title */}
                <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Event Title
                </label>
                <input
                    type="text"
                    {...register('title')}
                    className={`w-full px-4 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm`}
                    placeholder="Enter event name"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>

                {/* Date Fields - Grid Layout */}
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
                     {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                    End Date
                    </label>
                    <input
                    type="date"
                    {...register('end_date')}
                    min={watchedStartDate}
                    className={`w-full px-4 py-2 border ${errors.end_date ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm`}
                    />
                     {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>}
                </div>
                </div>

                {/* Time and Department - Grid Layout */}
                <div className="grid grid-cols-2 gap-4">
                  <div ref={dropdownRef} className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Time
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsTimeOpen(!isTimeOpen)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white text-left flex items-center justify-between text-sm hover:bg-gray-50 transition-colors"
                    >
                      <span className={watchedTime ? 'text-gray-900' : 'text-gray-400'}>
                        {watchedTime || 'Select time'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isTimeOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isTimeOpen && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar left-0">
                        {hours.map((hour, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setValue('time', hour);
                              setIsTimeOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                              watchedTime === hour ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-600'
                            }`}
                          >
                            {hour}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div ref={deptDropdownRef} className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Department
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsDeptOpen(!isDeptOpen)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white text-left flex items-center justify-between text-sm hover:bg-gray-50 transition-colors"
                    >
                      <span className={`block truncate ${watchedDepartment ? 'text-gray-900' : 'text-gray-400'}`}>
                        {watchedDepartment || 'All Departments'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isDeptOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDeptOpen && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar left-0">
                        <button
                          type="button"
                          onClick={() => {
                            setValue('department', null);
                            setIsDeptOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                            !watchedDepartment ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-600'
                          }`}
                        >
                          All Departments
                        </button>
                        {departments.map((dept, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setValue('department', dept.name || dept);
                              setIsDeptOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                              watchedDepartment === (dept.name || dept) ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-600'
                            }`}
                          >
                            {dept.name || dept}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Description
                </label>
                <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm resize-none"
                    placeholder="Enter event description"
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
                {isSubmitting ? 'Adding...' : 'Add Event'}
            </button>
            </div>
        </form>
      </div>
    </div>
  );
}
