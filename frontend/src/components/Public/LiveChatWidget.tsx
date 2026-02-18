import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, Loader2, Info } from 'lucide-react';
import { chatApi, ChatMessage, ChatConversation } from '@/api/chatApi';
import { useChatStore } from '@/stores/chatStore';

const LiveChatWidget = () => {
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
                conversation_id: conversation.id,
                message: originalMsg,
                sender_type: 'Applicant'
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
                        className="absolute bottom-20 right-0 w-[320px] bg-white rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100/50 overflow-hidden flex flex-col"
                        style={{ height: '540px' }}
                    >
                        {/* Master V2 Header */}
                        <div className="bg-[#0f172a] p-4 pb-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/10">
                                        <MessageCircle size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black tracking-widest text-white uppercase font-sans">Human Resources</h3>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="relative flex h-1.5 w-1.5">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Online</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-all active:scale-90 text-white/50 hover:text-white"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Content Overlay Container */}
                        <div className="flex-1 -mt-8 relative z-20 bg-white rounded-t-[2rem] flex flex-col overflow-hidden">
                            {!onboarded ? (
                                <div className="flex-1 p-6 flex flex-col justify-center text-center">
                                    <div className="mb-6">
                                        <h4 className="text-base font-black text-slate-900 tracking-tight italic">Chat with HR</h4>
                                        <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Please enter your details to start a conversation.</p>
                                    </div>
                                    <form onSubmit={handleStartChat} className="space-y-4">
                                        <div className="space-y-1.5 text-left">
                                            <input 
                                                required
                                                type="text" 
                                                placeholder="Full Name" 
                                                className="w-full px-5 py-3 bg-slate-50 border-0 rounded-xl focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none transition-all font-bold text-[13px] text-slate-800 placeholder:text-slate-300"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5 text-left">
                                            <input 
                                                required
                                                type="email" 
                                                placeholder="Email Address" 
                                                className="w-full px-5 py-3 bg-slate-50 border-0 rounded-xl focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none transition-all font-bold text-[13px] text-slate-800 placeholder:text-slate-300"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                        <button 
                                            disabled={loading}
                                            className="w-full bg-slate-950 text-white font-black py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 mt-2"
                                        >
                                            {loading ? <Loader2 size={16} className="animate-spin text-white/50" /> : 'Start Chat'}
                                        </button>
                                    </form>
                                    <p className="mt-6 text-[9px] text-slate-400 font-bold uppercase tracking-widest">Typical response: 5 mins</p>
                                </div>
                            ) : (
                                <>
                                    <div 
                                        ref={scrollRef}
                                        className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20"
                                    >
                                        {messages.length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-4">
                                                <MessageCircle className="text-slate-900 mb-2" size={24} />
                                                <p className="text-[10px] font-black uppercase tracking-tight">Connected with HR Support</p>
                                            </div>
                                        )}
                                        {messages.map((msg) => {
                                            const isApplicant = msg.sender_type === 'Applicant';
                                            return (
                                                <div key={msg.id} className={`flex ${isApplicant ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[90%] p-3 px-4 rounded-2xl flex flex-col ${
                                                        isApplicant 
                                                        ? 'bg-slate-900 text-white rounded-br-none' 
                                                        : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none shadow-sm'
                                                    }`}>
                                                        <p className="text-[13px] font-bold leading-relaxed">{msg.message}</p>
                                                        <span className="text-[8px] mt-1 text-right opacity-30 font-black tracking-tighter uppercase">
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="p-4 bg-white border-t border-slate-50">
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                                placeholder="Message HR..."
                                                className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none font-bold text-[13px] text-slate-800 placeholder:text-slate-400"
                                            />
                                            <button 
                                                onClick={handleSend}
                                                disabled={!input.trim()}
                                                className="absolute right-1.5 top-1.5 w-10 h-10 bg-slate-950 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-30"
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
                className={`w-14 h-14 rounded-2xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all ${
                    isOpen ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a] border border-slate-100'
                }`}
            >
                {isOpen ? <X size={24} /> : (
                    <div className="relative">
                        <MessageCircle size={26} strokeWidth={2.5} />
                        <div className="absolute top-0 right-0 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full shadow-sm"></div>
                    </div>
                )}
            </motion.button>
        </div>
    );
};

export default LiveChatWidget;
