import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Form9Header, Form9VacantPosition } from '@/schemas/compliance';

interface Form9State {
  isOpen: boolean;
  header: Form9Header;
  positions: Form9VacantPosition[];
}

interface Form9Actions {
  openModal: () => void;
  closeModal: () => void;
  setHeader: (header: Partial<Form9Header>) => void;
  setPositions: (positions: Form9VacantPosition[]) => void;
  addPosition: (position: Omit<Form9VacantPosition, 'no'>) => void;
  updatePosition: (index: number, data: Partial<Form9VacantPosition>) => void;
  removePosition: (index: number) => void;
  resetForm: () => void;
}

const defaultHeader: Form9Header = {
  agencyName: 'CGO MEYCAUAYAN, BULACAN',
  signatoryName: 'JUDITH S. GUEVARRA, MPA',
  signatoryTitle: 'City Human Resource Management Officer',
  date: '',
  deadlineDate: '',
  officeAddress: 'City Govt. of Meycauayan, Saluysoy, City of Meyc.',
  contactInfo: 'i4-919-8020 local 501 / chrmoimeycjobs.csc@gmail.cc'
};

const initialState: Form9State = {
  isOpen: false,
  header: defaultHeader,
  positions: []
};

export const useForm9Store = create<Form9State & Form9Actions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        openModal: () => set({ isOpen: true }),
        closeModal: () => set({ isOpen: false }),

        setHeader: (header) => set((state) => ({
          header: { ...state.header, ...header }
        })),

        setPositions: (positions) => set({ positions }),

        addPosition: (position) => set((state) => ({
          positions: [
            ...state.positions,
            { ...position, no: state.positions.length + 1 }
          ]
        })),

        updatePosition: (index, data) => set((state) => ({
          positions: state.positions.map((pos, i) =>
            i === index ? { ...pos, ...data } : pos
          )
        })),

        removePosition: (index) => set((state) => ({
          positions: state.positions
            .filter((_, i) => i !== index)
            .map((pos, i) => ({ ...pos, no: i + 1 }))
        })),

        resetForm: () => set({
          header: defaultHeader,
          positions: []
        })
      }),
      { name: 'form9-store' }
    ),
    { name: 'form9-store' }
  )
);
