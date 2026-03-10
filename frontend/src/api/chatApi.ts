import api from './axios';
import { AxiosResponse } from 'axios';

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderType: 'Applicant' | 'Administrator';
  senderId?: number | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatConversation {
  id: number;
  applicantName: string;
  applicantEmail: string;
  status: 'Active' | 'Closed' | 'Archived';
  unreadCount?: number;
  lastMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export const chatApi = {
  /**
   * Public: Start or resume a conversation
   */
  start: async (name: string, email: string): Promise<AxiosResponse<{ success: boolean; conversation: ChatConversation }>> => {
    return await api.post('/chat/start', { name, email });
  },

  /**
   * Public/Admin: Send a message
   */
  sendMessage: async (data: { conversationId: number; message: string; senderType: 'Applicant' | 'Administrator' }): Promise<AxiosResponse<{ success: boolean; messageId: number }>> => {
    return await api.post('/chat/message', data);
  },

  /**
   * Public/Admin: Get messages for a conversation
   */
  getMessages: async (conversationId: number, markRead = false, readerRole?: 'Applicant' | 'Administrator'): Promise<AxiosResponse<{ success: boolean; messages: ChatMessage[] }>> => {
    return await api.get(`/chat/messages/${conversationId}`, { 
      params: { markRead, reader: readerRole } 
    });
  },

  /**
   * Admin: Get all active conversations
   */
  getConversations: async (): Promise<AxiosResponse<{ success: boolean; conversations: ChatConversation[] }>> => {
    return await api.get('/chat/conversations');
  },

  /**
   * Admin: Close a conversation
   */
  close: async (id: number): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
    return await api.patch(`/chat/conversations/${id}/close`);
  }
};
