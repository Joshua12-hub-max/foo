import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, Loader2, Trash2, AlertCircle } from 'lucide-react';
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
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeletingHistory, setIsDeletingHistory] = useState(false);
    const [isConnected, setIsConnected] = useState(true);
    const [isPageVisible, setIsPageVisible] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const unreadCount = useChatStore(state => state.unreadCount);
    const setUnreadCount = useChatStore(state => state.setUnreadCount);
    const setConversationId = useChatStore(state => state.setConversationId);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [formErrors, setFormErrors] = useState<{ name?: string; email?: string }>({});

    // Visibility Listener
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsPageVisible(document.visibilityState === 'visible');
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Load from localStorage or Auto-onboard if authenticated
    useEffect(() => {
        const savedId = localStorage.getItem('chat_conversation_id');
        const savedName = localStorage.getItem('chat_user_name');
        const savedEmail = localStorage.getItem('chat_user_email');

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
                        setIsConnected(true);
                    }
                } catch (err) {
                    console.error('Auto-onboard failed:', err);
                    setIsConnected(false);
                } finally {
                    setLoading(false);
                }
            };
            autoOnboard();
        }
    }, [isAuthenticated, user, onboarded, isOpen, setConversationId, loading]);

    // Poll for new messages when open and page is visible
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isOpen && conversation && isPageVisible) {
            const fetchMessages = async () => {
                try {
                    const res = await chatApi.getMessages(conversation.id, true, 'Applicant');
                    if (res.data.success) {
                        setMessages(res.data.messages);
                        setIsConnected(true);
                    }
                } catch (err) {
                    console.error('Polling error:', err);
                    setIsConnected(false);
                }
            };

            fetchMessages();
            interval = setInterval(fetchMessages, 4000);
        }
        return () => clearInterval(interval);
    }, [isOpen, conversation, isPageVisible]);

    // Poll for unread count when closed and page is visible
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (!isOpen && conversation && isPageVisible) {
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

            fetchUnread();
            interval = setInterval(fetchUnread, 12000);
        }
        return () => clearInterval(interval);
    }, [isOpen, conversation, setUnreadCount, isPageVisible]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleStartChat = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});
        setLoading(true);

        try {
            chatStartSchema.parse({ name: name.trim(), email: email.trim() });

            const res = await chatApi.start(name.trim(), email.trim());
            if (res.data.success) {
                setConversation(res.data.conversation);
                setConversationId(res.data.conversation.id);
                setOnboarded(true);
                localStorage.setItem('chat_conversation_id', res.data.conversation.id.toString());
                localStorage.setItem('chat_user_name', name.trim());
                localStorage.setItem('chat_user_email', email.trim());
                const msgRes = await chatApi.getMessages(res.data.conversation.id);
                setMessages(msgRes.data.messages);
                setIsConnected(true);
                toast.success('Chat started successfully!');
            }
        } catch (err: unknown) {
            console.error('Failed to start chat', err);
            if (err instanceof ZodError) {
                const errors: { name?: string; email?: string } = {};
                err.issues.forEach(issue => {
                    const path = issue.path[0] as string;
                    if (path === 'name') errors.name = issue.message;
                    if (path === 'email') errors.email = issue.message;
                });
                setFormErrors(errors);
            } else if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                const serverMsg = axiosErr.response?.data?.message || 'Failed to start chat';
                toast.error(serverMsg);
            } else {
                toast.error('Failed to start chat. Please check your connection.');
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
            const res = await chatApi.sendMessage({
                conversationId: conversation.id,
                message: originalMsg.trim(),
                senderType: 'Applicant'
            });
            if (res.data.success) {
                setMessages(prev => [...prev, res.data.message]);
                setIsConnected(true);
            }
        } catch (err) {
            console.error('Send error:', err);
            setInput(originalMsg);
            toast.error('Failed to send message. Please try again.');
            setIsConnected(false);
        }
    };

    const handleDeleteHistory = async () => {
        if (!conversation) return;
        setIsDeletingHistory(true);
        try {
            await chatApi.deleteConversation(conversation.id, 'Applicant');
            localStorage.removeItem('chat_conversation_id');
            localStorage.removeItem('chat_user_name');
            localStorage.removeItem('chat_user_email');
            setConversation(null);
            setMessages([]);
            setOnboarded(false);
            setIsOpen(false);
            toast.success('Chat history deleted');
        } catch (err) {
            console.error('Delete history error:', err);
            toast.error('Failed to delete chat history');
        } finally {
            setIsDeletingHistory(false);
            setDeletingId(null);
        }
    };

    return (
        <>
            {/* Chat Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 p-4 bg-[var(--zed-bg-dark)] hover:bg-[var(--zed-bg-darker)] text-white rounded-full shadow-[var(--zed-shadow-xl)] transition-all active:scale-95 border border-[var(--zed-border-dark)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X size={24} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            className="relative"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                        >
                            <MessageCircle size={24} />
                            {unreadCount > 0 ? (
                                <div className="absolute -top-3 -right-3 bg-[var(--zed-primary)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-[var(--zed-bg-dark)]">
                                    {unreadCount}
                                </div>
                            ) : (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--zed-primary)] rounded-full animate-pulse border-2 border-[var(--zed-bg-dark)]"></div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 w-[380px] h-[600px] bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] shadow-[var(--zed-shadow-xl)] z-50 flex flex-col overflow-hidden font-sans"
                    >
                        {/* Header */}
                        <div className="bg-[var(--zed-bg-dark)] px-6 py-5 flex items-center justify-between border-b border-[var(--zed-border-dark)]">
                            <div>
                                <h3 className="font-bold text-lg text-white flex items-center gap-2 tracking-tight">
                                    Live Support
                                    {isConnected ? (
                                        <span className="flex h-2 w-2 rounded-full bg-[var(--zed-primary)] animate-pulse"></span>
                                    ) : (
                                        <span className="flex h-2 w-2 rounded-full bg-[var(--zed-error)]"></span>
                                    )}
                                </h3>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                                    {isConnected ? 'Online' : 'Reconnecting...'}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-[var(--zed-border-dark)] rounded-lg transition-colors text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Onboarding Form */}
                        {!onboarded ? (
                            <div className="flex-1 p-8 flex flex-col justify-center bg-[var(--zed-bg-surface)]">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-white border border-[var(--zed-border-light)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <MessageCircle size={32} className="text-[var(--zed-bg-dark)]" />
                                    </div>
                                    <h4 className="text-2xl font-bold text-[var(--zed-text-dark)] tracking-tight mb-2">
                                        How can we help?
                                    </h4>
                                    <p className="text-sm text-[var(--zed-text-muted)] font-medium">
                                        Start a conversation with our HR team
                                    </p>
                                </div>

                                <form onSubmit={handleStartChat} className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--zed-text-dark)] uppercase tracking-wider mb-2">
                                            Your Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className={`w-full px-4 py-3 bg-white border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-4 transition-all ${
                                                formErrors.name
                                                    ? 'border-[var(--zed-error)] ring-[var(--zed-error)]/10'
                                                    : 'border-[var(--zed-border-light)] focus:border-[var(--zed-primary)] focus:ring-[var(--zed-primary)]/10'
                                            }`}
                                            placeholder="John Doe"
                                        />
                                        {formErrors.name && (
                                            <p className="text-[10px] text-[var(--zed-error)] font-bold mt-1.5 uppercase tracking-wide flex items-center gap-1">
                                                <AlertCircle size={10} />
                                                {formErrors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[var(--zed-text-dark)] uppercase tracking-wider mb-2">
                                            Work Email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={`w-full px-4 py-3 bg-white border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-4 transition-all ${
                                                formErrors.email
                                                    ? 'border-[var(--zed-error)] ring-[var(--zed-error)]/10'
                                                    : 'border-[var(--zed-border-light)] focus:border-[var(--zed-primary)] focus:ring-[var(--zed-primary)]/10'
                                            }`}
                                            placeholder="john@example.com"
                                        />
                                        {formErrors.email && (
                                            <p className="text-[10px] text-[var(--zed-error)] font-bold mt-1.5 uppercase tracking-wide flex items-center gap-1">
                                                <AlertCircle size={10} />
                                                {formErrors.email}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full zed-btn zed-btn-primary py-4 shadow-lg disabled:opacity-50 inline-flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Initializing...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                Start Chat
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <>
                                {/* Messages */}
                                <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4 bg-[var(--zed-bg-surface)] scrollbar-premium">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex items-center justify-center p-8">
                                            <div className="text-center">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--zed-border-light)]">
                                                    <MessageCircle size={24} className="text-slate-300" />
                                                </div>
                                                <p className="text-sm text-[var(--zed-text-dark)] font-bold tracking-tight">
                                                    No messages yet
                                                </p>
                                                <p className="text-xs text-[var(--zed-text-muted)] mt-1 font-medium">
                                                    Ask us anything about Meycauayan HR!
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.senderType === 'Applicant' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[85%] rounded-[var(--radius-md)] px-4 py-3 shadow-sm ${
                                                        msg.senderType === 'Applicant'
                                                            ? 'bg-[var(--zed-bg-dark)] text-white'
                                                            : 'bg-white border border-[var(--zed-border-light)] text-[var(--zed-text-dark)]'
                                                    }`}
                                                >
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">
                                                        {msg.message}
                                                    </p>
                                                    <p
                                                        className={`text-[10px] mt-2 font-bold uppercase tracking-wide ${
                                                            msg.senderType === 'Applicant'
                                                                ? 'text-slate-400'
                                                                : 'text-[var(--zed-text-muted)]'
                                                        }`}
                                                    >
                                                        {new Date(msg.createdAt).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Connection Status Banner */}
                                {!isConnected && (
                                    <div className="px-4 py-2 bg-[var(--zed-error)] text-white">
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                                            <AlertCircle size={14} />
                                            Reconnecting to live support...
                                        </div>
                                    </div>
                                )}

                                {/* Input Area */}
                                <div className="p-4 bg-white border-t border-[var(--zed-border-light)]">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                            placeholder="Type your message..."
                                            className="flex-1 px-4 py-3 bg-[var(--zed-bg-surface)] border border-[var(--zed-border-light)] rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-4 focus:ring-[var(--zed-primary)]/10 focus:border-[var(--zed-primary)]"
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!input.trim()}
                                            className="zed-btn zed-btn-primary px-4 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <button
                                            onClick={() => setDeletingId(-1)}
                                            className="text-[10px] text-[var(--zed-error)] hover:underline font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                                        >
                                            <Trash2 size={12} />
                                            Reset Conversation
                                        </button>
                                        <span className="text-[10px] text-[var(--zed-text-muted)] font-bold uppercase tracking-wider">
                                            Press Enter to send
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={deletingId === -1}
                onClose={() => setDeletingId(null)}
                onConfirm={handleDeleteHistory}
                title="Delete Chat History"
                message="Are you sure you want to delete this entire conversation? This action cannot be undone."
                confirmText="Delete"
                isLoading={isDeletingHistory}
            />
        </>
    );
};

export default LiveChatWidget;
