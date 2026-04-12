import React, { useState, useEffect } from 'react';
import { X, Mail, Video, Globe, Wand2, Loader2, AlertCircle, CalendarCheck, Plug } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Applicant } from '@/types/recruitment';
import { recruitmentApi } from '@/api/recruitmentApi';
import { googleCalendarApi } from '@/api/googleCalendarApi';
import { zoomApi } from '@/api/zoomApi';
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
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
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

  useEffect(() => {
    if (isOpen) {
      reset({
        date: initialData?.date || selectedApplicant?.interviewDate?.split('T')[0] || '',
        time: initialData?.time || (selectedApplicant?.interviewDate ? new Date(selectedApplicant.interviewDate).toTimeString().substring(0, 5) : ''),
        platform: initialData?.platform || selectedApplicant?.interviewPlatform || 'Jitsi Meet',
        link: initialData?.link || selectedApplicant?.interviewLink || '',
        notes: initialData?.notes || selectedApplicant?.interviewNotes || ''
      });
    }
  }, [isOpen, selectedApplicant, initialData, reset]);

  const platform = watch('platform');
  const date = watch('date');
  const time = watch('time');

  // Type-safe error message extractor
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    return 'An unexpected error occurred';
  };

  // Check Google Calendar Connection Status
  const { data: googleSyncStatus, refetch: checkGoogleStatus } = useQuery({
    queryKey: ['googleCalendarStatus'],
    queryFn: async () => {
      const response = await googleCalendarApi.getSyncStatus();
      return response.data;
    },
    enabled: isOpen && platform === 'Google Meet',
    retry: false
  });

  const isGoogleConnected = googleSyncStatus?.connected;

  // Listen for OAuth callback messages from popup (secure with origin validation)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin for security (only trust our own frontend and backend URLs)
      const trustedOrigins = [
        'http://localhost:5173', 
        'http://localhost:5174', 
        'http://127.0.0.1:5173', 
        'http://127.0.0.1:5174',
        window.location.origin
      ];
      if (!trustedOrigins.includes(event.origin)) {
        return;
      }

      // Check if this is our Google auth success message
      const data = event.data as { status?: string; message?: string };
      if (data?.status === 'success' && data?.message === 'google-auth-success') {
        // Refresh the Google Calendar status
        checkGoogleStatus();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [checkGoogleStatus]);

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

  // Check Zoom Configuration Status
  const { data: zoomStatus } = useQuery({
    queryKey: ['zoomStatus'],
    queryFn: async () => {
      const response = await zoomApi.getStatus();
      return response.data;
    },
    enabled: isOpen && platform === 'Zoom',
    retry: false
  });

  const isZoomConfigured = zoomStatus?.configured;

  // React Query mutation for Zoom meeting creation
  const generateZoomMeetingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedApplicant || !date || !time) {
        throw new Error('Please select date and time first');
      }
      const response = await zoomApi.createMeeting({
        topic: `Interview Invitation - CHRMO Mey Portal`,
        startTime: `${date}T${time}:00`,
        duration: 60,
        applicantName: `${selectedApplicant.firstName} ${selectedApplicant.lastName}`,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.meetingLink) {
        setValue('link', data.meetingLink, { shouldValidate: true });
      }
    }
  });

  // Handle Google OAuth Connection
  const handleConnectGoogle = async () => {
    try {
      const { data } = await googleCalendarApi.getAuthUrl();
      if (data.authUrl) {
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        window.open(
          data.authUrl, 
          'Google Calendar Connect', 
          `width=${width},height=${height},top=${top},left=${left}`
        );
        
        // No more setInterval with popup.closed check! 
        // The popup will send a message back via postMessage, 
        // which our useEffect listener above will handle.
      }
    } catch (error) {
      console.error('Failed to initiate Google Auth', error);
    }
  };

  // Instant Jitsi Meet generation (no backend needed)
  const handleGenerateJitsi = () => {
    if (!selectedApplicant) return;
    setIsGeneratingJitsi(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      const link = generateJitsiLink(`${selectedApplicant.firstName}-${selectedApplicant.lastName}`);
      setValue('link', link, { shouldValidate: true });
      setIsGeneratingJitsi(false);
    }, 300);
  };

  const handleAutoGenerate = () => {
    if (platform === 'Jitsi Meet') {
      handleGenerateJitsi();
    } else if (platform === 'Google Meet') {
      if (isGoogleConnected) {
        generateGoogleMeetMutation.mutate();
      } else {
        handleConnectGoogle();
      }
    } else if (platform === 'Zoom') {
      if (isZoomConfigured) {
        generateZoomMeetingMutation.mutate();
      }
    }
  };

  const onSubmit = (data: ScheduleInterviewFormData) => {
    onConfirm(data);
  };

  if (!isOpen) return null;

  const isGenerating = isGeneratingJitsi || generateGoogleMeetMutation.isPending || generateZoomMeetingMutation.isPending;
  const canAutoGenerate = platform === 'Jitsi Meet' || platform === 'Google Meet' || (platform === 'Zoom' && isZoomConfigured);

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
              <span>This will send an invitation email to <strong>{selectedApplicant?.firstName}</strong>.</span>
            </p>
            
            <div className="space-y-5">
              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">Date</label>
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
                  <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">Time</label>
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
                <label className="block text-xs font-bold text-gray-500 tracking-wider mb-2 ml-1">Platform</label>
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
                  <div className="mt-1.5 ml-1">
                    {isGoogleConnected ? (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                         <CalendarCheck size={12} /> Connected to Google Calendar
                      </p>
                    ) : (
                      <button 
                        type="button" 
                        onClick={handleConnectGoogle}
                        className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                      >
                         <Plug size={12} /> Connect Google Calendar
                      </button>
                    )}
                  </div>
                )}
                {platform === 'Zoom' && (
                  <div className="mt-1.5 ml-1">
                    {isZoomConfigured ? (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                         <CalendarCheck size={12} /> Zoom is configured and ready
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                         <AlertCircle size={12} /> Zoom not configured. Please add credentials to .env
                      </p>
                    )}
                  </div>
                )}
                {errors.platform && (
                  <p className="text-xs text-red-500 mt-1 ml-1">{errors.platform.message}</p>
                )}
              </div>

              {/* Meeting Link */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-500 tracking-wider ml-1">Meeting Link</label>
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
                          {platform === 'Google Meet' && !isGoogleConnected ? 'Connect & Generate' : 'Auto-Generate'}
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
                      {getErrorMessage(generateGoogleMeetMutation.error)}
                    </p>
                    {getErrorMessage(generateGoogleMeetMutation.error).includes('Calendar not connected') && !isGoogleConnected && (
                      <p className="text-xs text-gray-500 mt-1">
                        Please connect your calendar using the link above.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">Message / Notes</label>
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
