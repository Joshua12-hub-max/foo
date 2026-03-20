import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema } from '@/schemas/calendar';
import { CalendarEvent, EventFormData } from '@/types/calendar';
import { Department } from '@/types/org';
import { formatHour12, convertTo24Hour } from '../../shared/utils/eventUtils';
import Combobox from '@/components/Custom/Combobox';

interface EditEventModalProps {
  show: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  onUpdate: (data: CalendarEvent) => void;
  hours: string[];
  departments?: Department[];
}

/**
 * Edit Event Modal
 * Modal for editing existing events with start/end date and department support
 */
const EditEventModal = ({ show, event, onClose, onUpdate, hours = [], departments = [] }: EditEventModalProps) => {

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
        time: event.time ? formatHour12(convertTo24Hour(String(event.time))) : '', 
        description: event.description || '', 
        department: event.department || '', 
        recurringPattern: event.recurringPattern || 'none', 
        recurringEndDate: event.recurringEndDate || '' 
      });
    }
  }, [event, reset]);

  const onSubmit = (data: EventFormData) => {
    if (!event) return;
    onUpdate({ 
      ...event,
      ...data,
      date: data.startDate,
      time: data.time ? convertTo24Hour(data.time) : null,
      department: data.department || null
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
              <div className="z-[30] relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Time
                </label>
                <Combobox
                  options={hours.map(h => ({ value: h, label: h }))}
                  value={watch('time')}
                  onChange={(val) => setValue('time', val)}
                  placeholder="Select time"
                  buttonClassName="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                />
              </div>

              <div className="z-[30] relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Department
                </label>
                <Combobox
                  options={[
                    { value: '', label: 'All Departments' },
                    ...departments.map(dept => {
                      const name = typeof dept === 'string' ? dept : (dept as Department).name || '';
                      return { value: name, label: name };
                    })
                  ]}
                  value={watchedDepartment || ''}
                  onChange={(val) => setValue('department', val || '')}
                  placeholder="All Departments"
                  buttonClassName="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                />
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
