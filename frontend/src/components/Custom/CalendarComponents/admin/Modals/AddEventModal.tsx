import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema } from '@/schemas/calendar';
import { EventFormData } from '@/types/calendar';
import { Department } from '@/types/org';
import Combobox from '@/components/Custom/Combobox';

interface AddEventModalProps {
  show: boolean;
  onClose: () => void;
  onAdd: (data: EventFormData) => void;
  hours: string[];
  departments?: Department[];
}

export default function AddEventModal({ show, onClose, onAdd, hours = [], departments = [] }: AddEventModalProps) {

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
      time: '9:00 AM',
      description: '',
      department: '',
      recurringPattern: 'none'
    }
  });

  const watchedTime = watch('time');
  const watchedDepartment = watch('department');
  // Sync date fields
  const watchedStartDate = watch('startDate');

  useEffect(() => {
    if (watchedStartDate) {
       setValue('date', watchedStartDate);
    }
  }, [watchedStartDate, setValue]);


  useEffect(() => {
    if (show) {
        reset({
            title: '',
            date: new Date().toISOString().split('T')[0],
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            time: '9:00 AM',
            description: '',
            department: '',
            recurringPattern: 'none'
        });
    }
  }, [show, reset]);

  const onSubmit = (data: EventFormData) => {
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
                    {...register('startDate')}
                    className={`w-full px-4 py-2 border ${errors.startDate ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm`}
                    />
                     {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                    End Date
                    </label>
                    <input
                    type="date"
                    {...register('endDate')}
                    min={watchedStartDate}
                    className={`w-full px-4 py-2 border ${errors.endDate ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm`}
                    />
                     {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
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
                      value={watchedTime}
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
                      onChange={(val) => setValue('department', val || null)}
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
