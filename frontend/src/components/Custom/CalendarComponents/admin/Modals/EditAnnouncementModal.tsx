import { X, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@/lib/zodResolver';
import { announcementSchema } from '@/schemas/calendar';
import { formatHour12, convertTo24Hour } from '../../shared/utils/eventUtils';
import Combobox from '@/components/Custom/Combobox';

import { Announcement, AnnouncementFormData } from '@/types/calendar';

interface EditAnnouncementModalProps {
  show: boolean;
  announcement: Announcement | null;
  onClose: () => void;
  onUpdate: (id: string | number, data: AnnouncementFormData) => void;
  hours?: string[];
}

export default function EditAnnouncementModal({ show, announcement, onClose, onUpdate, hours = [] }: EditAnnouncementModalProps) {
  const {
      register,
      handleSubmit,
      reset,
      watch,
      setValue,
      formState: { errors, isSubmitting }
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
        title: '',
        content: '',
        priority: 'normal',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: ''
    }
  });

  useEffect(() => {
    if (announcement) {
      reset({
          title: announcement.title || '',
          content: announcement.content || '',
          priority: (announcement.priority as "normal" | "high" | "urgent") || 'normal',
          startDate: announcement.startDate ? String(announcement.startDate).split('T')[0] : '',
          endDate: announcement.endDate ? String(announcement.endDate).split('T')[0] : '',
          startTime: formatHour12(convertTo24Hour(announcement.startTime)), // Use 12h format
          endTime: formatHour12(convertTo24Hour(announcement.endTime)) // Use 12h format
      });
    }
  }, [announcement, reset]);

  if (!show || !announcement) return null;

  const onSubmit = (data: AnnouncementFormData) => {
    onUpdate(announcement.id, data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full"> 
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Edit Announcement</h2>
            <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
                <X className="w-5 h-5" />
            </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto">
            <div className="space-y-4">
                {/* Structure matching previous... skipping to Times */}
                <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input type="text" {...register('title')} className={`w-full px-4 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm`} placeholder="Announcement Headline" />
                 {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>}
                </div>

                <div className="z-[30] relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                <Combobox
                  options={[
                    { value: 'normal', label: 'Normal' },
                    { value: 'high', label: 'High Priority' },
                    { value: 'urgent', label: 'Urgent' }
                  ]}
                  value={watch('priority')}
                  onChange={(val) => setValue('priority', val as never)}
                  placeholder="Select Priority"
                  buttonClassName="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white"
                />
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                    <input type="date" {...register('startDate')} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                    <input type="date" {...register('endDate')} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm" />
                </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div className="z-[20] relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Start Time
                    </label>
                    <Combobox
                      options={hours.map(h => ({ value: h, label: h }))}
                      value={watch('startTime')}
                      onChange={(val) => setValue('startTime', val)}
                      placeholder="Select Start Time"
                      buttonClassName="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                    />
                </div>
                <div className="z-[20] relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> End Time
                    </label>
                    <Combobox
                      options={hours.map(h => ({ value: h, label: h }))}
                      value={watch('endTime')}
                      onChange={(val) => setValue('endTime', val)}
                      placeholder="Select End Time"
                      buttonClassName="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                    />
                </div>
                </div>

                <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Description
                </label>
                <textarea
                    {...register('content')}
                    className={`w-full px-4 py-2 border ${errors.content ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm h-32 resize-none`}
                    placeholder="Write your announcement description here..."
                />
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
                Update Announcement
            </button>
            </div>
        </form>
      </div>
    </div>
  );
}
