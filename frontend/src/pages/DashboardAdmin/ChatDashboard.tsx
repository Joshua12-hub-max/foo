import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi, ChatConversation, ChatMessage } from '@/api/chatApi';
import { 
  MessageCircle, Send, User, Clock, CheckCircle2, 
  Search, Loader2, MoreVertical, X, Mail
} from 'lucide-react';
import { useToastStore } from '@/stores';

const ChatDashboard = () => {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    const queryClient = useQueryClient();
    const showToast = useToastStore((state) => state.showToast);
    const scrollRef = useRef<HTMLDivElement>(null);

    // List of conversations
    const { data: convData, isLoading: loadingConv } = useQuery({
        queryKey: ['chat-conversations'],
        queryFn: () => chatApi.getConversations(),
        refetchInterval: 5000 // Poll for new chats
    });

    const conversations = convData?.data.conversations || [];

    // Messages for selected conversation (manual polling inside useEffect)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (selectedId) {
            const fetchMsgs = async () => {
                const res = await chatApi.getMessages(selectedId, true, 'Administrator');
                if (res.data.success) {
                    setMessages(res.data.messages);
                }
            };
            fetchMsgs();
            interval = setInterval(fetchMsgs, 3000);
        } else {
            setMessages([]);
        }
        return () => clearInterval(interval);
    }, [selectedId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !selectedId) return;

        const msgText = input;
        setInput('');

        try {
            await chatApi.sendMessage({
                conversationId: selectedId,
                message: msgText,
                senderType: 'Administrator'
            });
            const res = await chatApi.getMessages(selectedId);
            setMessages(res.data.messages);
        } catch (err) {
            showToast('Failed to send message', 'error');
            setInput(msgText);
        }
    };

    const closeMutation = useMutation({
        mutationFn: (id: number) => chatApi.close(id),
        onSuccess: () => {
            showToast('Conversation closed', 'success');
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            setSelectedId(null);
        }
    });

    const filteredConversations = conversations.filter(c => 
        c.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.applicant_email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedConv = conversations.find(c => c.id === selectedId);

    return (
        <div className="h-[calc(100vh-140px)] flex gap-6 animate-in fade-in duration-500">
            {/* Conversations List */}
            <div className="w-[350px] flex flex-col gap-4">
                <div className="bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm h-full">
                    <div className="p-5 border-b border-slate-100 flex flex-col gap-4">
                        <h2 className="text-xl font-black text-slate-900 leading-tight">Live Support</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Search conversations..."
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 outline-none font-bold text-xs"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loadingConv ? (
                            <div className="p-10 flex flex-col items-center gap-3">
                                <Loader2 className="animate-spin text-slate-400" />
                                <span className="text-[10px] font-black uppercase text-slate-400">Loading Chats...</span>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="p-10 text-center text-slate-400 italic text-sm">
                                No active chats found.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {filteredConversations.map(conv => (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedId(conv.id)}
                                        className={`w-full p-5 text-left transition-all hover:bg-slate-50 flex flex-col gap-1.5 relative ${
                                            selectedId === conv.id ? 'bg-slate-50 border-r-4 border-slate-900' : 'border-r-4 border-transparent'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-black text-slate-900 text-sm truncate pr-8">{conv.applicant_name}</h4>
                                            {conv.unread_count && conv.unread_count > 0 ? (
                                                <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full absolute top-5 right-5">
                                                    {conv.unread_count}
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                            <Mail size={10} /> {conv.applicant_email}
                                        </p>
                                        {conv.last_message && (
                                            <p className="text-xs text-slate-500 line-clamp-1 italic mt-1 font-medium">
                                                "{conv.last_message}"
                                            </p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat View */}
            <div className="flex-1">
                {selectedId && selectedConv ? (
                    <div className="bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-xl h-full">
                        {/* Chat Header */}
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-lg">
                                    {selectedConv.applicant_name[0]}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 leading-tight">{selectedConv.applicant_name}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Ongoing Support</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => closeMutation.mutate(selectedId)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black transition-colors flex items-center gap-2"
                                >
                                    <CheckCircle2 size={14} /> Mark as Resolved
                                </button>
                                <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30"
                        >
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.senderType === 'Administrator' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[70%] group flex flex-col ${msg.senderType === 'Administrator' ? 'items-end' : 'items-start'}`}>
                                        <div className={`p-4 rounded-3xl shadow-sm border ${
                                            msg.senderType === 'Administrator'
                                            ? 'bg-slate-900 border-slate-900 text-white rounded-br-none'
                                            : 'bg-white border-white text-slate-700 rounded-bl-none'
                                        }`}>
                                            <p className="text-sm font-medium leading-relaxed">{msg.message}</p>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {new Date(msg.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply Area */}
                        <div className="p-6 bg-white border-t border-slate-100">
                            <form onSubmit={handleSend} className="relative">
                                <input 
                                    type="text" 
                                    placeholder={`Reply to ${selectedConv.applicant_name}...`}
                                    className="w-full pl-6 pr-16 py-4 bg-slate-100 border border-transparent rounded-[1.5rem] focus:bg-white focus:border-slate-900/10 focus:ring-4 focus:ring-slate-900/5 outline-none font-bold text-sm text-slate-800 transition-all"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <button 
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="absolute right-2 top-2 p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="h-full bg-white border border-slate-200 border-dashed rounded-3xl flex flex-col items-center justify-center text-center p-12 space-y-4">
                        <div className="p-6 bg-slate-50 rounded-full text-slate-200">
                            <MessageCircle size={64} strokeWidth={1} />
                        </div>
                        <div className="max-w-xs">
                            <h4 className="text-xl font-black text-slate-900">Select a Conversation</h4>
                            <p className="text-sm font-medium text-slate-400 mt-2 leading-relaxed">
                                Pick an ongoing chat from the list to start responding to applicant inquiries.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatDashboard;
