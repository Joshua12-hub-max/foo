import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Modal {
  id: string;
  component: string; // Identifier for the component to render (used in mapping) or we could store component directly if not serializing
  props?: Record<string, unknown>;
  onClose?: () => void;
  isOpen?: boolean; // Helpful for animations
}

interface ModalState {
  modals: Modal[];
}

interface ModalActions {
  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  getModalById: (id: string) => Modal | undefined;
}

type ModalStore = ModalState & ModalActions;

export const useModalStore = create<ModalStore>()(
  devtools(
    (set, get) => ({
      modals: [],

      openModal: (modalData) => {
        const id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newModal: Modal = { ...modalData, id, isOpen: true };
        
        set((state) => ({
          modals: [...state.modals, newModal],
        }));

        return id;
      },

      closeModal: (id) => {
        set((state) => ({
          modals: state.modals.filter((m) => m.id !== id),
        }));
      },

      closeAllModals: () => {
        set({ modals: [] });
      },

      getModalById: (id) => {
        return get().modals.find((m) => m.id === id);
      },
    }),
    { name: 'modal-store' }
  )
);
