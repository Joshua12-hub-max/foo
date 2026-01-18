import React, { useState } from 'react';
import { X, Mail, Video, Globe, Wand2, Loader2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Applicant } from '../Hooks/useApplicantData';
import { recruitmentApi } from '@/api/recruitmentApi';
import { scheduleInterviewSchema, type ScheduleInterviewFormData } from '@/schemas/recruitmentSchema';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: ScheduleInterviewFormData) => void;
  selectedApplicant: Applicant | null;
  initialData?: Partial<ScheduleInterviewFormData>;
}

// Generate instant video meeting link using meet.jit.si (free, no account needed)
const generateJitsiLink = (applicantName: string): string => {
  const roomId = `nebr-interview-${applicantName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${Date.now().toString(36)}`;
  return `https://meet.jit.si/${roomId}`;
};

const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  selectedApplicant,
  initialData
}) => {
  const [isGeneratingJitsi, setIsGeneratingJitsi] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ScheduleInterviewFormData>({
    resolver: zodResolver(scheduleInterviewSchema),
    defaultValues: {
      date: initialData?.date || '',
      time: initialData?.time || '',
      platform: initialData?.platform || 'Jitsi Meet',
      link: initialData?.link || '',
      notes: initialData?.notes || ''
    }
  });

  const platform = watch('platform');
  const date = watch('date');
  const time = watch('time');

  // React Query mutation for Google Meet (requires OAuth)
  const generateGoogleMeetMutation = useMutation({
    mutationFn: async () => {
      if (!selectedApplicant || !date || !time) {
        throw new Error('Please select date and time first');
      }
      const dateTime = `${date}T${time}`;
      const response = await recruitmentApi.generateMeetingLink(
        selectedApplicant.id,
        dateTime,
        60
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.meetingLink) {
        setValue('link', data.meetingLink, { shouldValidate: true });
      }
    }
  });

  // Instant Jitsi Meet generation (no backend needed)
  const handleGenerateJitsi = () => {
    if (!selectedApplicant) return;
    setIsGeneratingJitsi(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      const link = generateJitsiLink(`${selectedApplicant.first_name}-${selectedApplicant.last_name}`);
      setValue('link', link, { shouldValidate: true });
      setIsGeneratingJitsi(false);
    }, 300);
  };

  const handleAutoGenerate = () => {
    if (platform === 'Jitsi Meet') {
      handleGenerateJitsi();
    } else if (platform === 'Google Meet') {
      generateGoogleMeetMutation.mutate();
    }
  };

  const onSubmit = (data: ScheduleInterviewFormData) => {
    onConfirm(data);
  };

  if (!isOpen) return null;

  const isGenerating = isGeneratingJitsi || generateGoogleMeetMutation.isPending;
  const canAutoGenerate = platform === 'Jitsi Meet' || platform === 'Google Meet';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <h3 className="text-lg font-bold text-gray-800">Schedule Interview</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto">
            <p className="text-sm text-gray-500 mb-6 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg border border-blue-100 flex items-center gap-2">
              <Mail size={16} />
              <span>This will send an invitation email to <strong>{selectedApplicant?.first_name}</strong>.</span>
            </p>
            
            <div className="space-y-5">
              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Date</label>
                  <input 
                    type="date" 
                    {...register('date')}
                    className={`w-full p-2.5 bg-gray-50 border rounded-lg text-sm focus:ring-2 focus:ring-gray-200 outline-none transition-all ${errors.date ? 'border-red-300' : 'border-gray-200'}`}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.date && (
                    <p className="text-xs text-red-500 mt-1 ml-1">{errors.date.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Time</label>
                  <input 
                    type="time" 
                    {...register('time')}
                    className={`w-full p-2.5 bg-gray-50 border rounded-lg text-sm focus:ring-2 focus:ring-gray-200 outline-none transition-all ${errors.time ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  {errors.time && (
                    <p className="text-xs text-red-500 mt-1 ml-1">{errors.time.message}</p>
                  )}
                </div>
              </div>

              {/* Platform */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Platform</label>
                <div className="grid grid-cols-3 gap-2">
                  <label className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${platform === 'Jitsi Meet' ? 'bg-orange-50 border-orange-200 text-orange-700 font-medium' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      value="Jitsi Meet" 
                      {...register('platform')}
                      className="hidden" 
                    />
                    <Video size={14} /> Jitsi
                  </label>
                  <label className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${platform === 'Google Meet' ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      value="Google Meet" 
                      {...register('platform')}
                      className="hidden" 
                    />
                    <Video size={14} /> Google
                  </label>
                  <label className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${platform === 'Zoom' ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      value="Zoom" 
                      {...register('platform')}
                      className="hidden" 
                    />
                    <Video size={14} /> Zoom
                  </label>
                </div>
                {platform === 'Jitsi Meet' && (
                  <p className="text-xs text-green-600 mt-1.5 ml-1">✓ Instant link generation - no setup required</p>
                )}
                {platform === 'Google Meet' && (
                  <p className="text-xs text-gray-500 mt-1.5 ml-1">Requires Google Calendar connection</p>
                )}
                {errors.platform && (
                  <p className="text-xs text-red-500 mt-1 ml-1">{errors.platform.message}</p>
                )}
              </div>

              {/* Meeting Link */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Meeting Link</label>
                  {canAutoGenerate && (
                    <button
                      type="button"
                      onClick={handleAutoGenerate}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 size={14} />
                          Auto-Generate
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="url" 
                    {...register('link')}
                    placeholder={platform === 'Zoom' ? "Paste your Zoom link" : "Click Auto-Generate"} 
                    className={`w-full pl-9 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-gray-200 outline-none transition-all ${errors.link ? 'border-red-300' : 'border-gray-200'}`}
                  />
                </div>
                {errors.link && (
                  <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.link.message}</p>
                )}
                {generateGoogleMeetMutation.isError && (
                  <div className="mt-1.5 ml-1">
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {(generateGoogleMeetMutation.error as Error)?.message || 'Failed to generate link.'}
                    </p>
                    {(generateGoogleMeetMutation.error as Error)?.message?.includes('Calendar not connected') && (
                      <p className="text-xs text-gray-500 mt-1">
                        Tip: Use <strong>Jitsi Meet</strong> for instant link generation without setup.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Message / Notes</label>
                <textarea 
                  {...register('notes')}
                  className="w-full p-3 border border-gray-200 rounded-lg h-24 text-sm focus:ring-2 focus:ring-gray-200 outline-none transition-all resize-none"
                  placeholder="Additional instructions for the applicant..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose} 
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Mail size={16} />
              )}
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;
