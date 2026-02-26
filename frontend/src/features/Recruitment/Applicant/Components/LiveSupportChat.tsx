import React, { useEffect, useState, useRef } from 'react';
import { chatApi, ChatConversation, ChatMessage } from '@/api/chatApi';
import { useToastStore } from '@/stores';
import { MessageSquare, Send, User, Clock, CheckCircle2, ChevronLeft, Loader2, Search } from 'lucide-react';

const LiveSupportChat: React.FC = () => {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const showToast = useToastStore((state) => state.showToast);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await chatApi.getConversations();
            if (response.data.success) {
                setConversations(response.data.conversations);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
            showToast('Failed to load chat sessions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (id: number) => {
        try {
            setMessagesLoading(true);
            const response = await chatApi.getMessages(id, true, 'Admin');
            if (response.data.success) {
                setMessages(response.data.messages);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            showToast('Failed to load messages', 'error');
        } finally {
            setMessagesLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.id);
            const interval = setInterval(() => fetchMessages(selectedConversation.id), 3000); // Poll messages every 3s
            return () => clearInterval(interval);
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedConversation || !newMessage.trim() || sending) return;

        try {
            setSending(true);
            const response = await chatApi.sendMessage({
                conversation_id: selectedConversation.id,
                message: newMessage.trim(),
                sender_type: 'Admin'
            });

            if (response.data.success) {
                setNewMessage('');
                fetchMessages(selectedConversation.id);
            }
        } catch (error) {
            showToast('Failed to send message', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleCloseConversation = async (id: number) => {
        if (!window.confirm('Are you sure you want to close this chat?')) return;
        try {
            const response = await chatApi.close(id);
            if (response.data.success) {
                showToast('Chat closed', 'success');
                setSelectedConversation(null);
                fetchConversations();
            }
        } catch (error) {
            showToast('Failed to close chat', 'error');
        }
    };

    const filteredConversations = conversations.filter(conv => 
        (conv.applicant_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (conv.applicant_email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-[600px] flex bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
            {/* Sidebar: Conversations List */}
            <div className={`w-full md:w-80 flex-shrink-0 border-r border-gray-100 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <MessageSquare size={18} className="text-blue-600" />
                        Live Chats
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-gray-400" size={24} />
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            <User className="mx-auto mb-2 text-gray-300" size={32} />
                            No active chats
                        </div>
                    ) : (
                        filteredConversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv)}
                                className={`w-full p-4 flex items-start gap-3 border-b border-gray-50 hover:bg-blue-50/30 transition-colors text-left ${selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                                    {conv.applicant_name ? conv.applicant_name[0] : '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h4 className="font-bold text-gray-900 truncate text-sm">{conv.applicant_name || 'Anonymous'}</h4>
                                        <span className="text-[10px] text-gray-400 shrink-0">{new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{conv.last_message || 'No messages yet'}</p>
                                    {conv.unread_count && conv.unread_count > 0 ? (
                                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                                            {conv.unread_count} new
                                        </span>
                                    ) : null}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-slate-50 relative ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedConversation(null)} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-600">
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                                    {selectedConversation.applicant_name ? selectedConversation.applicant_name[0] : '?'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 leading-tight">{selectedConversation.applicant_name || 'Anonymous'}</h4>
                                    <p className="text-[10px] text-gray-500">{selectedConversation.applicant_email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleCloseConversation(selectedConversation.id)}
                                className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5"
                            >
                                <CheckCircle2 size={14} />
                                Close Session
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                            {messagesLoading && messages.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <Loader2 className="animate-spin text-blue-600" size={32} />
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.sender_type === 'Admin';
                                    return (
                                        <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                                                isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                            }`}>
                                                <p>{msg.message}</p>
                                                <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-blue-100 justify-end' : 'text-gray-400'}`}>
                                                    <Clock size={10} />
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your response..."
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || sending}
                                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-200"
                            >
                                <Send size={20} strokeWidth={2.5} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 animate-in fade-in duration-500">
                        <div className="p-6 bg-white rounded-full shadow-xl shadow-slate-200/50 mb-6">
                            <MessageSquare size={48} className="text-blue-200" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-600">Select a conversation</h3>
                        <p className="text-sm">Choose an active session from the left to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveSupportChat;
