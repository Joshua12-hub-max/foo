import { create } from 'zustand';

interface ChatState {
  isOpen: boolean;
  conversationId: number | null;
  unreadCount: number;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  setConversationId: (id: number | null) => void;
  setUnreadCount: (count: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  conversationId: null,
  unreadCount: 0,
  openChat: () => set({ isOpen: true, unreadCount: 0 }), // Reset unread when opening
  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set((state) => ({ 
    isOpen: !state.isOpen,
    unreadCount: !state.isOpen ? 0 : state.unreadCount // Reset if opening
  })),
  setConversationId: (id) => set({ conversationId: id }),
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
