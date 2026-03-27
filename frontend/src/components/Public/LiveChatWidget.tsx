import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Loader2, Info, Pencil, Trash2 } from 'lucide-react';
import { chatApi, ChatMessage, ChatConversation } from '@/api/chatApi';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { formatFullName } from '@/utils/nameUtils';
import { chatStartSchema } from '@/schemas/inquiry';
import { ZodError } from 'zod';
import { toast } from 'react-hot-toast';
import ConfirmDialog from '@/components/Custom/Shared/ConfirmDialog';

const LiveChatWidget = () => {
    const user = useAuthStore(state => state.user);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    
    const { isOpen, setIsOpen } = { 
        isOpen: useChatStore(state => state.isOpen), 
        setIsOpen: (open: boolean) => {
            if (open) useChatStore.getState().openChat();
            else useChatStore.getState().closeChat();
        }
    };
    const [onboarded, setOnboarded] = useState(false);
    const [conversation, setConversation] = useState<ChatConversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editInput, setEditInput] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeletingHistory, setIsDeletingHistory] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    
    // Store integration
    const unreadCount = useChatStore(state => state.unreadCount);
    const setUnreadCount = useChatStore(state => state.setUnreadCount);
    const setConversationId = useChatStore(state => state.setConversationId);

    // Form for onboarding
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    // Load from localStorage or Auto-onboard if authenticated
    useEffect(() => {
        const savedId = localStorage.getItem('chat_conversation_id');
        const savedName = localStorage.getItem('chat_user_name');
        const savedEmail = localStorage.getItem('chat_user_email');

        // Always populate name/email if they exist
        if (savedName) setName(savedName);
        if (savedEmail) setEmail(savedEmail);

        if (savedId && savedName && savedEmail) {
            setConversation({
                id: Number(savedId),
                applicantName: savedName,
                applicantEmail: savedEmail,
                status: 'Active',
                createdAt: '',
                updatedAt: ''
            });
            setConversationId(Number(savedId));
            setOnboarded(true);
        } else if (isAuthenticated && user && !onboarded && !loading && isOpen) {
            const autoOnboard = async () => {
                setLoading(true);
                try {
                    const userName = formatFullName(user.lastName, user.firstName);
                    const res = await chatApi.start(userName, user.email);
                    if (res.data.success) {
                        setConversation(res.data.conversation);
                        setConversationId(res.data.conversation.id);
                        setOnboarded(true);
                        localStorage.setItem('chat_conversation_id', res.data.conversation.id.toString());
                        localStorage.setItem('chat_user_name', userName);
                        localStorage.setItem('chat_user_email', user.email);
                        const msgRes = await chatApi.getMessages(res.data.conversation.id);
                        setMessages(msgRes.data.messages);
                    }
                } catch (err) {
                    console.error('Auto-onboard failed:', err);
                } finally {
                    setLoading(false);
                }
            };
            autoOnboard();
        }
    }, [isAuthenticated, user, onboarded, isOpen, setConversationId]);

    // Poll for new messages when open
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isOpen && conversation) {
            const fetchMessages = async () => {
                try {
                    const res = await chatApi.getMessages(conversation.id, true, 'Applicant');
                    if (res.data.success) {
                        setMessages(res.data.messages);
                    }
                } catch (err) {
                    console.error('Polling error:', err);
                }
            };

            console.log('[Chat] Polling for messages...', conversation.id);
            fetchMessages(); // Initial fetch
            interval = setInterval(fetchMessages, 5000); // Poll every 5s
        }
        return () => clearInterval(interval);
    }, [isOpen, conversation]);

    // Poll for unread count when closed
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (!isOpen && conversation) {
            const fetchUnread = async () => {
                try {
                    const res = await chatApi.getUnreadCount(conversation.id, 'Applicant');
                    if (res.data.success) {
                        setUnreadCount(res.data.count);
                    }
                } catch (err) {
                    console.error('Unread count polling error:', err);
                }
            };

            fetchUnread(); // Initial fetch
            interval = setInterval(fetchUnread, 10000); // Poll every 10s when closed
        }
        return () => clearInterval(interval);
    }, [isOpen, conversation, setUnreadCount]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleStartChat = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Validate client-side first
            chatStartSchema.parse({ name, email });
            
            const res = await chatApi.start(name, email);
            if (res.data.success) {
                setConversation(res.data.conversation);
                setConversationId(res.data.conversation.id);
                setOnboarded(true);
                localStorage.setItem('chat_conversation_id', res.data.conversation.id.toString());
                localStorage.setItem('chat_user_name', name);
                localStorage.setItem('chat_user_email', email);
                // Try to load history
                const msgRes = await chatApi.getMessages(res.data.conversation.id);
                setMessages(msgRes.data.messages);
            }
        } catch (err: unknown) {
            console.error('Failed to start chat', err);
            if (err instanceof ZodError) {
                toast.error(err.issues[0].message, { id: 'chat-val-error' });
            } else if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                const serverMsg = axiosErr.response?.data?.message || 'Failed to start chat';
                toast.error(serverMsg, { id: 'chat-server-error' });
            } else {
                toast.error('Failed to start chat', { id: 'chat-generic-error' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !conversation) return;

        const originalMsg = input;
        setInput('');

        try {
            await chatApi.sendMessage({
                conversationId: conversation.id,
                message: originalMsg,
                senderType: 'Applicant'
            });
            // Immediately fetch to show user msg
            const res = await chatApi.getMessages(conversation.id);
            setMessages(res.data.messages);
        } catch (err) {
            console.error('Send error:', err);
            setInput(originalMsg);
        }
    };

    const handleEdit = async (msgId: number) => {
        if (!editInput.trim() || !conversation) return;
        try {
            await chatApi.editMessage(msgId, { 
                message: editInput, 
                senderType: 'Applicant',
                conversationId: conversation.id 
            });
            setEditingId(null);
            const res = await chatApi.getMessages(conversation.id);
            setMessages(res.data.messages);
        } catch (err) {
            console.error('Edit error:', err);
        }
    };

    const handleDelete = async (msgId: number, type: 'me' | 'everyone') => {
        if (!conversation) return;
        try {
            await chatApi.deleteMessage(msgId, type, 'Applicant', conversation.id);
            setDeletingId(null);
            const res = await chatApi.getMessages(conversation.id);
            setMessages(res.data.messages);
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const confirmDeleteHistory = async () => {
        if (!conversation) return;
        try {
            await chatApi.deleteConversation(conversation.id, 'Applicant');
            localStorage.removeItem('chat_conversation_id');
            // We KEEP chat_user_name and chat_user_email 
            setConversationId(null);
            setUnreadCount(0);
            setConversation(null);
            setMessages([]);
            setOnboarded(false);
        } catch (err) {
            console.error('Delete conversation error:', err);
        } finally {
            setIsDeletingHistory(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-outfit">
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 40, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, y: 40, filter: 'blur(10px)' }}
                        className="absolute bottom-20 right-[-8px] sm:right-0 w-[calc(100vw-32px)] sm:w-[360px] bg-slate-900 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-700/50 overflow-hidden flex flex-col"
                        style={{ height: 'min(580px, calc(100vh - 120px))' }}
                    >
                        {/* Header */}
                        <div className="bg-slate-800/50 border-b border-slate-700/50 px-5 py-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-1 bg-white/20 h-4 rounded-full" />
                                <div>
                                    <h3 className="font-black text-sm text-white flex items-center gap-2 tracking-tight uppercase">
                                        Live support
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Active session</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {onboarded && conversation && (
                                    <button 
                                        onClick={() => setIsDeletingHistory(true)}
                                        className="p-2 text-red-300 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all"
                                        title="Delete entire history"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-2.5 hover:bg-white/5 rounded-xl transition-all active:scale-90 text-slate-500 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-h-0 relative z-20 bg-slate-900 flex flex-col overflow-hidden">
                            {!onboarded ? (
                                <div className="flex-1 p-8 flex flex-col justify-center text-center">
                                    <div className="mb-10">
                                        <h4 className="text-xl font-black text-white tracking-tight uppercase">Chat with HR</h4>
                                        <p className="text-[11px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Please enter your details to start</p>
                                    </div>
                                    <form onSubmit={handleStartChat} className="space-y-4">
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="Full name" 
                                            className="w-full px-5 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl focus:bg-slate-800 focus:ring-2 focus:ring-white/10 outline-none transition-all font-bold text-[13px] text-white placeholder:text-slate-600"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                        <input 
                                            required
                                            type="email" 
                                            placeholder="Email address" 
                                            className="w-full px-5 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl focus:bg-slate-800 focus:ring-2 focus:ring-white/10 outline-none transition-all font-bold text-[13px] text-white placeholder:text-slate-600"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                        <button 
                                            disabled={loading}
                                            className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl shadow-2xl hover:bg-slate-100 active:scale-95 transition-all text-xs tracking-widest uppercase mt-4"
                                        >
                                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Start chat'}
                                        </button>
                                    </form>
                                    <p className="mt-10 text-[9px] text-slate-600 font-bold tracking-widest uppercase">Typical response: 5 mins</p>
                                </div>
                            ) : (
                                <>
                                    <div 
                                        ref={scrollRef}
                                        className="flex-1 overflow-y-auto p-5 space-y-5 scroll-smooth custom-scrollbar"
                                    >
                                        {messages.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-50">
                                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                                    <Info size={20} className="text-slate-400" />
                                                </div>
                                                <p className="text-xs font-bold text-white uppercase tracking-tighter">No messages yet</p>
                                                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-medium">Send a message to start the conversation</p>
                                            </div>
                                        ) : (
                                            messages.map((msg) => {
                                                const isApplicant = msg.senderType === 'Applicant';
                                                return (
                                                    <div key={msg.id} className={`flex gap-3 ${isApplicant ? 'flex-row-reverse' : 'flex-row'}`}>
                                                        <div className={`max-w-[80%] group flex flex-col ${isApplicant ? 'items-end' : 'items-start'}`}>
                                                            <div className="flex items-center gap-2 group/actions">
                                                                {isApplicant && !msg.isDeletedForEveryone && (
                                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover/actions:opacity-100 transition-all duration-200">
                                                                        <button 
                                                                            onClick={() => {
                                                                                setEditingId(msg.id);
                                                                                setEditInput(msg.message);
                                                                            }}
                                                                            className="p-1.5 hover:bg-white/5 rounded-lg text-slate-600 hover:text-white transition-all"
                                                                            title="Edit"
                                                                        >
                                                                            <Pencil size={12} />
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => {
                                                                                setDeletingId(msg.id);
                                                                            }}
                                                                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-600 hover:text-red-400 transition-all"
                                                                            title="Delete message"
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                
                                                                <div className={`p-4 px-5 rounded-2xl flex flex-col shadow-lg ${
                                                                    msg.isDeletedForEveryone
                                                                    ? 'bg-slate-800/50 border border-slate-700 text-slate-500 italic rounded-br-none'
                                                                    : isApplicant 
                                                                    ? 'bg-slate-100 text-slate-900 rounded-br-none font-bold' 
                                                                    : 'bg-slate-800 border border-slate-700 text-white rounded-bl-none font-medium'
                                                                }`}>
                                                                    {editingId === msg.id ? (
                                                                        <div className="flex flex-col gap-3 min-w-[180px]">
                                                                            <textarea 
                                                                                className="w-full bg-slate-900 text-white p-3 text-[12px] rounded-xl outline-none border border-slate-700 focus:border-white/20 transition-all min-h-[80px]"
                                                                                value={editInput}
                                                                                onChange={(e) => setEditInput(e.target.value)}
                                                                                autoFocus
                                                                            />
                                                                            <div className="flex justify-end gap-2">
                                                                                <button onClick={() => setEditingId(null)} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Cancel</button>
                                                                                <button onClick={() => handleEdit(msg.id)} className="px-3 py-1 bg-white text-slate-900 text-[10px] font-black uppercase rounded-lg hover:bg-slate-100 transition-all">Save</button>
                                                                            </div>
                                                                        </div>
                                                                    ) : deletingId === msg.id ? (
                                                                        <div className="flex flex-col gap-2 min-w-[150px] p-1 text-center">
                                                                            <p className="text-[9px] font-black text-red-400 uppercase tracking-tighter mb-1">Delete message?</p>
                                                                            <div className="flex flex-col gap-1.5">
                                                                                <button 
                                                                                    onClick={() => handleDelete(msg.id, 'everyone')}
                                                                                    className="w-full py-1.5 bg-red-500/10 text-red-400 text-[9px] font-black uppercase rounded-lg hover:bg-red-500/20 transition-all"
                                                                                >
                                                                                    Everyone
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => handleDelete(msg.id, 'me')}
                                                                                    className="w-full py-1.5 bg-slate-800 text-slate-400 text-[9px] font-black uppercase rounded-lg hover:bg-slate-700 transition-all"
                                                                                >
                                                                                    Me Only
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => setDeletingId(null)} 
                                                                                    className="w-full py-1 text-[8px] font-black uppercase text-slate-600 hover:text-slate-400 transition-colors"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className={`flex items-center gap-2 mt-2 transition-opacity duration-300 ${isApplicant ? 'flex-row-reverse' : 'flex-row'}`}>
                                                                {msg.isEdited && !msg.isDeletedForEveryone && (
                                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-tighter italic">Edited</span>
                                                                )}
                                                                <span className="text-[9px] text-white/20 font-black tracking-widest uppercase">
                                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div className="p-5 bg-slate-800/30 border-t border-slate-700/50">
                                        <div className="relative group">
                                            <input 
                                                type="text" 
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                                placeholder="Write a message..."
                                                className="w-full pl-6 pr-14 py-4 bg-slate-800 border border-slate-700 rounded-2xl focus:bg-slate-700 focus:border-slate-500 transition-all outline-none font-bold text-[13px] text-white placeholder:text-slate-600 shadow-inner"
                                            />
                                            <button 
                                                onClick={handleSend}
                                                disabled={!input.trim()}
                                                className="absolute right-1.5 top-1.5 w-11 h-11 bg-white text-slate-900 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-20 shadow-xl"
                                            >
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => useChatStore.getState().toggleChat()}
                className={`w-16 h-16 rounded-3xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all border ${
                    isOpen 
                    ? 'bg-white text-slate-900 border-white' 
                    : 'bg-slate-900 text-white border-slate-700 hover:border-slate-500'
                }`}
            >
                {isOpen ? <X size={24} strokeWidth={3} /> : (
                    <div className="relative">
                        <span className="text-[10px] font-black uppercase tracking-widest">Chat</span>
                        {unreadCount > 0 ? (
                            <div className="absolute -top-4 -right-4 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg animate-bounce border-2 border-white">
                                {unreadCount}
                            </div>
                        ) : (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                        )}
                    </div>
                )}
            </motion.button>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
            <ConfirmDialog
                isOpen={isDeletingHistory}
                title="Delete Chat History"
                message="Are you sure you want to PERMANENTLY delete your entire chat history? This cannot be undone."
                isDestructive={true}
                confirmText="Delete History"
                onClose={() => setIsDeletingHistory(false)}
                onConfirm={confirmDeleteHistory}
            />
        </div>
    );
};

export default LiveChatWidget;
