import { create } from 'zustand';
import { JsonValue } from '@/types';

export interface Modal {
  id: string;
  component: string; // Identifier for the component to render (used in mapping) or we could store component directly if not serializing
  props?: Record<string, JsonValue>;
  onClose?: () => void;
  isOpen?: boolean; // Helpful for animations
}

interface ModalState {
  modals: Modal[];
}

interface ModalActions {
  openModal: (modal: Modal) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  isModalOpen: (id: string) => boolean;
  getModalProps: (id: string) => Record<string, JsonValue> | undefined;
}

export const useModalStore = create<ModalState & ModalActions>((set, get) => ({
  modals: [],

  openModal: (modal) => {
    set((state) => ({
      modals: [...state.modals.filter((m) => m.id !== modal.id), { ...modal, isOpen: true }],
    }));
  },

  closeModal: (id) => {
    set((state) => ({
      modals: state.modals.filter((m) => m.id !== id),
    }));
  },

  closeAllModals: () => set({ modals: [] }),

  isModalOpen: (id) => get().modals.some((m) => m.id === id),

  getModalProps: (id) => get().modals.find((m) => m.id === id)?.props,
}));
