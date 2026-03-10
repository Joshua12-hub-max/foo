import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, Loader2, Info } from 'lucide-react';
import { chatApi, ChatMessage, ChatConversation } from '@/api/chatApi';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { formatFullName } from '@/utils/nameUtils';

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
    const scrollRef = useRef<HTMLDivElement>(null);

    // Form for onboarding
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    // Auto-onboard if authenticated
    useEffect(() => {
        if (isAuthenticated && user && !onboarded && !loading && isOpen) {
            const autoOnboard = async () => {
                setLoading(true);
                try {
                    const userName = formatFullName(user.lastName, user.firstName);
                    const res = await chatApi.start(userName, user.email);
                    if (res.data.success) {
                        setConversation(res.data.conversation);
                        setOnboarded(true);
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
    }, [isAuthenticated, user, onboarded, isOpen]);

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

            fetchMessages(); // Initial fetch
            interval = setInterval(fetchMessages, 5000); // Poll every 5s
        }
        return () => clearInterval(interval);
    }, [isOpen, conversation]);

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
            const res = await chatApi.start(name, email);
            if (res.data.success) {
                setConversation(res.data.conversation);
                setOnboarded(true);
                // Try to load history
                const msgRes = await chatApi.getMessages(res.data.conversation.id);
                setMessages(msgRes.data.messages);
            }
        } catch (err) {
            console.error('Failed to start chat', err);
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

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-outfit">
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 40, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, y: 40, filter: 'blur(10px)' }}
                        className="absolute bottom-20 right-[-8px] sm:right-0 w-[calc(100vw-32px)] sm:w-[340px] bg-[#131314] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-[#444746] overflow-hidden flex flex-col"
                        style={{ height: 'min(560px, calc(100vh - 120px))' }}
                    >
                        {/* Master V2 Header */}
                        <div className="bg-[#1e1e1f] border-b border-[#444746] px-5 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                                    <MessageCircle size={18} className="text-green-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-white flex items-center gap-2 tracking-tight">
                                        Live support
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 tracking-tight">Active session</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-all active:scale-90 text-white/50 hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Content Overlay Container */}
                        <div className="flex-1 min-h-0 relative z-20 bg-[#131314] flex flex-col overflow-hidden">
                            {!onboarded ? (
                                <div className="flex-1 p-8 flex flex-col justify-center text-center">
                                    <div className="mb-8">
                                        <h4 className="text-lg font-black text-white tracking-tight">Chat with HR</h4>
                                        <p className="text-[11px] text-slate-400 mt-2 font-medium">Please enter your details to start a conversation.</p>
                                    </div>
                                    <form onSubmit={handleStartChat} className="space-y-4">
                                        <div className="space-y-1.5 text-left">
                                            <input 
                                                required
                                                type="text" 
                                                placeholder="Full name" 
                                                className="w-full px-5 py-3.5 bg-[#1e1e1f] border border-[#444746] rounded-xl focus:bg-[#1e1e1f] focus:ring-1 focus:ring-green-500/50 outline-none transition-all font-bold text-[13px] text-white placeholder:text-slate-500"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5 text-left">
                                            <input 
                                                required
                                                type="email" 
                                                placeholder="Email address" 
                                                className="w-full px-5 py-3.5 bg-[#1e1e1f] border border-[#444746] rounded-xl focus:bg-[#1e1e1f] focus:ring-1 focus:ring-green-500/50 outline-none transition-all font-bold text-[13px] text-white placeholder:text-slate-500"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                        <button 
                                            disabled={loading}
                                            className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/10 hover:bg-green-500 active:scale-95 transition-all text-xs tracking-tight flex items-center justify-center gap-2 mt-4"
                                        >
                                            {loading ? <Loader2 size={16} className="animate-spin text-white/50" /> : 'Start chat'}
                                        </button>
                                    </form>
                                    <p className="mt-8 text-[9px] text-slate-500 font-bold tracking-tight">Typical response: 5 mins</p>
                                </div>
                            ) : (
                                <>
                                    <div 
                                        ref={scrollRef}
                                        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
                                    >
                                        {messages.length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-4">
                                                <MessageCircle className="text-white mb-2" size={24} />
                                                <p className="text-[10px] font-bold tracking-tight text-white">Connected with HR support</p>
                                            </div>
                                        )}
                                        {messages.map((msg) => {
                                            const isApplicant = msg.senderType === 'Applicant';
                                            return (
                                                <div key={msg.id} className={`flex ${isApplicant ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] p-3.5 px-4 rounded-2xl flex flex-col ${
                                                        isApplicant 
                                                        ? 'bg-green-600 text-white rounded-br-none shadow-sm' 
                                                        : 'bg-[#1e1e1f] border border-[#444746] text-white rounded-bl-none shadow-sm'
                                                    }`}>
                                                        <p className="text-[13px] font-medium leading-relaxed">{msg.message}</p>
                                                        <span className="text-[8px] mt-1.5 opacity-40 font-bold tracking-tight text-right">
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="p-4 bg-[#1e1e1f]/50 border-t border-[#444746]">
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                                placeholder="Message HR..."
                                                className="w-full pl-5 pr-12 py-3.5 bg-[#1e1e1f] border border-[#444746] rounded-xl focus:ring-1 focus:ring-green-500/50 transition-all outline-none font-bold text-[13px] text-white placeholder:text-slate-500"
                                            />
                                            <button 
                                                onClick={handleSend}
                                                disabled={!input.trim()}
                                                className="absolute right-1.5 top-1.5 w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center hover:bg-green-500 transition-all active:scale-95 disabled:opacity-30"
                                            >
                                                <Send size={14} />
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
                className={`w-14 h-14 rounded-2xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.3)] flex items-center justify-center transition-all ${
                    isOpen ? 'bg-white text-[#131314]' : 'bg-[#131314] text-white border border-[#444746]'
                }`}
            >
                {isOpen ? <X size={24} /> : (
                    <div className="relative">
                        <MessageCircle size={26} strokeWidth={2.5} />
                        <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#131314] rounded-full shadow-sm"></div>
                    </div>
                )}
            </motion.button>
        </div>
    );
};

export default LiveChatWidget;
