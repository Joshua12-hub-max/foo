import api from './axios';
import { AxiosResponse } from 'axios';

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderType: 'Applicant' | 'Administrator';
  senderId?: number | null;
  message: string;
  isRead: boolean;
  isEdited?: boolean;
  isDeletedForEveryone?: boolean;
  createdAt: string;
  adminAvatar?: string | null;
  applicantAvatar?: string | null;
}

export interface ChatConversation {
  id: number;
  applicantName: string;
  applicantEmail: string;
  applicantAvatar?: string | null;
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
   * Uses dedicated admin route if senderType is Administrator
   */
  sendMessage: async (data: { conversationId: number; message: string; senderType: 'Applicant' | 'Administrator' }): Promise<AxiosResponse<{ success: boolean; message: ChatMessage }>> => {
    const url = data.senderType === 'Administrator' ? '/chat/admin/message' : '/chat/message';
    return await api.post(url, data);
  },

  /**
   * Public/Admin: Get messages for a conversation
   * Uses dedicated admin route if readerRole is Administrator
   */
  getMessages: async (conversationId: number, markRead = false, readerRole?: 'Applicant' | 'Administrator'): Promise<AxiosResponse<{ success: boolean; messages: ChatMessage[] }>> => {
    const url = readerRole === 'Administrator' ? `/chat/admin/messages/${conversationId}` : `/chat/messages/${conversationId}`;
    return await api.get(url, { 
      params: { markRead, reader: readerRole } 
    });
  },

  /**
   * Public/Admin: Get unread count for a conversation
   */
  getUnreadCount: async (conversationId: number, role?: 'Applicant' | 'Administrator'): Promise<AxiosResponse<{ success: boolean; count: number }>> => {
    return await api.get(`/chat/unread-count/${conversationId}`, { params: { role } });
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
  },

  /**
   * Public/Admin: Edit a message
   * Uses dedicated admin route if senderType is Administrator
   */
  editMessage: (id: number, data: { message: string; senderType: 'Applicant' | 'Administrator'; conversationId?: number }) => {
      const url = data.senderType === 'Administrator' ? `/chat/admin/message/${id}` : `/chat/message/${id}`;
      return api.patch(url, data);
  },

  /**
   * Public/Admin: Delete a message
   * Uses dedicated admin route if senderType is Administrator
   */
  deleteMessage: (id: number, type: 'me' | 'everyone', senderType: 'Applicant' | 'Administrator', conversationId?: number) => {
      const url = senderType === 'Administrator' ? `/chat/admin/message/${id}` : `/chat/message/${id}`;
      return api.delete(url, { params: { type, senderType, conversationId } });
  },

  /**
   * Public/Admin: Delete Entire Conversation
   * Uses dedicated admin route if senderType is Administrator
   */
  deleteConversation: async (id: number, senderType: 'Applicant' | 'Administrator'): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
    const url = senderType === 'Administrator' ? `/chat/admin/conversations/${id}` : `/chat/conversations/${id}`;
    return await api.delete(url, { params: { senderType } });
  },

  /**
   * Admin: Get total unread count across all active conversations
   */
  getAdminUnreadTotal: async (): Promise<AxiosResponse<{ success: boolean; count: number }>> => {
    return await api.get('/chat/admin/unread-total');
  }
};
