import { X, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { announcementSchema, AnnouncementSchema } from '@/schemas/calendar';
import { useEffect } from 'react';

interface CreateAnnouncementModalProps {
  show: boolean;
  onClose: () => void;
  onCreate: (announcement: any) => void;
  hours?: string[];
}

export default function CreateAnnouncementModal({ show, onClose, onCreate, hours = [] }: CreateAnnouncementModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(announcementSchema),
        defaultValues: {
            title: '',
            content: '',
            priority: 'normal',
            start_date: '',
            end_date: '',
            start_time: '9:00 AM', // Default
            end_time: '5:00 PM'   // Default
        }
    });

  useEffect(() => {
    if (show) {
        reset({
            title: '',
            content: '',
            priority: 'normal',
            start_date: '',
            end_date: '',
            start_time: '9:00 AM',
            end_time: '5:00 PM'
        });
    }
  }, [show, reset]);
  
  // ... onSubmit ...

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
       {/* ... wrapper ... */}
       <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col h-full">
            {/* ... header ... */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">New Announcement</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
            </button>
            </div>

            <div className="p-6 overflow-y-auto">
            <div className="space-y-4">
                {/* Title and Priority sections same as before... I'll include them to be safe with replace block but trying to minimize */}
                <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                <input type="text" {...register('title')} className={`w-full px-4 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm`} placeholder="Announcement Headline" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>}
                </div>

                <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                <select {...register('priority')} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm bg-white">
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                    <input type="date" {...register('start_date')} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                    <input type="date" {...register('end_date')} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm" />
                </div>
                </div>

                {/* Times with Dropdown */}
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Start Time
                    </label>
                    <select {...register('start_time')} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm bg-white">
                        {hours.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> End Time
                    </label>
                    <select {...register('end_time')} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm bg-white">
                        {hours.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
                    </select>
                </div>
                </div>

                <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
                <textarea {...register('content')} className={`w-full px-4 py-2 border ${errors.content ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm h-32 resize-none`} placeholder="Write your announcement here..." />
                 {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content.message as string}</p>}
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
                Post Announcement
            </button>
            </div>
        </form>
      </div>
    </div>
  );
}
