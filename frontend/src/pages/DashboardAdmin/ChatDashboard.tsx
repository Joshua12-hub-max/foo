import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi, ChatConversation, ChatMessage } from '@/api/chatApi';
import { 
  Send, User, Clock, CheckCircle2, 
  Search, Loader2, MoreVertical, X, Mail, Pencil, Trash2
} from 'lucide-react';
import { useToastStore, useAuthStore } from '@/stores';

const ChatDashboard = () => {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editInput, setEditInput] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    
    const queryClient = useQueryClient();
    const showToast = useToastStore((state) => state.showToast);
    const currentUser = useAuthStore((state) => state.user);
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
            const res = await chatApi.getMessages(selectedId, false, 'Administrator');
            setMessages(res.data.messages);
        } catch (err) {
            showToast('Failed to send message', 'error');
            setInput(msgText);
        }
    };

    const handleEdit = async (msgId: number) => {
        if (!editInput.trim()) return;
        try {
            await chatApi.editMessage(msgId, { message: editInput, senderType: 'Administrator' });
            setEditingId(null);
            if (selectedId) {
                const res = await chatApi.getMessages(selectedId, false, 'Administrator');
                setMessages(res.data.messages);
            }
        } catch (err) {
            showToast('Failed to edit message', 'error');
        }
    };

    const handleDelete = async (msgId: number, type: 'me' | 'everyone') => {
        try {
            await chatApi.deleteMessage(msgId, type, 'Administrator');
            if (selectedId) {
                const res = await chatApi.getMessages(selectedId, false, 'Administrator');
                setMessages(res.data.messages);
            }
            setDeletingId(null);
            showToast('Message deleted', 'success');
        } catch (err) {
            showToast('Failed to delete message', 'error');
        }
    };

    const handleDeleteConversation = async () => {
        if (!selectedId || !confirm('Are you sure you want to PERMANENTLY delete this entire conversation and all its messages? This cannot be undone.')) return;
        try {
            await chatApi.deleteConversation(selectedId, 'Administrator');
            showToast('Conversation deleted', 'success');
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            setSelectedId(null);
        } catch (err) {
            showToast('Failed to delete conversation', 'error');
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
        c.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedConv = conversations.find(c => c.id === selectedId);

    return (
        <div className="h-[calc(100vh-140px)] flex gap-6 animate-in fade-in duration-500 relative">
            {/* Delete Confirmation Modal */}

            {/* Conversations List */}
            <div className="w-[350px] flex flex-col gap-4">
                <div className="bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm h-full">
                    <div className="p-5 border-b border-slate-100 flex flex-col gap-4">
                        <h2 className="text-lg font-semibold text-slate-800 leading-tight">Live Support</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Search conversations..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-900/5 outline-none font-normal text-xs"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loadingConv ? (
                            <div className="p-10 flex flex-col items-center gap-3">
                                <Loader2 className="animate-spin text-slate-400" />
                                <span className="text-[10px] font-medium uppercase text-slate-400">Loading Chats...</span>
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
                                        className={`w-full p-4 text-left transition-all hover:bg-slate-50 flex items-center gap-3 relative ${
                                            selectedId === conv.id ? 'bg-slate-100/50 border-r-4 border-slate-400' : 'border-r-4 border-transparent'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold text-slate-700 text-sm truncate">{conv.applicantName}</h4>
                                                {conv.unreadCount && conv.unreadCount > 0 ? (
                                                    <span className="bg-slate-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                                        {conv.unreadCount}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="text-[10px] font-normal text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                                <Clock size={10} /> {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
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
                    <div className="bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm h-full">
                        {/* Chat Header */}
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 leading-tight">{selectedConv.applicantName}</h3>
                                    <p className="text-[11px] font-normal text-slate-500 truncate">{selectedConv.applicantEmail}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => closeMutation.mutate(selectedId)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
                                >
                                    <CheckCircle2 size={14} /> Resolve
                                </button>
                                <button 
                                    onClick={handleDeleteConversation}
                                    className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"
                                    title="Delete Conversation"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-8 space-y-6 bg-white"
                        >
                             {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex items-end gap-3 ${msg.senderType === 'Administrator' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    {/* Avatar */}

                                    <div className={`max-w-[70%] group flex flex-col ${msg.senderType === 'Administrator' ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2">
                                            {/* Show Edit ONLY for my messages */}
                                            {msg.senderType === 'Administrator' && msg.senderId === currentUser?.id && !msg.isDeletedForEveryone && (
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingId(msg.id);
                                                            setEditInput(msg.message);
                                                        }}
                                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>
                                                </div>
                                            )}
                                            
                                            {/* Show Delete for Everyone for ALL messages (Moderation) */}
                                            {!msg.isDeletedForEveryone && (
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                    <button 
                                                        onClick={() => {
                                                            setDeletingId(msg.id);
                                                        }}
                                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                                                        title="Delete message"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            )}
                                            
                                            <div className={`p-4 rounded-2xl border ${
                                                msg.isDeletedForEveryone
                                                ? 'bg-slate-50 border-slate-200 text-slate-400 italic'
                                                : msg.senderType === 'Administrator'
                                                ? 'bg-slate-100 border-slate-200 text-slate-700'
                                                : 'bg-white border-slate-200 text-slate-700'
                                            } ${msg.senderType === 'Administrator' ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                                                {editingId === msg.id ? (
                                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                                        <textarea 
                                                            className="w-full bg-white text-slate-700 p-2 text-sm rounded-xl outline-none border border-slate-200 focus:border-slate-400"
                                                            value={editInput}
                                                            onChange={(e) => setEditInput(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => setEditingId(null)} className="text-[10px] font-semibold uppercase text-slate-400 hover:text-slate-600">Cancel</button>
                                                            <button onClick={() => handleEdit(msg.id)} className="text-[10px] font-semibold uppercase text-slate-600 hover:text-slate-900">Save</button>
                                                        </div>
                                                    </div>
                                                ) : deletingId === msg.id ? (
                                                    <div className="flex flex-col gap-2 min-w-[180px] p-1">
                                                        <p className="text-[10px] font-bold text-red-500 uppercase mb-1">Delete Message?</p>
                                                        <div className="flex flex-col gap-1.5">
                                                            <button 
                                                                onClick={() => handleDelete(msg.id, 'everyone')}
                                                                className="w-full py-2 bg-red-500 text-white text-[9px] font-bold uppercase rounded-lg hover:bg-red-600 transition-all"
                                                            >
                                                                Everyone
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(msg.id, 'me')}
                                                                className="w-full py-2 bg-slate-200 text-slate-600 text-[9px] font-bold uppercase rounded-lg hover:bg-slate-300 transition-all"
                                                            >
                                                                Me Only
                                                            </button>
                                                            <button 
                                                                onClick={() => setDeletingId(null)}
                                                                className="w-full py-1.5 text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-normal leading-relaxed">{msg.message}</p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {msg.isEdited && !msg.isDeletedForEveryone && (
                                                <span className="text-[9px] font-semibold text-slate-400 uppercase">Edited</span>
                                            )}
                                            <span className="text-[9px] font-medium text-slate-400 uppercase">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {msg.senderType === 'Administrator' && (
                                                <button 
                                                    onClick={() => setDeletingId(msg.id)}
                                                    className="text-[9px] font-semibold text-slate-400 hover:text-slate-600 uppercase"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply Area */}
                        <div className="p-6 bg-white border-t border-slate-100">
                            <form onSubmit={handleSend} className="relative">
                                <input 
                                    type="text" 
                                    placeholder={`Reply to ${selectedConv.applicantName}...`}
                                    className="w-full pl-6 pr-16 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-slate-400 outline-none font-normal text-sm text-slate-700 transition-all"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <button 
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="absolute right-2 top-2 p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="h-full bg-slate-50/50 border border-slate-200 border-dashed rounded-3xl flex flex-col items-center justify-center text-center p-12 space-y-4">
                        <div className="h-1 bg-slate-200 w-16 mb-4 rounded-full" />
                        <div className="max-w-xs">
                            <h4 className="text-lg font-semibold text-slate-700">Select a Conversation</h4>
                            <p className="text-sm font-normal text-slate-400 mt-2">
                                Choose an active chat to begin.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatDashboard;
