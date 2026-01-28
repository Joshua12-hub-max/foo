import api from './axios';
import { AxiosResponse } from 'axios';

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_type: 'Applicant' | 'Admin';
  sender_id?: number | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatConversation {
  id: number;
  applicant_name: string;
  applicant_email: string;
  status: 'Active' | 'Closed' | 'Archived';
  unread_count?: number;
  last_message?: string;
  created_at: string;
  updated_at: string;
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
  sendMessage: async (data: { conversation_id: number; message: string; sender_type: 'Applicant' | 'Admin' }): Promise<AxiosResponse<{ success: boolean; message_id: number }>> => {
    return await api.post('/chat/message', data);
  },

  /**
   * Public/Admin: Get messages for a conversation
   */
  getMessages: async (conversationId: number, markRead = false, readerRole?: 'Applicant' | 'Admin'): Promise<AxiosResponse<{ success: boolean; messages: ChatMessage[] }>> => {
    return await api.get(`/chat/messages/${conversationId}`, { 
      params: { mark_read: markRead, reader: readerRole } 
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
