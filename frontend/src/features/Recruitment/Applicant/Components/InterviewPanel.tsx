import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  Video, PhoneOff, FileText, User, Calendar, Clock, 
  Maximize2, MessageSquare, Copy, CheckCircle2, ChevronRight,
  Monitor, Wifi, Sparkles, ExternalLink, Save, Loader2, X
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saveInterviewNotesSchema, SaveInterviewNotesFormData } from '../../../../schemas/recruitmentSchema';
import useInterviewStore from '../../../../stores/useInterviewStore';
import { useInterviewActions } from '../Hooks/useInterviewActions';
import ZoomMeetingEmbed from '@components/VideoCall/ZoomMeetingEmbed';
import { requestDownloadToken } from '@/Service/Auth';

import { motion, AnimatePresence } from 'framer-motion';

interface InterviewPanelProps {
  roomName: string;
  displayName: string;
  onClose: () => void;
  applicantId: number; 
  applicantName?: string;
  applicantEmail?: string;
  jobTitle?: string;
  interviewLink?: string;
  interviewPlatform?: string;
  resumePath?: string;
}

const InterviewPanel: React.FC<InterviewPanelProps> = ({
  displayName,
  onClose,
  applicantId,
  applicantName,
  applicantEmail,
  jobTitle,
  interviewLink,
  interviewPlatform,
  resumePath
}) => {
  // Zustand Store
  const { 
    isCallActive, 
    setCallActive, 
    startInterview: storeStartInterview, 
    endInterview: storeEndInterview 
  } = useInterviewStore();

  // React Query Mutation
  const { saveInterviewNotesMutation } = useInterviewActions();

  // Local State
  const [copied, setCopied] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [secureResumeUrl, setSecureResumeUrl] = useState<string | null>(null);
  const videoWindowRef = useRef<Window | null>(null);
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const loadSecureUrl = async () => {
      if (showResume && resumePath) {
        try {
          const token = await requestDownloadToken();
          if (token) {
            setSecureResumeUrl(`${apiUrl}/uploads/resumes/${resumePath}?token=${token}#toolbar=0`);
          } else {
            console.error('[InterviewPanel] No download token returned');
            setSecureResumeUrl(`${apiUrl}/uploads/resumes/${resumePath}#toolbar=0`);
          }
        } catch (err) {
          console.error('[InterviewPanel] Failed to load secure resume URL:', err);
          setSecureResumeUrl(`${apiUrl}/uploads/resumes/${resumePath}#toolbar=0`);
        }
      } else {
        setSecureResumeUrl(null);
      }
    };
    loadSecureUrl();
  }, [showResume, resumePath, apiUrl]);

  // Zoom Meeting Details parsing
  const zoomDetails = useMemo(() => {
    if (!interviewLink || interviewPlatform !== 'Zoom') return null;
    
    try {
      const url = new URL(interviewLink);
      // Handle standard /j/ format
      const pathParts = url.pathname.split('/');
      const meetingNumber = pathParts[pathParts.length - 1];
      const password = url.searchParams.get('pwd') || undefined;
      
      return { meetingNumber, password };
    } catch (err) {
      console.error('Failed to parse Zoom link:', err);
      return null;
    }
  }, [interviewLink, interviewPlatform]);

  const startVideoCall = () => {
    if (interviewLink) {
      setCallActive(true);
    }
  };

  const openInNewWindow = () => {
    if (interviewLink) {
      const width = 1200;
      const height = 800;
      const left = window.screen.width - width;
      const top = 0;
      
      videoWindowRef.current = window.open(
        interviewLink,
        'InterviewCall',
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
      );
    }
  };

  const endInterview = () => {
    if (videoWindowRef.current) {
      try {
        if (!videoWindowRef.current.closed) {
          videoWindowRef.current.close();
        }
      } catch (err) {
        console.debug('Window close blocked or already closed.');
      }
    }
    // Automatically save notes on end
    handleSubmit(onSaveNotes)();
    storeEndInterview();
    onClose();
  };

  const copyLink = () => {
    if (interviewLink) {
      navigator.clipboard.writeText(interviewLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onSaveNotes = (data: SaveInterviewNotesFormData) => {
    saveInterviewNotesMutation.mutate({ ...data, id: applicantId });
  };

  // React Hook Form
  const { 
    register, 
    handleSubmit, 
    formState: { isDirty, isSubmitting } 
  } = useForm<SaveInterviewNotesFormData>({
    resolver: zodResolver(saveInterviewNotesSchema),
    defaultValues: {
      applicantId: applicantId,
      notes: '',
    }
  });

  const isGMeet = interviewPlatform === 'Google Meet';

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-white/60 backdrop-blur-md flex justify-end font-sans overflow-hidden"
    >
      <div className="w-[94vw] h-full bg-[var(--zed-bg-light)] shadow-[-20px_0_80px_rgba(0,0,0,0.1)] flex overflow-hidden">
        
        {/* LEFT PANEL - APPLICANT INTEL (Zed Light Mode) */}
        <div className="w-[400px] bg-[var(--zed-bg-surface)] text-[var(--zed-text-dark)] flex flex-col border-r border-[var(--zed-border-light)] relative z-10">
          
          {/* Workspace Header */}
          <div className="p-8 bg-[var(--zed-bg-light)] border-b border-[var(--zed-border-light)] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--zed-primary)] flex items-center justify-center shadow-lg shadow-[var(--zed-primary)]/20">
                <Video size={24} className="text-white" />
              </div>
              <div>
                <h2 className="font-black text-lg text-[var(--zed-text-dark)] tracking-tight uppercase leading-none">Interview</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--zed-success)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--zed-success)]"></span>
                  </span>
                  <p className="text-[10px] font-black text-[var(--zed-text-muted)] tracking-[0.2em] uppercase">Workspace</p>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-[var(--zed-bg-dark)]/5 rounded-full text-[var(--zed-text-muted)] hover:text-[var(--zed-text-dark)] transition-all active:scale-90"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar scrollbar-premium">
            
            {/* APPLICANT IDENTITY (Zed Standard Light Card) */}
            <div className="bg-white rounded-[var(--radius-lg)] p-6 border border-[var(--zed-border-light)] shadow-sm">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 rounded-full bg-[var(--zed-primary)]/10 border-2 border-[var(--zed-primary)]/30 flex items-center justify-center p-1 shadow-inner">
                   <User size={32} className="text-[var(--zed-primary)]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-[var(--zed-text-dark)] tracking-tight truncate uppercase leading-none">{applicantName}</h3>
                  <p className="text-xs font-bold text-[var(--zed-text-muted)] truncate mt-2 tracking-wide uppercase">{applicantEmail}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--zed-bg-surface)] text-[10px] font-black text-[var(--zed-text-dark)] border border-[var(--zed-border-light)] tracking-widest uppercase">
                  {jobTitle || 'Role'}
                </span>
                <span className="px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--zed-primary)]/10 text-[10px] font-black text-[var(--zed-primary)] border border-[var(--zed-primary)]/20 tracking-widest uppercase">
                  {interviewPlatform}
                </span>
              </div>
            </div>

            {/* ACTION CENTER */}
            <div className="space-y-5">
              <h4 className="text-[10px] font-black text-[var(--zed-text-muted)] tracking-[0.2em] flex items-center gap-2 uppercase">
                <Monitor size={12} /> System Controls
              </h4>
              
              {!isCallActive ? (
                <button
                  onClick={startVideoCall}
                  className="w-full h-16 bg-[var(--zed-primary)] hover:bg-[var(--zed-primary-hover)] text-white rounded-[var(--radius-lg)] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 transition-all zed-shadow-lg active:scale-95"
                >
                  <Video size={24} />
                  <span>Join Session</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-[var(--zed-success)]/10 border border-[var(--zed-success)]/20 rounded-[var(--radius-lg)] p-5 flex items-center gap-4 text-[var(--zed-success)]">
                    <div className="w-10 h-10 rounded-full bg-[var(--zed-success)]/20 flex items-center justify-center animate-pulse">
                      <Wifi size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-xs uppercase tracking-[0.1em]">Stream Active</h3>
                    </div>
                  </div>
                  <button
                    onClick={openInNewWindow}
                    className="w-full py-4 bg-[var(--zed-bg-light)] hover:bg-[var(--zed-bg-surface)] text-[var(--zed-text-dark)] rounded-[var(--radius-lg)] font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-3 border border-white/10 transition-all active:scale-95"
                  >
                    <ExternalLink size={16} />
                    External Fallback
                  </button>
                </div>
              )}
            </div>

            {/* DOCUMENT VIEWER TOGGLE */}
            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-[var(--zed-text-muted)] tracking-[0.2em] uppercase">Intelligence</h4>
               <button
                 onClick={() => setShowResume(!showResume)}
                 className={`w-full flex items-center gap-4 p-4 rounded-[var(--radius-lg)] border transition-all active:scale-95 ${showResume ? 'bg-[var(--zed-primary)]/10 border-[var(--zed-primary)]/50 text-[var(--zed-primary)] shadow-md shadow-[var(--zed-primary)]/5' : 'bg-white border-[var(--zed-border-light)] hover:bg-[var(--zed-bg-surface)] text-[var(--zed-text-muted)]'}`}
               >
                 <FileText size={24} />
                 <div className="flex-1 text-left">
                   <div className="font-black text-xs uppercase tracking-widest">Resume Viewer</div>
                   <div className="text-[10px] font-bold opacity-60 uppercase mt-0.5">Toggle Preview</div>
                 </div>
               </button>
            </div>

            {/* MEETING DETAILS */}
            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-[var(--zed-text-muted)] tracking-[0.2em] uppercase">Credentials</h4>
               <div className="relative group">
                 <input 
                    type="text" 
                    readOnly 
                    value={interviewLink} 
                    className="w-full bg-[var(--zed-bg-surface)] border border-[var(--zed-border-light)] text-[var(--zed-text-muted)] text-[10px] rounded-[var(--radius-md)] py-4 pl-4 pr-20 font-mono outline-none focus:border-[var(--zed-primary)]/30 transition-all"
                 />
                 <button 
                    onClick={copyLink}
                    className="absolute inset-y-2 right-2 px-3 bg-white hover:bg-[var(--zed-bg-surface)] rounded-[var(--radius-sm)] border border-[var(--zed-border-light)] text-[9px] font-black text-[var(--zed-text-dark)] tracking-widest uppercase transition-all shadow-sm"
                 >
                    {copied ? 'Copied' : 'Copy'}
                 </button>
               </div>
            </div>
          </div>

          {/* SESSION FOOTER */}
          <div className="p-6 bg-[var(--zed-bg-light)] border-t border-[var(--zed-border-light)]">
            <button
              onClick={endInterview}
              className="w-full py-5 bg-[var(--zed-error)]/10 hover:bg-[var(--zed-error)]/20 text-[var(--zed-error)] border border-[var(--zed-error)]/20 rounded-[var(--radius-lg)] font-black text-xs tracking-widest uppercase flex items-center justify-center gap-3 transition-all zed-shadow-lg active:scale-95"
            >
              <PhoneOff size={18} />
              Terminate Session
            </button>
          </div>
        </div>

        {/* RIGHT PANEL - DYNAMIC WORKSPACE (Zed Light Mode) */}
        <div className="flex-1 flex flex-col bg-[var(--zed-bg-surface)] relative overflow-hidden">
          
          {/* Main Stage: Video or Resume */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            {/* Zed Design Element: Background Grid (Ultra-Subtle) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--zed-primary)_1px,transparent_1px),linear-gradient(to_bottom,var(--zed-primary)_1px,transparent_1px)] bg-[size:5px_5px] opacity-[0.001] pointer-events-none"></div>

            
            <AnimatePresence mode="wait">
              {showResume ? (
                <motion.div 
                  key="resume"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 bg-[var(--zed-bg-light)] p-4 overflow-hidden flex flex-col"
                >
                  <div className="bg-white rounded-[var(--radius-lg)] zed-shadow-xl flex-1 overflow-hidden relative border border-[var(--zed-border-light)]">
                    <div className="absolute top-4 right-4 z-10">
                      <button onClick={() => setShowResume(false)} className="p-2 bg-white/80 text-[var(--zed-text-dark)] border border-[var(--zed-border-light)] rounded-full backdrop-blur-md hover:bg-[var(--zed-bg-surface)] transition-all">
                        <X size={16} />
                      </button>
                    </div>
                    {secureResumeUrl ? (
                      <iframe 
                        src={secureResumeUrl}
                        className="w-full h-full"
                        title="Resume Preview"
                      />
                    ) : resumePath ? (
                      <div className="w-full h-full flex items-center justify-center text-[var(--zed-text-muted)] flex-col gap-4">
                        <Loader2 size={32} className="animate-spin text-[var(--zed-primary)]" />
                        <p className="font-black uppercase tracking-widest text-[10px]">Authenticating Document...</p>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--zed-text-muted)] flex-col gap-4">
                        <FileText size={64} className="opacity-20" />
                        <p className="font-black uppercase tracking-widest text-xs">Resume not found</p>
                      </div>
                    )}

                  </div>
                </motion.div>
              ) : isCallActive && interviewLink ? (
                <motion.div 
                  key="video"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 bg-[var(--zed-bg-surface)] relative flex flex-col shadow-inner"
                >
                   {/* Platform Specific Logic */}
                   {interviewPlatform === 'Zoom' && zoomDetails ? (
                     <div className="w-full h-full">
                       <ZoomMeetingEmbed
                         meetingNumber={zoomDetails.meetingNumber}
                         password={zoomDetails.password}
                         userName={displayName || 'Interviewer'}
                         onClose={() => setCallActive(false)}
                         isInline={true}
                       />
                     </div>
                   ) : isGMeet ? (
                     <div className="w-full h-full flex items-center justify-center bg-[var(--zed-bg-surface)] p-12 text-center">
                        <div className="max-w-md space-y-6">
                          <div className="w-20 h-20 bg-[var(--zed-primary)]/10 rounded-[var(--radius-lg)] flex items-center justify-center mx-auto border border-[var(--zed-primary)]/20">
                            <Video size={40} className="text-[var(--zed-primary)]" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-[var(--zed-text-dark)] mb-2 uppercase tracking-tight">Assistant Mode</h2>
                            <p className="text-[var(--zed-text-muted)] text-sm leading-relaxed font-medium">
                              Google Meet security prohibits direct embedding. Use the dedicated 
                              <strong> External Meeting Launcher</strong> below while keeping your notes active.
                            </p>
                          </div>
                          <button 
                            onClick={openInNewWindow}
                            className="px-8 py-4 bg-[var(--zed-primary)] hover:bg-[var(--zed-primary-hover)] text-white rounded-[var(--radius-lg)] font-black transition-all zed-shadow-lg flex items-center gap-3 mx-auto uppercase tracking-widest text-xs active:scale-95"
                          >
                            <ExternalLink size={20} />
                            Launch Meeting
                          </button>
                        </div>
                     </div>
                   ) : (
                     <div className="w-full h-full relative group bg-[var(--zed-bg-surface)] border border-[var(--zed-border-light)] m-4 rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
                       <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              const frame = document.getElementById('interview-frame') as HTMLIFrameElement;
                              if (frame) frame.src = frame.src;
                            }}
                            className="p-2 bg-white/80 text-[var(--zed-text-dark)] rounded-lg backdrop-blur-md border border-[var(--zed-border-light)] hover:bg-[var(--zed-bg-surface)] shadow-sm"
                            title="Refresh Stream"
                          >
                            <Wifi size={16} />
                          </button>
                       </div>
                       <iframe
                         id="interview-frame"
                         src={interviewLink}
                         allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen"
                         className="w-full h-full border-none"
                         title="Interview Video Call"
                       />
                     </div>
                   )}
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex items-center justify-center bg-[var(--zed-bg-surface)]"
                >
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-white shadow-xl rounded-[var(--radius-lg)] flex items-center justify-center mx-auto border border-[var(--zed-border-light)]">
                      <Sparkles size={40} className="text-[var(--zed-primary)]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[var(--zed-text-dark)] uppercase tracking-tight">Ready to begin?</h3>
                      <p className="text-[var(--zed-text-muted)] text-sm font-medium">Click "Join Session" to activate workspace</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Workspace Footer: Integrated Notes */}
          <div className="h-[350px] bg-white border-t border-[var(--zed-border-light)] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
            {/* Notes Controls */}
            <div className="h-14 px-8 border-b border-[var(--zed-border-light)] flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-[var(--zed-text-muted)]" />
                <h3 className="font-black text-[10px] text-[var(--zed-text-dark)] uppercase tracking-[0.2em]">Live Assessment Notes</h3>
                {isDirty && (
                  <span className="text-[9px] font-black bg-[var(--zed-warning)] text-white px-2 py-0.5 rounded-full uppercase shadow-sm">
                    Unsaved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                 <button
                   onClick={handleSubmit(onSaveNotes)}
                   disabled={isSubmitting || !isDirty}
                   className="flex items-center gap-2 px-5 py-2 bg-[var(--zed-primary)] hover:bg-[var(--zed-primary-hover)] disabled:opacity-30 text-white rounded-[var(--radius-sm)] text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
                 >
                   {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                   COMMIT NOTES
                 </button>
                 <div className="h-4 w-px bg-[var(--zed-border-light)]" />
                 <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--zed-text-muted)] uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      <span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      <span>{new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Editor Stage */}
            <div className="flex-1 p-6 overflow-hidden">
              <div className="h-full bg-[var(--zed-bg-surface)] rounded-[var(--radius-lg)] border border-[var(--zed-border-light)] flex flex-col shadow-inner">
                <textarea
                  {...register('notes')}
                  className="flex-1 w-full p-6 bg-transparent resize-none focus:outline-none text-[var(--zed-text-dark)] text-sm leading-relaxed placeholder:text-[var(--zed-text-muted)]/40 font-medium"
                  placeholder="Record technical assessment, cultural fit observations, and final decision pointers..."
                />
                <div className="px-4 py-2 bg-white/50 border-t border-[var(--zed-border-light)] flex items-center justify-between rounded-b-[var(--radius-lg)]">
                  <div className="flex gap-2">
                    {['SKILLS', 'VIBE', 'SALARY', 'DECISION'].map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-sm)] text-[8px] font-black text-[var(--zed-text-muted)] shadow-sm tracking-widest">#{tag}</span>
                    ))}
                  </div>
                  <span className="text-[9px] font-black text-[var(--zed-text-muted)] tracking-[0.2em] uppercase opacity-40">
                    Auto-save active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InterviewPanel;
