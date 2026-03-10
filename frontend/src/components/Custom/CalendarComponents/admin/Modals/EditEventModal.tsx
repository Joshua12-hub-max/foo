import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema } from '@/schemas/calendar';
import { CalendarEvent, EventFormData } from '@/types/calendar';
import { Department } from '@/types/org';
import { formatHour12, convertTo24Hour } from '../../shared/utils/eventUtils';

interface EditEventModalProps {
  show: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  onUpdate: (data: EventFormData) => void;
  hours: string[];
  departments?: Department[];
}

/**
 * Edit Event Modal
 * Modal for editing existing events with start/end date and department support
 */
const EditEventModal = ({ show, event, onClose, onUpdate, hours = [], departments = [] }: EditEventModalProps) => {
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);

  const {
      register,
      handleSubmit,
      setValue,
      watch,
      reset,
      formState: { errors, isSubmitting }
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
        title: '',
        date: '',
        startDate: '',
        endDate: '',
        time: '',
        description: '',
        department: '',
        recurringPattern: 'none',
        recurringEndDate: ''
    }
  });

  // Watch fields
  const watchedDepartment = watch('department');

  // Populate form on event change
  useEffect(() => {
    if (event) {
      reset({ 
        title: event.title || '', 
        date: event.startDate || event.date || '',
        startDate: event.startDate || event.date || '', 
        endDate: event.endDate || event.startDate || event.date || '', 
        time: formatHour12(convertTo24Hour(event.time ?? undefined)), 
        description: event.description || '', 
        department: event.department || '', 
        recurringPattern: event.recurringPattern || 'none', 
        recurringEndDate: event.recurringEndDate || '' 
      });
    }
  }, [event, reset]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target as Node)) {
        setIsDeptOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onSubmit = (data: EventFormData) => {
    onUpdate({ 
      title: data.title, 
      startDate: data.startDate, 
      endDate: data.endDate, 
      date: data.startDate, 
      time: data.time ? (convertTo24Hour(data.time) as unknown as string) : null, 
      description: data.description, 
      department: data.department || null, 
      recurringPattern: data.recurringPattern, 
      recurringEndDate: data.recurringEndDate 
    });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Edit Event</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                {...register('title')}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm"
                placeholder="Enter event title"
                required
              />
            </div>

            {/* Date Fields - Grid Layout */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  min={watch('startDate')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm"
                />
              </div>
            </div>

            {/* Time and Department - Grid Layout */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Time
                </label>
                <select
                  {...register('time')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm bg-white"
                >
                  {hours.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
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
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar left-0">
                    <button
                      type="button"
                      onClick={() => {
                        setValue('department', '');
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
                          setValue('department', typeof dept === 'string' ? dept : (dept as Department).name || '');
                          setIsDeptOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                          watchedDepartment === (typeof dept === 'string' ? dept : (dept as Department).name) ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-600'
                        }`}
                      >
                        {typeof dept === 'string' ? dept : (dept as Department).name}
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
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm resize-none"
                placeholder="Enter event description"
              />
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
              Update Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;
