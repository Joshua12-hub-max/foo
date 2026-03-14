import React, { useEffect, useRef, useState } from 'react';
import { 
  Video, PhoneOff, FileText, User, Calendar, Clock, 
  Maximize2, MessageSquare, Copy, CheckCircle2, ChevronRight,
  Monitor, Wifi, Sparkles, ExternalLink, Save, Loader2 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saveInterviewNotesSchema, SaveInterviewNotesFormData } from '../../../../schemas/recruitmentSchema';
import useInterviewStore from '../../../../stores/useInterviewStore';
import { useInterviewActions } from '../Hooks/useInterviewActions';

interface InterviewPanelProps {
  roomName: string;
  displayName: string;
  onClose: () => void;
  applicantId: number; // Added applicantId
  applicantName?: string;
  applicantEmail?: string;
  jobTitle?: string;
  interviewLink?: string;
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
  const videoWindowRef = useRef<Window | null>(null);

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
      rating: undefined,
      duration: undefined
    }
  });

  const startVideoCall = () => {
    if (interviewLink) {
      videoWindowRef.current = window.open(
        interviewLink,
        'InterviewCall',
        'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
      );
      storeStartInterview(applicantId);
      setCallActive(true);
    }
  };

  const endInterview = () => {
    if (videoWindowRef.current && !videoWindowRef.current.closed) {
      videoWindowRef.current.close();
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

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex font-sans overflow-hidden">
      
      {/* LEFT PANEL - CONTROLS & INFO */}
      <div className="w-[420px] bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F8F9FC] flex items-center justify-center shadow-lg shadow-gray-500/20">
              <Video size={20} className="text-slate-950" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white tracking-tight">Interview Session</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Panel</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* APPLICANT CARD */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gray-900/20 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-slate-800/80 rounded-xl p-5 border border-gray-900/50">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 p-0.5 shadow-inner">
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                    <User size={28} className="text-slate-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">{applicantName || 'Applicant Name'}</h3>
                  <p className="text-sm text-slate-400 truncate mb-2">{applicantEmail || 'email@example.com'}</p>
                  
                  {jobTitle && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-700/50 border border-slate-600/50 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                       <Sparkles size={10} className="text-amber-400" />
                       {jobTitle}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MAIN ACTION - VIDEO CALL */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Monitor size={12} /> Connection
            </h4>
            
            {!isCallActive ? (
              <button
                onClick={startVideoCall}
                className="w-full group relative overflow-hidden rounded-xl bg-[#F8F9FC] p-px shadow-xl shadow-gray-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="relative h-14 w-full bg-transparent flex items-center justify-center gap-3 rounded-xl transition-all group-hover:bg-white/5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                    <Video size={16} className="text-gray-950" />
                  </div>
                  <span className="font-bold text-gray-950 text-lg">Start Video Call</span>
                  <ChevronRight size={20} className="text-gray-950/50 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ) : (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3 text-green-400">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                    <Wifi size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Call in Progress</h3>
                    <p className="text-xs text-green-500/70">Video window is active</p>
                  </div>
                </div>
                <button
                  onClick={startVideoCall}
                  className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-gray-700"
                >
                  <Maximize2 size={16} />
                  Focus Video Window
                </button>
              </div>
            )}
          </div>

          {/* MEETING LINK */}
          {interviewLink && (
            <div className="space-y-3">
               <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Meeting Link</h4>
                <div className="flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                   <span className="text-[10px] text-amber-500 font-medium">For Applicant & Interviewer</span>
                </div>
               </div>
               
               <div className="group relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Video size={14} className="text-gray-500" />
                 </div>
                 <input 
                    type="text" 
                    readOnly 
                    value={interviewLink} 
                    className="w-full bg-gray-950 border border-gray-800 text-gray-400 text-xs rounded-lg py-3 pl-9 pr-24 focus:outline-none focus:border-gray-500/50 focus:ring-1 focus:ring-gray-500/50 transition-all font-mono"
                 />
                 <button 
                    onClick={copyLink}
                    className="absolute inset-y-1 right-1 px-3 bg-gray-800 hover:bg-gray-700 rounded-md text-xs font-medium text-gray-300 transition-colors flex items-center gap-1.5 border border-gray-700"
                 >
                    {copied ? <CheckCircle2 size={12} className="text-green-400" /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                 </button>
               </div>
               <p className="text-[12px] text-gray-500 leading-relaxed px-1">
                 Share this exact link if the applicant hasn't received it yet. Both parties must join this URL.
               </p>
            </div>
          )}

          {/* RESOURCES */}
          <div className="space-y-3">
             <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resources</h4>
             {resumePath ? (
               <a
                 href={`http://localhost:5000/uploads/resumes/${resumePath}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-800 hover:bg-gray-800 hover:border-gray-700 transition-all group"
               >
                 <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                   <FileText size={20} />
                 </div>
                 <div className="flex-1">
                   <div className="font-medium text-sm text-slate-200 group-hover:text-white">Applicant Resume</div>
                   <div className="text-xs text-slate-500">PDF Document</div>
                 </div>
                 <ExternalLink size={14} className="text-slate-600 group-hover:text-slate-400" />
               </a>
             ) : (
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-800 border-dashed text-center">
                  <span className="text-xs text-slate-500">No resume available</span>
                </div>
             )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={endInterview}
            className="w-full py-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-400 border border-rose-500/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <PhoneOff size={16} />
            End Interview Session
          </button>
        </div>
      </div>

      {/* RIGHT PANEL - NOTES */}
      <div className="flex-1 flex flex-col bg-[#F8F9FC] relative">
        <div className="absolute inset-0 bg-[url('https://optimizely.com/img/backgrounds/grid.svg')] opacity-[0.03] pointer-events-none"></div>
        
        {/* Notes Header */}
        <div className="h-16 px-8 bg-white/80 border-b border-gray-200/60 sticky top-0 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <h3 className="p-2 font-bold text-lg text-gray-800">Interview Notes</h3>
            {isDirty && <span className="text-xs text-amber-500 font-medium px-2 py-0.5 bg-amber-50 rounded-full border border-amber-200">Unsaved Changes</span>}
          </div>
          <div className="flex items-center gap-4">
             <button
               onClick={handleSubmit(onSaveNotes)}
               disabled={isSubmitting || !isDirty}
               className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors border border-gray-700 shadow-sm"
             >
               {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
               Save Notes
             </button>

             <div className="h-6 w-px bg-gray-300 mx-2" />

             <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm">
                <Calendar size={14} className="text-gray-500" />
                <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm">
                <Clock size={14} className="text-gray-500" />
                <span>{new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Editor Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto h-full flex flex-col gap-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col ring-4 ring-gray-50/50 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2 p-2 border-b border-gray-100 bg-gray-50/50 rounded-t-xl overflow-x-auto">
                  {['Technical Skills', 'Communication', 'Cultural Fit', 'Experience', 'Questions', 'Decision'].map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-white border border-gray-200 rounded-md text-[11px] font-semibold text-gray-500 cursor-default select-none shadow-sm">
                      {tag}
                    </span>
                  ))}
              </div>
              <textarea
                {...register('notes')}
                className="flex-1 w-full p-8 resize-none focus:outline-none text-gray-700 text-base leading-relaxed placeholder:text-gray-300 rounded-b-xl"
                placeholder="Start typing your interview notes here..."
              />
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-end">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  {isSubmitting ? 'Saving...' : 'Auto-save enabled on exit'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPanel;
