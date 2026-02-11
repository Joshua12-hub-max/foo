import { create } from 'zustand';

interface CalendarState {
  modals: {
    addEvent: boolean;
    editEvent: boolean;
    createAnnouncement: boolean;
    editAnnouncement: boolean;
    schedule: boolean;
    editSchedule: boolean;
    deleteConfirm: boolean;
    eventDetails: boolean;
  };
  selectedItem: unknown | null;
  selectedType: 'event' | 'announcement' | 'schedule' | null;
  currentView: string;
}

interface CalendarActions {
  setModal: (modalName: keyof CalendarState['modals'], isOpen: boolean) => void;
  setSelectedItem: (item: unknown, type: CalendarState['selectedType']) => void;
  setCurrentView: (view: string) => void;
  closeAllModals: () => void;
}

export const useCalendarStore = create<CalendarState & CalendarActions>((set) => ({
  modals: {
    addEvent: false,
    editEvent: false,
    createAnnouncement: false,
    editAnnouncement: false,
    schedule: false,
    editSchedule: false,
    deleteConfirm: false,
    eventDetails: false,
  },
  selectedItem: null,
  selectedType: null,
  currentView: 'month',

  setModal: (modalName, isOpen) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: isOpen },
    })),

  setSelectedItem: (item, type) =>
    set({
      selectedItem: item,
      selectedType: type,
    }),

  setCurrentView: (view) => set({ currentView: view }),

  closeAllModals: () =>
    set({
      modals: {
        addEvent: false,
        editEvent: false,
        createAnnouncement: false,
        editAnnouncement: false,
        schedule: false,
        editSchedule: false,
        deleteConfirm: false,
        eventDetails: false,
      },
      selectedItem: null,
      selectedType: null,
    }),
}));
