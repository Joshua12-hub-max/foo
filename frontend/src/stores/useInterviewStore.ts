import { create } from 'zustand';

interface InterviewState {
  activeApplicantId: number | null;
  startTime: Date | null;
  isCallActive: boolean;
  notes: string;
  setNotes: (notes: string) => void;
  startInterview: (applicantId: number) => void;
  endInterview: () => void;
  setCallActive: (isActive: boolean) => void;
}

const useInterviewStore = create<InterviewState>((set) => ({
  activeApplicantId: null,
  startTime: null,
  isCallActive: false,
  notes: '',
  setNotes: (notes) => set({ notes }),
  startInterview: (applicantId) => set({ 
    activeApplicantId: applicantId, 
    startTime: new Date(),
    isCallActive: true 
  }),
  endInterview: () => set({ 
    activeApplicantId: null, 
    startTime: null,
    isCallActive: false,
    notes: '' 
  }),
  setCallActive: (isActive) => set({ isCallActive: isActive })
}));

export default useInterviewStore;
