import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Applicant } from '@/features/Recruitment/Applicant/Hooks/useApplicantData';

interface InterviewState {
  activeApplicant: Applicant | null;
  startTime: string | null;
  isCallActive: boolean;
  notes: string;
  setNotes: (notes: string) => void;
  startInterview: (applicant: Applicant) => void;
  endInterview: () => void;
  setCallActive: (isActive: boolean) => void;
}

const useInterviewStore = create<InterviewState>()(
  persist(
    (set) => ({
      activeApplicant: null,
      startTime: null,
      isCallActive: false,
      notes: '',
      setNotes: (notes) => set({ notes }),
      startInterview: (applicant) => set({ 
        activeApplicant: applicant, 
        startTime: new Date().toISOString(),
        isCallActive: false // Initialize as false until video is actually started
      }),
      endInterview: () => set({ 
        activeApplicant: null, 
        startTime: null, 
        isCallActive: false,
        notes: '' 
      }),
      setCallActive: (isActive) => set({ isCallActive: isActive })
    }),
    {
      name: 'interview-session-storage',
    }
  )
);

export default useInterviewStore;

